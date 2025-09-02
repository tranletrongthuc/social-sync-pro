### Instructions for Next Session

To continue our work, copy the entire content of this summary and paste it as your first message to me next time.

---

### 1. Summary of Accomplishments

Over this session, we have performed a significant refactoring of the project's backend API and frontend services with the following key achievements:

*   **API Route Consolidation**	To stay within the Vercel Hobby plan limits, all API routes under the `/api` directory were consolidated. Instead of multiple files, we now have one file per service (`mongodb.js`, `gemini.js`, `openrouter.js`, etc.) that uses an `?action=` query parameter to differentiate between operations.
*   **Database ID Refactoring**	The MongoDB save/update logic in `api/mongodb.js` was refactored to ensure that a custom `id` field (stored as a string) is always created and aligned with the value of the native `_id` (ObjectID). This creates a consistent and predictable ID structure across all collections.
*   **Database Service Consolidation**	All frontend database service logic, which was previously split between `databaseService.ts` and `mongodbStrategyService.ts`, has been merged into a single, comprehensive `databaseService.ts` file for improved maintainability.
*   **Code Cleanup**	All old, redundant API and service files have been deleted, leaving a much cleaner and more organized project structure.

### 2. Current Project Structure

Here is the updated structure of the key directories we have modified:

**API Directory (`/api`):**
```
/api
├── lib/
│   ├── airtable.js
│   ├── cors.js
│   └── mongodb.js
├── cloudflare.js
├── cloudinary.js
├── facebook.js
├── gemini.js
├── health.js
├── index.js
├── mongodb.js
└── openrouter.js
```

**Services Directory (`/src/services`):**
```
/src/services
├── bffService.ts
├── cloudflareService.ts
├── cloudinaryService.ts
├── configService.ts
├── databaseService.ts
├── exportService.ts
├── facebookService.ts
├── geminiService.ts
├── khongminhService.ts
├── lazyLoadService.ts
├── openrouterService.ts
├── socialAccountService.ts
├── socialApiService.ts
└── textGenerationService.ts
```

### 3. Key File Contents

Here are the full contents of the primary files we have refactored.

