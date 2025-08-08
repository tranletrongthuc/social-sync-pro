import { getSocialAccountForPersona } from './socialAccountService';

export class SocialAccountNotConnectedError extends Error {
    platform: string;
    personaId: string;

    constructor(message: string, platform: string, personaId: string) {
        super(message);
        this.name = "SocialAccountNotConnectedError";
        this.platform = platform;
        this.personaId = personaId;
    }
}

// Placeholder for direct posting (will be expanded)
export const directPost = async (
    personaId: string,
    platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest',
    postContent: any, // This will be a more specific type later
    imageUrl?: string,
    videoUrl?: string
): Promise<{ publishedUrl: string }> => {
    const socialAccount = getSocialAccountForPersona(personaId, platform);
    if (!socialAccount) {
        throw new SocialAccountNotConnectedError(`No ${platform} account connected for this persona.`, platform, personaId);
    }

    switch (platform) {
        case 'Facebook':
            const fbPageId = socialAccount.credentials.pageId;
            const fbAccessToken = socialAccount.credentials.pageAccessToken;
            console.log("Facebook credentials for publishing:", { fbPageId, fbAccessToken: fbAccessToken ? '[REDACTED]' : '[MISSING]' });
            if (!fbPageId || !fbAccessToken) {
                throw new Error('Facebook credentials missing.');
            }
            // Assuming postContent has title, content, hashtags, cta for MediaPlanPost
            console.log("Calling publishToFacebookPage with args:", postContent, imageUrl, fbPageId, fbAccessToken, videoUrl);
            return publishToFacebookPage(postContent, imageUrl, fbPageId, fbAccessToken, videoUrl);
        case 'Instagram':
        case 'TikTok':
        case 'YouTube':
        case 'Pinterest':
            // Simulate direct post for other platforms
            console.log(`Simulating direct post to ${platform} for persona ${personaId}:`, postContent);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return { publishedUrl: `https://simulated.social/${platform}/${Date.now()}` };
        default:
            throw new Error(`Unsupported platform for direct posting: ${platform}`);
    }
};

// Placeholder for scheduled posting (will be expanded)
export const schedulePost = async (
    personaId: string,
    platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest',
    postContent: any, // This will be a more specific type later
    scheduleDate: string,
    imageUrl?: string,
    videoUrl?: string
): Promise<void> => {
    const socialAccount = getSocialAccountForPersona(personaId, platform);
    if (!socialAccount) {
        throw new Error(`No ${platform} account connected for this persona.`);
    }

    console.log(`Simulating scheduling post to ${platform} for persona ${personaId} on ${scheduleDate}:`, postContent);
    await new Promise(resolve => setTimeout(resolve, 2000));
    // In a real scenario, this would interact with the platform's scheduling API or an internal scheduler.
    console.log(`Post successfully scheduled for ${platform}.`);
};