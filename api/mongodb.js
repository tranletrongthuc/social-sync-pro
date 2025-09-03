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
    const brandsCollection = db.collection('brands');

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
              const { assets, brandId } = request.body;
  
              // Ensure coreMediaAssets is properly structured
              const coreMediaAssets = {
                logoConcepts: (assets.coreMediaAssets?.logoConcepts || []).map(logo => ({...logo})),
                colorPalette: assets.coreMediaAssets?.colorPalette || {},
                fontRecommendations: assets.coreMediaAssets?.fontRecommendations || {}
              };

              const brandDocument = {
                name: assets.brandFoundation?.brandName || '',
                mission: assets.brandFoundation?.mission || '',
                usp: assets.brandFoundation?.usp || '',
                targetAudience: assets.brandFoundation?.targetAudience || '',
                personality: assets.brandFoundation?.personality || '',
                
                values: assets.brandFoundation?.values || [],
                keyMessaging: assets.brandFoundation?.keyMessaging || [],
                
                // Removed top-level logoConcepts field
                
                coreMediaAssets: coreMediaAssets,
                
                unifiedProfileAssets: {
                    ...assets.unifiedProfileAssets,
                    profilePictureImageUrl: '', // These will be populated later via sync-asset-media
                    coverPhotoImageUrl: ''
                },
                
                settings: assets.settings || {}, // New consolidated settings
  
                updatedAt: new Date(),
              };
  
              if (brandId) {
                await brandsCollection.updateOne(
                  { _id: new ObjectId(brandId) },
                  { $set: brandDocument }
                );
                response.status(200).json({ brandId: brandId });
              } else {
                const newBrandObjectId = new ObjectId();
                const newBrandId = newBrandObjectId.toString();
                const fullDocument = {
                    ...brandDocument,
                    _id: newBrandObjectId,
                    brandId: newBrandId, // for backward compatibility, can be removed later
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
              
              const brand = await brandsCollection.findOne({ _id: new ObjectId(brandId) });
              
              if (!brand) {
                return response.status(200).json(null);
              }
              
              response.status(200).json(brand.settings || {});
              console.log('--- Settings fetched ---');
            } catch (error) {
              console.error('--- CRASH in /api/mongodb/fetch-settings ---');
              throw error;
            }
            break;

      case 'list-brands':
        console.log('--- Received request for /api/mongodb/list-brands ---');
        try {
          const brandRecords = await brandsCollection.find({}).toArray();
          
          const brands = brandRecords.map(record => ({
            id: record._id.toString(),
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
                updatedAt: new Date(),
                // New auto-generation fields
                contentTone: persona.contentTone,
                visualCharacteristics: persona.visualCharacteristics,
                coreCharacteristics: persona.coreCharacteristics || [],
                keyMessages: persona.keyMessages || [],
                gender: persona.gender
              };
              
              // If persona.id exists AND it's a valid ObjectId, it's an update.
              if (persona.id && ObjectId.isValid(persona.id)) {
                await personasCollection.updateOne(
                  { _id: new ObjectId(persona.id) },
                  { $set: personaDocument }
                );
                response.status(200).json({ id: persona.id });
              } else {
                // Otherwise, it's a new persona (even if it has a client-side UUID).
                // We generate a new, unified ID on the backend.
                const newPersonaObjectId = new ObjectId();
                const newPersonaId = newPersonaObjectId.toString();
                const fullPersonaDocument = {
                    ...personaDocument,
                    _id: newPersonaObjectId,
                    id: newPersonaId // Unified ID
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
                  
                  const result = await brandsCollection.updateOne(
                    { _id: new ObjectId(brandId) },
                    { $set: { settings: settings, updatedAt: new Date() } },
                    { upsert: true }
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
                  const { brandId, assets } = request.body;
                  
                  const brand = await brandsCollection.findOne({ _id: new ObjectId(brandId) });
                  if (!brand) {
                    return response.status(404).json({ error: 'Brand not found' });
                  }
        
                  const brandUpdates = {
                    // Update the entire coreMediaAssets object. 
                    // This is safe as the frontend sends the full, correct structure.
                    'coreMediaAssets': assets.coreMediaAssets,
                    'unifiedProfileAssets': assets.unifiedProfileAssets
                  };
                  
                  await brandsCollection.updateOne(
                    { _id: new ObjectId(brandId) },
                    { $set: brandUpdates }
                  );
                  
                  response.status(200).json({ success: true });
                  console.log('--- Asset media synced ---');
                } catch (error) {
                  console.error('--- CRASH in /api/mongodb/sync-asset-media ---');
                  console.error('Error object:', error);
                  // Provide a more informative error response
                  response.status(500).json({ error: `Failed to sync asset media: ${error.message}` });
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
                sources: (post.sources || []).map(s => `${s.title}:${s.uri}`) || [],
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
                  
                  const brandRecord = await brandsCollection.findOne({ _id: new ObjectId(brandId) });
                  
                  if (!brandRecord) {
                    response.status(404).json({ error: `Brand with ID ${brandId} not found.` });
                    return;
                  }
                  
                  const [
                    affiliateProductsRecords,
                    personasRecords,
                    trendsRecords,
                    ideasRecords,
                    mediaPlanGroupsRecords
                  ] = await Promise.all([
                    db.collection('affiliateProducts').find({ brandId: brandId }).toArray(),
                    db.collection('personas').find({ brandId: brandId }).toArray(),
                    db.collection('trends').find({ brandId: brandId }).toArray(),
                    db.collection('ideas').find({ brandId: brandId }).toArray(),
                    db.collection('mediaPlanGroups').find({ brandId: brandId }).toArray()
                  ]);
                  
                  const affiliateLinks = affiliateProductsRecords.map(record => ({ /* ... */ }));
                  const personas = personasRecords.map(record => ({ /* ... */ }));
                  const trends = trendsRecords.map(record => ({ /* ... */ }));
                  const ideas = ideasRecords.map(record => ({ /* ... */ }));
                  const mediaPlans = mediaPlanGroupsRecords.map(record => ({ /* ... */ }));
                  
                  const assets = {
                    brandFoundation: {
                      brandName: brandRecord.name,
                      mission: brandRecord.mission,
                      values: brandRecord.values || [],
                      targetAudience: brandRecord.targetAudience,
                      personality: brandRecord.personality,
                      keyMessaging: brandRecord.keyMessaging || [],
                      usp: brandRecord.usp
                    },
                    coreMediaAssets: {
                      // Read logo concepts from the consolidated location
                      logoConcepts: brandRecord.coreMediaAssets?.logoConcepts || [],
                      colorPalette: brandRecord.coreMediaAssets?.colorPalette || {},
                      fontRecommendations: brandRecord.coreMediaAssets?.fontRecommendations || {}
                    },
                    unifiedProfileAssets: brandRecord.unifiedProfileAssets || {},
                    mediaPlans: mediaPlans,
                    affiliateLinks: affiliateLinks,
                    personas: personas,
                    trends: trends,
                    ideas: ideas,
                    settings: brandRecord.settings || {}
                  };
                  
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
                    
                    const brandRecord = await brandsCollection.findOne({ _id: new ObjectId(brandId) });
                    
                    if (!brandRecord) {
                      return response.status(404).json({ error: `Brand with ID ${brandId} not found.` });
                    }
        
                    const brandSummary = {
                      id: brandRecord._id.toString(),
                      name: brandRecord.name,
                      logoUrl: brandRecord.logoUrl // This field might not exist anymore, but keep for compatibility if needed elsewhere
                    };
        
                    const brandKitData = {
                      brandFoundation: {
                        brandName: brandRecord.name,
                        mission: brandRecord.mission,
                        values: brandRecord.values || [],
                        targetAudience: brandRecord.targetAudience,
                        personality: brandRecord.personality,
                        keyMessaging: brandRecord.keyMessaging || [],
                        usp: brandRecord.usp,
                      },
                      coreMediaAssets: {
                        // Read logo concepts from the consolidated location
                        logoConcepts: brandRecord.coreMediaAssets?.logoConcepts || [],
                        colorPalette: brandRecord.coreMediaAssets?.colorPalette || {},
                        fontRecommendations: brandRecord.coreMediaAssets?.fontRecommendations || {},
                      },
                      unifiedProfileAssets: brandRecord.unifiedProfileAssets || {},
                      settings: brandRecord.settings || {}
                    };

                    response.status(200).json({
                      brandSummary,
                      brandKitData
                    });
                    console.log('--- Initial load data sent to client ---');
        
                } catch (error) {
                    console.error('--- CRASH in /api/mongodb/initial-load ---');
                    throw error;
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
                    photos: record.photos || [],
                    socialAccounts: record.socialAccounts || [],
                    contentTone: record.contentTone,
                    visualCharacteristics: record.visualCharacteristics,
                    coreCharacteristics: record.coreCharacteristics,
                    keyMessages: record.keyMessages
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
                const trendRecord = await trendsCollection.findOne({ _id: new ObjectId(trendId), brandId: brandId });
                
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