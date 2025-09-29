import fetch from 'node-fetch';
import FormData from 'form-data';

export async function uploadMediaToCloudinary(media) {
    const mediaEntries = Object.entries(media).filter(
        ([, url]) => url && url.startsWith('data:')
    );

    if (mediaEntries.length === 0) {
        return {};
    }

    const uploadPromises = mediaEntries.map(async ([key, url]) => {
        try {
            const isVideo = url.startsWith('data:video');
            const resourceType = isVideo ? 'video' : 'image';
            const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

            const dataUrlParts = url.split(',');
            if (dataUrlParts.length < 2) throw new Error('Invalid data URL format');
            
            const mimePart = dataUrlParts[0].split(':')[1];
            const mimeType = mimePart ? mimePart.split(';')[0] : (isVideo ? 'video/mp4' : 'image/jpeg');
            const base64Data = dataUrlParts[1];
            
            const cleanedBase64 = base64Data.replace(/\s/g, '');
            const buffer = Buffer.from(cleanedBase64, 'base64');

            const formData = new FormData();
            formData.append('file', buffer, {
                filename: `${key}.${mimeType.split('/')[1] || 'jpg'}`,
                contentType: mimeType
            });
            formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
            formData.append('public_id', key);

            const cloudinaryResponse = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders()
            });

            if (!cloudinaryResponse.ok) {
                const errorData = await cloudinaryResponse.json().catch(() => ({}));
                throw new Error(`Cloudinary upload failed: ${errorData.error?.message || cloudinaryResponse.statusText}`);
            }

            const result = await cloudinaryResponse.json();
            return [key, result.secure_url];
        } catch (error) {
            console.error(`Failed to upload media with key "${key}" to Cloudinary:`, error);
            return null;
        }
    });

    const results = await Promise.all(uploadPromises);
    return Object.fromEntries(results.filter(r => r !== null));
}
