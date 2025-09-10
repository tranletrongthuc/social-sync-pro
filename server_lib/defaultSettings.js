import { defaultPrompts } from './defaultPrompts.js';

export const initialSettings = {
    language: "",
    totalPostsPerMonth: 0,
    mediaPromptSuffix: "",
    affiliateContentKit: "",
    textGenerationModel: "",
    imageGenerationModel: "",
    textModelFallbackOrder: [],
    visionModels: [],
    contentPillars: [],
    prompts: defaultPrompts,
    updatedAt: new Date()
};