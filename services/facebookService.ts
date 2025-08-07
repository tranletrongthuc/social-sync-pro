import type { MediaPlanPost, FacebookLoginResponse, FacebookPage } from '../types';

declare const FB: any; // Declare the FB object from the SDK

// Logs the user in and gets their pages
export const connectAndGetPageToken = async (): Promise<FacebookLoginResponse> => {
    if (typeof FB === 'undefined' || !FB.login) {
        throw new Error("Facebook SDK is not available or initialized. Please wait a moment and try again.");
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
                    console.log("Raw Facebook /me/accounts response:", pageResponse);
                    if (pageResponse && !pageResponse.error) {
                        if (pageResponse.data && pageResponse.data.length > 0) {
                            const pages: FacebookPage[] = pageResponse.data.map((page: any) => ({
                                id: page.id,
                                name: page.name,
                                access_token: page.access_token,
                                category: page.category,
                                category_list: page.category_list,
                                tasks: page.tasks,
                            }));
                            resolve({
                                userAccessToken,
                                pages,
                            });
                        } else {
                            reject(new Error("No Facebook Pages found for this account with the granted permissions. Please try connecting again and ensure you grant access to the Facebook Pages you wish to manage."));
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
    accessToken: string,
    videoUrl?: string
): Promise<{ publishedUrl: string }> => {
    console.log("publishToFacebookPage received args:", { post, imageUrl, pageId, accessToken: accessToken ? '[REDACTED]' : '[MISSING]', videoUrl });
    const apiVersion = 'v23.0';
    const fullMessage = `${post.title}\n\n${post.content}\n\n${(post.hashtags || []).join(' ')}\n\nCTA: ${post.cta}`;

    let endpoint = '';
    const params = new URLSearchParams();
    params.append('access_token', accessToken);

    console.log("Page ID right before URL construction:", pageId); // New diagnostic log

    if (imageUrl) {
        endpoint = "https://graph.facebook.com/" + apiVersion + "/" + pageId + "/photos";
        params.append('caption', fullMessage);
        params.append('url', imageUrl); // Use URL directly, assuming it's publicly accessible
    } else {
        endpoint = "https://graph.facebook.com/" + apiVersion + "/" + pageId + "/feed";
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