**`/api/mongodb.js`**
```javascript
import { getClientAndDb } from './lib/mongodb.js';
import { allowCors } from './lib/cors.js';
import { ObjectId } from 'mongodb';

// Helper function to create a filter based on ID validity
function createIdFilter(id, fieldName = '_id') {
  if (ObjectId.isValid(id)) {
    return { [fieldName]: new ObjectId(id) };
  } else {
    // If not a valid ObjectId, use the id as a string field
    return { [fieldName === '_id' ? 'id' : fieldName]: id };
  }
}

async function handler(request, response) {
  const { action } = request.query;
  
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get MongoDB client and database instance
    const { client, db } = await getClientAndDb();

    switch (action) {
      case 'assign-persona-to-plan':
        console.log('--- Received request for /api/mongodb/assign-persona-to-plan ---');
        try {
          const { planId, personaId, updatedPosts, brandId } = request.body;
          
          // Update the media plan with the persona
          const mediaPlansCollection = db.collection('mediaPlanGroups');
          const result = await mediaPlansCollection.updateOne(
            createIdFilter(planId),
            { $set: { personaId: personaId } }
          );
          
          // Update posts if needed
          if (updatedPosts && updatedPosts.length > 0) {
            const postsCollection = db.collection('mediaPlanPosts');
            for (const post of updatedPosts) {
              await postsCollection.updateOne(
                createIdFilter(post.id),
                { $set: { mediaPrompt: post.mediaPrompt } }
              );
            }
          }
          
          response.status(200).json({ success: true });
          console.log('--- Persona assigned to plan ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/assign-persona-to-plan ---');
          throw error;
        }
        break;

      case 'bulk-patch-posts':
        console.log('--- Received request for /api/mongodb/bulk-patch-posts ---');
        try {
          const { updates } = request.body;
          
          const postsCollection = db.collection('mediaPlanPosts');
          const bulkOperations = updates.map(update => ({
            updateOne: {
              filter: createIdFilter(update.postId),
              update: { $set: update.fields }
            }
          }));
          
          const result = await postsCollection.bulkWrite(bulkOperations);
          
          response.status(200).json({ success: true, modifiedCount: result.modifiedCount });
          console.log('--- Bulk patched posts ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/bulk-patch-posts ---');
          throw error;
        }
        break;

      case 'bulk-update-post-schedules':
        console.log('--- Received request for /api/mongodb/bulk-update-post-schedules ---');
        try {
          const { updates } = request.body;
          
          const postsCollection = db.collection('mediaPlanPosts');
          const bulkOperations = updates.map(update => ({
            updateOne: {
              filter: createIdFilter(update.postId),
              update: { 
                $set: { 
                  scheduledAt: update.scheduledAt,
                  status: update.status
                }
              }
            }
          }));
          
          const result = await postsCollection.bulkWrite(bulkOperations);
          
          response.status(200).json({ success: true, modifiedCount: result.modifiedCount });
          console.log('--- Bulk updated post schedules ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/bulk-update-post-schedules ---');
          throw error;
        }
        break;

      case 'check-credentials':
        console.log('--- Received request for /api/mongodb/check-credentials ---');
        try {
          const { MONGODB_URI } = process.env;
          
          if (!MONGODB_URI) {
            return response.status(400).json({ error: 'Missing MONGODB_URI in environment variables' });
          }
          
          // Try to list collections to verify connection
          const collections = await db.listCollections().toArray();
          
          response.status(200).json({ success: true, collections: collections.map(c => c.name) });
          console.log('--- MongoDB connection verified ---');
        } catch (error) {
          console.error('MongoDB credential check failed:', error);
          response.status(500).json({ error: `Failed to connect to MongoDB: ${error.message}` });
        }
        break;

      case 'create-or-update-brand':
        console.log('--- Received request for /api/mongodb/create-or-update-brand ---');
        try {
          const { assets, imageUrls, brandId } = request.body; // brandId is a string from client
          
          const brandsCollection = db.collection('brands');
          
          const brandDocument = {
            name: assets.brandFoundation.brandName,
            mission: assets.brandFoundation.mission,
            usp: assets.brandFoundation.usp,
            targetAudience: assets.brandFoundation.targetAudience,
            personality: assets.brandFoundation.personality,
            colorPalette: assets.coreMediaAssets.colorPalette,
            fontRecommendations: assets.coreMediaAssets.fontRecommendations,
            unifiedProfileAssets: assets.unifiedProfileAssets,
            updatedAt: new Date()
          };
          
          if (brandId) {
            // Update existing brand. Assume brandId is the string representation of _id
            await brandsCollection.updateOne(
              { _id: new ObjectId(brandId) },
              { $set: brandDocument }
            );
            response.status(200).json({ brandId: brandId });
          } else {
            // Create new brand
            const newBrandObjectId = new ObjectId();
            const newBrandId = newBrandObjectId.toString();
            const fullDocument = {
                ...brandDocument,
                _id: newBrandObjectId,
                brandId: newBrandId, // custom id field
                createdAt: new Date()
            };
            await brandsCollection.insertOne(fullDocument);
            response.status(200).json({ brandId: newBrandId });
          }
          
          console.log('--- Brand created or updated ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/create-or-update-brand ---');
          throw error;
        }
        break;

      case 'delete-affiliate-link':
        console.log('--- Received request for /api/mongodb/delete-affiliate-link ---');
        try {
          const { linkId, brandId } = request.body;
          
          const affiliateProductsCollection = db.collection('affiliateProducts');
          const result = await affiliateProductsCollection.deleteOne(
            createIdFilter(linkId)
          );
          
          response.status(200).json({ success: result.deletedCount > 0 });
          console.log('--- Affiliate link deleted ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/delete-affiliate-link ---');
          throw error;
        }
        break;

      case 'delete-ai-model':
        console.log('--- Received request for /api/mongodb/delete-ai-model ---');
        try {
          const { modelId } = request.body;
          
          const aiModelsCollection = db.collection('aiModels');
          const result = await aiModelsCollection.deleteOne(
            createIdFilter(modelId)
          );
          
          response.status(200).json({ success: result.deletedCount > 0 });
          console.log('--- AI model deleted ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/delete-ai-model ---');
          throw error;
        }
        break;

      case 'delete-ai-service':
        console.log('--- Received request for /api/mongodb/delete-ai-service ---');
        try {
          const { serviceId } = request.body;
          
          const aiServicesCollection = db.collection('aiServices');
          const result = await aiServicesCollection.deleteOne({ _id: new ObjectId(serviceId) });
          
          response.status(200).json({ success: result.deletedCount > 0 });
          console.log('--- AI service deleted ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/delete-ai-service ---');
          throw error;
        }
        break;

      case 'delete-persona':
        console.log('--- Received request for /api/mongodb/delete-persona ---');
        try {
          const { personaId, brandId } = request.body;
          
          const personasCollection = db.collection('personas');
          const result = await personasCollection.deleteOne({
            _id: new ObjectId(personaId),
            brandId: brandId
          });
          
          response.status(200).json({ success: result.deletedCount > 0 });
          console.log('--- Persona deleted ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/delete-persona ---');
          throw error;
        }
        break;

      case 'delete-trend':
        console.log('--- Received request for /api/mongodb/delete-trend ---');
        try {
            const { trendId, brandId } = request.body;

            if (!trendId || !brandId) {
                return response.status(400).json({ error: 'Missing trendId or brandId in request body' });
            }
            
            // Delete trend from MongoDB
            const trendsCollection = db.collection('trends');
            const result = await trendsCollection.deleteOne({ _id: new ObjectId(trendId), brandId: brandId });
            
            // Also delete associated ideas
            const ideasCollection = db.collection('ideas');
            await ideasCollection.deleteMany({ trendId: trendId });

            response.status(200).json({ success: true });
            console.log('--- Trend deleted successfully ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/delete-trend ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to delete trend: ${error.message}` });
        }
        break;

      case 'ensure-tables':
        console.log('--- Received request for /api/mongodb/ensure-tables ---');
        try {
          // In MongoDB, collections are created automatically when first used
          // We'll just return success
          response.status(200).json({ success: true });
          console.log('--- MongoDB collections ensured ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/ensure-tables ---');
          throw error;
        }
        break;

      case 'fetch-admin-defaults':
        console.log('--- Received request for /api/mongodb/fetch-admin-defaults ---');
        try {
          const adminSettingsCollection = db.collection('adminSettings');
          const settingsRecord = await adminSettingsCollection.findOne({});
          
          if (!settingsRecord) {
            return response.status(200).json({});
          }
          
          const settings = {
            language: settingsRecord.language,
            totalPostsPerMonth: settingsRecord.totalPostsPerMonth,
            mediaPromptSuffix: settingsRecord.mediaPromptSuffix,
            affiliateContentKit: settingsRecord.affiliateContentKit,
            textGenerationModel: settingsRecord.textGenerationModel,
            imageGenerationModel: settingsRecord.imageGenerationModel,
            textModelFallbackOrder: settingsRecord.textModelFallbackOrder || [],
            visionModels: settingsRecord.visionModels || []
          };
          
          response.status(200).json(settings);
          console.log('--- Admin defaults fetched ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/fetch-admin-defaults ---');
          throw error;
        }
        break;

      case 'fetch-affiliate-links':
        console.log('--- Received request for /api/mongodb/fetch-affiliate-links ---');
        try {
          const { brandId } = request.body;
          
          const affiliateProductsCollection = db.collection('affiliateProducts');
          const linkRecords = await affiliateProductsCollection.find({ brandId: brandId }).toArray();
          
          const affiliateLinks = linkRecords.map(record => ({
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
            product_description: record.productDescription,
            features: record.features || [],
            use_cases: record.useCases || [],
            customer_reviews: record.customerReviews,
            product_rating: record.productRating,
            product_avatar: record.productAvatar,
            product_image_links: record.productImageLinks || []
          }));
          
          response.status(200).json({ affiliateLinks });
          console.log('--- Affiliate links fetched ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/fetch-affiliate-links ---');
          throw error;
        }
        break;

      case 'fetch-settings':
        console.log('--- Received request for /api/mongodb/fetch-settings ---');
        try {
          const { brandId } = request.body;
          
          const brandSettingsCollection = db.collection('brandSettings');
          const settingsRecord = await brandSettingsCollection.findOne({ brandId: brandId });
          
          if (!settingsRecord) {
            return response.status(200).json(null);
          }
          
          const settings = {
            language: settingsRecord.language,
            totalPostsPerMonth: settingsRecord.totalPostsPerMonth,
            mediaPromptSuffix: settingsRecord.mediaPromptSuffix,
            affiliateContentKit: settingsRecord.affiliateContentKit,
            textGenerationModel: settingsRecord.textGenerationModel,
            imageGenerationModel: settingsRecord.imageGenerationModel,
            textModelFallbackOrder: settingsRecord.textModelFallbackOrder || [],
            visionModels: settingsRecord.visionModels || []
          };
          
          response.status(200).json(settings);
          console.log('--- Settings fetched ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/fetch-settings ---');
          throw error;
        }
        break;

      case 'list-brands':
        console.log('--- Received request for /api/mongodb/list-brands ---');
        try {
          const brandsCollection = db.collection('brands');
          const brandRecords = await brandsCollection.find({}).toArray();
          
          const brands = brandRecords.map(record => ({
            id: record.brandId,
            name: record.name
          }));
          
          response.status(200).json({ brands });
          console.log('--- Brands list sent to client ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/list-brands ---');
          response.status(500).json({ error: `Failed to fetch brands from MongoDB: ${error.message}` });
        }
        break;

      case 'list-media-plan-groups':
        console.log('--- Received request for /api/mongodb/list-media-plan-groups ---');
        try {
            const { brandId } = request.body;

            console.log('Loading list media plan groups for brandId: ', brandId)

            if (!brandId) {
                return response.status(400).json({ error: 'Missing brandId in request body' });
            }
            
            // Fetch media plan groups data from MongoDB
            const collection = db.collection('mediaPlanGroups');
            const planRecords = await collection.find({ brandId: brandId }).toArray();
            
            // Transform MongoDB records to match the expected API response format
            const groups = planRecords.map((record) => ({
                id: record.id || record._id.toString(), // Use the stored id or fallback to ObjectId string
                name: record.name,
                prompt: record.prompt,
                source: record.source,
                productImages: record.productImages || [],
                personaId: record.personaId
            }));

            response.status(200).json({ groups });
            console.log('--- Media plan groups list sent to client ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/list-media-plan-groups ---');
            console.error('Error object:', error);
            
            response.status(500).json({ error: `Failed to fetch media plan groups from MongoDB: ${error.message}` });
        }
        break;

      case 'load-ai-services':
        console.log('--- Received request for /api/mongodb/load-ai-services ---');
        try {
          const aiServicesCollection = db.collection('aiServices');
          const aiModelsCollection = db.collection('aiModels');
          
          const serviceRecords = await aiServicesCollection.find({}).toArray();
          const modelRecords = await aiModelsCollection.find({}).toArray();
          
          // Group models by service
          const serviceIdToModelsMap = new Map();
          modelRecords.forEach(modelRecord => {
            const serviceId = modelRecord.serviceId;
            if (serviceId) {
              if (!serviceIdToModelsMap.has(serviceId)) {
                serviceIdToModelsMap.set(serviceId, []);
              }
              serviceIdToModelsMap.get(serviceId).push(modelRecord);
            }
          });
          
          const services = serviceRecords.map(serviceRecord => {
            const serviceId = serviceRecord._id.toString();
            const models = serviceIdToModelsMap.get(serviceId) || [];
            
            return {
              id: serviceId,
              name: serviceRecord.name,
              description: serviceRecord.description,
              models: models.map(modelRecord => ({
                id: modelRecord._id.toString(),
                name: modelRecord.name,
                provider: modelRecord.provider,
                capabilities: modelRecord.capabilities || []
              }))
            };
          });
          
          response.status(200).json({ services });
          console.log('--- AI services loaded ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/load-ai-services ---');
          throw error;
        }
        break;

      case 'load-media-plan':
        console.log('--- Received request for /api/mongodb/load-media-plan ---');
        try {
          const { planId } = request.body;
          
          const mediaPlanGroupsCollection = db.collection('mediaPlanGroups');
          const planRecord = await mediaPlanGroupsCollection.findOne({ _id: new ObjectId(planId) });
          
          if (!planRecord) {
            return response.status(404).json({ error: `Plan with ID ${planId} not found.` });
          }
          
          const mediaPlanPostsCollection = db.collection('mediaPlanPosts');
          const postRecords = await mediaPlanPostsCollection.find({ mediaPlanId: planId }).toArray();
          
          const imageUrls = {};
          const videoUrls = {};
          const weeks = new Map();
          
          postRecords.forEach(record => {
            // Collect image and video URLs
            if (record.imageKey && record.imageUrl) imageUrls[record.imageKey] = record.imageUrl;
            if (record.videoKey && record.videoUrl) videoUrls[record.videoKey] = record.videoUrl;
            
            // Group posts by week
            const weekNum = record.week;
            if (!weeks.has(weekNum)) {
              weeks.set(weekNum, { theme: record.theme, posts: [] });
            }
            
            // Add post to week
            weeks.get(weekNum).posts.push({
              id: record._id.toString(),
              platform: record.platform,
              contentType: record.contentType,
              title: record.title,
              content: record.content || '',
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
              status: record.status || 'draft',
              isPillar: record.isPillar,
              week: record.week,
              postOrder: record.postOrder
            });
          });
          
          // Convert weeks map to array and sort
          const finalPlan = Array.from(weeks.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([weekNum, weekData]) => ({
              week: weekNum,
              theme: weekData.theme,
              posts: weekData.posts
            }));
          
          response.status(200).json({ plan: finalPlan, imageUrls, videoUrls });
          console.log('--- Media plan loaded ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/load-media-plan ---');
          throw error;
        }
        break;

      case 'load-project':
        console.log('--- Received request for /api/mongodb/load-project ---');
        try {
          const { brandId } = request.body;
          
          // This would load all project data for a brand
          // Implementation would depend on what data is needed
          response.status(200).json({ message: 'Project loading not fully implemented' });
          console.log('--- Project loading placeholder ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/load-project ---');
          throw error;
        }
        break;

      case 'save-admin-defaults':
        console.log('--- Received request for /api/mongodb/save-admin-defaults ---');
        try {
          const settings = request.body;
          
          const adminSettingsCollection = db.collection('adminSettings');
          
          // Update or insert admin settings
          const result = await adminSettingsCollection.updateOne(
            {}, // Match any document
            { 
              $set: {
                language: settings.language,
                totalPostsPerMonth: settings.totalPostsPerMonth,
                mediaPromptSuffix: settings.mediaPromptSuffix,
                affiliateContentKit: settings.affiliateContentKit,
                textGenerationModel: settings.textGenerationModel,
                imageGenerationModel: settings.imageGenerationModel,
                textModelFallbackOrder: settings.textModelFallbackOrder || [],
                visionModels: settings.visionModels || [],
                updatedAt: new Date()
              }
            },
            { upsert: true } // Create if doesn't exist
          );
          
          response.status(200).json({ success: true });
          console.log('--- Admin defaults saved ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/save-admin-defaults ---');
          throw error;
        }
        break;

      case 'save-affiliate-links':
        console.log('--- Received request for /api/mongodb/save-affiliate-links ---');
        try {
          const { links, brandId } = request.body;
          
          const affiliateProductsCollection = db.collection('affiliateProducts');
          const bulkOperations = [];

          for (const link of links) {
            const linkDocument = {
                productId: link.productId,
                productName: link.productName,
                price: link.price,
                salesVolume: link.salesVolume,
                providerName: link.providerName,
                commissionRate: link.commissionRate,
                commissionValue: link.commissionValue,
                productLink: link.productLink,
                promotionLink: link.promotionLink,
                brandId: brandId,
                updatedAt: new Date()
            };

            if (link.id && ObjectId.isValid(link.id)) { // Update existing
                bulkOperations.push({
                    updateOne: {
                        filter: { _id: new ObjectId(link.id), brandId: brandId },
                        update: { $set: linkDocument }
                    }
                });
            } else { // Insert new
                const newLinkObjectId = new ObjectId();
                const newLinkId = newLinkObjectId.toString();
                const newLinkDocument = {
                    ...linkDocument,
                    _id: newLinkObjectId,
                    id: newLinkId,
                };
                bulkOperations.push({
                    insertOne: {
                        document: newLinkDocument
                    }
                });
            }
          }
        
          if (bulkOperations.length > 0) {
            await affiliateProductsCollection.bulkWrite(bulkOperations);
          }
          
          response.status(200).json({ success: true });
          console.log('--- Affiliate links saved ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/save-affiliate-links ---');
          throw error;
        }
        break;

      case 'save-ai-model':
        console.log('--- Received request for /api/mongodb/save-ai-model ---');
        try {
          const { model, serviceId } = request.body;
          
          const aiModelsCollection = db.collection('aiModels');
          
          // Prepare model document
          const modelDocument = {
            name: model.name,
            provider: model.provider,
            capabilities: model.capabilities || [],
            serviceId: serviceId,
            updatedAt: new Date()
          };
          
          // If model.id exists, update; otherwise create new
          if (model.id) {
            await aiModelsCollection.updateOne(
              { _id: new ObjectId(model.id) },
              { $set: modelDocument }
            );
            response.status(200).json({ id: model.id });
          } else {
            const newModelObjectId = new ObjectId();
            const newModelId = newModelObjectId.toString();
            const fullModelDocument = {
                ...modelDocument,
                _id: newModelObjectId,
                id: newModelId
            };
            await aiModelsCollection.insertOne(fullModelDocument);
            response.status(200).json({ id: newModelId });
          }
          
          console.log('--- AI model saved ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/save-ai-model ---');
          throw error;
        }
        break;

      case 'save-ai-service':
        console.log('--- Received request for /api/mongodb/save-ai-service ---');
        try {
          const { service } = request.body;
          
          const aiServicesCollection = db.collection('aiServices');
          
          // Prepare service document
          const serviceDocument = {
            name: service.name,
            description: service.description,
            updatedAt: new Date()
          };
          
          // If service.id exists, update; otherwise create new
          if (service.id) {
            await aiServicesCollection.updateOne(
              { _id: new ObjectId(service.id) },
              { $set: serviceDocument }
            );
            response.status(200).json({ id: service.id });
          } else {
            const newServiceObjectId = new ObjectId();
            const newServiceId = newServiceObjectId.toString();
            const fullServiceDocument = {
                ...serviceDocument,
                _id: newServiceObjectId,
                id: newServiceId
            };
            await aiServicesCollection.insertOne(fullServiceDocument);
            response.status(200).json({ id: newServiceId });
          }
          
          console.log('--- AI service saved ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/save-ai-service ---');
          throw error;
        }
        break;

      case 'save-ideas':
        console.log('--- Received request for /api/mongodb/save-ideas ---');
        try {
          const { ideas } = request.body;
          
          const ideasCollection = db.collection('ideas');
          const bulkOperations = [];

          for (const idea of ideas) {
            const ideaDocument = {
                title: idea.title,
                description: idea.description,
                targetAudience: idea.targetAudience,
                productId: idea.productId,
                trendId: idea.trendId,
                updatedAt: new Date()
            };

            if (idea.id && ObjectId.isValid(idea.id)) { // Update existing
                bulkOperations.push({
                    updateOne: {
                        filter: { _id: new ObjectId(idea.id) },
                        update: { $set: ideaDocument }
                    }
                });
            } else { // Insert new
                const newIdeaObjectId = new ObjectId();
                const newIdeaId = newIdeaObjectId.toString();
                const newIdeaDocument = {
                    ...ideaDocument,
                    _id: newIdeaObjectId,
                    id: newIdeaId,
                };
                bulkOperations.push({
                    insertOne: {
                        document: newIdeaDocument
                    }
                });
            }
          }
        
          if (bulkOperations.length > 0) {
            await ideasCollection.bulkWrite(bulkOperations);
          }
          
          response.status(200).json({ success: true });
          console.log('--- Ideas saved ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/save-ideas ---');
          throw error;
        }
        break;

      case 'save-media-plan-group':
        console.log('--- Received request for /api/mongodb/save-media-plan-group ---');
        try {
          const { group, imageUrls, brandId } = request.body;
          
          const mediaPlanGroupsCollection = db.collection('mediaPlanGroups');
          const postsCollection = db.collection('mediaPlanPosts');
          
          // ✅ Generate a valid ObjectId and use its string form as the ID
          const groupObjectId = new ObjectId(); // 12-byte ObjectId
          const groupId = groupObjectId.toString(); // → "664f8d2b9e8c0c23f456789a" (24-char hex) 
          
          // Prepare group document
          // ✅ Use the SAME ObjectId value for _id and id
          const groupDocument = {
            _id: groupObjectId,     // ← MongoDB _id (ObjectId type)
            id: groupId,            // ← Your "custom" ID (string, but same value)
            name: group.name,
            prompt: group.prompt,
            source: group.source,
            productImages: group.productImages || [],
            brandId,
            personaId: group.personaId,
            updatedAt: new Date()
          };

          await mediaPlanGroupsCollection.insertOne(groupDocument);
          
          // Save posts if they exist
          if (group.plan && Array.isArray(group.plan) && group.plan.length > 0) {
            
            // Flatten plan into posts
            const allPosts = [];
            group.plan.forEach(week => {
              // Make sure week has the expected structure
              if (week && week.week !== undefined && week.theme && Array.isArray(week.posts)) {
                week.posts.forEach((post, postIndex) => {
                  // Validate post.id before creating ObjectId
                  const postId = new ObjectId(); // Generate new ObjectId for post
                  const postIdStr = postId.toString();
                  
                  allPosts.push({
                    ...post,
                    _id: postId,                    // ← ObjectId for post _id
                    id: postIdStr,                  // ← Optional: string version
                    mediaPlanId: groupId,           // ← String ID referencing group's _id
                    week: week.week,
                    theme: week.theme,
                    brandId: brandId,
                    imageUrl: post.imageKey ? imageUrls[post.imageKey] : null,
                    videoUrl: post.videoKey ? imageUrls[post.videoKey] : null,
                    postOrder: postIndex, // Add post order for proper sorting
                    updatedAt: new Date()
                  });
                });
              } else {
                console.warn('Skipping invalid week structure:', week);
              }
            });
            
            // Process posts in batches
            const batchSize = 10;
            for (let i = 0; i < allPosts.length; i += batchSize) {
              const batch = allPosts.slice(i, i + batchSize);
              
              // Prepare bulk operations
              const bulkOperations = batch.map(post => ({
                updateOne: {
                  filter: { _id: post._id },
                  update: { 
                    $set: {
                      title: post.title,
                      week: post.week,
                      theme: post.theme,
                      platform: post.platform,
                      contentType: post.contentType,
                      content: post.content,
                      description: post.description,
                      hashtags: post.hashtags || [],
                      cta: post.cta,
                      mediaPrompt: post.mediaPrompt,
                      script: post.script,
                      imageKey: post.imageKey,
                      imageUrl: post.imageUrl,
                      videoKey: post.videoKey,
                      videoUrl: post.videoUrl,
                      mediaOrder: post.mediaOrder || [],
                      sources: post.sources || [],
                      scheduledAt: post.scheduledAt,
                      publishedAt: post.publishedAt,
                      publishedUrl: post.publishedUrl,
                      autoComment: post.autoComment,
                      status: post.status || 'draft',
                      isPillar: post.isPillar,
                      brandId: brandId,
                      mediaPlanId: post.mediaPlanId, // Use the ObjectId for database consistency
                      promotedProductIds: post.promotedProductIds || [],
                      postOrder: post.postOrder,
                      updatedAt: new Date()
                    }
                  },
                  upsert: true
                }
              }));
              
              await postsCollection.bulkWrite(bulkOperations);
            }
          }
          
          response.status(200).json({ id: groupId });
          console.log('--- Media plan group saved ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/save-media-plan-group ---');
          console.error('Error details:', error);
          //response.status(500).json({ error: 'Failed to save media plan group' });
          throw error;
        }
        break;

      case 'save-persona':
        console.log('--- Received request for /api/mongodb/save-persona ---');
        try {
          const { persona, brandId } = request.body;
          
          const personasCollection = db.collection('personas');
          
          // Prepare persona document
          const personaDocument = {
            nickName: persona.nickName,
            mainStyle: persona.mainStyle,
            activityField: persona.activityField,
            outfitDescription: persona.outfitDescription,
            avatarImageKey: persona.avatarImageKey,
            avatarImageUrl: persona.avatarImageUrl,
            brandId: brandId,
            updatedAt: new Date()
          };
          
          // If persona.id exists, update; otherwise create new
          if (persona.id) {
            await personasCollection.updateOne(
              { _id: new ObjectId(persona.id) },
              { $set: personaDocument }
            );
            response.status(200).json({ id: persona.id });
          } else {
            const newPersonaObjectId = new ObjectId();
            const newPersonaId = newPersonaObjectId.toString();
            const fullPersonaDocument = {
                ...personaDocument,
                _id: newPersonaObjectId,
                id: newPersonaId
            };
            await personasCollection.insertOne(fullPersonaDocument);
            response.status(200).json({ id: newPersonaId });
          }
          
          console.log('--- Persona saved ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/save-persona ---');
          throw error;
        }
        break;

      case 'save-settings':
        console.log('--- Received request for /api/mongodb/save-settings ---');
        try {
          const { settings, brandId } = request.body;
          
          const brandSettingsCollection = db.collection('brandSettings');
          
          // Prepare settings document
          const settingsDocument = {
            language: settings.language,
            totalPostsPerMonth: settings.totalPostsPerMonth,
            mediaPromptSuffix: settings.mediaPromptSuffix,
            affiliateContentKit: settings.affiliateContentKit,
            textGenerationModel: settings.textGenerationModel,
            imageGenerationModel: settings.imageGenerationModel,
            textModelFallbackOrder: settings.textModelFallbackOrder || [],
            visionModels: settings.visionModels || [],
            brandId: brandId,
            updatedAt: new Date()
          };
          
          // Update or insert brand settings
          const result = await brandSettingsCollection.updateOne(
            { brandId: brandId },
            { $set: settingsDocument },
            { upsert: true } // Create if doesn't exist
          );
          
          response.status(200).json({ success: true });
          console.log('--- Settings saved ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/save-settings ---');
          throw error;
        }
        break;

      case 'save-trend':
        console.log('--- Received request for /api/mongodb/save-trend ---');
        try {
          const { trend, brandId } = request.body;
          
          const trendsCollection = db.collection('trends');
          
          // Prepare trend document
          const trendDocument = {
            industry: trend.industry,
            topic: trend.topic,
            keywords: trend.keywords || [],
            links: trend.links || [],
            notes: trend.notes,
            brandId: brandId,
            createdAt: trend.createdAt,
            updatedAt: new Date()
          };
          
          // If trend.id exists, update; otherwise create new
          if (trend.id) {
            await trendsCollection.updateOne(
              { _id: new ObjectId(trend.id) },
              { $set: trendDocument }
            );
            response.status(200).json({ id: trend.id });
          } else {
            const newTrendObjectId = new ObjectId();
            const newTrendId = newTrendObjectId.toString();
            const fullTrendDocument = {
                ...trendDocument,
                _id: newTrendObjectId,
                id: newTrendId
            };
            await trendsCollection.insertOne(fullTrendDocument);
            response.status(200).json({ id: newTrendId });
          }
          
          console.log('--- Trend saved ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/save-trend ---');
          throw error;
        }
        break;

      case 'sync-asset-media':
        console.log('--- Received request for /api/mongodb/sync-asset-media ---');
        try {
          const { imageUrls, brandId, assets } = request.body;
          
          // Update logo concepts with image URLs
          if (assets.coreMediaAssets.logoConcepts && assets.coreMediaAssets.logoConcepts.length > 0) {
            const logoConceptsCollection = db.collection('logoConcepts');
            
            const bulkOperations = assets.coreMediaAssets.logoConcepts
              .filter(logo => imageUrls[logo.imageKey])
              .map(logo => ({
                updateOne: {
                  filter: { 
                    ...createIdFilter(logo.id),
                    brandId: brandId
                  },
                  update: { 
                    $set: {
                      imageUrl: imageUrls[logo.imageKey],
                      updatedAt: new Date()
                    }
                  }
                }
              }));
            
            if (bulkOperations.length > 0) {
              await logoConceptsCollection.bulkWrite(bulkOperations);
            }
          }
          
          // Update brand profile images
          const brandsCollection = db.collection('brands');
          const brandUpdates = {};
          
          if (assets.unifiedProfileAssets.profilePictureImageKey && 
              imageUrls[assets.unifiedProfileAssets.profilePictureImageKey]) {
            brandUpdates.profilePictureImageUrl = imageUrls[assets.unifiedProfileAssets.profilePictureImageKey];
          }
          
          if (assets.unifiedProfileAssets.coverPhotoImageKey && 
              imageUrls[assets.unifiedProfileAssets.coverPhotoImageKey]) {
            brandUpdates.coverPhotoImageUrl = imageUrls[assets.unifiedProfileAssets.coverPhotoImageKey];
          }
          
          if (Object.keys(brandUpdates).length > 0) {
            await brandsCollection.updateOne(
              { brandId: brandId },
              { $set: brandUpdates }
            );
          }
          
          response.status(200).json({ success: true });
          console.log('--- Asset media synced ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/sync-asset-media ---');
          throw error;
        }
        break;

      case 'update-media-plan-post':
        console.log('--- Received request for /api/mongodb/update-media-plan-post ---');
        try {
          const { post, brandId, imageUrl, videoUrl } = request.body;
          
          const postsCollection = db.collection('mediaPlanPosts');
          
          // Prepare post document
          const postDocument = {
            title: post.title,
            weekIndex: post.weekIndex,
            theme: post.theme,
            platform: post.platform,
            contentType: post.contentType,
            content: post.content,
            description: post.description,
            hashtags: post.hashtags || [],
            cta: post.cta,
            mediaPrompt: post.mediaPrompt,
            script: post.script,
            imageKey: post.imageKey,
            imageUrl: imageUrl,
            videoKey: post.videoKey,
            videoUrl: videoUrl,
            mediaOrder: post.mediaOrder ? post.mediaOrder.join(',') : undefined,
            sources: post.sources?.map(s => `${s.title}:${s.uri}`) || [],
            scheduledAt: post.scheduledAt,
            publishedAt: post.publishedAt,
            publishedUrl: post.publishedUrl,
            autoComment: post.autoComment,
            status: post.status,
            isPillar: post.isPillar,
            brandId: brandId,
            promotedProductIds: post.promotedProductIds || [],
            updatedAt: new Date()
          };
          
          // Remove undefined fields
          Object.keys(postDocument).forEach(key => 
            postDocument[key] === undefined && delete postDocument[key]
          );
          
          // Update the post
          await postsCollection.updateOne(
            createIdFilter(post.id),
            { $set: postDocument }
          );
          
          response.status(200).json({ success: true });
          console.log('--- Media plan post updated ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/update-media-plan-post ---');
          throw error;
        }
        break;

      case 'check-product-exists':
        console.log('--- Received request for /api/mongodb/check-product-exists ---');
        try {
          const { productId } = request.body;
          
          const affiliateProductsCollection = db.collection('affiliateProducts');
          const productRecord = await affiliateProductsCollection.findOne({ productId: productId });
          
          response.status(200).json({ exists: !!productRecord });
          console.log('--- Product existence check completed ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/check-product-exists ---');
          throw error;
        }
        break;

      case 'load-ideas-for-trend':
        console.log('--- Received request for /api/mongodb/load-ideas-for-trend ---');
        try {
            const { trendId, brandId } = request.body;

            if (!trendId || !brandId) {
                return response.status(400).json({ error: 'Missing trendId or brandId in request body' });
            }
            
            // Fetch ideas data from MongoDB
            const ideasCollection = db.collection('ideas');
            const ideaRecords = await ideasCollection.find({ trendId: trendId }).toArray();
            
            // Transform MongoDB records to match the expected API response format
            const ideas = ideaRecords.map((record) => ({
                id: record._id.toString(),
                trendId: record.trendId,
                title: record.title,
                description: record.description,
                targetAudience: record.targetAudience,
                productId: record.productId,
                ...record // Include any other fields that might be in the record
            }));

            response.status(200).json({ ideas });
            console.log('--- Ideas data sent to client ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/load-ideas-for-trend ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to load ideas for trend: ${error.message}` });
        }
        break;

      case 'load-complete-project':
        console.log('--- Received request for /api/mongodb/load-complete-project ---');
        try {
          const { brandId } = request.body;
          
          // Load all necessary data for a complete project
          const brandsCollection = db.collection('brands');
          const brandRecord = await brandsCollection.findOne({ brandId: brandId });
          
          if (!brandRecord) {
            response.status(404).json({ error: `Brand with ID ${brandId} not found.` });
            return;
          }
          
          // Load related data
          const [
            brandValuesRecords,
            keyMessagesRecords,
            logoConceptsRecords,
            affiliateProductsRecords,
            personasRecords,
            trendsRecords,
            ideasRecords,
            mediaPlanGroupsRecords
          ] = await Promise.all([
            db.collection('brandValues').find({ brandId: brandId }).toArray(),
            db.collection('keyMessages').find({ brandId: brandId }).toArray(),
            db.collection('logoConcepts').find({ brandId: brandId }).toArray(),
            db.collection('affiliateProducts').find({ brandId: brandId }).toArray(),
            db.collection('personas').find({ brandId: brandId }).toArray(),
            db.collection('trends').find({ brandId: brandId }).toArray(),
            db.collection('ideas').find({ brandId: brandId }).toArray(),
            db.collection('mediaPlanGroups').find({ brandId: brandId }).toArray()
          ]);
          
          // Transform data to match expected format
          const brandValues = brandValuesRecords.map(record => record.text);
          const keyMessages = keyMessagesRecords.map(record => record.text);
          const logoConcepts = logoConceptsRecords.map(record => ({
            id: record._id.toString(),
            style: record.style,
            prompt: record.prompt,
            imageKey: record.imageKey,
            imageUrl: record.imageUrl
          }));
          
          const affiliateLinks = affiliateProductsRecords.map(record => ({
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
            features: record.features ? record.features.split(',').map(f => f.trim()) : [],
            use_cases: record.useCases ? record.useCases.split(',').map(u => u.trim()) : [],
            customer_reviews: record.customerReviews,
            product_rating: record.productRating,
            product_image_links: record.productImageLinks ? record.productImageLinks.split('\n') : []
          }));
          
          const personas = personasRecords.map(record => ({
            id: record._id.toString(),
            nickName: record.nickName,
            mainStyle: record.mainStyle,
            activityField: record.activityField,
            outfitDescription: record.outfitDescription,
            avatarImageKey: record.avatarImageKey,
            avatarImageUrl: record.avatarImageUrl,
            photos: [], // Will be populated on client side if needed
            socialAccounts: [] // Will be populated on client side if needed
          }));
          
          const trends = trendsRecords.map(record => ({
            id: record._id.toString(),
            brandId: record.brandId,
            industry: record.industry,
            topic: record.topic,
            keywords: record.keywords ? record.keywords.split(',').map(k => k.trim()) : [],
            links: record.links ? JSON.parse(record.linksJson || '[]') : [],
            notes: record.notes,
            analysis: record.analysis,
            createdAt: record.createdAt
          }));
          
          const ideas = ideasRecords.map(record => ({
            id: record._id.toString(),
            trendId: record.trendId,
            title: record.title,
            description: record.description,
            targetAudience: record.targetAudience,
            productId: record.productId
          }));
          
          const mediaPlans = mediaPlanGroupsRecords.map(record => ({
            id: record._id.toString(),
            name: record.name,
            prompt: record.prompt,
            productImages: record.productImages || [],
            personaId: record.personaId,
            plan: [] // Will be populated separately if needed
          }));
          
          // Construct the complete assets object
          const assets = {
            brandFoundation: {
              brandName: brandRecord.name,
              mission: brandRecord.mission,
              values: brandValues,
              targetAudience: brandRecord.targetAudience,
              personality: brandRecord.personality,
              keyMessaging: keyMessages,
              usp: brandRecord.usp
            },
            coreMediaAssets: {
              logoConcepts: logoConcepts,
              colorPalette: brandRecord.colorPalette || {},
              fontRecommendations: brandRecord.fontRecommendations || {}
            },
            unifiedProfileAssets: brandRecord.unifiedProfileAssets || {},
            mediaPlans: mediaPlans,
            affiliateLinks: affiliateLinks,
            personas: personas,
            trends: trends,
            ideas: ideas
          };
          
          // For now, we'll return empty objects for generated images and videos
          // In a full implementation, these would be loaded from Cloudinary or another storage service
          const generatedImages = {};
          const generatedVideos = {};
          
          response.status(200).json({
            assets,
            generatedImages,
            generatedVideos,
            brandId
          });
          console.log('--- Complete project loaded ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/load-complete-project ---');
          throw error;
        }
        break;
    
    case 'initial-load':
        console.log('--- Received request for /api/mongodb/initial-load ---');
        try {
            const { brandId } = request.body;

            if (!brandId) {
            return response.status(400).json({ error: 'Missing brandId in request body' });
            }
            
            // Fetch the brand record
            const brandsCollection = db.collection('brands');
            const brandRecord = await brandsCollection.findOne({ brandId: brandId });
            
            if (!brandRecord) {
            return response.status(404).json({ error: `Brand with ID ${brandId} not found.` });
            }

            // Fetch brand summary data for instant rendering
            const brandSummary = {
            id: brandRecord.brandId,
            name: brandRecord.name,
            logoUrl: brandRecord.logoUrl // Assuming there's a logoUrl field
            };

            // Fetch complete brand foundation data (for BrandKitView)
            const brandValuesCollection = db.collection('brandValues');
            const keyMessagesCollection = db.collection('keyMessages');
            const logoConceptsCollection = db.collection('logoConcepts');
            
            const brandValueRecords = await brandValuesCollection.find({ brandId: brandId }).toArray();
            const keyMessageRecords = await keyMessagesCollection.find({ brandId: brandId }).toArray();
            const logoConceptRecords = await logoConceptsCollection.find({ brandId: brandId }).toArray();

            const brandValues = brandValueRecords.map((record) => record.text);
            const keyMessages = keyMessageRecords.map((record) => record.text);
            const logoConcepts = logoConceptRecords.map((record) => ({
            id: record._id.toString(),
            style: record.style,
            prompt: record.prompt,
            imageKey: record.imageKey,
            }));

            const brandFoundation = {
            brandName: brandRecord.name,
            mission: brandRecord.mission,
            values: brandValues,
            targetAudience: brandRecord.targetAudience,
            personality: brandRecord.personality,
            keyMessaging: keyMessages,
            usp: brandRecord.usp,
            };

            const coreMediaAssets = {
            logoConcepts,
            colorPalette: brandRecord.colorPalette || {},
            fontRecommendations: brandRecord.fontRecommendations || {},
            };

            const unifiedProfileAssets = brandRecord.unifiedProfileAssets || {};

            const brandKitData = {
            brandFoundation,
            coreMediaAssets,
            unifiedProfileAssets
            };

            // Return both summary and brand kit data for instant rendering of BrandKitView
            response.status(200).json({
            brandSummary,
            brandKitData
            });
            console.log('--- Initial load data sent to client ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/initial-load ---');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            response.status(500).json({ error: `Failed to load initial data: ${error.message}`, details: error.message });
        }
        break;
    
    case 'load-affiliate-vault':
        console.log('--- Received request for /api/mongodb/load-affiliate-vault ---');
        try {
            const { brandId } = request.body;

            if (!brandId) {
                return response.status(400).json({ error: 'Missing brandId in request body' });
            }
            
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
            console.error('--- CRASH in /api/mongodb/load-affiliate-vault ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to load affiliate vault data: ${error.message}` });
        }
        break;

    case 'load-media-plan-posts-with-pagination':
        console.log('--- Received request for /api/mongodb/load-media-plan-posts-with-pagination ---');
        try {
            const { planId, page = 1, limit = 30 } = request.body;

            if (!planId) {
                return response.status(400).json({ error: 'Missing planId in request body' });
            }

            // Calculate offset for pagination
            const offset = (page - 1) * limit;
            
            // Fetch posts for the specific media plan with pagination
            const collection = db.collection('mediaPlanPosts');
            const allPostRecords = await collection.find({ mediaPlanId: planId }).toArray();
            
            // Group posts by week and theme
            const weeksMap = new Map();
            
            allPostRecords.forEach(record => {
                const weekNum = record.week || 1;
                const theme = record.theme || 'Untitled Week';
                
                if (!weeksMap.has(weekNum)) {
                    weeksMap.set(weekNum, {
                        week: weekNum,
                        theme: theme,
                        posts: []
                    });
                }
                
                // Add post to the appropriate week
                weeksMap.get(weekNum).posts.push({
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
                    status: record.status || 'draft',
                    isPillar: record.isPillar,
                    week: record.week,
                    postOrder: record.postOrder
                });
            });
            
            // Convert map to array and sort by week number
            const allWeeks = Array.from(weeksMap.values()).sort((a, b) => a.week - b.week);
            
            // Flatten all posts for pagination
            const allPosts = allWeeks.flatMap(week => 
                week.posts.map(post => ({ ...post, week: week.week, theme: week.theme }))
            );
            
            // Apply pagination
            const paginatedPosts = allPosts.slice(offset, offset + limit);
            
            // Extract image and video URLs
            const imageUrls = {};
            const videoUrls = {};
            
            allPostRecords.forEach(record => {
                if (record.imageKey && record.imageUrl) {
                    imageUrls[record.imageKey] = record.imageUrl;
                }
                if (record.videoKey && record.videoUrl) {
                    videoUrls[record.videoKey] = record.videoUrl;
                }
            });

            response.status(200).json({
                plan: allWeeks, // Return complete plan structure
                imageUrls,
                videoUrls,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(allPosts.length / limit),
                    totalPosts: allPosts.length,
                    hasNextPage: offset + limit < allPosts.length,
                    hasPrevPage: page > 1
                }
            });
            console.log('--- Media plan posts with pagination sent to client ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/load-media-plan-posts-with-pagination ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to load media plan posts: ${error.message}` });
        }
        break;

    case 'load-media-plan-posts':
        console.log('--- Received request for /api/mongodb/load-media-plan-posts ---');
        try {
            const { planId } = request.body;

            if (!planId) {
                return response.status(400).json({ error: 'Missing planId in request body' });
            }
            
            // Fetch posts for the specific media plan
            const collection = db.collection('mediaPlanPosts');
            const postRecords = await collection.find({ mediaPlanId: planId }).toArray();
            
            // Group posts by week and theme
            const weeksMap = new Map();
            
            postRecords.forEach(record => {
                const weekNum = record.week || 1;
                const theme = record.theme || 'Untitled Week';
                
                if (!weeksMap.has(weekNum)) {
                    weeksMap.set(weekNum, {
                        week: weekNum,
                        theme: theme,
                        posts: []
                    });
                }
                
                // Add post to the appropriate week
                weeksMap.get(weekNum).posts.push({
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
                    status: record.status || 'draft',
                    isPillar: record.isPillar,
                    week: record.week,
                    postOrder: record.postOrder
                });
            });
            
            // Convert map to array and sort by week number
            const plan = Array.from(weeksMap.values()).sort((a, b) => a.week - b.week);
            
            // Extract image and video URLs
            const imageUrls = {};
            const videoUrls = {};
            
            postRecords.forEach(record => {
                if (record.imageKey && record.imageUrl) {
                    imageUrls[record.imageKey] = record.imageUrl;
                }
                if (record.videoKey && record.videoUrl) {
                    videoUrls[record.videoKey] = record.videoUrl;
                }
            });

            response.status(200).json({
                plan,
                imageUrls,
                videoUrls
            });
            console.log('--- Media plan posts sent to client ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/load-media-plan-posts ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to load media plan posts: ${error.message}` });
        }
        break;

    case 'load-personas':
        console.log('--- Received request for /api/mongodb/load-personas ---');
        try {
            const { brandId } = request.body;

            if (!brandId) {
                return response.status(400).json({ error: 'Missing brandId in request body' });
            }
            
            // Fetch personas data from MongoDB
            const collection = db.collection('personas');
            const personaRecords = await collection.find({ brandId: brandId }).toArray();
            
            // Transform MongoDB records to match the expected API response format
            // Convert _id to id and remove _id field
            const personas = personaRecords.map((record) => ({
                id: record._id.toString(),
                nickName: record.nickName,
                mainStyle: record.mainStyle,
                activityField: record.activityField,
                outfitDescription: record.outfitDescription,
                avatarImageKey: record.avatarImageKey,
                avatarImageUrl: record.avatarImageUrl,
                photos: record.photos || [], // Will be populated on client side if needed
                socialAccounts: record.socialAccounts || [], // Will be populated on client side if needed
                ...record // Include any other fields that might be in the record
            }));

            response.status(200).json({ personas });
            console.log('--- Personas data sent to client ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/load-personas ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to load personas data: ${error.message}` });
        }
        break;

    case 'load-strategy-hub':
        console.log('--- Received request for /api/mongodb/load-strategy-hub ---');
        try {
            const { brandId } = request.body;

            if (!brandId) {
                return response.status(400).json({ error: 'Missing brandId in request body' });
            }
            
            // Fetch trends data from MongoDB
            const trendsCollection = db.collection('trends');
            const trendRecords = await trendsCollection.find({ brandId: brandId }).toArray();
            
            // Transform MongoDB records to match the expected API response format
            const trends = trendRecords.map((record) => ({
                id: record._id.toString(),
                brandId: record.brandId,
                industry: record.industry,
                topic: record.topic,
                keywords: record.keywords || [],
                links: record.links || [],
                notes: record.notes,
                analysis: record.analysis,
                createdAt: record.createdAt,
                ...record // Include any other fields that might be in the record
            }));

            // Fetch ideas data (only for existing trends)
            const trendIds = trendRecords.map(r => r._id.toString());
            let ideas = [];
            
            if (trendIds.length > 0) {
                const ideasCollection = db.collection('ideas');
                const ideaRecords = await ideasCollection.find({ trendId: { $in: trendIds } }).toArray();
                
                // Transform MongoDB records to match the expected API response format
                ideas = ideaRecords.map((record) => ({
                    id: record._id.toString(),
                    trendId: record.trendId,
                    title: record.title,
                    description: record.description,
                    targetAudience: record.targetAudience,
                    productId: record.productId,
                    ...record // Include any other fields that might be in the record
                }));
            }

            response.status(200).json({ trends, ideas });
            console.log('--- Strategy hub data sent to client ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/load-strategy-hub ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to load strategy hub data: ${error.message}` });
        }
        break;

    case 'load-trend':
        console.log('--- Received request for /api/mongodb/load-trend ---');
        try {
            const { trendId, brandId } = request.body;

            if (!trendId || !brandId) {
                return response.status(400).json({ error: 'Missing trendId or brandId in request body' });
            }
            
            // Fetch trend data from MongoDB
            const trendsCollection = db.collection('trends');
            const trendRecord = await trendsCollection.findOne({ _id: trendId, brandId: brandId });
            
            if (!trendRecord) {
                return response.status(404).json({ error: 'Trend not found' });
            }
            
            // Transform MongoDB record to match the expected API response format
            const trend = {
                id: trendRecord._id.toString(),
                brandId: trendRecord.brandId,
                industry: trendRecord.industry,
                topic: trendRecord.topic,
                keywords: trendRecord.keywords || [],
                links: trendRecord.links || [],
                notes: trendRecord.notes,
                analysis: trendRecord.analysis,
                createdAt: trendRecord.createdAt,
                ...trendRecord // Include any other fields that might be in the record
            };

            response.status(200).json({ trend });
            console.log('--- Trend data sent to client ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/load-trend ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to load trend: ${error.message}` });
        }
        break;

    case 'media-plan-posts':
        console.log('--- Received request for /api/mongodb/media-plan-posts ---');
        try {
            const { planId, page = 1, limit = 30 } = request.body;

            if (!planId) {
                return response.status(400).json({ error: 'Missing planId in request body' });
            }

            // Calculate offset for pagination
            const offset = (page - 1) * limit;
            
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
            console.log('--- Media plan posts sent to client ---');

        } catch (error) {
            console.error('--- CRASH in /api/mongodb/media-plan-posts ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to load media plan posts: ${error.message}` });
        }
        break;

      default:
        response.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('--- CRASH in /api/mongodb/[action] ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to process action ${action}: ${error.message}` });
  }
}

export default allowCors(handler);
```

**`/api/gemini.js`**
```javascript
import { allowCors } from './lib/cors.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the .env file. Gemini-related routes will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function handler(request, response) {
  const { action } = request.query;

  switch (action) {
    case 'generate': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/gemini/generate ---');
      try {
        console.log('Request body:', JSON.stringify(request.body, null, 2));
        const { model, contents, config } = request.body;

        if (!model || !contents) {
          console.log('Validation failed: Missing model or contents.');
          return response.status(400).json({ error: 'Missing required fields: model and contents' });
        }
        console.log(`Model: ${model}`);

        const generationConfig = { ...config };
        const systemInstruction = generationConfig?.systemInstruction;
        if (systemInstruction) {
          delete generationConfig.systemInstruction;
        }

        const modelConfig = { model: model };
        if (systemInstruction) {
          modelConfig.systemInstruction = systemInstruction;
        }

        const geminiModel = genAI.getGenerativeModel(modelConfig);
        console.log('Got generative model. Calling generateContent...');

        const generateContentRequest = {
          contents: [{ parts: [{ text: JSON.stringify(contents) }] }]
        };
        
        if (Object.keys(generationConfig).length > 0) {
          generateContentRequest.generationConfig = generationConfig;
        }

        const result = config 
          ? await geminiModel.generateContent(generateContentRequest)
          : await geminiModel.generateContent(JSON.stringify(contents));
        
        console.log('--- generateContent call SUCCEEDED ---');
        const responseText = result.response.text();

        response.status(200).json({ text: responseText });
        console.log('--- Response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/gemini/generate ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate content from Gemini API: ' + error.message });
      }
      break;
    }
    case 'generate-image': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/gemini/generate-image ---');
      try {
        const { model, prompt, config } = request.body;

        if (!model || !prompt) {
          return response.status(400).json({ error: 'Missing required fields: model and prompt' });
        }

        const generationConfig = { ...config };
        const systemInstruction = generationConfig?.systemInstruction;
        if (systemInstruction) {
          delete generationConfig.systemInstruction;
        }

        const modelConfig = { model: model };
        if (systemInstruction) {
          modelConfig.systemInstruction = systemInstruction;
        }

        const geminiModel = genAI.getGenerativeModel(modelConfig);
        console.log('Generating image with Gemini...');

        const result = await geminiModel.generateImages({ prompt, config: generationConfig });
        
        console.log('--- generateImages call SUCCEEDED ---');
        
        if (result.generatedImages && result.generatedImages.length > 0) {
          const base64Image = result.generatedImages[0].image.imageBytes;
          response.status(200).json({ image: `data:image/jpeg;base64,${base64Image}` });
        } else {
          response.status(500).json({ error: 'No image was generated' });
        }

        console.log('--- Image response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/gemini/generate-image ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate image from Gemini API: ' + error.message });
      }
      break;
    }
    case 'embed': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/gemini/embed ---');
      try {
        const { texts, taskTypes } = request.body;
        const { GEMINI_API_KEY } = process.env;

        if (!GEMINI_API_KEY) {
          return response.status(500).json({ error: 'Gemini API key not configured on server' });
        }

        if (!texts || !Array.isArray(texts) || !taskTypes || !Array.isArray(taskTypes) || texts.length !== taskTypes.length) {
          return response.status(400).json({ error: 'Invalid request: texts and taskTypes must be arrays of the same length' });
        }

        const ai = new GoogleGenerativeAI(GEMINI_API_KEY);

        const embeddingPromises = texts.map((text, index) => 
          ai.getGenerativeModel({ model: "embedding-001" }).embedContent({
            content: { parts: [{ text }] },
            taskType: taskTypes[index]
          })
        );

        const embeddingResults = await Promise.all(embeddingPromises);
        
        const embeddings = embeddingResults.map(res => res.embedding.values);

        response.status(200).json({ embeddings });
        console.log('--- Gemini embeddings response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/gemini/embed ---');
        console.error('Error object:', error);
        response.status(500).json({ error: `Failed to generate embeddings with Gemini: ${error.message}` });
      }
      break;
    }
    default:
      response.setHeader('Allow', ['POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}

export default allowCors(handler);
```

**`/api/openrouter.js`**
```javascript
import { allowCors } from './lib/cors.js';
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function handler(request, response) {
  const { action } = request.query;

  switch (action) {
    case 'generate': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/openrouter/generate ---');
      try {
        const { model, messages, responseFormat } = request.body;

        if (!process.env.OPENROUTER_API_KEY) {
          return response.status(500).json({ error: 'OpenRouter API key not configured on server' });
        }

        if (!model || !messages) {
          return response.status(400).json({ error: 'Missing required fields: model and messages' });
        }

        const siteUrl = request.headers.referer || 'https://socialsync.pro';
        const siteTitle = 'SocialSync Pro';

        const body = {
          model: model,
          messages: messages
        };

        if (responseFormat) {
          body.response_format = responseFormat;
        }

        const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": siteUrl,
            "X-Title": siteTitle,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!openrouterResponse.ok) {
          const errorData = await openrouterResponse.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `OpenRouter API error: ${openrouterResponse.status} ${openrouterResponse.statusText}`);
        }

        const responseData = await openrouterResponse.json();
        
        let responseText = '';
        if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message?.content) {
          responseText = responseData.choices[0].message.content;
        }

        response.status(200).json({ text: responseText });
        console.log('--- OpenRouter response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/openrouter/generate ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate content from OpenRouter API: ' + error.message });
      }
      break;
    }
    case 'generate-image': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/openrouter/generate-image ---');
      try {
        const { model, messages, responseFormat } = request.body;

        if (!process.env.OPENROUTER_API_KEY) {
          return response.status(500).json({ error: 'OpenRouter API key not configured on server' });
        }

        if (!model || !messages) {
          return response.status(400).json({ error: 'Missing required fields: model and messages' });
        }

        const siteUrl = request.headers.referer || 'https://socialsync.pro';
        const siteTitle = 'SocialSync Pro';

        const body = {
          model: model,
          messages: messages
        };

        if (responseFormat) {
          body.response_format = responseFormat;
        }

        const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": siteUrl,
            "X-Title": siteTitle,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!openrouterResponse.ok) {
          const errorData = await openrouterResponse.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `OpenRouter API error: ${openrouterResponse.status} ${openrouterResponse.statusText}`);
        }

        const responseData = await openrouterResponse.json();
        
        let responseImage = '';
        if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message?.content) {
          try {
            const content = responseData.choices[0].message.content;
            const parsed = JSON.parse(content);
            if (parsed.b64_json) {
              responseImage = `data:image/jpeg;base64,${parsed.b64_json}`;
            } else {
              responseImage = content;
            }
          } catch (parseError) {
            responseImage = responseData.choices[0].message.content;
          }
        }

        response.status(200).json({ image: responseImage });
        console.log('--- OpenRouter image response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/openrouter/generate-image ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate image from OpenRouter API: ' + error.message });
      }
      break;
    }
    default:
      response.setHeader('Allow', ['POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}

export default allowCors(handler);
```

**`/src/services/databaseService.ts`**
```typescript
import type { GeneratedAssets, Settings, MediaPlan, CoreMediaAssets, UnifiedProfileAssets, MediaPlanGroup, BrandFoundation, MediaPlanPost, AffiliateLink, Persona, PostStatus, Trend, Idea, ColorPalette, FontRecommendations, LogoConcept, PersonaPhoto, AIService } from '../../types';

// Cache for loaded data to prevent unnecessary reloads
const dataCache: Record<string, any> = {};

/**
 * Clear cache for a specific brand
 */
export const clearCacheForBrand = (brandId: string): void => {
  console.log("Clearing cache for brand:", brandId);
  Object.keys(dataCache).forEach(key => {
    if (key.includes(brandId)) {
      delete dataCache[key];
    }
  });
};

/**
 * Clear all cache
 */
export const clearAllCache = (): void => {
  console.log("Clearing all cache");
  Object.keys(dataCache).forEach(key => delete dataCache[key]);
};


/**
 * Fetch settings from MongoDB
 */
const fetchSettingsFromDatabase = async (brandId: string): Promise<Settings | null> => {
  try {
    const response = await fetch('/api/mongodb?action=fetch-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    const settings = await response.json();
    return settings;
  } catch (error) {
    console.error('Failed to fetch settings from database:', error);
    throw error;
  }
};

/**
 * Save settings to MongoDB
 */
const saveSettingsToDatabase = async (settings: Settings, brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Settings saved successfully:', result);
  } catch (error) {
    console.error('Failed to save settings to database:', error);
    throw error;
  }
};

/**
 * Fetch admin defaults from MongoDB
 */
const fetchAdminDefaultsFromDatabase = async (): Promise<Settings> => {
  try {
    const response = await fetch('/api/mongodb?action=fetch-admin-defaults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin defaults: ${response.statusText}`);
    }

    const settings = await response.json();
    return settings;
  } catch (error) {
    console.error('Failed to fetch admin defaults from database:', error);
    throw error;
  }
};

/**
 * Save admin defaults to MongoDB
 */
const saveAdminDefaultsToDatabase = async (settings: Settings): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-admin-defaults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to save admin defaults: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Admin defaults saved successfully:', result);
  } catch (error) {
    console.error('Failed to save admin defaults to database:', error);
    throw error;
  }
};

