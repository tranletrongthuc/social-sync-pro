// Test the BFF integration
async function testBffIntegration() {
  try {
    // Test the BFF service functions
    const bffService = await import('./services/bffService');
    
    // Test health check
    console.log('Testing BFF health check...');
    const health = await bffService.checkBffHealth();
    console.log('✅ BFF Health Check:', health);
    
    console.log('✅ BFF integration test completed successfully');
  } catch (error) {
    console.error('❌ BFF integration test failed:', error);
  }
}

// Run the test
testBffIntegration();