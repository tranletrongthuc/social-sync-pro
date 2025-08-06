// services/cloudflareService.ts

const getCloudflareCredentials = () => {
    const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
    const apiToken = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
        throw new Error("Cloudflare credentials (ACCOUNT_ID and API_TOKEN) are not configured. Please set them in the Integrations panel.");
    }
    return { accountId, apiToken };
};

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
    const { accountId, apiToken } = getCloudflareCredentials();
    const apiUrl = `https://ai-proxy.tk100mil.workers.dev/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(model)}`;

    // The payload can be either text-to-image or image-to-image
    const inputs: { prompt: string; image?: number[]; negative_prompt?: string; } = {
        prompt,
        negative_prompt: 'text, typography, writing, letters, words, text overlay'
    };

    if (productImages && productImages.length > 0) {
        // If images are provided, use the first one for image-to-image generation.
        // The API expects the image as an array of bytes.
        const imageBytes = await fileToUint8Array(productImages[0]);
        inputs.image = Array.from(imageBytes);
    }
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs)
    });


    if (!response.ok) {
        let errorText;
        try {
            const errorData = await response.json();
            errorText = errorData.errors?.map((e: any) => e.message).join(', ') || JSON.stringify(errorData);
        } catch (e) {
            errorText = await response.text();
        }
        throw new Error(`Cloudflare AI Error: ${errorText}`);
    }

    const blob = await response.blob();
    // Check if the successful response is actually an image
    if (blob.type.startsWith('image/')) {
         return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } else {
        // Handle cases where the server returns OK but sends an error in a non-image format (e.g., JSON)
        const responseText = await blob.text();
        console.error("Cloudflare AI returned a non-image success response:", responseText);
        throw new Error("Cloudflare AI returned an unexpected response format.");
    }
};