/**
 * Create or update a brand record in MongoDB
 */
const createOrUpdateBrandRecordInDatabase = async (
  assets: GeneratedAssets,
  imageUrls: Record<string, string>,
  brandId: string | null
): Promise<string> => {
  try {
    const response = await fetch('/api/mongodb?action=create-or-update-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assets, imageUrls, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create or update brand record: ${response.statusText}`);
    }

    const result = await response.json();
    return result.brandId;
  } catch (error) {
    console.error('Failed to create or update brand record in database:', error);
    throw error;
  }
};

/**
 * Load complete assets from MongoDB
 */
const loadCompleteAssetsFromDatabase = async (brandId: string): Promise<{
  assets: GeneratedAssets;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  brandId: string;
}> => {
  console.log("DEBUG: Loading complete assets for brand ID:", brandId);
  
  try {
    const response = await fetch('/api/mongodb?action=initial-load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to load complete assets: ${response.statusText}`);
    }

    const result = await response.json();
    
    const assets: GeneratedAssets = {
      brandFoundation: result.brandKitData.brandFoundation,
      coreMediaAssets: result.brandKitData.coreMediaAssets,
      unifiedProfileAssets: result.brandKitData.unifiedProfileAssets,
      mediaPlans: [], // Will be populated later
      affiliateLinks: [], // Will be populated later
      personas: [], // Will be populated later
      trends: [], // Will be populated later
      ideas: [], // Will be populated later
    };
    
    const generatedImages: Record<string, string> = {};
    const generatedVideos: Record<string, string> = {};
    
    return { assets, generatedImages, generatedVideos, brandId };
  } catch (error) {
    console.error("Failed to load complete assets from database:", error);
    throw error;
  }
};

