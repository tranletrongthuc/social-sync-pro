// Simple test to verify BFF integration
async function testBffConnection() {
  try {
    // Try to fetch from the BFF health endpoint
    const response = await fetch('/api/health', {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ BFF is accessible:', data);
      return true;
    } else {
      console.log('❌ BFF returned error status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to connect to BFF:', error.message);
    return false;
  }
}

// Test the connection
testBffConnection().then(success => {
  if (success) {
    console.log('✅ BFF integration test passed');
  } else {
    console.log('❌ BFF integration test failed - falling back to direct API calls');
  }
});