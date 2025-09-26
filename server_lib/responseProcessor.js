// Utility function to save AI responses for debugging
function saveDebugResponse(response, filenamePrefix = 'ai_response') {
    try {
        const fs = require('fs');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${filenamePrefix}_${timestamp}.txt`;
        fs.writeFileSync(filename, response, 'utf8');
        console.log(`[DEBUG] Response saved to ${filename}`);
        return filename;
    } catch (error) {
        console.warn("[DEBUG] Failed to save response to file:", error.message);
        return null;
    }
}

function sanitizeAndParseJson(jsonText) {
    console.log("--- RUNNING LATEST responseProcessor.js ---"); // Diagnostic log
    if (!jsonText) {
        throw new Error("Received empty JSON string from AI.");
    }

    // Pre-process to remove common AI reasoning blocks
    let processedText = jsonText;
    
    // Remove common AI reasoning/scratchpad patterns
    // This regex looks for patterns like "thinking:", "reasoning:", "scratchpad:", or "think:" blocks
    // followed by content in markdown code blocks or just text until we hit a JSON structure
    processedText = processedText.replace(/(?:think|reasoning|scratchpad|analysis):\s*(?:\n)?```(?:json)?\n{0,3}[\s\S]*?```/gi, '');
    processedText = processedText.replace(/(?:think|reasoning|scratchpad|analysis):[\s\S]*?(?=\n{2}|{|\[|$)/gi, '');
    processedText = processedText.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    processedText = processedText.replace(/<scratchpad>[\s\S]*?<\/scratchpad>/gi, '');
    
    // Save raw response for debugging if parsing fails
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const debugFilename = `debug_response_${timestamp}.txt`;
    
    let sanitized = processedText.trim();

    // Try to find JSON object in the response
    const firstBrace = sanitized.indexOf('{');
    const firstBracket = sanitized.indexOf('[');
    
    // Find the first JSON-like structure (object or array)
    let firstJsonChar = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        firstJsonChar = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
        firstJsonChar = firstBrace;
    } else if (firstBracket !== -1) {
        firstJsonChar = firstBracket;
    }

    if (firstJsonChar === -1) {
        console.error("Could not find a valid JSON structure within the AI response:", jsonText);
        
        // Save the raw response for debugging
        try {
            const fs = require('fs');
            fs.writeFileSync(debugFilename, `=== RAW AI RESPONSE (NO JSON STRUCTURE FOUND) ===
${jsonText}`, 'utf8');
            console.log(`[DEBUG] Raw AI response saved to ${debugFilename}`);
        } catch (writeError) {
            console.warn("[DEBUG] Failed to save raw response to file:", writeError.message);
        }
        
        throw new Error("The AI response did not contain a recognizable JSON object.");
    }

    // Extract from the first JSON character to the end
    sanitized = sanitized.substring(firstJsonChar);
    
    // Try to find the end of the JSON structure
    let lastBrace = sanitized.lastIndexOf('}');
    let lastBracket = sanitized.lastIndexOf(']');
    
    // Find the last JSON-like structure ending
    let lastJsonChar = -1;
    if (lastBrace !== -1 && lastBracket !== -1) {
        lastJsonChar = Math.max(lastBrace, lastBracket);
    } else if (lastBrace !== -1) {
        lastJsonChar = lastBrace;
    } else if (lastBracket !== -1) {
        lastJsonChar = lastBracket;
    }
    
    if (lastJsonChar !== -1) {
        sanitized = sanitized.substring(0, lastJsonChar + 1);
    }

    // Remove trailing commas before closing braces/brackets
    sanitized = sanitized.replace(/,(\s*[\}\]])/g, '$1');

    try {
        return JSON.parse(sanitized);
    } catch (e) {
        console.error("Failed to parse AI JSON response:", jsonText);
        console.error("Sanitized text that failed to parse:", sanitized);
        
        // Save the raw response for debugging
        try {
            const fs = require('fs');
            fs.writeFileSync(debugFilename, `=== RAW AI RESPONSE ===
${jsonText}

=== SANITIZED TEXT THAT FAILED TO PARSE ===
${sanitized}`, 'utf8');
            console.log(`[DEBUG] Raw AI response saved to ${debugFilename}`);
        } catch (writeError) {
            console.warn("[DEBUG] Failed to save raw response to file:", writeError.message);
        }
        
        // Try to extract JSON using a stack-based approach as a last resort
        // This function finds the outermost JSON object or array by tracking braces/brackets
        function extractJsonStructure(text) {
            const results = [];
            let i = 0;
            
            while (i < text.length) {
                // Look for start of JSON structure
                if (text[i] === '{' || text[i] === '[') {
                    let start = i;
                    let braceCount = 0;
                    let bracketCount = 0;
                    let inString = false;
                    let escapeNext = false;
                    
                    while (i < text.length) {
                        if (escapeNext) {
                            escapeNext = false;
                        } else if (text[i] === '\\') {  // This checks for a literal backslash character
                            escapeNext = true;
                        } else if (text[i] === '"' && !escapeNext) {  // This checks for a quote character
                            inString = !inString;
                        } else if (!inString) {
                            if (text[i] === '{') {
                                braceCount++;
                            } else if (text[i] === '}') {
                                braceCount--;
                                if (braceCount === 0 && bracketCount === 0) {
                                    results.push(text.substring(start, i + 1));
                                    break;
                                }
                            } else if (text[i] === '[') {
                                bracketCount++;
                            } else if (text[i] === ']') {
                                bracketCount--;
                                if (bracketCount === 0 && braceCount === 0) {
                                    results.push(text.substring(start, i + 1));
                                    break;
                                }
                            }
                        }
                        i++;
                    }
                } else {
                    i++;
                }
            }
            
            return results;
        }
        
        // Try stack-based approach on the original processed text (after removing reasoning blocks)
        const jsonMatches = extractJsonStructure(processedText);
        if (jsonMatches && jsonMatches.length > 0) {
            // Try parsing the largest JSON match
            const largestMatch = jsonMatches.reduce((largest, current) => 
                current.length > largest.length ? current : largest, '');
            try {
                const parsed = JSON.parse(largestMatch);
                console.log("[DEBUG] Successfully parsed using enhanced stack-based extraction");
                return parsed;
            } catch (extractError) {
                console.warn("[DEBUG] Enhanced stack-based extraction also failed:", extractError.message);
            }
        }
        
        // Final fallback: try to find JSON in the original text as well
        const originalJsonMatches = extractJsonStructure(jsonText);
        if (originalJsonMatches && originalJsonMatches.length > 0) {
            const largestOriginalMatch = originalJsonMatches.reduce((largest, current) => 
                current.length > largest.length ? current : largest, '');
            try {
                const parsed = JSON.parse(largestOriginalMatch);
                console.log("[DEBUG] Successfully parsed using fallback extraction from original text");
                return parsed;
            } catch (extractError) {
                console.warn("[DEBUG] Fallback extraction also failed:", extractError.message);
            }
        }
        
        throw new Error("The AI returned a malformed or unexpected response.");
    }
}

function validateAndCorrectCarouselPrompt(mediaPrompt, contentType) {
    if (contentType !== 'Carousel') {
        return mediaPrompt;
    }
    if (Array.isArray(mediaPrompt) && mediaPrompt.every(item => typeof item === 'string')) {
        return mediaPrompt;
    }
    if (typeof mediaPrompt === 'string') {
        const prompts = [];
        const regex = /Image \d+[:-]?\s*(.*?)(?=(Image \d+[:-]?\s*|$))/gsi;
        let match;
        while ((match = regex.exec(mediaPrompt)) !== null) {
            const promptText = match[1].trim();
            if (promptText) {
                prompts.push(promptText);
            }
        }
        if (prompts.length > 0) {
            return prompts;
        }
        const delimiters = [
            /\n\s*\n/g,
            /؛\s*/g,
            /.\s+/g,
        ];
        for (const delimiter of delimiters) {
            const parts = mediaPrompt.split(delimiter).map(part => part.trim()).filter(part => part.length > 0);
            if (parts.length >= 2 && parts.length <= 10) {
                return parts;
            }
        }
        return [mediaPrompt];
    }
    return [String(mediaPrompt)];
}

function normalizeContentType(contentType) {
    switch (contentType) {
        case 'Carousel':
        case 'Image':
        case 'Video':
        case 'Reel':
        case 'Shorts':
        case 'Story':
            return contentType;
        default:
            return 'Image';
    }
}

function validateAndCorrectMediaPlanPost(post) {
    const { status, ...restOfPost } = post;
    const normalizedContentType = normalizeContentType(post.contentType);
    let processedMediaPrompt = '';
    if (post.mediaPrompt) {
        processedMediaPrompt = validateAndCorrectCarouselPrompt(post.mediaPrompt, normalizedContentType);
    }
    return {
        ...restOfPost,
        contentType: normalizedContentType,
        status: 'draft',
        mediaPrompt: processedMediaPrompt,
    };
}

function normalizeMediaPlanGroupResponse(data) {
    if (!data) throw new Error("Invalid or empty data provided to normalizeMediaPlanGroupResponse.");
    let effectiveData = data;
    let name = '';
    let plan = [];
    if (data.result && typeof data.result === 'object') {
        effectiveData = data.result;
    }
    if (effectiveData.name && typeof effectiveData.name === 'string') {
        name = effectiveData.name;
    }
    if (Array.isArray(effectiveData)) {
        plan = effectiveData;
    } else if (typeof effectiveData === 'object') {
        const possiblePlanKeys = ['plan', 'weeks', 'mediaPlan'];
        for (const key of possiblePlanKeys) {
            if (effectiveData[key] && Array.isArray(effectiveData[key])) {
                plan = effectiveData[key];
                break;
            }
        }
        if (effectiveData.plan && typeof effectiveData.plan === 'object' && !Array.isArray(effectiveData.plan)) {
            if (effectiveData.plan.name) name = effectiveData.plan.name;
            const possibleNestedKeys = ['weeks', 'mediaPlan'];
            for (const key of possibleNestedKeys) {
                if (effectiveData.plan[key] && Array.isArray(effectiveData.plan[key])) {
                    plan = effectiveData.plan[key];
                    break;
                }
            }
        }
    }
    if (!Array.isArray(plan)) {
        console.warn("Could not find a valid 'plan' or 'weeks' array in the AI response.", data);
    }
    return { name: name || 'Untitled Plan', plan };
}

function processMediaPlanResponse(jsonText, params) {
  const { userPrompt, pillar, settings, persona, selectedProduct } = params;
  const parsedResult = sanitizeAndParseJson(jsonText);
  const { name: planName, plan: planWeeks } = normalizeMediaPlanGroupResponse(parsedResult);
  const planWithEnhancements = (planWeeks || []).map(week => ({
      ...week,
      posts: (week.posts || []).map((post) => {
          const correctedPost = validateAndCorrectMediaPlanPost(post);
          return {
              ...correctedPost,
              pillar: pillar,
              promotedProductIds: selectedProduct ? [selectedProduct.id] : [],
          };
      }),
  }));
  const generateFallbackTitle = (userPrompt, selectedProduct, persona) => {
      if (selectedProduct) {
          let title = `Promotion: ${selectedProduct.productName}`;
          if (persona) {
              title += ` ft. ${persona.nickName}`;
          }
          return title;
      }
      if (persona) {
          return `Plan for ${persona.nickName}: ${userPrompt.substring(0, 30)}...`;
      }
      return userPrompt.substring(0, 50);
  }
  return {
      name: (planName && planName !== 'Untitled Plan') ? planName : generateFallbackTitle(userPrompt, selectedProduct, persona),
      prompt: userPrompt,
      plan: planWithEnhancements,
      source: 'wizard',
      personaId: persona?.id,
  };
}

function processBrandKitResponse(jsonText, language) {
    const parsedJson = sanitizeAndParseJson(jsonText);

    const brandFoundationData = parsedJson.brandFoundation || parsedJson.brand_foundation;
    const coreMediaAssetsData = parsedJson.coreMediaAssets || parsedJson.core_media_assets;
    const unifiedProfileAssetsData = parsedJson.unifiedProfileAssets || parsedJson.unified_profile_assets;
    const planData = parsedJson.mediaPlan || parsedJson.initial1MonthMediaPlan || parsedJson.initialMediaPlan || parsedJson.initial_1_month_media_plan;

    if (!brandFoundationData || !coreMediaAssetsData || !unifiedProfileAssetsData) {
        console.error("AI response is missing one or more root keys. Parsed JSON:", parsedJson);
        throw new Error("The AI returned a JSON object with a missing or incorrect structure. Please try again.");
    }
    
    const brandFoundation = {
        brandName: brandFoundationData.brandName || brandFoundationData.name || '',
        mission: brandFoundationData.mission || '',
        usp: brandFoundationData.usp || brandFoundationData.uniqueSellingProposition || '',
        targetAudience: brandFoundationData.targetAudience || brandFoundationData.audience || '',
        values: Array.isArray(brandFoundationData.values) 
            ? brandFoundationData.values 
            : typeof brandFoundationData.values === 'string'
                ? brandFoundationData.values.split(',').map((v) => v.trim()).filter((v) => v)
                : [],
        personality: brandFoundationData.personality || '',
        keyMessaging: Array.isArray(brandFoundationData.keyMessaging) 
            ? brandFoundationData.keyMessaging 
            : typeof brandFoundationData.keyMessaging === 'string'
                ? [brandFoundationData.keyMessaging]
                : []
    };
    
    if (coreMediaAssetsData?.logoConcepts) {
        coreMediaAssetsData.logoConcepts = coreMediaAssetsData.logoConcepts.map((logo) => {
            const imageKey = `logo_${Math.random().toString(36).substring(2, 9)}`;
            return {
                ...logo,
                prompt: logo.prompt || logo.description || '',
                imageKey: imageKey
            };
        });
    }
    if (unifiedProfileAssetsData) {
        unifiedProfileAssetsData.profilePictureImageKey = `profile_${Math.random().toString(36).substring(2, 9)}`;
        unifiedProfileAssetsData.coverPhotoImageKey = `cover_${Math.random().toString(36).substring(2, 9)}`;
    }

    let mediaPlanGroup = null;
    if (planData && Array.isArray(planData)) {
        const planWithIds = planData.map(week => ({
            ...week,
            posts: (week.posts || []).map((post) => {
                const { status, ...restOfPost } = post;
                return {
                    ...restOfPost,
                    imageKey: post.mediaPrompt ? `media_plan_post_${Math.random().toString(36).substring(2, 9)}` : undefined,
                    status: 'draft',
                };
            }),
        }));
        
        mediaPlanGroup = {
            name: language === 'Việt Nam' ? 'Kế hoạch Ra mắt Thương hiệu' : 'Brand Launch Plan',
            prompt: language === 'Việt Nam' ? 'Kế hoạch ban đầu được tạo cho việc ra mắt thương hiệu.' : 'Initial plan generated for brand launch.',
            plan: planWithIds,
            source: 'brand-launch',
        };
    }
    
    const assets = {
        brandFoundation,
        coreMediaAssets: coreMediaAssetsData,
        unifiedProfileAssets: unifiedProfileAssetsData,
        mediaPlans: mediaPlanGroup ? [mediaPlanGroup] : [],
        settings: {},
    };
    return assets;
}

function processBrandProfileResponse(jsonText) {
    const parsed = sanitizeAndParseJson(jsonText);
    return parsed;
}

function processViralIdeasResponse(responseText, trendId) {
    console.log('[processViralIdeasResponse] Received AI response for trend ID:', trendId);
    console.log('[processViralIdeasResponse] Response text length:', responseText.length);
    console.log('[processViralIdeasResponse] First 200 chars of response:', responseText.substring(0, 200));
    
    const parsedJson = sanitizeAndParseJson(responseText);
    console.log('[processViralIdeasResponse] Successfully parsed JSON, keys:', Object.keys(parsedJson));
    
    const ideasArray = parsedJson.viralIdeas || parsedJson.ViralIdeas || (Array.isArray(parsedJson) ? parsedJson : []);
    console.log('[processViralIdeasResponse] Extracted ideas array length:', ideasArray.length);
    console.log('[processViralIdeasResponse] Is ideas array?', Array.isArray(ideasArray));

    if (!Array.isArray(ideasArray)) {
        console.error("Parsed JSON for viral ideas is not an array:", ideasArray);
        throw new Error("AI response for viral ideas was not in the expected array format.");
    }

    return ideasArray.map(idea => ({
        ...idea,
        trendId: trendId,
        status: 'new',
        createdAt: new Date().toISOString(),
    }));
}

function processAutoGeneratePersonasResponse(jsonText, brandId, modelUsed) {
    const parsedData = sanitizeAndParseJson(jsonText);

    let personasArray;

    // The AI might return various formats, so we check for multiple possibilities
    if (Array.isArray(parsedData)) {
        // Direct array: [...]
        personasArray = parsedData;
    } else if (parsedData && typeof parsedData === 'object') {
        // Check for various possible property names that contain the persona array
        // Different models might use different casing
        personasArray = parsedData.Personas ||           // Standard capitalized
                        parsedData.personas ||           // Lowercase
                        parsedData.PERSONAS ||           // Uppercase
                        parsedData.persona_array ||      // Alternative naming
                        parsedData.data ||               // Generic data property
                        parsedData.profiles;             // Alternative naming
    }

    // If we still don't have an array but the parsedData is an object with possible persona-like properties,
    // treat the entire object as a single persona
    if (!personasArray && parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
        // Check if the object looks like a single persona by checking for common persona properties
        const commonPersonaProps = ['name', 'nickName', 'description', 'demographics', 'bio', 'interests', 'personality'];
        const hasPersonaProps = commonPersonaProps.some(prop => prop in parsedData);
        
        if (hasPersonaProps) {
            personasArray = [parsedData];  // Wrap single object as array
        }
    }

    if (!personasArray || !Array.isArray(personasArray)) {
        console.error("Failed to find persona array in AI response. Parsed data:", parsedData);
        throw new Error("Received invalid or empty array response from AI when generating persona profiles.");
    }

    return personasArray.map(p => ({
        ...p,
        brandId: brandId,
        modelUsed: modelUsed,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
}

function processTrendSuggestionResponse(jsonText, brandId, industry, modelUsed) {
    const parsedData = sanitizeAndParseJson(jsonText);

    let trendsArray;

    // The AI might return { "trends": [...] } or just [...] 
    if (Array.isArray(parsedData)) {
        trendsArray = parsedData;
    } else if (parsedData && typeof parsedData === 'object') {
        // Check for various possible property names that contain the trends array
        trendsArray = parsedData.trends ||           // Standard lowercase
                      parsedData.Trends ||           // Capitalized
                      parsedData.TRENDS ||           // Uppercase
                      parsedData.trend_array ||      // Alternative naming
                      parsedData.data ||             // Generic data property
                      parsedData.items;              // Alternative naming
    }

    if (!trendsArray || !Array.isArray(trendsArray)) {
        console.error("Failed to find trends array in AI response. Parsed data:", parsedData);
        throw new Error("Received invalid or empty array response from AI when generating trend suggestions.");
    }

    // Process trends and ensure they conform to the Trend type
    return trendsArray.map(t => ({
        ...t,
        id: Math.random().toString(36).substring(2, 15), // Generate temporary ID, will be replaced by DB
        brandId: brandId,
        industry: t.industry || industry, // Use provided industry if not specified in response
        createdAt: new Date().toISOString(),
        modelUsed: modelUsed,
    }));
}

function processGenerateMediaPromptForPostResponse(responseText, postContentType, settings) {
    if (postContentType === 'Carousel Post' || postContentType === 'Carousel') {
        try {
            const parsedResponse = sanitizeAndParseJson(responseText);
            if (Array.isArray(parsedResponse)) {
                return parsedResponse.map((prompt) => {
                    // Validate each prompt to ensure it's a string
                    return typeof prompt === 'string' ? prompt + settings.mediaPromptSuffix : String(prompt) + settings.mediaPromptSuffix;
                });
            }
            
            // If parsing fails but we expect an array, try to convert the string to an array
            if (typeof parsedResponse === 'string') {
                return validateAndCorrectCarouselPrompt(parsedResponse + settings.mediaPromptSuffix, 'Carousel');
            }
        } catch (e) {
            console.error("Failed to parse carousel prompts, returning as single string:", responseText);
            // Try to correct the carousel prompt
            return validateAndCorrectCarouselPrompt(responseText + settings.mediaPromptSuffix, 'Carousel');
        }
    }
    return responseText + settings.mediaPromptSuffix;
}

function processContentPackageResponse(jsonText, params) {
  const { idea, pillarPlatform, settings, persona, selectedProduct } = params;
  const rawResponse = sanitizeAndParseJson(jsonText);

  if (!rawResponse.pillarContent) {
      throw new Error('Missing pillar content in API response');
  }

  const pillarPost = validateAndCorrectMediaPlanPost({
      title: rawResponse.pillarContent.title || 'Untitled',
      content: rawResponse.pillarContent.content || '',
      ...(rawResponse.pillarContent.description && { description: rawResponse.pillarContent.description }),
      hashtags: Array.isArray(rawResponse.pillarContent.hashtags) ?
          rawResponse.pillarContent.hashtags :
          (typeof rawResponse.pillarContent.hashtags === 'string' ? [rawResponse.pillarContent.hashtags] : []),
      cta: rawResponse.pillarContent.cta || '',
      mediaPrompt: rawResponse.pillarContent.mediaPrompt 
          ? (Array.isArray(rawResponse.pillarContent.mediaPrompt) ? rawResponse.pillarContent.mediaPrompt.map((mp) => mp + settings.mediaPromptSuffix) 
          : rawResponse.pillarContent.mediaPrompt + settings.mediaPromptSuffix) : '',
      platform: pillarPlatform,
      isPillar: true,
  });

  // Check for both repurposedContent (singular) and repurposedContents (plural) to handle different AI responses
  const repurposedContentArray = rawResponse.repurposedContent || rawResponse.repurposedContents;
  
  if (!Array.isArray(repurposedContentArray)) {
      // If there's no repurposed content, create an empty array to avoid the error
      console.warn('Missing repurposed contents in API response, continuing with just pillar content');
  }

  const repurposedPlatforms = ['Facebook', 'Instagram', 'TikTok', 'Pinterest'];
  const repurposedPosts = Array.isArray(repurposedContentArray) 
    ? repurposedContentArray
        .filter((content) => repurposedPlatforms.includes(content.platform))
        .map((content) => validateAndCorrectMediaPlanPost({
            title: content.title || 'Untitled',
            content: content.content || '',
            contentType: content.contentType || 'text',
            hashtags: Array.isArray(content.hashtags) ?
                content.hashtags :
                (typeof content.hashtags === 'string' ? [content.hashtags] : []),
            cta: content.cta || '',
            mediaPrompt: content.mediaPrompt + settings.mediaPromptSuffix || '',
            platform: content.platform,
            isPillar: false,
        }))
    : [];

  const allPosts = [
      pillarPost,
      ...repurposedPosts
  ];

  const finalPosts = allPosts.map(p => ({
      ...p,
      status: 'draft',
      promotedProductIds: (selectedProduct && selectedProduct.id) ? [selectedProduct.id] : [],
  }));

  const plan = [{
      theme: `Content Package: ${idea.title}`,
      posts: finalPosts
  }];

  return {
      name: idea.title,
      prompt: idea.description || 'N/A',
      plan: plan,
      source: 'content-package',
      personaId: persona?.id || null,
  };
}

function processFacebookTrendsResponse(jsonText) {
    const trendsData = sanitizeAndParseJson(jsonText);
    return (trendsData || []).map((trend) => ({ ...trend, createdAt: new Date().toISOString() }));
}

function processPostsForFacebookTrendResponse(jsonText) {
    return sanitizeAndParseJson(jsonText);
}

function processIdeasFromProductResponse(jsonText, product) {
    if (!jsonText) {
        console.warn("Received empty response from AI when generating ideas from product. Returning empty array.");
        return [];
    }

    let parsedData = sanitizeAndParseJson(jsonText);
    let ideasArray;

    if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
        const ideasKey = Object.keys(parsedData).find(key => key.toLowerCase() === 'productideas' || key.toLowerCase() === 'ideas');
        if (ideasKey && Array.isArray(parsedData[ideasKey])) {
            ideasArray = parsedData[ideasKey];
        } else if (parsedData.title) {
            // Handle case where a single idea object is returned
            ideasArray = [parsedData];
        } else {
            throw new Error("Expected an array of ideas, but received an object with unexpected keys: " + JSON.stringify(parsedData));
        }
    } else if (Array.isArray(parsedData)) {
        ideasArray = parsedData;
    } else {
        throw new Error("Expected an array of ideas, but received: " + JSON.stringify(parsedData));
    }

    if (!Array.isArray(ideasArray)) {
        throw new Error("Failed to extract a valid array of ideas.");
    }
    
    for (let i = 0; i < ideasArray.length; i++) {
        const idea = ideasArray[i];
        if (!idea.title || !idea.description || !idea.targetAudience) {
            throw new Error(`Idea at index ${i} is missing required fields.`);
        }
    }
    
    return ideasArray.map((idea) => ({
        ...idea,
        productId: product.id
    }));
}

function processSuggestTrendsResponse(jsonText) {
    let trends = sanitizeAndParseJson(jsonText);
    
    // Handle different response formats
    if (trends && typeof trends === 'object' && !Array.isArray(trends) && trends.Trends) {
        trends = trends.Trends;
    }
    
    if (trends && typeof trends === 'object' && !Array.isArray(trends) && trends.topic) {
        trends = [trends];
    }
    
    if (!Array.isArray(trends)) {
        throw new Error("Expected an array of trends, but received: " + JSON.stringify(trends));
    }
    
    // Validate each trend object
    for (let i = 0; i < trends.length; i++) {
        const trend = trends[i];
        if (!trend.topic) {
            throw new Error(`Trend at index ${i} is missing required 'topic' field.`);
        }
        // Ensure keywords is an array
        if (trend.keywords && !Array.isArray(trend.keywords)) {
            trend.keywords = [trend.keywords];
        }
    }
    
    return trends.map((trend) => ({
        ...trend,
        createdAt: new Date().toISOString()
    }));
}

function processSuggestGlobalTrendsResponse(jsonText) {
    return processSuggestTrendsResponse(jsonText);
}

export {
    sanitizeAndParseJson,
    validateAndCorrectCarouselPrompt,
    normalizeContentType,
    validateAndCorrectMediaPlanPost,
    normalizeMediaPlanGroupResponse,
    processMediaPlanResponse,
    processBrandKitResponse,
    processBrandProfileResponse,
    processViralIdeasResponse,
    processAutoGeneratePersonasResponse,
    processTrendSuggestionResponse,
    saveDebugResponse,
    processGenerateMediaPromptForPostResponse,
    processContentPackageResponse,
    processFacebookTrendsResponse,
    processPostsForFacebookTrendResponse,
    processIdeasFromProductResponse,
    processSuggestTrendsResponse,
    processSuggestGlobalTrendsResponse
};