/**
 * Sync asset media with MongoDB
 */
const syncAssetMediaWithDatabase = async (
  imageUrls: Record<string, string>,
  brandId: string,
  assets: GeneratedAssets
): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=sync-asset-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls, brandId, assets }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync asset media: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Asset media synced successfully:', result);
  } catch (error) {
    console.error('Failed to sync asset media with database:', error);
    throw error;
  }
};

/**
 * Save affiliate links to MongoDB
 */
const saveAffiliateLinksToDatabase = async (links: AffiliateLink[], brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-affiliate-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ links, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save affiliate links: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Affiliate links saved successfully:', result);
  } catch (error) {
    console.error('Failed to save affiliate links to database:', error);
    throw error;
  }
};

/**
 * Fetch affiliate links for brand from MongoDB
 */
const fetchAffiliateLinksForBrandFromDatabase = async (brandId: string): Promise<AffiliateLink[]> => {
  try {
    const response = await fetch('/api/mongodb?action=fetch-affiliate-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch affiliate links: ${response.statusText}`);
    }

    const result = await response.json();
    return result.affiliateLinks;
  } catch (error) {
    console.error('Failed to fetch affiliate links from database:', error);
    throw error;
  }
};

/**
 * Delete affiliate link from MongoDB
 */
const deleteAffiliateLinkFromDatabase = async (linkId: string, brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=delete-affiliate-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ linkId, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete affiliate link: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Affiliate link deleted successfully:', result);
  } catch (error) {
    console.error('Failed to delete affiliate link from database:', error);
    throw error;
  }
};

