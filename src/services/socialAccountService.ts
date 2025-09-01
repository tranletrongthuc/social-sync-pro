import { Persona, SocialAccount, FacebookPage } from '../../types';
import { connectAndGetPageToken, publishToFacebookPage } from './facebookService';

// This is a placeholder for a more robust credential storage mechanism.
// In a real application, these would be securely stored server-side.
export const getPersonaSocialAccounts = (personaId: string): SocialAccount[] => {
    try {
        const storedAccounts = localStorage.getItem(`persona_social_accounts_${personaId}`);
        return storedAccounts ? JSON.parse(storedAccounts) : [];
    } catch (e) {
        console.error("Error reading social accounts from localStorage:", e);
        return [];
    }
};

const setPersonaSocialAccounts = (personaId: string, accounts: SocialAccount[]) => {
    localStorage.setItem(`persona_social_accounts_${personaId}`, JSON.stringify(accounts));
};

export const connectSocialAccountToPersona = async (
    persona: Persona,
    platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest'
): Promise<Persona | { pages: FacebookPage[]; userAccessToken: string; }> => {
    let credentials: Record<string, string> = {};
    let displayName: string = platform;
    let profileUrl: string = '#';

    switch (platform) {
        case 'Facebook':
            try {
                const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
                if (!fbAppId) {
                    throw new Error("Facebook App ID is not configured. Please set the App ID in your .env.local file.");
                }
                const fbLoginResponse = await connectAndGetPageToken();

                if (fbLoginResponse.pages.length === 0) {
                    // Return pages (even if empty) for user to select or retry
                    return { pages: fbLoginResponse.pages, userAccessToken: fbLoginResponse.userAccessToken };
                }

                if (fbLoginResponse.pages.length > 1) {
                    // Return pages for user to select
                    return { pages: fbLoginResponse.pages, userAccessToken: fbLoginResponse.userAccessToken };
                } else {
                    // Auto-select the only available page
                    const page = fbLoginResponse.pages[0];
                    credentials = { pageId: page.id, pageAccessToken: page.access_token };
                    displayName = page.name;
                    profileUrl = `https://www.facebook.com/${page.id}`;
                }
            } catch (error) {
                console.error('Facebook connection failed:', error);
                throw error;
            }
            break;
        case 'Instagram':
        case 'TikTok':
        case 'YouTube':
        case 'Pinterest':
            // Simulate connection for other platforms
            await new Promise(resolve => setTimeout(resolve, 1500));
            credentials = { accessToken: `simulated_token_${platform.toLowerCase()}_${Date.now()}` };
            displayName = `My ${platform} Profile`;
            profileUrl = `https://www.simulated.com/${platform.toLowerCase()}/myprofile`;
            console.log(`Simulated connection for ${platform}.`);
            break;
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }

    const existingAccounts = getPersonaSocialAccounts(persona.id);
    const newAccount: SocialAccount = { platform, credentials, displayName, profileUrl };

    // Check if an account for this platform already exists for the persona
    const accountIndex = existingAccounts.findIndex(acc => acc.platform === platform);
    if (accountIndex > -1) {
        existingAccounts[accountIndex] = newAccount; // Update existing account
    } else {
        existingAccounts.push(newAccount); // Add new account
    }

    setPersonaSocialAccounts(persona.id, existingAccounts);
    
    // Update the persona object with the new social accounts
    const updatedPersona = { ...persona, socialAccounts: existingAccounts };
    return updatedPersona;
};

export const handleConnectFacebookPage = (
    personaId: string,
    page: FacebookPage
): Persona => {
    const existingAccounts = getPersonaSocialAccounts(personaId);
    const newAccount: SocialAccount = {
        platform: 'Facebook',
        credentials: { pageId: page.id, pageAccessToken: page.access_token },
        displayName: page.name,
        profileUrl: `https://www.facebook.com/${page.id}`
    };

    const accountIndex = existingAccounts.findIndex(acc => acc.platform === 'Facebook');
    if (accountIndex > -1) {
        existingAccounts[accountIndex] = newAccount;
    } else {
        existingAccounts.push(newAccount);
    }
    setPersonaSocialAccounts(personaId, existingAccounts);
    const persona = { id: personaId, socialAccounts: existingAccounts } as Persona;
    // This is a bit of a hack, we need to get the full persona object from the state
    // to avoid overwriting other properties. This should be improved with a proper state management solution.
    const storedPersonasString = localStorage.getItem('personas');
    if (storedPersonasString) {
        const storedPersonas = JSON.parse(storedPersonasString);
        const fullPersona = storedPersonas.find((p: Persona) => p.id === personaId);
        if (fullPersona) {
            return { ...fullPersona, socialAccounts: existingAccounts };
        }
    }
    return persona;
};

export const getSocialAccountForPersona = (
    personaId: string,
    platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest'
): SocialAccount | undefined => {
    const accounts = getPersonaSocialAccounts(personaId);
    return accounts.find(account => account.platform === platform);
};

export const disconnectSocialAccountFromPersona = (
    personaId: string,
    platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest'
): Persona => {
    const existingAccounts = getPersonaSocialAccounts(personaId);
    const updatedAccounts = existingAccounts.filter(account => account.platform !== platform);
    setPersonaSocialAccounts(personaId, updatedAccounts);
    
    // In a real app, you might also revoke tokens with the platform's API here.
    console.log(`Disconnected ${platform} from persona ${personaId}.`);

    // This function would ideally return the updated persona from a central state management
    // For now, it returns a partial persona with updated social accounts
    const persona = { id: personaId, socialAccounts: updatedAccounts } as Persona;
    // This is a bit of a hack, we need to get the full persona object from the state
    // to avoid overwriting other properties. This should be improved with a proper state management solution.
    const storedPersonasString = localStorage.getItem('personas');
    if (storedPersonasString) {
        const storedPersonas = JSON.parse(storedPersonasString);
        const fullPersona = storedPersonas.find((p: Persona) => p.id === personaId);
        if (fullPersona) {
            return { ...fullPersona, socialAccounts: updatedAccounts };
        }
    }
    return persona;
};

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
        throw new Error(`No ${platform} account connected for this persona.`);
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