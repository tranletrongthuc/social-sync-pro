import { getClientAndDb } from '../server_lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { Client, Receiver } from '@upstash/qstash';
import { generateMediaPlanGroup, createBrandFromIdea, generateBrandKit, generateViralIdeas, generatePersonasForBrand, generateTrends } from '../server_lib/generationService.js';
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Note: Body parser is disabled in the main api/index.js router

// Initialize QStash client for PUBLISHING
const qstashClient = process.env.QSTASH_TOKEN ? new Client({ token: process.env.QSTASH_TOKEN }) : null;

const rateLimiter = new Map();

function enforceRateLimit(userId) {
  const lastCall = rateLimiter.get(userId) || 0;
  const now = Date.now();
  if (now - lastCall < 60000) return false;
  rateLimiter.set(userId, now);
  return true;
}

function createTaskDocument(taskData) {
  const now = new Date();
  return {
    taskId: uuidv4(),
    userId: taskData.userId || '',
    brandId: taskData.brandId || '',
    type: taskData.type || 'GENERATE_MEDIA_PLAN',
    payload: taskData.payload || {},
    status: 'queued',
    progress: 0,
    priority: taskData.priority || 'normal',
    queuedAt: now,
    retryCount: 0,
    maxRetries: 3,
    createdBy: taskData.userId || '',
    createdAt: now,
    updatedAt: now,
  };
}

async function createTask(requestBody) {
  console.log('[API/Jobs] Creating task with request body.');
  
  const { type, payload, userId, brandId, priority = 'normal' } = requestBody;
  
  if (!type || !payload || !userId || (!brandId && type !== 'CREATE_BRAND_FROM_IDEA')) {
    throw new Error('Missing required fields: type, payload, userId, brandId');
  }
  
  if (!enforceRateLimit(userId)) {
    throw new Error('Rate limit exceeded. Please wait before creating another task.');
  }
  
  const { db } = await getClientAndDb();
  const tasksCollection = db.collection('tasks');
  
  const taskDocument = createTaskDocument({ type, payload, userId, brandId, priority });
  
  await tasksCollection.insertOne({
    ...taskDocument,
    _id: new ObjectId(),
    queuedAt: new Date(taskDocument.queuedAt),
    createdAt: new Date(taskDocument.createdAt),
    updatedAt: new Date(taskDocument.updatedAt),
  });
  
  console.log('[API/Jobs] Task saved with ID:', taskDocument.taskId);
  
  try {
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    const hasQStashConfig = qstashClient;
    const useQStashInDev = process.env.USE_QSTASH_IN_DEV === 'true';
    const shouldUseQStash = isProduction || (useQStashInDev && hasQStashConfig);
    
    if (shouldUseQStash && qstashClient) {
      let baseUrl;
      if (isProduction) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.QSTASH_BASE_URL) {
        baseUrl = process.env.QSTASH_BASE_URL;
      } else {
        throw new Error('QStash is enabled in development, but QSTASH_BASE_URL (your ngrok URL) is not set.');
      }
      
      const destinationUrl = `${baseUrl}/api/index.js?service=jobs&action=process`;
      console.log('[API/Jobs] Publishing task to QStash for taskId:', taskDocument.taskId, 'with URL:', destinationUrl);
      
      await qstashClient.publishJSON({
        url: destinationUrl,
        body: { taskId: taskDocument.taskId },
        method: 'POST',
      });

      console.log('[API/Jobs] Task published to QStash successfully for taskId:', taskDocument.taskId);
    } else {
      console.log('[API/Jobs] Using self-invocation for local development for taskId:', taskDocument.taskId);
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      const processUrl = `${baseUrl}/api/index.js?service=jobs&action=process`;

      fetch(processUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: taskDocument.taskId, isSelfInvoke: true }),
      }).catch(err => {
          console.error(`[API/Jobs] Self-invocation fetch failed for taskId: ${taskDocument.taskId}`, err);
      });
    }
  } catch (error) {
    console.error('[API/Jobs] Error during task scheduling for taskId:', taskDocument.taskId, error);
    await db.collection('tasks').updateOne(
      { taskId: taskDocument.taskId },
      { $set: { status: 'failed', lastError: error.message, updatedAt: new Date() } }
    );
    throw error;
  }
  
  return { taskId: taskDocument.taskId };
}