/**
 * Save persona to MongoDB
 */
const savePersonaToDatabase = async (persona: Persona, brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-persona', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ persona, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save persona: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Persona saved successfully:', result);
  } catch (error) {
    console.error('Failed to save persona to database:', error);
    throw error;
  }
};

/**
 * Delete persona from MongoDB
 */
const deletePersonaFromDatabase = async (personaId: string, brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=delete-persona', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ personaId, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete persona: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Persona deleted successfully:', result);
  } catch (error) {
    console.error('Failed to delete persona from database:', error);
    throw error;
  }
};

/**
 * Assign persona to plan in MongoDB
 */
const assignPersonaToPlanInDatabase = async (
  planId: string,
  personaId: string | null,
  updatedPosts: MediaPlanPost[],
  brandId: string
): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=assign-persona-to-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, personaId, updatedPosts, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign persona to plan: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Persona assigned to plan successfully:', result);
  } catch (error) {
    console.error('Failed to assign persona to plan in database:', error);
    throw error;
  }
};

/**
 * Update media plan post in MongoDB
 */
const updateMediaPlanPostInDatabase = async (
  post: MediaPlanPost,
  brandId: string,
  imageUrl?: string,
  videoUrl?: string
): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=update-media-plan-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post, brandId, imageUrl, videoUrl }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update media plan post: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Media plan post updated successfully:', result);
  } catch (error) {
    console.error('Failed to update media plan post in database:', error);
    throw error;
  }
};

