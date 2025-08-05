import { google } from 'googleapis'
import { createGoogleSheetsService } from './googleAuth'

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || '1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU'

export interface ThreadData {
  videoId: string
  videoTitle: string
  channelTitle: string
  summary: string
  threads: string[]
  createdAt: string
}

export async function saveToGoogleSheets(data: ThreadData) {
  try {
    console.log('[GoogleSheets] Starting save to Google Sheets...')
    console.log(`[GoogleSheets] Sheet ID: ${GOOGLE_SHEET_ID}`)
    
    // Google Sheets API 서비스 생성
    const sheets = await createGoogleSheetsService()
    
    // 먼저 시트가 존재하는지 확인하고 헤더가 있는지 체크
    try {
      console.log('[GoogleSheets] Checking sheet structure...')
      const sheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        ranges: ['Sheet1!A1:H1']
      })
      
      console.log('[GoogleSheets] Sheet exists, checking headers...')
    } catch (error) {
      console.log('[GoogleSheets] Sheet might not exist or no access:', error)
      throw new Error('Cannot access Google Sheet. Please check permissions and Sheet ID.')
    }
    
    // 헤더 행이 없으면 생성
    try {
      const headerCheck = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'Sheet1!A1:H1'
      })
      
      if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
        console.log('[GoogleSheets] Adding headers...')
        await sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: 'Sheet1!A1:H1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              'Timestamp',
              'Video ID', 
              'Video Title',
              'Channel Title',
              'Summary',
              'Thread Content',
              'Created At',
              'Character Count'
            ]]
          }
        })
      }
    } catch (headerError) {
      console.warn('[GoogleSheets] Header check/creation failed:', headerError)
    }
    
    // Thread 내용 결합 및 길이 계산
    const threadContent = data.threads.join('\n\n')
    const characterCount = threadContent.length
    
    console.log(`[GoogleSheets] Thread character count: ${characterCount}`)
    
    // 데이터 행 준비
    const row = [
      new Date().toISOString(), // Timestamp
      data.videoId,             // Video ID
      data.videoTitle,          // Video Title
      data.channelTitle,        // Channel Title
      data.summary,             // Summary
      threadContent,            // Thread Content (combined)
      data.createdAt,           // Created At
      characterCount            // Character Count
    ]

    console.log('[GoogleSheets] Appending data to sheet...')
    
    // 시트에 데이터 추가
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1!A:H', // A부터 H까지 8개 컬럼
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row]
      }
    })

    console.log('[GoogleSheets] Successfully saved to Google Sheets')
    console.log(`[GoogleSheets] Updated range: ${response.data.updates?.updatedRange}`)
    
    return { 
      success: true, 
      data: response.data,
      rowsAdded: response.data.updates?.updatedRows || 1,
      range: response.data.updates?.updatedRange
    }
  } catch (error: any) {
    console.error('Google Sheets save error:', error)
    
    // 권한 오류인 경우 명확한 메시지 전달
    if (error.code === 403 || error.message?.includes('PERMISSION_DENIED')) {
      throw new Error('PERMISSION_DENIED: API key is read-only. Please use a service account or Google Apps Script.')
    }
    
    throw new Error(`Failed to save to Google Sheets: ${error.message || 'Unknown error'}`)
  }
}

export async function getFromGoogleSheets(limit: number = 50) {
  try {
    console.log('[GoogleSheets] Fetching data from Google Sheets...')
    
    const sheets = await createGoogleSheetsService()
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1!A:H' // A부터 H까지 8개 컬럼
    })

    const rows = response.data.values || []
    console.log(`[GoogleSheets] Retrieved ${rows.length} rows`)
    
    if (rows.length === 0) {
      return []
    }
    
    // Skip header row and transform data
    const data = rows.slice(1).map((row, index) => ({
      id: index + 1,
      timestamp: row[0],
      videoId: row[1],
      videoTitle: row[2],
      channelTitle: row[3],
      summary: row[4],
      threadContent: row[5],
      threads: row[5] ? row[5].split('\n\n') : [], // Split by double newline
      createdAt: row[6],
      characterCount: parseInt(row[7]) || 0
    }))

    // Return latest entries first
    const result = data.reverse().slice(0, limit)
    console.log(`[GoogleSheets] Returning ${result.length} entries`)
    
    return result
  } catch (error) {
    console.error('Google Sheets fetch error:', error)
    throw new Error('Failed to fetch from Google Sheets')
  }
}