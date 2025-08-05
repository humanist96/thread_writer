// Service Account JSON 키를 환경변수 형태로 변환하는 도우미
const fs = require('fs');
const path = require('path');

console.log('🔧 Service Account 환경변수 설정 도우미');
console.log('=' .repeat(50));

console.log('\n📋 다음 단계를 따라해주세요:');
console.log('1. Google Cloud Console에서 다운로드한 JSON 키 파일을 준비');
console.log('2. JSON 파일 경로를 입력하거나 JSON 내용을 직접 붙여넣기');
console.log('3. 자동으로 .env.local 파일에 설정됩니다');

console.log('\n📁 예상 JSON 파일 위치:');
console.log('   - Downloads 폴더: C:\\Users\\Admin\\Downloads\\youtube-ai-thread-*.json');
console.log('   - 또는 직접 JSON 내용을 복사/붙여넣기');

console.log('\n🔍 JSON 파일 구조 확인:');
console.log('   {');
console.log('     "type": "service_account",');
console.log('     "project_id": "youtube-ai-thread-2025",');
console.log('     "private_key_id": "...",');
console.log('     "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",');
console.log('     "client_email": "youtube-ai-sheets@youtube-ai-thread-2025.iam.gserviceaccount.com",');
console.log('     ...');
console.log('   }');

console.log('\n📝 JSON 키 파일을 찾으셨으면:');
console.log('   1. 파일 내용을 메모장으로 열기');
console.log('   2. 전체 내용 복사 (Ctrl+A, Ctrl+C)');
console.log('   3. 여기에 붙여넣기');

// 자동으로 Service Account 이메일 표시
console.log('\n📧 예상 Service Account 이메일:');
console.log('   youtube-ai-sheets@youtube-ai-thread-2025.iam.gserviceaccount.com');
console.log('   (이 이메일을 Google Sheets에 편집자로 추가해야 합니다)');

function formatJsonForEnv(jsonString) {
  try {
    // JSON 유효성 검사
    const parsed = JSON.parse(jsonString);
    
    // 필수 필드 확인
    const required = ['type', 'project_id', 'private_key', 'client_email'];
    for (const field of required) {
      if (!parsed[field]) {
        throw new Error(`필수 필드 누락: ${field}`);
      }
    }
    
    console.log('\n✅ JSON 유효성 검사 통과');
    console.log(`   프로젝트 ID: ${parsed.project_id}`);
    console.log(`   클라이언트 이메일: ${parsed.client_email}`);
    
    // 한 줄로 변환 (개행 문자 이스케이프)
    const oneLine = JSON.stringify(parsed);
    
    return {
      valid: true,
      serviceAccountKey: oneLine,
      clientEmail: parsed.client_email,
      projectId: parsed.project_id
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

async function updateEnvFile(serviceAccountKey) {
  const envPath = path.join(__dirname, '.env.local');
  
  try {
    let envContent = '';
    
    // 기존 .env.local 파일 읽기
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }
    
    // GOOGLE_SERVICE_ACCOUNT_KEY 업데이트 또는 추가
    const keyLine = `GOOGLE_SERVICE_ACCOUNT_KEY=${serviceAccountKey}`;
    
    if (envContent.includes('GOOGLE_SERVICE_ACCOUNT_KEY=')) {
      // 기존 키 교체
      envContent = envContent.replace(/GOOGLE_SERVICE_ACCOUNT_KEY=.*$/m, keyLine);
    } else {
      // 새로 추가
      envContent += `\n# Google Service Account (JSON 키)\n${keyLine}\n`;
    }
    
    // 파일 저장
    fs.writeFileSync(envPath, envContent, 'utf-8');
    
    console.log('\n✅ .env.local 파일 업데이트 완료');
    console.log(`   파일 위치: ${envPath}`);
    
    return true;
  } catch (error) {
    console.error('\n❌ .env.local 파일 업데이트 실패:', error.message);
    return false;
  }
}

// 사용법 안내
console.log('\n🎯 다음 명령어로 이 스크립트를 사용하세요:');
console.log('   node env-setup-helper.js');
console.log('\n   그 다음 JSON 내용을 붙여넣고 Enter를 누르세요.');

module.exports = { formatJsonForEnv, updateEnvFile };