/**
 * Save media plan group to MongoDB
 */
const saveMediaPlanGroupToDatabase = async (
  group: MediaPlanGroup,
  imageUrls: Record<string, string>,
  brandId: string
): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-media-plan-group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ group, imageUrls, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save media plan group: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Media plan group saved successfully:', result);
  } catch (error) {
    console.error('Failed to save media plan group to database:', error);
    throw error;
  }
};

/**
 * Save trend to MongoDB
 */
const saveTrendToDatabase = async (trend: Omit<Trend, 'id'> & { id?: string }, brandId: string): Promise<string> => {
  console.log("saveTrend called with trend:", trend, "brandId:", brandId);
  
  try {
    const response = await fetch('/api/mongodb?action=save-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trend, brandId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to save trend. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to save trend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Trend saved successfully with ID:", data.trendId);
    
    // Clear cache for this brand's strategy hub data
    clearCacheForBrand(brandId);
    
    return data.trendId;
  } catch (error) {
    console.error("Error saving trend:", error);
    throw error;
  }
};

/**
 * Delete trend from MongoDB
 */
const deleteTrendFromDatabase = async (trendId: string, brandId: string): Promise<void> => {
  console.log("deleteTrend called with trendId:", trendId, "brandId:", brandId);
  
  try {
    const response = await fetch('/api/mongodb?action=delete-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trendId, brandId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to delete trend. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to delete trend: ${response.statusText}`);
    }

    console.log("Trend deleted successfully");
    
    // Clear cache for this brand's strategy hub data
    clearCacheForBrand(brandId);
  } catch (error) {
    console.error("Error deleting trend:", error);
    throw error;
  }
};

/**
 * Save ideas to MongoDB
 */
const saveIdeasToDatabase = async (ideas: Idea[]): Promise<void> => {
  console.log("saveIdeas called with ideas:", ideas);
  
  try {
    const response = await fetch('/api/mongodb?action=save-ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ideas }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to save ideas. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to save ideas: ${response.statusText}`);
    }

    console.log("Ideas saved successfully");
    
    // Clear cache for the brand associated with these ideas
    if (ideas.length > 0) {
      const brandId = ideas[0].id.split('-')[0]; // Extract brandId from the first idea's ID
      clearCacheForBrand(brandId);
    }
  } catch (error) {
    console.error("Error saving ideas:", error);
    throw error;
  }
};

/**
 * Save AI service to MongoDB
 */
const saveAIServiceToDatabase = async (service: { id: string; name: string; description: string }): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-ai-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save AI service: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI service saved successfully:', result);
  } catch (error) {
    console.error('Failed to save AI service to database:', error);
    throw error;
  }
};

