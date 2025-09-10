import { uploadMediaWithBff } from './bffService';
import type { Settings } from '../../types';

export const uploadMediaToCloudinary = async (
    media: Record<string, string>,
    settings: Settings
): Promise<Record<string, string>> => {

    const mediaToUpload = Object.entries(media).filter(
        ([, url]) => url && url.startsWith('data:')
    );

    if (mediaToUpload.length === 0) {
        return {};
    }
    
    // Use BFF exclusively for secure Cloudinary uploads
    return await uploadMediaWithBff(media, settings.cloudinaryCloudName || '', settings.cloudinaryUploadPreset || '');
};