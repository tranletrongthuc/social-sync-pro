import { getClientAndDb } from '../server_lib/mongodb.js';
import { allowCors } from '../server_lib/cors.js';
import { ObjectId } from 'mongodb';
import { defaultPrompts } from '../server_lib/defaultPrompts.js';
import { initialSettings } from '../server_lib/defaultSettings.js';

// Helper function for deep merging settings objects
const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);

function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

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
            { $set: { personaId: personaId }}
          );
          
          // Update posts if needed
          if (updatedPosts && updatedPosts.length > 0) {
            const postsCollection = db.collection('mediaPlanPosts');
            for (const post of updatedPosts) {
              await postsCollection.updateOne(
                createIdFilter(post.id),
                { $set: { mediaPrompt: post.mediaPrompt }, }
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
                },
                $unset: { upsert: true }
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

      case 'app-init':
        console.log('--- Received request for /api/mongodb/app-init ---');
        try {
          // 1. Check Credentials
          const { MONGODB_URI } = process.env;
          if (!MONGODB_URI) {
            return response.status(200).json({ credentialsSet: false, brands: [], adminDefaults: {}, aiModels: [] });
          }
          await db.command({ ping: 1 });

          // 2. List Brands (with robust filtering)
          const brandRecords = await brandsCollection.find({}).toArray();
          const brands = brandRecords
            .filter(record => record && record._id && record.name) // Filter out malformed records
            .map(record => ({
              id: record._id.toString(),
              name: record.name
            }));

          // 3. Fetch Admin Defaults and AI Models in parallel
          const adminSettingsCollection = db.collection('adminSettings');
          const aiModelsCollection = db.collection('aiModels');

          const [settingsRecord, modelRecords] = await Promise.all([
              adminSettingsCollection.findOne({}),
              aiModelsCollection.find({}).toArray()
          ]);

          // Auto-initialize settings if needed
          let adminDefaults = settingsRecord;
          if (!adminDefaults || !adminDefaults.prompts) {
            console.log('No admin prompts found in DB, initializing from defaultSettings.js...');
            await adminSettingsCollection.updateOne(
                  {},
                  { $set: initialSettings },
                  { upsert: true }
              );
            adminDefaults = await adminSettingsCollection.findOne({});
          }
          
          // Sanitize models
          const aiModels = modelRecords.map(m => ({ ...m, id: m._id.toString() }));

          response.status(200).json({ credentialsSet: true, brands: brands, adminDefaults: adminDefaults || {}, aiModels: aiModels });
          console.log('--- App init data sent ---');
        } catch (error) {
          console.error('App init failed:', error);
          response.status(500).json({ error: `App initialization failed: ${error.message}` });
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
                // This is an existing brand. Update it.
                await brandsCollection.updateOne(
                  { _id: new ObjectId(brandId) },
                  { $set: brandDocument },
                  { upsert: true } // Use upsert to be safe, though a brandId should always exist here.
                );
                response.status(200).json({ brandId: brandId });
              } else {
                // This is a new brand. Fetch admin defaults and copy them.
                const adminSettingsCollection = db.collection('adminSettings');
                const adminSettings = await adminSettingsCollection.findOne({});
                
                // The app-init logic now guarantees that adminSettings from the DB is the complete source of truth for defaults.
                // We just copy it directly.
                brandDocument.settings = adminSettings;

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

      case 'load-settings-data':
        console.log('--- Received request for /api/mongodb/load-settings-data ---');
        try {
          const aiModelsCollection = db.collection('aiModels');
          const adminSettingsCollection = db.collection('adminSettings');

          // Fetch all data in parallel
          const [
            modelRecords,
            adminSettingsRecord
          ] = await Promise.all([
            aiModelsCollection.find({}).toArray(),
            adminSettingsCollection.findOne({})
          ]);
          
          // Group models by service
          const servicesMap = new Map();
          modelRecords.forEach(model => {
            if (!servicesMap.has(model.service)) {
              servicesMap.set(model.service, {
                id: model.service, // In the new schema, the service name is the ID
                name: model.service,
                models: []
              });
            }
            servicesMap.get(model.service).models.push({
              id: model._id.toString(),
              name: model.name,
              provider: model.provider,
              capabilities: model.capabilities || []
            });
          });

          const services = Array.from(servicesMap.values());

          // Sanitize admin settings to ensure it's not null
          let adminSettings = {};
          if (adminSettingsRecord) {
            adminSettings = {
              ...adminSettingsRecord,
              prompts: {
                ...defaultPrompts,
                ...(adminSettingsRecord.prompts || {}),
              }
            };
          } else {
            adminSettings = {
                language: 'English',
                totalPostsPerMonth: 30,
                mediaPromptSuffix: '',
                affiliateContentKit: '',
                textGenerationModel: 'gemini-1.5-pro-latest',
                imageGenerationModel: 'dall-e-3',
                textModelFallbackOrder: [],
                visionModels: [],
                contentPillars: [],
                prompts: defaultPrompts
            };
          }
          
          response.status(200).json({ services, adminSettings });
          console.log('--- Settings data loaded ---');
        } catch (error) {
          console.error('--- CRASH in /api/mongodb/load-settings-data ---');
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
              pillar: record.pillar, // ADDED: Load pillar property
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

              // Deep merge the received settings with the defaults to ensure all prompt fields exist
              const settingsToSave = {
                ...settings,
                prompts: deepMerge(defaultPrompts, settings.prompts || {})
              };
              
              // Update or insert admin settings
              const result = await adminSettingsCollection.updateOne(
                {}, // Match any document
                { 
                  $set: {
                    language: settingsToSave.language,
                    totalPostsPerMonth: settingsToSave.totalPostsPerMonth,
                    mediaPromptSuffix: settingsToSave.mediaPromptSuffix,
                    affiliateContentKit: settingsToSave.affiliateContentKit,
                    textGenerationModel: settingsToSave.textGenerationModel,
                    imageGenerationModel: settingsToSave.imageGenerationModel,
                    textModelFallbackOrder: settingsToSave.textModelFallbackOrder || [],
                    visionModels: settingsToSave.visionModels || [],
                    contentPillars: settingsToSave.contentPillars || [],
                    prompts: settingsToSave.prompts, // Save the full prompts object
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
                            update: { $set: linkDocument },
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
              const { model } = request.body; // Service name is now part of the model object
              
              const aiModelsCollection = db.collection('aiModels');
              
              // Prepare model document
              const modelDocument = {
                name: model.name,
                provider: model.provider,
                capabilities: model.capabilities || [],
                service: model.service, // New unified field
                updatedAt: new Date()
              };
              
              // If model.id exists, update; otherwise create new
              if (model.id) {
                await aiModelsCollection.updateOne(
                  { _id: new ObjectId(model.id) },
                  { $set: modelDocument },
                  { upsert: true }
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
    
          case 'save-ideas':
            console.log('--- Received request for /api/mongodb/save-ideas ---');
            try {
              const { ideas, brandId } = request.body;
              
              const ideasCollection = db.collection('ideas');
              const newIdeas = [];
              const operations = ideas.map(idea => {
                const ideaDocument = {
                    title: idea.title,
                    description: idea.description,
                    targetAudience: idea.targetAudience,
                    productId: idea.productId,
                    trendId: idea.trendId,
                    brandId: brandId,
                    updatedAt: new Date()
                };

                if (idea.id && ObjectId.isValid(idea.id)) {
                    return {
                        updateOne: {
                            filter: { _id: new ObjectId(idea.id) },
                            update: { $set: ideaDocument },
                        }
                    };
                } else {
                    const newIdeaObjectId = new ObjectId();
                    const newIdeaId = newIdeaObjectId.toString();
                    const newIdeaDocument = {
                        ...ideaDocument,
                        _id: newIdeaObjectId,
                        id: newIdeaId,
                    };
                    newIdeas.push(newIdeaDocument);
                    return {
                        insertOne: {
                            document: newIdeaDocument
                        }
                    };
                }
              });

              if (operations.length > 0) {
                await ideasCollection.bulkWrite(operations);
              }
              
              response.status(200).json({ success: true, ideas: newIdeas });
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

              // 1. Generate a new ObjectId on the server for the group.
              const groupObjectId = new ObjectId();
              const groupId = groupObjectId.toString();

              const groupDocument = {
                _id: groupObjectId, // ObjectId for the DB
                id: groupId,       // String version for consistency
                name: group.name,
                prompt: group.prompt,
                source: group.source,
                productImages: group.productImages || [],
                brandId,
                personaId: group.personaId,
                updatedAt: new Date(),
                createdAt: new Date(),
              };
    
              // Insert the new group document.
              await mediaPlanGroupsCollection.insertOne(groupDocument);
              
              const allPostsWithNewIds = [];
              if (group.plan && Array.isArray(group.plan)) {
                // 2. Ignore client-side IDs and generate new ObjectIds for each post.
                group.plan.forEach(week => {
                  if (week && week.posts && Array.isArray(week.posts)) {
                    week.posts.forEach((post, postIndex) => {
                      const postObjectId = new ObjectId();
                      const postId = postObjectId.toString();
                      
                      allPostsWithNewIds.push({
                        ...post,
                        _id: postObjectId, // Use the new server-generated ObjectId
                        id: postId,         // Use the string version of the new ID
                        mediaPlanId: groupId,
                        week: week.week,
                        theme: week.theme,
                        brandId: brandId,
                        imageUrl: post.imageKey ? imageUrls[post.imageKey] : null,
                        videoUrl: post.videoKey ? imageUrls[post.videoKey] : null,
                        postOrder: postIndex,
                        updatedAt: new Date(),
                        createdAt: new Date(),
                      });
                    });
                  }
                });
              }
              
              // 3. Save the posts with their new, correct IDs.
              if (allPostsWithNewIds.length > 0) {
                  const bulkOperations = allPostsWithNewIds.map(post => ({
                      insertOne: {
                          document: post
                      }
                  }));
                  await postsCollection.bulkWrite(bulkOperations);
              }
              
              // 4. Return the saved plan with the correct, server-generated IDs to the client.
              const finalPlan = {
                ...groupDocument,
                plan: group.plan.map(week => ({
                  ...week,
                  posts: allPostsWithNewIds
                    .filter(p => p.week === week.week)
                    // Ensure client gets string IDs
                    .map(p => ({ ...p, _id: p.id })) 
                }))
              };

              // Remove the ObjectId version of _id before sending to client
              delete finalPlan._id;

              response.status(200).json({ savedPlan: finalPlan });
              console.log('--- Media plan group saved with server-generated ObjectIds ---');
            } catch (error) {
              console.error('--- CRASH in /api/mongodb/save-media-plan-group ---');
              console.error('Error details:', error);
              throw error;
            }
            break;
    
          case 'save-persona':
            console.log('--- Received request for /api/mongodb/save-persona ---');
            try {
              const { persona, brandId } = request.body;
              
              const personasCollection = db.collection('personas');
              
              // Prepare persona document with the new rich structure
              const personaDocument = {
                nickName: persona.nickName,
                demographics: persona.demographics || { age: 0, location: '', occupation: '' },
                backstory: persona.backstory || '',
                voice: persona.voice || { personalityTraits: [], communicationStyle: { formality: 50, energy: 50 }, linguisticRules: [] },
                knowledgeBase: persona.knowledgeBase || [],
                brandRelationship: persona.brandRelationship || { originStory: '', coreAffinity: '', productUsage: '' },
                visualCharacteristics: persona.visualCharacteristics || '',

                // Legacy fields
                outfitDescription: persona.outfitDescription || '',
                mainStyle: persona.mainStyle || '',
                activityField: persona.activityField || '',
                avatarImageKey: persona.avatarImageKey,
                avatarImageUrl: persona.avatarImageUrl,
                photos: persona.photos || [],
                socialAccounts: persona.socialAccounts || [],
                gender: persona.gender,

                brandId: brandId,
                updatedAt: new Date(),
              };
              
              // If persona.id exists AND it's a valid ObjectId, it's an update.
              if (persona.id && ObjectId.isValid(persona.id)) {
                await personasCollection.updateOne(
                  { _id: new ObjectId(persona.id) },
                  { $set: personaDocument },
                  { upsert: true }
                );
                response.status(200).json({ id: persona.id });
              } else {
                // Otherwise, it's a new persona. Generate a new, unified ID.
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
                    { $set: { settings: settings, updatedAt: new Date() } }
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
              
              // If trend.id exists and is a valid ObjectId, it's an update.
              if (trend.id && ObjectId.isValid(trend.id)) {
                await trendsCollection.updateOne(
                  { _id: new ObjectId(trend.id) },
                  { $set: trendDocument },
                  { upsert: true }
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
                    { $set: brandUpdates },
                    { upsert: true }
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
              
              // Prepare post document with all possible fields from the client
              const postDocument = {
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
                imageUrl: imageUrl, // Comes from request body separately
                videoKey: post.videoKey,
                videoUrl: videoUrl, // Comes from request body separately
                mediaOrder: post.mediaOrder || [],
                sources: post.sources || [],
                scheduledAt: post.scheduledAt,
                publishedAt: post.publishedAt,
                publishedUrl: post.publishedUrl,
                autoComment: post.autoComment,
                status: post.status,
                pillar: post.pillar,
                isPillar: post.isPillar,
                brandId: brandId, // Comes from request body separately
                mediaPlanId: post.mediaPlanId,
                promotedProductIds: post.promotedProductIds || [],
                postOrder: post.postOrder,
                updatedAt: new Date()
              };
              
              // Remove undefined fields to avoid overwriting existing data with null
              Object.keys(postDocument).forEach(key => 
                postDocument[key] === undefined && delete postDocument[key]
              );
              
              // Update the post. Do NOT upsert. If the post doesn't exist, it's a client-side data issue.
              const result = await postsCollection.updateOne(
                createIdFilter(post.id),
                { $set: postDocument }
              );

              if (result.matchedCount === 0) {
                console.warn(`--- update-media-plan-post did not find a document to update for id: ${post.id} ---`);
              }
              
              response.status(200).json({ success: true, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
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
                    
                    const [brandRecord, affiliateLinksRecords] = await Promise.all([
                        brandsCollection.findOne({ _id: new ObjectId(brandId) }),
                        db.collection('affiliateProducts').find({ brandId: brandId }).toArray()
                    ]);
                    
                    if (!brandRecord) {
                      return response.status(404).json({ error: `Brand with ID ${brandId} not found.` });
                    }

                    const affiliateLinks = affiliateLinksRecords.map((record) => ({
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
                        ...record
                    }));
        
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
                      brandKitData,
                      affiliateLinks
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
    
        
    
        case 'load-media-plan-posts-DEPRECATED':
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
                    ...record, // Spread all fields from the database record
                    id: record._id.toString(), // Ensure 'id' is the string representation of '_id'
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
    
        case 'load-media-plan-posts':
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