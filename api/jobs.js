import { allowCors } from '../server_lib/cors.js';
import { getClientAndDb } from '../server_lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting store (in production, use Redis or similar)
const rateLimiter = new Map();

// Utility function to validate QStash signature (simplified for now)
async function validateQStashSignature(request) {
  // In a real implementation, you would verify the signature
  // For now, we'll just return true if we're in a QStash webhook context
  return request.headers['upstash-delivery-url'] !== undefined;
}

// Utility function to enforce rate limiting per user
function enforceRateLimit(userId) {
  const lastCall = rateLimiter.get(userId) || 0;
  const now = Date.now();
  if (now - lastCall < 60000) return false; // Max 1 task per minute
  rateLimiter.set(userId, now);
  return true;
}

// Utility function to create a task document
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

// Handler functions
async function createTask(requestBody) {
  console.log('[API/Jobs] Creating task with request body:', requestBody);
  
  const { type, payload, userId, brandId, priority = 'normal' } = requestBody;
  
  // Validate input
  if (!type || !payload || !userId || !brandId) {
    console.error('[API/Jobs] Missing required fields:', { type, payload, userId, brandId });
    throw new Error('Missing required fields: type, payload, userId, brandId');
  }
  
  // Rate limiting
  if (!enforceRateLimit(userId)) {
    console.warn('[API/Jobs] Rate limit exceeded for user:', userId);
    throw new Error('Rate limit exceeded. Please wait before creating another task.');
  }
  
  const { db } = await getClientAndDb();
  const tasksCollection = db.collection('tasks');
  
  // Create task document
  const taskDocument = createTaskDocument({ type, payload, userId, brandId, priority });
  
  console.log('[API/Jobs] Saving task document to database:', taskDocument);
  
  // Save to database
  const result = await tasksCollection.insertOne({
    ...taskDocument,
    _id: new ObjectId(),
    queuedAt: new Date(taskDocument.queuedAt),
    createdAt: new Date(taskDocument.createdAt),
    updatedAt: new Date(taskDocument.updatedAt),
  });
  
  console.log('[API/Jobs] Task saved with ID:', taskDocument.taskId);
  
  // In a real implementation, you would push a message to QStash here
  // For now, we'll just return the task ID
  
  return { taskId: taskDocument.taskId };
}

