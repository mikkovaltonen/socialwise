// Simple OpenRouter API test
const API_KEY = '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';

async function testOpenRouter() {
  console.log('Testing OpenRouter API with Grok-4-fast (free)...\n');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://valmet-buyer.firebaseapp.com',
        'X-Title': 'Valmet Test'
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4-fast:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Keep responses brief.'
          },
          {
            role: 'user',
            content: 'Say "Hello World" and nothing else.'
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', response.status, error);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Response from Gemini 2.5 Flash:');
    console.log('----------------------------------------');
    console.log(data.choices[0].message.content);
    console.log('----------------------------------------');
    console.log('\nFull response object:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testOpenRouter();