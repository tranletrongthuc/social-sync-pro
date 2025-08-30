import { getClientAndDb } from '../lib/mongodb.js';
import { allowCors } from '../lib/cors.js';

async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/mongodb/affiliate-vault ---');
  try {
    const { brandId } = request.body;

    if (!brandId) {
      return response.status(400).json({ error: 'Missing brandId in request body' });
    }

    // Get MongoDB client and database instance
    const { client, db } = await getClientAndDb();
    
    // Fetch affiliate links data from MongoDB
    const collection = db.collection('affiliateProducts');
    const linkRecords = await collection.find({ brandId: brandId }).toArray();
    
    // Transform MongoDB records to match the expected API response format
    const affiliateLinks = linkRecords.map((record) => ({
      id: record._id.toString(),
      productId: record.productId,
      productName: record.productName,
      price: record.price,
      salesVolume: record.salesVolume,
      providerName: record.providerName,
      commissionRate: record.commissionRate,
      commissionValue: record.commissionValue,
      productLink: record.productLink,
      promotionLink: record.promotionLink,
      product_avatar: record.productAvatar,
      product_description: record.productDescription,
      features: record.features || [],
      use_cases: record.useCases || [],
      customer_reviews: record.customerReviews,
      product_rating: record.productRating,
      product_image_links: record.productImageLinks || [],
      ...record // Include any other fields that might be in the record
    }));

    response.status(200).json({ affiliateLinks });
    console.log('--- Affiliate vault data sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/mongodb/affiliate-vault ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to load affiliate vault data: ${error.message}` });
  }
}

export default allowCors(handler);