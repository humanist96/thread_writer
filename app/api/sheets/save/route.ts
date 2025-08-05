import { NextResponse } from 'next/server'
import { saveToGoogleSheets, ThreadData } from '@/lib/googleSheets'
import { saveViaGoogleAppsScript } from '@/lib/googleAppsScript'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const data: ThreadData = await request.json()
    
    if (!data.videoId || !data.threads || data.threads.length === 0) {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 })
    }

    console.log('[SaveAPI] Starting save process...')
    
    // 방법 1: Google Sheets API (서비스 계정)
    try {
      const result = await saveToGoogleSheets(data)
      console.log('✅ Saved to Google Sheets API successfully')
      return NextResponse.json({ 
        success: true, 
        result, 
        method: 'google_sheets_api',
        message: 'Google Sheets에 성공적으로 저장되었습니다!'
      })
    } catch (sheetsError) {
      console.warn('⚠️ Google Sheets API failed:', sheetsError)
      
      // API 키로는 쓰기가 불가능한 경우 Google Sheets 링크 제공
      if (sheetsError instanceof Error && sheetsError.message.includes('PERMISSION_DENIED')) {
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit`
        console.log('📋 Google Sheets 직접 열기:', sheetUrl)
        
        // 로컬에 저장하고 시트 링크 제공
        const dataDir = path.join(process.cwd(), 'data')
        try {
          await fs.mkdir(dataDir, { recursive: true })
        } catch (error) {
          // Directory might already exist
        }

        const filename = `thread_${data.videoId}_${Date.now()}.json`
        const filepath = path.join(dataDir, filename)
        
        const saveData = {
          ...data,
          savedAt: new Date().toISOString(),
          filename
        }
        
        await fs.writeFile(filepath, JSON.stringify(saveData, null, 2), 'utf-8')
        
        return NextResponse.json({ 
          success: true, 
          result: { 
            filename, 
            path: filepath,
            googleSheetsUrl: sheetUrl,
            manualCopyNeeded: true
          },
          method: 'manual_copy_required',
          message: `API 키는 읽기 전용입니다. 데이터가 로컬에 저장되었습니다.\n\nGoogle Sheets를 열어서 수동으로 붙여넣어주세요:\n${sheetUrl}`,
          clipboardData: {
            timestamp: new Date().toISOString(),
            videoId: data.videoId,
            videoTitle: data.videoTitle,
            channelTitle: data.channelTitle,
            summary: data.summary,
            threadContent: data.threads.join('\n\n'),
            characterCount: data.threads.join('\n\n').length
          }
        })
      }
      
      // 방법 2: Google Apps Script (웹앱)
      try {
        const threadContent = data.threads.join('\n\n')
        const scriptResult = await saveViaGoogleAppsScript({
          videoId: data.videoId,
          videoTitle: data.videoTitle,
          channelTitle: data.channelTitle,
          summary: data.summary,
          threadContent,
          characterCount: threadContent.length
        })
        
        console.log('✅ Saved via Google Apps Script successfully')
        return NextResponse.json({ 
          success: true, 
          result: scriptResult, 
          method: 'google_apps_script',
          message: 'Google Apps Script를 통해 저장되었습니다!'
        })
      } catch (scriptError) {
        console.warn('⚠️ Google Apps Script failed:', scriptError)
        
        // Fallback to local storage
        const dataDir = path.join(process.cwd(), 'data')
        try {
          await fs.mkdir(dataDir, { recursive: true })
        } catch (error) {
          // Directory might already exist
        }

        const filename = `thread_${data.videoId}_${Date.now()}.json`
        const filepath = path.join(dataDir, filename)
        
        const saveData = {
          ...data,
          savedAt: new Date().toISOString(),
          filename,
          error: sheetsError instanceof Error ? sheetsError.message : 'Unknown error'
        }
        
        await fs.writeFile(filepath, JSON.stringify(saveData, null, 2), 'utf-8')
        
        console.log(`✅ Thread data saved locally as fallback: ${filename}`)
        
        return NextResponse.json({ 
          success: true, 
          result: { filename, path: filepath },
          method: 'local_fallback',
          warning: 'Saved locally due to Google Sheets error'
        })
      }
    }
    
  } catch (error: any) {
    console.error('Save API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to save data' 
    }, { status: 500 })
  }
}