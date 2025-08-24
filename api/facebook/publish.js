const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/facebook/publish ---');
  try {
    const { post, imageUrl, pageId, accessToken, videoUrl } = request.body;

    if (!pageId || !accessToken) {
      return response.status(400).json({ error: 'Missing required fields: pageId and accessToken' });
    }

    if (!post || typeof post !== 'object') {
      return response.status(400).json({ error: 'Missing or invalid post data' });
    }

    const apiVersion = 'v23.0';
    const fullMessage = `${post.title}\n\n${post.content}\n\n${(post.hashtags || []).join(' ')}\n\nCTA: ${post.cta}`;

    let endpoint = '';
    const params = new URLSearchParams();
    params.append('access_token', accessToken);

    console.log("Page ID right before URL construction:", pageId); // New diagnostic log

    if (imageUrl) {
      endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;
      params.append('caption', fullMessage);
      params.append('url', imageUrl);
    } else {
      endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
      params.append('message', fullMessage);
    }

    const facebookResponse = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'POST',
    });

    const responseData = await facebookResponse.json();

    if (!facebookResponse.ok) {
      throw new Error(responseData.error?.message || "Failed to publish to Facebook");
    }

    const postId = responseData.id || responseData.post_id;
    if (!postId) {
      throw new Error("Facebook API did not return a post ID");
    }

    const publishedUrl = `https://www.facebook.com/${postId}`;
    response.status(200).json({ publishedUrl });
    console.log('--- Facebook publish response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/facebook/publish ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to publish to Facebook: ${error.message}` });
  }
}