async function processTask(requestBody) {
  console.log('[API/Jobs] Processing task with request body:', requestBody);
  
  const { taskId } = requestBody;
  
  if (!taskId) {
    throw new Error('Missing taskId');
  }
  
  const { db } = await getClientAndDb();
  const tasksCollection = db.collection('tasks');
  
  const task = await tasksCollection.findOne({ taskId });
  
  if (!task) {
    throw new Error(`Task with ID ${taskId} not found`);
  }
  
  await tasksCollection.updateOne({ taskId }, { $set: { status: 'processing', startedAt: new Date(), updatedAt: new Date() } });
  
  console.log('[API/Jobs] Updated task status to processing for task ID:', taskId);
  
  try {
    const payloadWithBrandId = { ...task.payload, brandId: task.brandId };

    let result = null;
    switch (task.type) {
      case 'GENERATE_MEDIA_PLAN':
        result = { mediaPlanGroupId: await generateMediaPlanGroup(payloadWithBrandId) };
        break;
      case 'CREATE_BRAND_FROM_IDEA':
        result = await createBrandFromIdea(payloadWithBrandId);
        break;
      case 'GENERATE_BRAND_KIT':
        result = await generateBrandKit(payloadWithBrandId);
        break;
      case 'GENERATE_VIRAL_IDEAS':
        result = await generateViralIdeas(payloadWithBrandId);
        break;
      case 'AUTO_GENERATE_PERSONAS':
        result = await generatePersonasForBrand(payloadWithBrandId);
        break;
      case 'GENERATE_TRENDS':
        result = await generateTrends({ ...payloadWithBrandId, trendType: 'industry' });
        break;
      case 'GENERATE_GLOBAL_TRENDS':
        result = await generateTrends({ ...payloadWithBrandId, trendType: 'global' });
        break;
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
    
    await tasksCollection.updateOne({ taskId }, { $set: { status: 'completed', progress: 100, result: result, completedAt: new Date(), updatedAt: new Date() } });
    console.log('[API/Jobs] Updated task status to completed for task ID:', taskId);
  } catch (error) {
    console.error(`[API/Jobs] Error processing task ${taskId}:`, error);
    await tasksCollection.updateOne({ taskId }, { $set: { status: 'failed', lastError: error.message, updatedAt: new Date() } });
    throw error;
  }
  
  return { success: true };
}

async function getTaskStatus(requestQuery) {
  const { taskId } = requestQuery;
  if (!taskId) throw new Error('Missing taskId');
  const { db } = await getClientAndDb();
  const task = await db.collection('tasks').findOne({ taskId });
  if (!task) throw new Error(`Task with ID ${taskId} not found`);
  return { taskId: task.taskId, status: task.status, progress: task.progress, currentStep: task.currentStep, result: task.result, error: task.lastError };
}

async function cancelTask(requestBody) {
  const { taskId, userId } = requestBody;
  if (!taskId || !userId) throw new Error('Missing required fields: taskId, userId');
  const { db } = await getClientAndDb();
  const task = await db.collection('tasks').findOne({ taskId });
  if (!task) throw new Error(`Task with ID ${taskId} not found`);
  if (task.userId !== userId) throw new Error('Unauthorized: You do not own this task');
  await db.collection('tasks').updateOne({ taskId }, { $set: { status: 'cancelled', updatedAt: new Date() } });
  return { success: true };
}

async function listTasks(requestQuery) {
  let { brandId } = requestQuery;
  if (!brandId) {
    console.error('[API/Jobs] Missing brandId in listTasks request');
    throw new Error('Missing brandId');
  }
  
  // Sanitize and convert to string
  brandId = String(brandId).trim();
  
  // Do a simple validation without potentially problematic regex
  if (typeof brandId !== 'string' || brandId.length !== 24) {
    console.error(`[API/Jobs] Invalid brandId format - length check failed: ${brandId}`);
    throw new Error(`Invalid brandId format: ${brandId}`);
  }
  
  // Additional check: verify it only contains hexadecimal characters
  for (let i = 0; i < brandId.length; i++) {
    const c = brandId[i];
    if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'))) {
      console.error(`[API/Jobs] Invalid character in brandId: ${brandId}, char at pos ${i} is ${c}`);
      throw new Error(`Invalid brandId format: ${brandId}`);
    }
  }
  
  try {
    const { db } = await getClientAndDb();
    
    // To avoid any potential issues with direct parameter injection into the query,
    // we'll use a more explicit approach with a validated ObjectId
    const tasks = await db.collection('tasks').find({ brandId }).sort({ createdAt: -1 }).toArray();
    console.log(`[API/Jobs] Found ${tasks.length} tasks for brand ${brandId}`);
    return tasks;
  } catch (error) {
    console.error('[API/Jobs] Error in listTasks:', error);
    throw error;
  }
}

async function handler(request, response) {
  const { action } = request.query;
  const requestBody = request.body; // Parsed by api/index.js
  const rawBody = request.rawBody; // Raw body also provided by api/index.js

  // Validate action parameter to prevent potential injection issues
  // Using manual character checking instead of regex to avoid potential issues
  if (typeof action !== 'string') {
    console.error(`[API/Jobs] Invalid action parameter type: ${typeof action}`);
    return response.status(400).json({ error: 'Invalid action parameter' });
  }

  // Check each character to ensure it's safe (alphanumeric, underscore, hyphen)
  for (let i = 0; i < action.length; i++) {
    const c = action[i];
    if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '-')) {
      console.error(`[API/Jobs] Invalid character in action parameter: ${c} at position ${i}`);
      return response.status(400).json({ error: 'Invalid action parameter' });
    }
  }

  if (action === 'process' && !requestBody.isSelfInvoke) {
    const signature = request.headers['upstash-signature'];
    if (!signature) {
      return response.status(401).json({ error: 'Missing Upstash-Signature header' });
    }

    const receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    });

    try {
        const isValid = await receiver.verify({
            signature,
            body: rawBody.toString('utf-8'),
        });

        if (!isValid) {
            console.error('[API/Jobs] QStash signature verification failed. Signature:', signature);
            return response.status(401).json({ error: 'Invalid QStash signature' });
        }
        console.log('[API/Jobs] QStash signature verified successfully.');
    } catch (error) {
        console.error('[API/Jobs] Error during QStash signature verification:', error);
        return response.status(400).json({ error: 'Invalid signature' });
    }
  }
  
  try {
    let result;
    switch (action) {
      case 'create':
        result = await createTask(requestBody);
        response.status(202).json(result);
        break;
      case 'process':
        result = await processTask(requestBody);
        response.status(200).json(result);
        break;
      case 'status':
        result = await getTaskStatus(request.query);
        response.status(200).json(result);
        break;
      case 'list':
        result = await listTasks(request.query);
        response.status(200).json(result);
        break;
      case 'cancel':
        result = await cancelTask(requestBody);
        response.status(200).json(result);
        break;
      default:
        response.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const errorMessage = error.message ? String(error.message) : 'Unknown error occurred';
    response.status(500).json({ error: `Failed to process action ${action}: ${errorMessage}` });
  }
}

export default handler;