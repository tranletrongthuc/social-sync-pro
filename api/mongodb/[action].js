import { getClientAndDb } from '../lib/mongodb.js';
import { allowCors } from '../lib/cors.js';
import { ObjectId } from 'mongodb';

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
            { _id: new ObjectId(planId) },
            { $set: { personaId: personaId } }
          );
          
          // Update posts if needed
          if (updatedPosts && updatedPosts.length > 0) {
            const postsCollection = db.collection('mediaPlanPosts');
            for (const post of updatedPosts) {
              await postsCollection.updateOne(
                { _id: new ObjectId(post.id) },
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
              filter: { _id: new ObjectId(update.postId) },
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
              filter: { _id: new ObjectId(update.postId) },
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
          const { assets, imageUrls, brandId } = request.body;
          
          const brandsCollection = db.collection('brands');
          
          // Prepare brand document
          const brandDocument = {
            brandId: brandId || new ObjectId().toString(),
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
          
          // If brandId exists, update; otherwise create new
          if (brandId) {
            await brandsCollection.updateOne(
              { brandId: brandId },
              { $set: brandDocument }
            );
          } else {
            await brandsCollection.insertOne(brandDocument);
          }
          
          response.status(200).json({ brandId: brandDocument.brandId });
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
          const result = await affiliateProductsCollection.deleteOne({ 
            _id: new ObjectId(linkId),
            brandId: brandId
          });
          
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
          const result = await aiModelsCollection.deleteOne({ _id: new ObjectId(modelId) });
          
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
          const { trendId } = request.body;
          
          const trendsCollection = db.collection('trends');
          const result = await trendsCollection.deleteOne({ _id: new ObjectId(trendId) });
          
          response.status(200).json({ success: result.deletedCount > 0 });
          console.log('--- Trend deleted ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/delete-trend ---');
          throw error;
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
          
          const mediaPlanGroupsCollection = db.collection('mediaPlanGroups');
          const planRecords = await mediaPlanGroupsCollection.find({ brandId: brandId }).toArray();
          
          const groups = planRecords.map(record => ({
            id: record._id.toString(),
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
          
          // Prepare bulk operations
          const bulkOperations = links.map(link => ({
            updateOne: {
              filter: { 
                _id: new ObjectId(link.id),
                brandId: brandId
              },
              update: { 
                $set: {
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
                }
              },
              upsert: true
            }
          }));
          
          const result = await affiliateProductsCollection.bulkWrite(bulkOperations);
          
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
          } else {
            const result = await aiModelsCollection.insertOne(modelDocument);
            model.id = result.insertedId.toString();
          }
          
          response.status(200).json({ id: model.id });
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
          } else {
            const result = await aiServicesCollection.insertOne(serviceDocument);
            service.id = result.insertedId.toString();
          }
          
          response.status(200).json({ id: service.id });
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
          
          // Process in batches
          const batchSize = 10;
          for (let i = 0; i < ideas.length; i += batchSize) {
            const batch = ideas.slice(i, i + batchSize);
            
            // Prepare bulk operations
            const bulkOperations = batch.map(idea => ({
              updateOne: {
                filter: { 
                  _id: new ObjectId(idea.id)
                },
                update: { 
                  $set: {
                    title: idea.title,
                    description: idea.description,
                    targetAudience: idea.targetAudience,
                    productId: idea.productId,
                    trendId: idea.trendId,
                    updatedAt: new Date()
                  }
                },
                upsert: true
              }
            }));
            
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
          
          // Prepare group document
          const groupDocument = {
            name: group.name,
            prompt: group.prompt,
            source: group.source,
            productImages: group.productImages || [],
            brandId: brandId,
            personaId: group.personaId,
            updatedAt: new Date()
          };
          
          // If group.id exists, update; otherwise create new
          let groupId;
          if (group.id) {
            await mediaPlanGroupsCollection.updateOne(
              { _id: new ObjectId(group.id) },
              { $set: groupDocument }
            );
            groupId = group.id;
          } else {
            const result = await mediaPlanGroupsCollection.insertOne(groupDocument);
            groupId = result.insertedId.toString();
          }
          
          // Save posts if they exist
          if (group.plan && group.plan.length > 0) {
            const postsCollection = db.collection('mediaPlanPosts');
            
            // Flatten plan into posts
            const allPosts = [];
            group.plan.forEach(week => {
              week.posts.forEach(post => {
                allPosts.push({
                  ...post,
                  mediaPlanId: groupId,
                  week: week.week,
                  theme: week.theme,
                  brandId: brandId,
                  imageUrl: post.imageKey ? imageUrls[post.imageKey] : null,
                  videoUrl: post.videoKey ? imageUrls[post.videoKey] : null
                });
              });
            });
            
            // Process posts in batches
            const batchSize = 10;
            for (let i = 0; i < allPosts.length; i += batchSize) {
              const batch = allPosts.slice(i, i + batchSize);
              
              // Prepare bulk operations
              const bulkOperations = batch.map(post => ({
                updateOne: {
                  filter: { 
                    _id: new ObjectId(post.id)
                  },
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
                      mediaPlanId: groupId,
                      promotedProductIds: post.promotedProductIds || [],
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
          } else {
            const result = await personasCollection.insertOne(personaDocument);
            persona.id = result.insertedId.toString();
          }
          
          response.status(200).json({ id: persona.id });
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
          } else {
            const result = await trendsCollection.insertOne(trendDocument);
            trend.id = result.insertedId.toString();
          }
          
          response.status(200).json({ id: trend.id });
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
                    _id: new ObjectId(logo.id),
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
            { _id: new ObjectId(post.id) },
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
          
          const ideasCollection = db.collection('ideas');
          const ideaRecords = await ideasCollection.find({ trendId: trendId }).toArray();
          
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
          console.log('--- Ideas for trend loaded ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/load-ideas-for-trend ---');
          throw error;
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