/**
 * Delete AI service from MongoDB
 */
const deleteAIServiceFromDatabase = async (serviceId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=delete-ai-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serviceId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete AI service: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI service deleted successfully:', result);
  } catch (error) {
    console.error('Failed to delete AI service from database:', error);
    throw error;
  }
};

/**
 * Save AI model to MongoDB
 */
const saveAIModelToDatabase = async (model: { id: string; name: string; provider: string; capabilities: string[] }, serviceId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-ai-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, serviceId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save AI model: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI model saved successfully:', result);
  } catch (error) {
    console.error('Failed to save AI model to database:', error);
    throw error;
  }
};

/**
 * Delete AI model from MongoDB
 */
const deleteAIModelFromDatabase = async (modelId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=delete-ai-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete AI model: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI model deleted successfully:', result);
  } catch (error) {
    console.error('Failed to delete AI model from database:', error);
    throw error;
  }
};

/**
 * Load AI services from MongoDB
 */
const loadAIServicesFromDatabase = async (): Promise<AIService[]> => {
  try {
    const response = await fetch('/api/mongodb?action=load-ai-services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to load AI services: ${response.statusText}`);
    }

    const result = await response.json();
    return result.services;
  } catch (error) {
    console.error('Failed to load AI services from database:', error);
    throw error;
  }
};

/**
 * List media plan groups for brand from MongoDB
 */
const listMediaPlanGroupsForBrandFromDatabase = async (brandId: string): Promise<{
  id: string;
  name: string;
  prompt: string;
  source?: MediaPlanGroup['source'];
  productImages?: 
  { 
    name: string; 
    type: string; 
    data: string 
  }[]; 
  personaId?: string;
}[]> => {
  try {
    const response = await fetch('/api/mongodb?action=list-media-plan-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list media plan groups: ${response.statusText}`);
    }

    const result = await response.json();
    return result.groups;
  } catch (error) {
    console.error('Failed to list media plan groups from database:', error);
    throw error;
  }
};

/**
 * Load media plan from MongoDB
 */
const loadMediaPlanFromDatabase = async (planId: string): Promise<{
  plan: MediaPlan;
  imageUrls: Record<string, string>;
  videoUrls: Record<string, string>;
}> => {
  try {
    const response = await fetch('/api/mongodb?action=load-media-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to load media plan: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to load media plan from database:', error);
    throw error;
  }
};

/**
 * Bulk patch posts in MongoDB
 */
const bulkPatchPostsInDatabase = async (updates: { postId: string; fields: Record<string, any> }[]): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=bulk-patch-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk patch posts: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Posts bulk patched successfully:', result);
  } catch (error) {
    console.error('Failed to bulk patch posts in database:', error);
    throw error;
  }
};

/**
 * Bulk update post schedules in MongoDB
 */
const bulkUpdatePostSchedulesInDatabase = async (updates: { postId: string; scheduledAt: string; status: 'scheduled' }[]): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=bulk-update-post-schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk update post schedules: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Post schedules bulk updated successfully:', result);
  } catch (error) {
    console.error('Failed to bulk update post schedules in database:', error);
    throw error;
  }
};

/**
 * List brands from MongoDB
 */
const listBrandsFromDatabase = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const response = await fetch('/api/mongodb?action=list-brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to list brands: ${response.statusText}`);
    }

    const result = await response.json();
    return result.brands;
  } catch (error) {
    console.error('Failed to list brands from database:', error);
    throw error;
  }
};

/**
 * Check database credentials
 */
const checkDatabaseCredentials = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/mongodb?action=check-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      console.error(`Failed to check database credentials: ${response.statusText}`);
      return false;
    }

    const result = await response.json();
    console.log('Database credentials verified:', result);
    return true;
  } catch (error) {
    console.error('Failed to check database credentials:', error);
    return false;
  }
};

/**
 * Load a complete project from MongoDB
 */
