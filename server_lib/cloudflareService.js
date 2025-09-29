async function generateImageWithCloudflare(model, prompt, options = {}) {
    const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        throw new Error('Cloudflare credentials not configured on server');
    }

    if (!model || !prompt) {
        throw new Error('Missing required fields: model and prompt');
    }

    // Use a proxy endpoint or direct Cloudflare API
    const apiUrl = `https://ai-proxy.tk100mil.workers.dev/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${encodeURIComponent(model)}`;

    // The payload can be either text-to-image or image-to-image
    const inputs = {
        prompt,
        negative_prompt: 'text, typography, writing, letters, words, text overlay'
    };

    // Add aspect ratio if provided
    if (options.aspectRatio) {
        inputs.aspect_ratio = options.aspectRatio;
    }

    const cloudflareResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs)
    });

    if (!cloudflareResponse.ok) {
        let errorText;
        try {
            const errorData = await cloudflareResponse.json();
            errorText = errorData.errors?.map((e) => e.message).join(', ') || JSON.stringify(errorData);
        } catch (e) {
            errorText = await cloudflareResponse.text();
        }
        throw new Error(`Cloudflare AI Error: ${errorText}`);
    }

    const blob = await cloudflareResponse.blob();
    // Check if the successful response is actually an image
    if (blob.type.startsWith('image/')) {
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = blob.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        return dataUrl;
    } else {
        // Handle cases where the server returns OK but sends an error in a non-image format (e.g., JSON)
        const responseText = await blob.text();
        console.error("Cloudflare AI returned a non-image success response:", responseText);
        throw new Error("Cloudflare AI returned an unexpected response format.");
    }
}

export { generateImageWithCloudflare };