import type { BrandFoundation, Persona, AffiliateLink, Settings, BrandInfo, PostInfo, FacebookTrend, Idea, MediaPlanPost, GenerationOptions } from '../../types';

/**
 * This service is responsible for all complex prompt engineering.
 * It constructs the final, detailed prompts that are sent to AI services.
 */

// #region Media Plan
type MediaPlanPromptParams = {
  brandFoundation: BrandFoundation;
  userPrompt: string;
  language: string;
  totalPosts: number;
  useSearch: boolean;
  selectedPlatforms: string[];
  options: GenerationOptions;
  settings: Settings;
  persona: Persona | null;
  pillar: string;
};

export const buildMediaPlanPrompt = (params: MediaPlanPromptParams): string => {
  const { 
    userPrompt,
    language,
    totalPosts,
    selectedPlatforms,
    settings,
    persona,
    pillar
  } = params;

  const p = settings.prompts.mediaPlanGeneration;

  const personaInstruction = persona 
    ? p.personaEmbodimentInstruction
        .replace('{persona.nickName}', persona.nickName)
        .replace('{persona.demographics.age}', persona.demographics?.age?.toString() || '')
        .replace('{persona.demographics.occupation}', persona.demographics?.occupation || '')
        .replace('{persona.demographics.location}', persona.demographics?.location || '')
        .replace('{persona.backstory}', persona.backstory || '')
        .replace('{persona.knowledgeBase}', persona.knowledgeBase?.join(', ') || '')
        .replace('{persona.voice.personalityTraits}', persona.personalityTraits?.join(', ') || '')
        .replace('{persona.voice.linguisticRules}', persona.communicationStyle?.voice || '')
        .replace('{options.tone}', params.options.tone)
    : '';

  const campaignInstruction = p.campaignGoalInstruction
    .replace('{userPrompt}', userPrompt)
    .replace('{pillar}', pillar);

  const outputInstruction = p.jsonOutputInstruction
    .replace('{totalPosts}', totalPosts.toString())
    .replace('{selectedPlatforms}', selectedPlatforms.join(', '));

  const prompt = [
    p.systemInstruction.replace('{language}', language),
    personaInstruction,
    campaignInstruction,
    p.contentGenerationRules,
    p.hyperDetailedImagePromptGuide,
    outputInstruction
  ].join('\n\n');

  return prompt;
};
// #endregion

// #region Brand Kit
export const buildBrandKitPrompt = (params: { brandInfo: BrandInfo, language: string, settings: Settings }): string => {
  const { brandInfo, language, settings } = params;
  return settings.prompts.simple.generateBrandKit
      .replace('{language}', language)
      .replace('{brandInfo}', JSON.stringify(brandInfo, null, 2));
};
// #endregion

// #region Simple Text
export const buildRefinePostPrompt = (params: { postText: string, settings: Settings }): string => {
  const { postText, settings } = params;
  return settings.prompts.simple.refinePost.replace('{postText}', postText);
};

export const buildGenerateBrandProfilePrompt = (params: { idea: string, language: string, settings: Settings }): string => {
  const { idea, language, settings } = params;
  return settings.prompts.simple.generateBrandProfile
      .replace('{language}', language)
      .replace('{idea}', idea);
};

export const buildGenerateInCharacterPostPrompt = (params: { objective: string, platform: string, keywords: string[], pillar: string, settings: Settings, persona: Persona, options: GenerationOptions }): string => {
    const { objective, platform, keywords, pillar, settings, persona, options } = params;
    const p = settings.prompts.generateInCharacterPost;

    const prompt = [
        p.rolePlayInstruction
            .replace('{nickName}', persona.nickName)
            .replace('{demographics.age}', persona.demographics?.age?.toString() || '')
            .replace('{demographics.occupation}', persona.demographics?.occupation || '')
            .replace('{demographics.location}', persona.demographics?.location || '')
            .replace('{persona.backstory}', persona.backstory || '')
            .replace('{persona.knowledgeBase}', persona.knowledgeBase?.join(', ') || '')
            .replace('{persona.voice.personalityTraits}', persona.personalityTraits?.join(', ') || '')
            .replace('{persona.voice.linguisticRules}', persona.communicationStyle?.voice || '')
            .replace('{options.tone}', params.options.tone),
        p.personalityInstruction.replace('{voice.personalityTraits}', persona.personalityTraits?.join(', ') || ''),
        p.writingStyleInstruction.replace('{voice.linguisticRules}', persona.communicationStyle?.voice || ''),
        p.backstoryInstruction.replace('{backstory}', persona.backstory || ''),
        p.interestsInstruction.replace('{knowledgeBase}', persona.knowledgeBase?.join(', ') || ''),
        p.contextPreamble.replace('{date}', new Date().toLocaleDateString()),
        p.taskInstruction.replace('{platform}', platform),
        p.objectiveInstruction.replace('{objective}', objective),
        p.pillarInstruction.replace('{pillar}', pillar),
        p.keywordsInstruction.replace('{keywords}', keywords.join(', ')),
        p.perspectiveInstruction,
        p.negativeConstraints
    ].join('\n');

    return prompt;
};

