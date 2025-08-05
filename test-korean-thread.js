// Test Korean thread generation
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testKoreanThread() {
  console.log('🇰🇷 Testing Korean thread generation...\n');
  
  // Sample Korean transcript
  const koreanTranscript = "AI를 활용한 바이브 코딩이 개발자의 미래를 바꾸고 있습니다. 코드만 작성하는 개발자가 아닌, 문제를 해결하는 개발자가 되어야 합니다. V0, 커서 AI 같은 도구들을 활용하면 개발 속도가 획기적으로 향상됩니다.";
  
  try {
    console.log('📤 Sending request to generate thread...');
    
    const response = await axios.post('http://localhost:3000/api/generate-thread', {
      transcript: koreanTranscript,
      videoTitle: '바이브 코딩 마스터하기',
      videoDescription: 'AI 시대의 개발자 생존 전략'
    });
    
    console.log('\n✅ Thread generated successfully!');
    console.log('\n📝 Summary:', response.data.summary);
    console.log('\n🧵 Threads:');
    response.data.threads.forEach((thread, index) => {
      console.log(`\n${index + 1}. ${thread.content}`);
      console.log(`   Characters: ${thread.content.length}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testKoreanThread();