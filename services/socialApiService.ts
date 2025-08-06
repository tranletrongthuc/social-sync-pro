



import type { MediaPlanPost, ConnectedAccounts } from '../types';
import { connectAndGetPageToken } from './facebookService';

declare const FB: any; // Declare the FB object from the SDK

// --- STATE SIMULATION ---
// In a real app, this would be managed server-side and tied to a user session.
// We use localStorage to persist the "connections" across reloads for a better demo experience.
const getSimulatedConnections = (): ConnectedAccounts => {
    try {
        const stored = localStorage.getItem('social_sync_connections');
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

const setSimulatedConnections = (connections: ConnectedAccounts) => {
    localStorage.setItem('social_sync_connections', JSON.stringify(connections));
};

// --- API FUNCTIONS ---

/**
 * Handles connecting a social media account. Uses real auth for Facebook, and simulation for others.
 * @param platform The platform to connect (e.g., 'Facebook', 'Instagram').
 */
export const connectAccount = async (platform: string): Promise<ConnectedAccounts> => {
    console.log(`Attempting to connect to ${platform}...`);
    const lowerPlatform = platform.toLowerCase();

    if (lowerPlatform === 'facebook') {
        try {
            const { pageId, pageAccessToken } = await connectAndGetPageToken();
            
            // Store the retrieved credentials for real publishing
            localStorage.setItem('facebook_page_id', pageId);
            localStorage.setItem('facebook_page_token', pageAccessToken);
            
            // Update the connection status
            const connections = getSimulatedConnections();
            connections[lowerPlatform] = true;
            setSimulatedConnections(connections);
            console.log(`Facebook page (ID: ${pageId}) connected successfully.`);
            return connections;
        } catch (error) {
            console.error('Facebook connection failed:', error);
            const connections = getSimulatedConnections();
            delete connections[lowerPlatform];
            setSimulatedConnections(connections);
            throw error; // Re-throw the error to be caught by UI
        }
    } else {
        // --- Use simulation for all non-Facebook platforms ---
        console.log(`Using simulation for ${platform}.`);

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const connections = getSimulatedConnections();
        connections[lowerPlatform] = true;
        setSimulatedConnections(connections);
        console.log(`${platform} connected successfully (simulated).`);
        return connections;
    }
};

/**
 * Disconnects a social media account.
 * @param platform The platform to disconnect.
 */
export const disconnectAccount = async (platform: string): Promise<ConnectedAccounts> => {
    console.log(`Disconnecting from ${platform}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const connections = getSimulatedConnections();
    const lowerPlatform = platform.toLowerCase();
    delete connections[lowerPlatform];
    
    // Remove Facebook-specific credentials
    if (lowerPlatform === 'facebook') {
        localStorage.removeItem('facebook_page_id');
        localStorage.removeItem('facebook_page_token');
        console.log('Facebook Page credentials removed from local storage.');
    }

    setSimulatedConnections(connections);
    console.log(`${platform} disconnected.`);
    return connections;
};

/**
 * Retrieves the current connection statuses.
 */
export const getConnectedAccounts = async (): Promise<ConnectedAccounts> => {
    return Promise.resolve(getSimulatedConnections());
};

const getFacebookCredentials = (): { pageId: string, accessToken: string } => {
    const pageId = localStorage.getItem('facebook_page_id');
    const accessToken = localStorage.getItem('facebook_page_token');

    if (!pageId || !accessToken) {
        throw new Error('Facebook Page credentials not found. Please re-connect your Facebook account in the Integrations panel.');
    }
    return { pageId, accessToken };
};

/**
 * Publishes a post to a social media platform. Uses real API for Facebook.
 * @param post The post object to publish.
 * @param imageUrl The public URL of the image to be included in the post.
 * @param videoUrl The public URL of the video to be included in the post.
 * @returns A promise that resolves with the URL of the "published" post.
 */
export const publishPost = async (post: MediaPlanPost, imageUrl?: string, videoUrl?: string): Promise<{ publishedUrl: string }> => {
    console.log(`Attempting to publish post "${post.title}" to ${post.platform}...`);
    const lowerPlatform = post.platform.toLowerCase();

    if (lowerPlatform === 'facebook') {
        try {
            const { pageId, accessToken } = getFacebookCredentials();
            return publishToFacebookPage(post, pageId, accessToken, imageUrl, videoUrl);
        } catch(error) {
             console.error('Facebook publish failed:', error);
             throw error;
        }
    }
    
    // --- Fallback to simulation for any other platform ---
    console.log(`Using generic simulation for ${post.platform}...`);

    console.log('Content:', post.content);
    if (imageUrl) console.log('Image URL:', imageUrl);
    if (videoUrl) console.log('Video URL:', videoUrl);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (post.title.toLowerCase().includes('fail')) {
        console.error(`Simulated failure for post "${post.title}"`);
        throw new Error(`Simulated API error: Failed to publish to ${post.platform}.`);
    }
    const publishedUrl = `https://socialsync.pro/simulated/${lowerPlatform}/${Date.now()}`;
    console.log(`Post published successfully to (simulated): ${publishedUrl}`);
    return { publishedUrl };
};


// Publishes to the page using the Graph API
export const publishToFacebookPage = async (
    post: MediaPlanPost,
    pageId: string,
    accessToken: string,
    imageUrl?: string,
    videoUrl?: string
): Promise<{ publishedUrl: string }> => {
    const apiVersion = 'v19.0';
    const fullMessage = `${post.title}\n\n${post.content}\n\n${(post.hashtags || []).join(' ')}\n\nCTA: ${post.cta}`;

    let endpoint = '';
    const params = new URLSearchParams();
    params.append('access_token', accessToken);

    if (videoUrl) {
        endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/videos`;
        params.append('description', fullMessage);
        params.append('file_url', videoUrl);
    } else if (imageUrl) {
        endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;
        params.append('caption', fullMessage);
        params.append('url', imageUrl); // Use URL directly, assuming it's publicly accessible
    } else {
        endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
        params.append('message', fullMessage);
    }

    const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'POST',
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.error?.message || "Failed to publish to Facebook.");
    }

    const postId = responseData.id || responseData.post_id;
    if (!postId) {
        throw new Error("Facebook API did not return a post ID.");
    }

    const publishedUrl = `https://www.facebook.com/${postId}`;
    return { publishedUrl };
};

/**
 * Simulates scheduling a post for a future date.
 * @param post The post object to schedule.
 * @param scheduleDate The ISO string of the date to schedule the post for.
 * @returns A promise that resolves when the post is "scheduled".
 */
export const schedulePost = async (post: MediaPlanPost, scheduleDate: string): Promise<void> => {
    console.log(`Simulating scheduling post "${post.title}" for ${post.platform} at ${scheduleDate}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (post.title.toLowerCase().includes('fail')) {
        console.error(`Simulated scheduling failure for post "${post.title}"`);
        throw new Error(`Simulated API error: Failed to schedule post for ${post.platform}.`);
    }

    console.log('Post scheduled successfully (simulated).');
};