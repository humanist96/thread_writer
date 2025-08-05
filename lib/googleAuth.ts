// Google Sheets API 인증 설정
import { google } from 'googleapis'

export function getGoogleSheetsAuth() {
  // 환경변수에서 서비스 계정 정보 또는 API 키 가져오기
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  
  if (serviceAccountKey) {
    try {
      // 서비스 계정 키를 파싱 (JSON 문자열인 경우)
      const credentials = typeof serviceAccountKey === 'string' 
        ? JSON.parse(serviceAccountKey) 
        : serviceAccountKey

      return new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ]
      })
    } catch (error) {
      console.error('[GoogleAuth] Service account parsing error:', error)
      throw new Error('Invalid service account credentials')
    }
  }
  
  if (apiKey) {
    // API 키 방식 (읽기 전용)
    console.warn('[GoogleAuth] API key authentication is read-only. Write operations will fail.')
    console.warn('[GoogleAuth] Please set up a service account or Google Apps Script for write access.')
    return apiKey
  }
  
  throw new Error('No Google authentication credentials found. Please set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SHEETS_API_KEY')
}

export async function createGoogleSheetsService() {
  const auth = getGoogleSheetsAuth()
  
  if (typeof auth === 'string') {
    // API key authentication
    return google.sheets({ 
      version: 'v4', 
      auth: auth
    })
  } else {
    // Service account authentication
    const authClient = await auth.getClient()
    return google.sheets({ 
      version: 'v4', 
      auth: authClient as any // Type assertion to fix compilation
    })
  }
}