



import { GoogleGenAI, type ContentEmbedding, type EmbedContentResponse } from "@google/genai";
import type { MediaPlanPost, AffiliateLink } from '../types';


/**
 * Calculates the cosine similarity between two vectors.
 * @param vecA The first vector.
 * @param vecB The second vector.
 * @returns The cosine similarity score (between -1 and 1).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Suggests relevant affiliate products for a given social media post using vector similarity search.
 * This function implements the on-demand matching workflow (Workflow B) described in the KhongMinh module specification.
 * It generates embeddings for the post and available products in a single batch call, then calculates cosine similarity to find the best matches.
 */
export const suggestProductsForPost = async (
    post: MediaPlanPost,
    availableAffiliateLinks: AffiliateLink[],
    count: number
): Promise<AffiliateLink[]> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.warn("API_KEY not set, skipping KhongMinh suggestion.");
      return [];
    }
    if (!availableAffiliateLinks || availableAffiliateLinks.length === 0 || count <= 0) {
        return [];
    }

    try {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        
        // Workflow B, Step 2: Construct Post Text
        const postText = `${post.title} | ${post.content} | ${(post.hashtags || []).join(' ')}`;

        // This simulates part of Workflow A on the fly: Construct Product Text
        const productTexts = availableAffiliateLinks.map(link => 
            `${link.productName} | ${link.providerName}`
        );
        
        // Workflow B, Step 3: Generate Post and Product embeddings
        const postRequest = {
            contents: { parts: [{ text: postText }] },
            taskType: "RETRIEVAL_QUERY" as const
        };
        const productRequests = productTexts.map(text => ({
            contents: { parts: [{ text }] },
            taskType: "RETRIEVAL_DOCUMENT" as const
        }));

        const allRequests = [postRequest, ...productRequests];

        const embeddingPromises = allRequests.map(req => 
            ai.models.embedContent({
                model: "embedding-001",
                ...req
            })
        );
        
        const embeddingResults = await Promise.all(embeddingPromises);
        
        const embeddings: (ContentEmbedding | undefined)[] = embeddingResults.map(res => res.embeddings[0]);

        if (!embeddings || embeddings.length < 2 || !embeddings[0]?.values) {
             console.error("Not enough embeddings returned from API.");
             return [];
        }

        const postEmbedding = embeddings[0].values;
        const productEmbeddings = embeddings.slice(1);

        // Workflow B, Step 4: Perform Similarity Search
        const scoredLinks = availableAffiliateLinks.map((link, index) => {
            const productEmbeddingValues = productEmbeddings[index]?.values;
            if (!productEmbeddingValues) {
                return { link, similarity: -1 };
            }
            const similarity = cosineSimilarity(postEmbedding, productEmbeddingValues);
            return { link, similarity };
        });

        // Acceptance Criteria: Retrieve Top Matches with score > 0.75
        const SIMILARITY_THRESHOLD = 0.75;
        const sortedAndFilteredLinks = scoredLinks
            .filter(item => item.similarity >= SIMILARITY_THRESHOLD)
            .sort((a, b) => b.similarity - a.similarity);
        
        // Workflow B, Step 5 & 7: Return ranked list of top N products
        return sortedAndFilteredLinks.slice(0, count).map(item => item.link);

    } catch (error) {
        console.error("KhongMinh suggestion using vector search failed:", error);
        // Gracefully fail by returning an empty array.
        return [];
    }
};