export const buildGenerateMediaPromptForPostPrompt = (params: { postContent: { title: string; content: string, contentType: string }, brandFoundation: BrandFoundation, language: string, persona: Persona | null, settings: Settings }): string => {
  const { postContent, brandFoundation, language, persona, settings } = params;
  
  const personaInstruction = persona
    ? `The media MUST feature the following persona: ${persona.nickName} - ${persona.outfitDescription}. The generated prompt MUST start with this description.`
    : 'Generate a generic image prompt.';

  return settings.prompts.simple.generateMediaPrompt
      .replace('{brandFoundation}', JSON.stringify(brandFoundation, null, 2))
      .replace('{personaInstruction}', personaInstruction)
      .replace('{language}', language)
      .replace('{postContent}', JSON.stringify(postContent, null, 2));
};

export const buildAffiliateCommentPrompt = (params: { post: MediaPlanPost, products: AffiliateLink[], language: string, settings: Settings }): string => {
  const { post, products, language, settings } = params;
  if (products.length === 0) {
    throw new Error("Cannot generate a comment without at least one affiliate product.");
  }
  
  const productDetails = products.map(p => `- ${p.productName}: ${p.productLink}`).join('\n');

  return settings.prompts.simple.generateAffiliateComment
      .replace('{language}', language)
      .replace('{post}', JSON.stringify(post, null, 2))
      .replace('{productDetails}', productDetails);
};

export const buildGenerateViralIdeasPrompt = (params: { trend: { topic: string; keywords: string[] }, language: string, useSearch: boolean, settings: Settings }): string => {
  const { trend, language, settings } = params;
  return settings.prompts.simple.generateViralIdeas
      .replace('{language}', language)
      .replace('{trend}', JSON.stringify(trend, null, 2));
};

export const buildGenerateContentPackagePrompt = (params: { idea: Idea, language: string, persona: Persona | null, pillarPlatform: string, repurposedPlatforms: string[], settings: Settings, options: GenerationOptions }): string => {
    const { idea, language, persona, pillarPlatform, repurposedPlatforms, settings, options } = params;
    const p = settings.prompts.contentPackage;

    const personaVisuals = persona?.visualCharacteristics ? `Detailed Description: ${persona.visualCharacteristics}` : '';

    const instructions = [
        p.taskInstruction.replace('{sanitizedIdeaTitle}', idea.title),
        p.pillarContentInstruction
            .replace('{pillarPlatform}', pillarPlatform)
            .replace('{pillarPlatform}', pillarPlatform)
            .replace('{idea.targetAudience}', idea.targetAudience || '')
            .replace('{persona.demographics.age}', persona.demographics?.age?.toString() || '')
            .replace('{persona.demographics.occupation}', persona.demographics?.occupation || '')
            .replace('{persona.demographics.location}', persona.demographics?.location || '')
            .replace('{persona.backstory}', persona.backstory || '')
            .replace('{persona.knowledgeBase}', persona.knowledgeBase?.join(', ') || '')
            .replace('{persona.voice.personalityTraits}', persona.personalityTraits?.join(', ') || '')
            .replace('{persona.voice.linguisticRules}', persona.communicationStyle?.voice || '')
            .replace('{options.tone}', params.options.tone),
        p.repurposedContentInstruction
            .replace('{repurposedPlatforms}', repurposedPlatforms.join(', '))
            .replace('{repurposedPlatforms}', repurposedPlatforms.join(', ')),
        p.mediaPromptInstruction.replace('{persona.outfitDescription}', personaVisuals),
        p.jsonOutputInstruction.replace('{language}', language)
    ].join('\n\n');

    return instructions;
};

export const buildGenerateFacebookTrendsPrompt = (params: { industry: string, language: string, settings: Settings }): string => {
  const { industry, language, settings } = params;
  return settings.prompts.simple.generateFacebookTrends
      .replace('{industry}', industry)
      .replace('{language}', language);
};

export const buildGeneratePostsForFacebookTrendPrompt = (params: { trend: FacebookTrend, language: string, settings: Settings }): string => {
  const { trend, language, settings } = params;
  return settings.prompts.simple.generateFacebookPostsForTrend
      .replace('{language}', language)
      .replace('{trend}', JSON.stringify(trend, null, 2));
};

export const buildGenerateIdeasFromProductPrompt = (params: { product: AffiliateLink, language: string, settings: Settings }): string => {
  const { product, language, settings } = params;
  return settings.prompts.simple.generateIdeasFromProduct
      .replace('{language}', language)
      .replace('{product}', JSON.stringify(product, null, 2));
};

export const buildAutoGeneratePersonaPrompt = (params: { mission: string, usp: string, settings: Settings }): string => {
  const { mission, usp, settings } = params;
  const prompts = settings.prompts.autoGeneratePersona;
  return prompts.mainPrompt
    .replace('{mission}', mission)
    .replace('{usp}', usp);
};
// #endregion
