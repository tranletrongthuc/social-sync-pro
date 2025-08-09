import { generateTrends } from '../services/geminiService';

describe('generateTrends', () => {
    it('should return an array of trends with keywords property', async () => {
        const industry = 'tech';
        const language = 'English';
        const model = 'gemini-2.5-pro'; // Use a valid model for testing

        const trends = await generateTrends(industry, language, model);

        expect(Array.isArray(trends)).toBe(true);
        trends.forEach(trend => {
            expect(trend).toHaveProperty('topic');
            expect(trend).toHaveProperty('keywords');
            expect(Array.isArray(trend.keywords)).toBe(true);
            expect(trend).toHaveProperty('analysis');
            expect(trend).toHaveProperty('links');
            expect(Array.isArray(trend.links)).toBe(true);
        });
    });
});