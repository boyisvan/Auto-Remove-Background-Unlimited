const axios = require('axios');

async function testAPI() {
  try {
    const response = await axios.get('https://api.remove.bg/v1.0/account', {
      headers: {
        'X-Api-Key': 'En2kCTfMg67787umXpTPSY4D'
      }
    });
    console.log('API Key hợp lệ:', response.data);
  } catch (error) {
    console.error('API Key không hợp lệ:', error.response?.data || error.message);
  }
}

testAPI();