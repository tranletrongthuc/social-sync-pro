import { getClientAndDb } from '../lib/mongodb.js';
import { allowCors } from '../lib/cors.js';

async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/mongodb/load-media-plan-posts-with-pagination ---');
  try {
    const { planId, page = 1, limit = 30 } = request.body;

    if (!planId) {
      return response.status(400).json({ error: 'Missing planId in request body' });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get MongoDB client and database instance
    const { client, db } = await getClientAndDb();
    
    // Fetch posts for the specific media plan with pagination
    const collection = db.collection('mediaPlanPosts');
    const allPostRecords = await collection.find({ mediaPlanId: planId }).toArray();
    
    // Sort posts by week and then by post order if available
    allPostRecords.sort((a, b) => {
      const weekA = a.week || 0;
      const weekB = b.week || 0;
      if (weekA !== weekB) return weekA - weekB;
      
      // If week is the same, sort by post order or creation date
      const orderA = a.postOrder || new Date(a.createdTime || 0).getTime();
      const orderB = b.postOrder || new Date(b.createdTime || 0).getTime();
      return orderA - orderB;
    });
    
    // Apply pagination
    const paginatedPosts = allPostRecords.slice(offset, offset + limit);
    
    const posts = paginatedPosts.map((record) => ({
      id: record._id.toString(),
      platform: record.platform,
      contentType: record.contentType,
      title: record.title,
      content: record.content,
      description: record.description,
      hashtags: record.hashtags || [],
      cta: record.cta,
      mediaPrompt: record.mediaPrompt,
      script: record.script,
      imageKey: record.imageKey,
      videoKey: record.videoKey,
      mediaOrder: record.mediaOrder || [],
      sources: record.sources || [],
      promotedProductIds: record.promotedProductIds || [],
      scheduledAt: record.scheduledAt,
      publishedAt: record.publishedAt,
      publishedUrl: record.publishedUrl,
      autoComment: record.autoComment,
      status: record.status,
      isPillar: record.isPillar,
      week: record.week,
      postOrder: record.postOrder,
      ...record // Include any other fields that might be in the record
    }));

    response.status(200).json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(allPostRecords.length / limit),
        totalPosts: allPostRecords.length,
        hasNextPage: offset + limit < allPostRecords.length,
        hasPrevPage: page > 1
      }
    });
    console.log('--- Media plan posts with pagination sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/mongodb/load-media-plan-posts-with-pagination ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to load media plan posts: ${error.message}` });
  }
}

export default allowCors(handler);