async function processTask(requestBody) {
  console.log('[API/Jobs] Processing task with request body:', requestBody);
  
  // In a real implementation, this would be called by QStash webhook
  // and would process the actual task
  const { taskId } = requestBody;
  
  if (!taskId) {
    console.error('[API/Jobs] Missing taskId in request body');
    throw new Error('Missing taskId');
  }
  
  const { db } = await getClientAndDb();
  const tasksCollection = db.collection('tasks');
  
  // Find the task
  const task = await tasksCollection.findOne({ taskId });
  
  if (!task) {
    console.error('[API/Jobs] Task not found with ID:', taskId);
    throw new Error(`Task with ID ${taskId} not found`);
  }
  
  console.log('[API/Jobs] Found task:', task);
  
  // Update task status to processing
  await tasksCollection.updateOne(
    { taskId },
    { 
      $set: { 
        status: 'processing',
        startedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
  
  console.log('[API/Jobs] Updated task status to processing for task ID:', taskId);
  
  try {
    // Process the actual task based on its type
    let result = null;
    
    switch (task.type) {
      case 'GENERATE_MEDIA_PLAN':
        console.log('[API/Jobs] Processing GENERATE_MEDIA_PLAN task');
        // For now, let's just simulate the processing
        // In a real implementation, we would import and call the actual service functions
        await new Promise(resolve => setTimeout(resolve, 3000));
        result = { mediaPlanGroupId: 'mock-media-plan-id' };
        console.log('[API/Jobs] Completed GENERATE_MEDIA_PLAN task');
        break;
        
      case 'GENERATE_BRAND_KIT':
        console.log('[API/Jobs] Processing GENERATE_BRAND_KIT task');
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = { brandKitId: 'mock-brand-kit-id' };
        console.log('[API/Jobs] Completed GENERATE_BRAND_KIT task');
        break;
        
      case 'AUTO_GENERATE_PERSONAS':
        console.log('[API/Jobs] Processing AUTO_GENERATE_PERSONAS task');
        await new Promise(resolve => setTimeout(resolve, 2500));
        result = { personaSetId: 'mock-persona-set-id' };
        console.log('[API/Jobs] Completed AUTO_GENERATE_PERSONAS task');
        break;
        
      default:
        console.error('[API/Jobs] Unsupported task type:', task.type);
        throw new Error(`Unsupported task type: ${task.type}`);
    }
    
    // Update task status to completed
    await tasksCollection.updateOne(
      { taskId },
      { 
        $set: { 
          status: 'completed',
          progress: 100,
          result: result,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    console.log('[API/Jobs] Updated task status to completed for task ID:', taskId);
  } catch (error) {
    console.error(`[API/Jobs] Error processing task ${taskId}:`, error);
    
    // Update task status to failed
    await tasksCollection.updateOne(
      { taskId },
      { 
        $set: { 
          status: 'failed',
          lastError: error.message,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('[API/Jobs] Updated task status to failed for task ID:', taskId);
    
    throw error;
  }
  
  return { success: true };
}

async function getTaskStatus(requestQuery) {
  const { taskId } = requestQuery;
  
  console.log('[API/Jobs] Getting status for task ID:', taskId);
  
  if (!taskId) {
    console.error('[API/Jobs] Missing taskId in query');
    throw new Error('Missing taskId');
  }
  
  const { db } = await getClientAndDb();
  const tasksCollection = db.collection('tasks');
  
  // Find the task
  const task = await tasksCollection.findOne({ taskId });
  
  if (!task) {
    console.error('[API/Jobs] Task not found with ID:', taskId);
    throw new Error(`Task with ID ${taskId} not found`);
  }
  
  console.log('[API/Jobs] Found task status:', {
    taskId: task.taskId,
    status: task.status,
    progress: task.progress,
    currentStep: task.currentStep,
    result: task.result,
    error: task.lastError
  });
  
  // Return task status
  return {
    taskId: task.taskId,
    status: task.status,
    progress: task.progress,
    currentStep: task.currentStep,
    result: task.result,
    error: task.lastError
  };
}

async function cancelTask(requestBody) {
  const { taskId, userId } = requestBody;
  
  if (!taskId || !userId) {
    throw new Error('Missing required fields: taskId, userId');
  }
  
  const { db } = await getClientAndDb();
  const tasksCollection = db.collection('tasks');
  
  // Find the task and verify ownership
  const task = await tasksCollection.findOne({ taskId });
  
  if (!task) {
    throw new Error(`Task with ID ${taskId} not found`);
  }
  
  if (task.userId !== userId) {
    throw new Error('Unauthorized: You do not own this task');
  }
  
  // Update task status to cancelled
  await tasksCollection.updateOne(
    { taskId },
    { 
      $set: { 
        status: 'cancelled',
        updatedAt: new Date()
      }
    }
  );
  
  return { success: true };
}

// Main handler
async function handler(request, response) {
  const { action } = request.query;
  
  console.log('[API/Jobs] Received request with action:', action, 'method:', request.method, 'query:', request.query);
  
  if (request.method !== 'POST' && action !== 'status') {
    console.warn('[API/Jobs] Method not allowed:', request.method);
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    // Handle QStash webhook signature validation for process action
    if (action === 'process') {
      const isValid = await validateQStashSignature(request);
      if (!isValid) {
        console.warn('[API/Jobs] Invalid signature for process action');
        return response.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    let result;
    
    switch (action) {
      case 'create':
        console.log('[API/Jobs] Processing create action with body:', request.body);
        result = await createTask(request.body);
        console.log('[API/Jobs] Create action completed, result:', result);
        response.status(202).json(result);
        break;
        
      case 'process':
        console.log('[API/Jobs] Processing process action with body:', request.body);
        result = await processTask(request.body);
        console.log('[API/Jobs] Process action completed, result:', result);
        response.status(200).json(result);
        break;
        
      case 'status':
        if (request.method !== 'GET') {
          console.warn('[API/Jobs] Method not allowed for status action:', request.method);
          return response.status(405).json({ error: 'Method Not Allowed for status action' });
        }
        console.log('[API/Jobs] Processing status action with query:', request.query);
        result = await getTaskStatus(request.query);
        console.log('[API/Jobs] Status action completed, result:', result);
        response.status(200).json(result);
        break;
        
      case 'cancel':
        console.log('[API/Jobs] Processing cancel action with body:', request.body);
        result = await cancelTask(request.body);
        console.log('[API/Jobs] Cancel action completed, result:', result);
        response.status(200).json(result);
        break;
        
      default:
        console.warn('[API/Jobs] Unknown action:', action);
        response.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('--- CRASH in /api/jobs/[action] ---');
    console.error('Error object:', error);
    
    // Make sure the error message is a string and properly escaped
    const errorMessage = error.message ? String(error.message) : 'Unknown error occurred';
    
    response.status(500).json({ 
      error: "Failed to process action " + action + ": " + errorMessage.replace(/"/g, '"') 
    });
  }
}

export default allowCors(handler);