



import { generateEmbeddingsWithBff } from './bffService';
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
    if (!availableAffiliateLinks || availableAffiliateLinks.length === 0 || count <= 0) {
        return [];
    }

    try {
        // Workflow B, Step 2: Construct Post Text
        const postText = `${post.title} | ${post.content} | ${(post.hashtags || []).join(' ')}`;

        // This simulates part of Workflow A on the fly: Construct Product Text
        const productTexts = availableAffiliateLinks.map(link => 
            `${link.productName} | ${link.providerName} | ${link.product_description || ''} | ${(link.features || []).join(' ')} | ${(link.use_cases || []).join(' ')} | ${link.customer_reviews || ''} | ${link.product_rating || ''}`
        );
        
        // Workflow B, Step 3: Generate Post and Product embeddings
        const allTexts = [postText, ...productTexts];
        const allTaskTypes = [
            "RETRIEVAL_QUERY", 
            ...productTexts.map(() => "RETRIEVAL_DOCUMENT")
        ];

        const embeddings = await generateEmbeddingsWithBff(allTexts, allTaskTypes);
        
        if (!embeddings || embeddings.length < 2) {
             console.error("Not enough embeddings returned from API.");
             return [];
        }

        const postEmbedding = embeddings[0];
        const productEmbeddings = embeddings.slice(1);

        // Workflow B, Step 4: Perform Similarity Search
        const scoredLinks = availableAffiliateLinks.map((link, index) => {
            const productEmbeddingValues = productEmbeddings[index];
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
            .sort((a, b) => {
                if (b.similarity !== a.similarity) {
                    return b.similarity - a.similarity;
                }
                // Prioritize by salesVolume (highest first)
                if (b.link.salesVolume !== a.link.salesVolume) {
                    return b.link.salesVolume - a.link.salesVolume;
                }
                // Then by product_rating (highest first)
                return (b.link.product_rating || 0) - (a.link.product_rating || 0);
            });
        
        // Workflow B, Step 5 & 7: Return ranked list of top N products
        return sortedAndFilteredLinks.slice(0, count).map(item => item.link);

    } catch (error) {
        console.error("KhongMinh suggestion using vector search failed:", error);
        // Gracefully fail by returning an empty array.
        return [];
    }
};