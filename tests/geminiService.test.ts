import { generateFacebookTrends as generateTrends } from '../services/geminiService';
import * as bffService from '../services/bffService';

jest.mock('../services/bffService');

describe('generateTrends', () => {
    it('should return an array of trends with keywords property', async () => {
        const industry = 'tech';
        const language = 'English';
        const model = 'gemini-2.5-pro'; // Use a valid model for testing

        const mockResponse = JSON.stringify([
            {
                topic: 'Test Topic',
                keywords: ['keyword1', 'keyword2'],
                analysis: 'Test Analysis',
                links: [{uri: 'http://example.com', title: 'Test Link'}],
            },
        ]);

        (bffService.generateContentWithBff as jest.Mock).mockResolvedValue(mockResponse);

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