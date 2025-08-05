// Google Apps Script를 통한 Google Sheets 저장
// 이 방법은 서비스 계정 없이도 작동하지만 Google Apps Script 웹앱이 필요합니다.

export interface GoogleAppsScriptResponse {
  success: boolean
  message: string
  rowNumber?: number
  data?: any
}

export async function saveViaGoogleAppsScript(data: {
  videoId: string
  videoTitle: string
  channelTitle: string
  summary: string
  threadContent: string
  characterCount: number
}): Promise<GoogleAppsScriptResponse> {
  
  // Google Apps Script 웹앱 URL (실제 배포 시 설정 필요)
  const SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL
  
  console.log('[GoogleAppsScript] Checking GOOGLE_APPS_SCRIPT_URL...')
  console.log('[GoogleAppsScript] URL exists:', !!SCRIPT_URL)
  
  if (!SCRIPT_URL) {
    console.error('[GoogleAppsScript] GOOGLE_APPS_SCRIPT_URL not found in environment variables')
    throw new Error('Google Apps Script URL이 설정되지 않았습니다. GOOGLE_APPS_SCRIPT_URL 환경변수를 설정해주세요.')
  }

  try {
    console.log('[GoogleAppsScript] Sending data to Google Apps Script...')
    console.log('[GoogleAppsScript] URL:', SCRIPT_URL)
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        action: 'saveThread',
        timestamp: new Date().toISOString(),
        videoId: data.videoId,
        videoTitle: data.videoTitle,
        channelTitle: data.channelTitle,
        summary: data.summary,
        threadContent: data.threadContent,
        characterCount: data.characterCount,
        createdAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    console.log('[GoogleAppsScript] Response:', result)
    
    return result
  } catch (error) {
    console.error('[GoogleAppsScript] Error:', error)
    throw new Error(`Google Apps Script 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

// Google Apps Script 코드 (참조용, 실제로는 Google Apps Script 에디터에서 작성)
export const GOOGLE_APPS_SCRIPT_CODE = `
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'saveThread') {
      return saveThreadData(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Unknown action'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveThreadData(data) {
  // 스프레드시트 ID (환경에 맞게 수정)
  const SHEET_ID = '1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU';
  
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // 헤더가 없으면 추가
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 8).setValues([[
        'Timestamp', 'Video ID', 'Video Title', 'Channel Title', 
        'Summary', 'Thread Content', 'Created At', 'Character Count'
      ]]);
    }
    
    // 데이터 추가
    const row = [
      data.timestamp,
      data.videoId,
      data.videoTitle,
      data.channelTitle,
      data.summary,
      data.threadContent,
      data.createdAt,
      data.characterCount
    ];
    
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Thread saved successfully',
        rowNumber: sheet.getLastRow()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Save failed: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;