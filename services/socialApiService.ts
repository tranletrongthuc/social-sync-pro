import type { MediaPlanPost, Persona } from '../types';
import { connectSocialAccountToPersona, disconnectSocialAccountFromPersona, directPost, schedulePost as socialAccountServiceSchedulePost, getSocialAccountForPersona } from './socialAccountService';

declare const FB: any; // Declare the FB object from the SDK

// --- API FUNCTIONS ---

/**
 * Handles connecting a social media account to a persona.
 * @param persona The persona to connect the account to.
 * @param platform The platform to connect (e.g., 'Facebook', 'Instagram').
 * @returns The updated persona with the new social account.
 */
export const connectAccount = async (persona: Persona, platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest'): Promise<Persona> => {
    return connectSocialAccountToPersona(persona, platform);
};

/**
 * Disconnects a social media account from a persona.
 * @param persona The persona from which to disconnect the account.
 * @param platform The platform to disconnect.
 * @returns The updated persona with the social account removed.
 */
export const disconnectAccount = async (persona: Persona, platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest'): Promise<Persona> => {
    return disconnectSocialAccountFromPersona(persona.id, platform);
};

/**
 * Retrieves the social account for a given persona and platform.
 * @param personaId The ID of the persona.
 * @param platform The platform to retrieve the account for.
 * @returns The social account, or undefined if not found.
 */
export const getSocialAccount = (personaId: string, platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Pinterest') => {
    return getSocialAccountForPersona(personaId, platform);
};

/**
 * Publishes a post to a social media platform for a specific persona.
 * @param personaId The ID of the persona associated with the post.
 * @param post The post object to publish.
 * @param imageUrl The public URL of the image to be included in the post.
 * @param videoUrl The public URL of the video to be included in the post.
 * @returns A promise that resolves with the URL of the "published" post.
 */
export const publishPost = async (personaId: string, post: MediaPlanPost, imageUrl?: string, videoUrl?: string): Promise<{ publishedUrl: string }> => {
    return directPost(personaId, post.platform, post, imageUrl, videoUrl);
};

/**
 * Schedules a post for a future date for a specific persona.
 * @param personaId The ID of the persona associated with the post.
 * @param post The post object to schedule.
 * @param scheduleDate The ISO string of the date to schedule the post for.
 * @param imageUrl The public URL of the image to be included in the post.
 * @param videoUrl The public URL of the video to be included in the post.
 * @returns A promise that resolves when the post is "scheduled".
 */
export const schedulePost = async (personaId: string, post: MediaPlanPost, scheduleDate: string, imageUrl?: string, videoUrl?: string): Promise<void> => {
    return socialAccountServiceSchedulePost(personaId, post.platform, post, scheduleDate, imageUrl, videoUrl);
};