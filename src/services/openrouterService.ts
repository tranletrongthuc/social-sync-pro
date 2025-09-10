import { generateContentWithOpenRouterBff, generateImageWithOpenRouterBff } from './bffService';
import type { Settings } from '../../types';

/**
 * This file acts as a simple provider client for OpenRouter.
 * Its sole responsibility is to communicate with the BFF.
 */

export const generateRawContentWithOpenRouter = async (prompt: string, model: string, settings: Settings, useSearch: boolean): Promise<string> => {
    // Note: useSearch is ignored for OpenRouter as it doesn't support it directly.
    const messages = [
        { role: 'system', content: settings.affiliateContentKit || 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
    ];

    const response = await generateContentWithOpenRouterBff(
        model,
        messages,
        { "type": "json_object" } // Assume JSON object for structured data, can be adapted
    );
    
    return response;
};

export const generateImageWithOpenRouter = async (
    prompt: string, 
    model: string,
    settings: any,
    aspectRatio: "1:1" | "16:9" = "1:1",
    productImages?: File[]
): Promise<string> => {
    if (!prompt || prompt.trim() === '') {
        throw new Error("Prompt cannot be empty for OpenRouter image generation.");
    }
    
    const messages: any[] = [];
    const userContent: any[] = [];
    
    const NEGATIVE_PROMPT = ', no text, text-free, no typography, no writing, no letters, no words, text overlay';
    const instructionText = `Generate a single, high-quality image based on the following description. The response must be a valid JSON object containing one key: "b64_json", which holds the base64 encoded string of the generated JPEG image.

Description (aspect ratio ${aspectRatio}): "${prompt}${settings.mediaPromptSuffix ? `, ${settings.mediaPromptSuffix}` : ''}${NEGATIVE_PROMPT}"`;
    
    userContent.push({ type: 'text', text: instructionText });
    
    messages.push({ role: 'user', content: userContent });
    
    const response = await generateImageWithOpenRouterBff(
        model,
        messages,
        { "type": "json_object" }
    );
    
    return response;
};
