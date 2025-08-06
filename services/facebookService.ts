
import type { MediaPlanPost } from '../types';

declare const FB: any; // Declare the FB object from the SDK

// Helper to initialize the SDK
export const initFacebookSdk = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // This function will be called by the SDK once it's loaded.
        (window as any).fbAsyncInit = function() {
            const appId = (window as any).process.env.FACEBOOK_APP_ID;
            if (!appId) {
                console.error("Facebook App ID is not configured. Cannot initialize SDK.");
                // Ensure rejection if the App ID is missing at initialization time.
                return reject(new Error("Facebook App ID is not configured."));
            }
            
            try {
                FB.init({
                    appId,
                    cookie: true,
                    xfbml: true,
                    version: 'v19.0'
                });
                console.log("Facebook SDK Initialized via fbAsyncInit.");
                resolve(); // Resolve the promise once initialization is done.
            } catch (e) {
                console.error("Error during FB.init:", e);
                reject(e);
            }
        };

        // In case the script is already loaded and fbAsyncInit has been called
        if (typeof FB !== 'undefined' && FB.getLoginStatus) {
            console.log("Facebook SDK was already loaded.");
             // We assume if it was loaded, fbAsyncInit has run with its internal checks.
            return resolve();
        }
    });
};


// Logs the user in and gets their pages
export const connectAndGetPageToken = async (): Promise<{ pageId: string, pageAccessToken: string }> => {
    if (typeof FB === 'undefined' || !FB.login) {
        throw new Error("Facebook SDK is not available or initialized. Please wait a moment and try again.");
    }
    const appId = (window as any).process.env.FACEBOOK_APP_ID;
    if (!appId) {
        throw new Error("Facebook App ID is not configured. Please set the App ID in the Integrations panel.");
    }
    
    return new Promise((resolve, reject) => {
        // Enforce HTTPS. The FB SDK throws an error if called from http.
        if (window.location.protocol !== 'https:') {
            // Updated error message to be more helpful for developers.
            return reject(new Error('Facebook Login requires a secure (HTTPS) connection. To test this feature, please run your development server over HTTPS or use a tunneling service like ngrok.'));
        }

        FB.login((response: any) => {
            if (response.authResponse) {
                console.log('Facebook login successful:', response);
                const userAccessToken = response.authResponse.accessToken;

                // Get user's pages
                FB.api('/me/accounts', { access_token: userAccessToken }, (pageResponse: any) => {
                    if (pageResponse && !pageResponse.error) {
                        if (pageResponse.data && pageResponse.data.length > 0) {
                            const firstPage = pageResponse.data[0];
                            console.log(`Auto-selecting first available page: ${firstPage.name} (ID: ${firstPage.id})`);
                            resolve({
                                pageId: firstPage.id,
                                pageAccessToken: firstPage.access_token
                            });
                        } else {
                            reject(new Error("No Facebook Pages found for this account. Please ensure you have at least one Page and have granted permissions."));
                        }
                    } else {
                        reject(new Error(pageResponse.error?.message || "Failed to fetch Facebook pages."));
                    }
                });
            } else {
                reject(new Error('User cancelled login or did not fully authorize.'));
            }
        }, { scope: 'pages_show_list,pages_read_engagement,pages_manage_posts' });
    });
};

// Publishes to the page using the Graph API
export const publishToFacebookPage = async (
    post: MediaPlanPost,
    imageUrl: string | undefined,
    pageId: string,
    accessToken: string
): Promise<{ publishedUrl: string }> => {
    const apiVersion = 'v19.0';
    const fullMessage = `${post.title}\n\n${post.content}\n\n${(post.hashtags || []).join(' ')}\n\nCTA: ${post.cta}`;

    let endpoint = '';
    const params = new URLSearchParams();
    params.append('access_token', accessToken);

    if (imageUrl) {
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
