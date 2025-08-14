// Test script to verify BFF functionality
import { checkBffHealth } from './services/bffService';

async function testBff() {
  try {
    console.log('Testing BFF health check...');
    const health = await checkBffHealth();
    console.log('BFF Health Status:', health);
    
    if (health.status === 'ok') {
      console.log('✅ BFF is running correctly');
      console.log('Services status:', health.services);
    } else {
      console.log('❌ BFF is not healthy');
    }
  } catch (error) {
    console.error('❌ BFF test failed:', error);
  }
}

testBff();