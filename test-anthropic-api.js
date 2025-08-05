// Test Anthropic API directly
require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testAnthropicAPI() {
  console.log('🧪 Testing Anthropic API...\n');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length || 0);
  console.log('API Key prefix:', apiKey?.substring(0, 10) + '...');
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY is not set in .env.local');
    return;
  }
  
  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    console.log('\n📤 Sending test request to Claude API...');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: `Create a simple JSON response for a test. Return only JSON:
{
  "summary": "This is a test summary",
  "threads": [
    {"content": "Test tweet 1", "order": 1},
    {"content": "Test tweet 2", "order": 2}
  ]
}`
      }],
    });
    
    console.log('\n✅ API Response received!');
    console.log('Response type:', response.content[0].type);
    console.log('Response content:', response.content[0].text);
    
    // Try to parse JSON
    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('\n✅ Successfully parsed JSON:');
      console.log(JSON.stringify(parsed, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Error type:', error.constructor.name);
    console.error('Error status:', error.status);
    console.error('Error details:', error);
  }
}

testAnthropicAPI();