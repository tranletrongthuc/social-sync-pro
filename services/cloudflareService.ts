// services/cloudflareService.ts
import { generateImageWithCloudflareBff } from './bffService';

const fileToUint8Array = (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Generates an image using a Cloudflare AI model. Supports text-to-image and image-to-image.
 * @param prompt - The text instruction for the image generation.
 * @param model - The specific Cloudflare model to use (e.g., '@cf/stabilityai/stable-diffusion-xl-base-1.0').
 * @param productImages - An array of product images. If provided, the first image will be used for image-to-image tasks.
 * @returns A Promise that resolves to a data URL string of the generated image.
 */
export const generateImageWithCloudflare = async (
    prompt: string,
    model: string,
    productImages: File[]
): Promise<string> => {
    if (!prompt || prompt.trim() === '') {
        throw new Error("Prompt cannot be empty for Cloudflare image generation.");
    }

    let imageBytes: number[] | undefined;
    if (productImages && productImages.length > 0) {
        // If images are provided, use the first one for image-to-image generation.
        // The API expects the image as an array of bytes.
        const uint8Array = await fileToUint8Array(productImages[0]);
        imageBytes = Array.from(uint8Array);
    }
    
    // Use BFF for secure Cloudflare image generation
    return await generateImageWithCloudflareBff(
        prompt,
        model,
        imageBytes
    );
};
