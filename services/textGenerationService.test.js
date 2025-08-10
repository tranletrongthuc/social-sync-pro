// Simple test to verify that our service is properly structured
import { textGenerationService } from './textGenerationService';

// This test just verifies that the service has all the required methods
console.log('Testing textGenerationService structure...');

const requiredMethods = [
  'refinePostContent',
  'generateBrandProfile',
  'generateBrandKit',
  'generateMediaPlanGroup',
  'generateImagePromptForPost',
  'generateAffiliateComment',
  'generateViralIdeas',
  'generateContentPackage',
  'generateFacebookTrends',
  'generatePostsForFacebookTrend',
  'generateIdeasFromProduct'
];

for (const method of requiredMethods) {
  if (typeof textGenerationService[method] === 'function') {
    console.log(`✓ ${method} is present`);
  } else {
    console.log(`✗ ${method} is missing`);
  }
}

console.log('Test completed.');