import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.videoId || !data.threads || data.threads.length === 0) {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 })
    }

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data')
    try {
      await fs.mkdir(dataDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save to local JSON file
    const filename = `thread_${data.videoId}_${Date.now()}.json`
    const filepath = path.join(dataDir, filename)
    
    const saveData = {
      ...data,
      savedAt: new Date().toISOString(),
      filename
    }
    
    await fs.writeFile(filepath, JSON.stringify(saveData, null, 2), 'utf-8')
    
    console.log(`✅ Thread data saved locally: ${filename}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Saved locally successfully',
      filename,
      path: filepath
    })
  } catch (error: any) {
    console.error('Local save error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to save locally' 
    }, { status: 500 })
  }
}