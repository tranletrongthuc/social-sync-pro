
import { generateContentWithBff, generateImageWithBananaBff } from './bffService';
import type { Settings } from '../../types';

/**
 * This file acts as a simple provider client for Gemini.
 * Its sole responsibility is to communicate with the BFF.
 */

export const generateRawContentWithGemini = async (prompt: string, model: string, settings: Settings, useSearch: boolean): Promise<string> => {
    const config: any = {
        systemInstruction: settings.affiliateContentKit,
    };

    if (useSearch) {
        config.tools = [{ googleSearch: {} }];
    } else {
        config.responseMimeType = "application/json";
    }
    
    return await generateContentWithBff(model, prompt, config, settings);
};

export const generateImageWithBanana = async (
    model: string,
    prompt: string,
    promptSuffix: string
): Promise<string> => {
    const fullPrompt = `${prompt}${promptSuffix ? `, ${promptSuffix}` : ''}`;
    return await generateImageWithBananaBff(model, fullPrompt);
};
