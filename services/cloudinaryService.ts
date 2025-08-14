import { uploadMediaWithBff } from './bffService';

const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',');
    if (parts.length < 2 || !parts[1]) {
        throw new Error('Invalid data URL format.');
    }
    const mimeString = parts[0].split(':')[1]?.split(';')[0] || '';
    // Clean the base64 string by removing any whitespace characters (e.g., newlines).
    const cleanedBase64 = parts[1].replace(/\s/g, '');
    const byteString = atob(cleanedBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
};

export const uploadMediaToCloudinary = async (
    media: Record<string, string>
): Promise<Record<string, string>> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        console.warn("Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET) are not set. Skipping media uploads.");
        return {};
    }

    const mediaToUpload = Object.entries(media).filter(
        ([, url]) => url && url.startsWith('data:')
    );

    if (mediaToUpload.length === 0) {
        return {};
    }
    
    try {
        // Try to use BFF for secure Cloudinary uploads
        return await uploadMediaWithBff(media, cloudName, uploadPreset);
    } catch (error) {
        console.warn("BFF Cloudinary upload failed, falling back to direct upload:", error);
        // Fallback to direct upload if BFF fails
        const uploadPromises = mediaToUpload.map(async ([key, url]) => {
            try {
                const isVideo = url.startsWith('data:video');
                const resourceType = isVideo ? 'video' : 'image';
                const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

                const blob = dataUrlToBlob(url);
                const formData = new FormData();
                formData.append('file', blob);
                formData.append('upload_preset', uploadPreset);
                formData.append('public_id', key); 
                
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Cloudinary upload failed for key "${key}":`, errorData.error.message);
                    return null;
                }

                const result = await response.json();
                return [key, result.secure_url];
            } catch (error) {
                console.error(`Failed to upload media with key "${key}" to Cloudinary.`, error);
                return null;
            }
        });
        
        const results = await Promise.all(uploadPromises);

        const newPublicUrls: Record<string, string> = Object.fromEntries(
            results.filter((r): r is [string, string] => r !== null)
        );
        
        return newPublicUrls;
    }
};