const loadProjectFromDatabase = async (brandId: string): Promise<{
  assets: GeneratedAssets;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  brandId: string;
}> => {
  try {
    console.log(`Loading complete project for brand ID: ${brandId}`);
    
    // Make an API call to load the complete project
    const response = await fetch('/api/mongodb?action=load-complete-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to load complete project: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Loaded complete project for brand ID: ${brandId}`);
    return result;
  } catch (error) {
    console.error('Failed to load complete project from database:', error);
    throw error;
  }
};

/**
 * Check if a product exists in the database by its ID
 */
const checkIfProductExistsInDatabase = async (productId: string): Promise<boolean> => {
  try {
    // This would typically make an API call to check if a product exists
    // For now, we'll implement a simple version that returns true
    // In a full implementation, this would check the database
    console.log(`Checking if product exists in database: ${productId}`);
    
    // Make an API call to check if the product exists
    const response = await fetch('/api/mongodb?action=check-product-exists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      console.error(`Failed to check if product exists: ${response.statusText}`);
      return false;
    }

    const result = await response.json();
    return result.exists || false;
  } catch (error) {
    console.error('Failed to check if product exists in database:', error);
    return false;
  }
};

/**
 * Load ideas for a specific trend
 */
const loadIdeasForTrend = async (trendId: string, brandId: string): Promise<Idea[]> => {
  console.log("loadIdeasForTrend called with trendId:", trendId, "brandId:", brandId);
  
  const cacheKey = `ideas-${trendId}-${brandId}`;
  if (dataCache[cacheKey]) {
    console.log("Returning cached ideas data");
    return dataCache[cacheKey];
  }
  
  try {
    const response = await fetch('/api/mongodb?action=load-ideas-for-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trendId, brandId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to load ideas for trend. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to load ideas for trend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Ideas data received from API:", data);
    
    // Cache the data
    dataCache[cacheKey] = data.ideas;
    return data.ideas;
  } catch (error) {
    console.error("Error loading ideas for trend:", error);
    throw error;
  }
};


// --- NEW FUNCTIONS FOR OPTIMIZED LOADING ---

/**
 * Load initial project data for fast rendering of the BrandKitView
 */
const loadInitialProjectData = async (brandId: string): Promise<{
  brandSummary: { id: string; name: string; logoUrl?: string };
  brandKitData: {
    brandFoundation: BrandFoundation;
    coreMediaAssets: CoreMediaAssets;
    unifiedProfileAssets: UnifiedProfileAssets;
  };
}> => {
  const response = await fetch('/api/mongodb?action=initial-load', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to load initial project data: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Load media plan groups list for the MediaPlanView
 */
const loadMediaPlanGroupsList = async (brandId: string): Promise<{
  id: string;
  name: string;
  prompt: string;
  source?: MediaPlanGroup['source'];
  productImages?: { name: string; type: string; data: string }[];
  personaId?: string;
}[]> => {
  const response = await fetch('/api/mongodb?action=list-media-plan-groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to load media plan groups: ${response.statusText}`);
  }

  const { groups } = await response.json();
  return groups;
};

/**
 * Load strategy hub data (trends and ideas)
 */
const loadStrategyHubData = async (brandId: string): Promise<{
  trends: Trend[];
  ideas: Idea[];
}> => {
  console.log("loadStrategyHubData called with brandId:", brandId);
  const response = await fetch('/api/mongodb?action=strategy-hub', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',},
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to load strategy hub data. Status:", response.status, "Text:", errorText);
    throw new Error(`Failed to load strategy hub data: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Strategy hub data received from API:", data);
  return data;
};

/**
 * Load affiliate vault data
 */
const loadAffiliateVaultData = async (brandId: string): Promise<AffiliateLink[]> => {
  console.log("loadAffiliateVaultData called with brandId:", brandId);
  const response = await fetch('/api/mongodb?action=affiliate-vault', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to load affiliate vault data. Status:", response.status, "Text:", errorText);
    throw new Error(`Failed to load affiliate vault data: ${response.statusText}`);
  }

  const { affiliateLinks } = await response.json();
  console.log("Affiliate vault data received from API:", affiliateLinks);
  return affiliateLinks;
};

/**
 * Load personas data
 */
const loadPersonasData = async (brandId: string): Promise<Persona[]> => {
  console.log("loadPersonasData called with brandId:", brandId);
  const response = await fetch('/api/mongodb?action=personas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to load personas data. Status:", response.status, "Text:", errorText);
    throw new Error(`Failed to load personas data: ${response.statusText}`);
  }

  const { personas } = await response.json();
  console.log("Personas data received from API:", personas);
  return personas;
};

/**
 * Load media plan posts with pagination
 * Note: This implementation is for MongoDB.
 * this should be updated to use proper database pagination for better performance.
 * @param planId - The ID of the media plan to load posts for
 * @param page - The page number to load (1-indexed)
 * @param limit - The number of posts per page
 */
const loadMediaPlanPostsWithPagination = async (
  planId: string,
  page: number = 1,
  limit: number = 30
) => {
  // This is a placeholder implementation
  // In a real implementation, this would fetch posts from MongoDB with pagination
  console.log(`Loading posts for plan ${planId}, page: ${page}, limit: ${limit}`);
  return { posts: [], total: 0 };
};

/**
 * Load a specific trend from MongoDB
 * @param trendId - The ID of the trend to load
 * @param brandId - The ID of the brand the trend belongs to
 */
export const loadTrend = async (trendId: string, brandId: string): Promise<Trend | null> => {
  console.log("loadTrend called with trendId:", trendId, "brandId:", brandId);
  
  const cacheKey = `trend-${trendId}-${brandId}`;
  if (dataCache[cacheKey]) {
    console.log("Returning cached trend data");
    return dataCache[cacheKey];
  }
  
  try {
    const response = await fetch('/api/mongodb?action=load-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trendId, brandId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to load trend. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to load trend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Trend data received from API:", data);
    
    // Cache the data
    dataCache[cacheKey] = data.trend;
    return data.trend;
  } catch (error) {
    console.error("Error loading trend:", error);
    throw error;
  }
};


// Export all functions with MongoDB-specific names
export { 
  fetchSettingsFromDatabase as fetchSettings,
  saveSettingsToDatabase as saveSettings,
  fetchAdminDefaultsFromDatabase as fetchAdminDefaults,
  saveAdminDefaultsToDatabase as saveAdminDefaults,
  createOrUpdateBrandRecordInDatabase as createOrUpdateBrandRecord,
  loadCompleteAssetsFromDatabase as loadCompleteAssets,
  syncAssetMediaWithDatabase as syncAssetMedia,
  saveAffiliateLinksToDatabase as saveAffiliateLinks,
  fetchAffiliateLinksForBrandFromDatabase as fetchAffiliateLinksForBrand,
  deleteAffiliateLinkFromDatabase as deleteAffiliateLink,
  savePersonaToDatabase as savePersona,
  deletePersonaFromDatabase,
  assignPersonaToPlanInDatabase,
  updateMediaPlanPostInDatabase,
  saveMediaPlanGroupToDatabase as saveMediaPlanGroup,
  saveTrendToDatabase as saveTrend,
  deleteTrendFromDatabase as deleteTrend,
  saveIdeasToDatabase as saveIdeas,
  saveAIServiceToDatabase as saveAIService,
  deleteAIServiceFromDatabase as deleteAIService,
  saveAIModelToDatabase as saveAIModel,
  deleteAIModelFromDatabase as deleteAIModel,
  loadAIServicesFromDatabase as loadAIServices,
  listMediaPlanGroupsForBrandFromDatabase as listMediaPlanGroupsForBrand,
  loadMediaPlanFromDatabase as loadMediaPlan,
  bulkPatchPostsInDatabase as bulkPatchPosts,
  bulkUpdatePostSchedulesInDatabase as bulkUpdatePostSchedules,
  listBrandsFromDatabase,
  checkDatabaseCredentials,
  loadProjectFromDatabase,
  checkIfProductExistsInDatabase,
  loadIdeasForTrend,
  loadInitialProjectData,
  loadMediaPlanGroupsList,
  loadStrategyHubData,
  loadAffiliateVaultData,
  loadPersonasData,
  loadMediaPlanPostsWithPagination,
};
```

**`/src/services/bffService.ts`**
```typescript
import type { MediaPlanPost, AffiliateLink, BrandFoundation, Persona } from '../../types';

// Get the BFF URL from environment variables or use default
// In production, VITE_BFF_URL should be set to your actual BFF deployment URL
const BFF_URL = import.meta.env.VITE_BFF_URL || '';

// Generic fetch helper with error handling
export const bffFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // Use relative path when proxying through Vite in development
  // Use full URL in production when VITE_BFF_URL is set
  const url = BFF_URL ? `${BFF_URL}${endpoint}` : endpoint;
  
  try {
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'include',
    };
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `BFF request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Re-throw the error to be handled by the calling function
    throw error;
  }
};

// --- Gemini API Functions ---
export const generateContentWithBff = async (
  model: string,
  contents: string,
  config?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/gemini?action=generate', {
      method: 'POST',
      body: JSON.stringify({ model, contents, config }),
    });
    
    return response.text;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini/generate:`, error);
    throw error;
  }
};

export const generateImageWithBff = async (
  model: string,
  prompt: string,
  config?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/gemini?action=generate-image', {
      method: 'POST',
      body: JSON.stringify({ model, prompt, config }),
    });
    
    return response.image;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini/generate-image:`, error);
    throw error;
  }
};

// --- OpenRouter API Functions ---
export const generateContentWithOpenRouterBff = async (
  model: string,
  messages: any[],
  responseFormat?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/openrouter?action=generate', {
      method: 'POST',
      body: JSON.stringify({ model, messages, responseFormat }),
    });
    
    return response.text;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/openrouter/generate:`, error);
    throw error;
  }
};

export const generateImageWithOpenRouterBff = async (
  model: string,
  messages: any[],
  responseFormat?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/openrouter?action=generate-image', {
      method: 'POST',
      body: JSON.stringify({ model, messages, responseFormat }),
    });
    
    return response.image;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/openrouter/generate-image:`, error);
    throw error;
  }
};

// --- Cloudinary API Functions ---
export const uploadMediaWithBff = async (
  media: Record<string, string>,
  cloudName: string,
  uploadPreset: string
): Promise<Record<string, string>> => {
  try {
    const response = await bffFetch('/api/cloudinary/upload', {
      method: 'POST',
      body: JSON.stringify({ media, cloudName, uploadPreset }),
    });
    
    return response.uploadedUrls;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/cloudinary/upload:`, error);
    throw error;
  }
};

// --- Facebook API Functions ---
export const publishToFacebookWithBff = async (
  post: MediaPlanPost,
  imageUrl: string | undefined,
  pageId: string,
  accessToken: string,
  videoUrl?: string
): Promise<{ publishedUrl: string }> => {
  try {
    const response = await bffFetch('/api/facebook/publish', {
      method: 'POST',
      body: JSON.stringify({ post, imageUrl, pageId, accessToken, videoUrl }),
    });
    
    return response;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/facebook/publish:`, error);
    throw error;
  }
};

// --- Database API Functions ---
export const databaseRequestWithBff = async (
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<any> => {
  try {
    const response = await bffFetch('/api/database/request', {
      method: 'POST',
      body: JSON.stringify({ method, path, body, headers }),
    });
    
    return response;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/database/request:`, error);
    throw error;
  }
};

// --- Health Check ---
export const checkBffHealth = async (): Promise<{
  status: string;
  timestamp: string;
  services: Record<string, boolean>;
}> => {
  try {
    return await bffFetch('/api/health');
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/health:`, error);
    throw error;
  }
};

// --- Cloudflare API Functions ---
export const generateImageWithCloudflareBff = async (
  prompt: string,
  model: string,
  image?: number[]
): Promise<string> => {
  try {
    const response = await bffFetch('/api/cloudflare/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, model, image }),
    });
    
    return response.image;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/cloudflare/generate-image:`, error);
    throw error;
  }
};

// --- Gemini Embedding Functions ---
export const generateEmbeddingsWithBff = async (
  texts: string[],
  taskTypes: string[]
): Promise<number[][]> => {
  try {
    const response = await bffFetch('/api/gemini?action=embed', {
      method: 'POST',
      body: JSON.stringify({ texts, taskTypes }),
    });
    
    return response.embeddings;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini/embed:`, error);
    throw error;
  }
};
```

Session Summary (2025-09-01)

The bug preventing new brand kits from saving was caused by a **stale state closure** and **silent failure**. 🐞 The `ensureMongoProject` function, a `useCallback` hook, had a missing dependency: the `areCredentialsSet` state variable. This caused the function to retain an outdated `false` value for the credentials status.

***

### Bug Fixes

The `handleGenerateKit` function failed to check the return value of `ensureMongoProject`. Since the latter was returning `null` due to the stale state, the save operation was silently skipped.

* **Dependency Array Update**: To fix this, `areCredentialsSet` was added to the dependency array of the `ensureMongoProject` `useCallback` hook. This ensures the function re-creates itself with the latest `areCredentialsSet` value.

* **Improved Error Handling**: The `handleGenerateKit` function was updated to check for a `null` return value from `ensureMongoProject`. If `null` is returned, a non-blocking toast notification now informs the user that the generated content was not saved to the database due to missing credentials.

The primary file affected was **src/App.tsx**, where the state management and error-handling logic were corrected.

Session Summary (2025-09-02)
### Backend and Frontend Refactoring

The backend and frontend of the application have been refactored to streamline the "brand kit" generation feature. The core change involves **consolidating four separate MongoDB collections** (`brandSettings`, `brandValues`, `keyMessages`, and `logoConcepts`) into a single, main **`brands` collection**.

---

### Key Technical Changes

#### Backend (API)
* **MongoDB Schema:** The `brands` collection now stores all brand-related data, including settings, values, key messages, and logo concepts, within a single document for each brand.
* **API Endpoints:** The API has been updated to use this new, unified data structure.
    * The `create-or-update-brand` endpoint now accepts and saves all brand data in a single call.
    * Endpoints like `fetch-settings`, `save-settings`, `load-complete-project`, and `initial-load` have been modified to query for and retrieve data from the consolidated `brands` collection.
* **Database Consistency:** Database queries have been standardized to use the `_id` field instead of a custom `brandId` to fix an underlying BSONError, ensuring consistent data retrieval and manipulation.

---

#### Frontend (UI)
* **Data Service:** The `databaseService.ts` file has been refactored to align with the new API structure. It now sends and receives the complete, consolidated brand object and no longer contains separate functions for handling individual brand data like settings.
* **UI Components:**
    * **`SettingsModal.tsx`**: This component was changed from a stateful component that fetched its own data to a "dumb" component. It now receives the `settings` object and a save function (`onSave`) as props from a parent component, making it more reusable.
    * **`App.tsx`**: The main application component now manages the `settings` state. It includes a new `handleSaveSettings` function that updates the entire `generatedAssets` state object and then calls `createOrUpdateBrandRecord` to persist the changes to the database.
    * **`BrandProfiler.tsx` and `AssetDisplay.tsx`**: These components required no changes as they were already designed to handle the consolidated data structure.

---

### Database Cleanup and Bug Fix
* A bug that caused a **`BSONError`** during new brand generation was identified and fixed. The issue was traced to the `ensureMongoProject` function in `App.tsx`, which was passing an incorrect argument to the backend's `createOrUpdateBrandRecord` function. The corrected code ensures that image URLs are properly populated in the assets object before it is sent to the database.
* A subsequent frontend error (`handleSaveSettings is not defined`) was identified as a scope issue in `App.tsx`. The `handleSaveSettings` function has been corrected to use the `useCallback` hook, ensuring it is properly defined and accessible to child components.

The refactoring and fixes are complete, simplifying the database schema and improving the reliability of the brand generation process.