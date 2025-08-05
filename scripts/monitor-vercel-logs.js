const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

const DEPLOYMENT_URL = 'youtube-ai-thread-1s2rz1z28-humanist96s-projects.vercel.app'

async function monitorLogs() {
  console.log(`[Monitor] Starting log monitoring for ${DEPLOYMENT_URL}`)
  console.log('[Monitor] Press Ctrl+C to stop\n')

  try {
    // Get runtime logs
    const { stdout, stderr } = await execAsync(`vercel logs ${DEPLOYMENT_URL}`, {
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    })

    if (stderr) {
      console.error('[Monitor] Error output:', stderr)
    }

    // Parse and filter logs
    const lines = stdout.split('\n')
    const transcriptLogs = lines.filter(line => 
      line.includes('Transcript') || 
      line.includes('transcript') ||
      line.includes('SimpleTranscript') ||
      line.includes('YouTubeTranscript') ||
      line.includes('Error') ||
      line.includes('error')
    )

    console.log(`[Monitor] Found ${transcriptLogs.length} relevant log entries:\n`)

    // Group logs by request
    const requests = new Map()
    let currentRequest = null

    transcriptLogs.forEach(line => {
      // Try to extract request ID or timestamp
      const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)/)
      if (match) {
        currentRequest = match[1]
        if (!requests.has(currentRequest)) {
          requests.set(currentRequest, [])
        }
      }
      
      if (currentRequest) {
        requests.get(currentRequest).push(line)
      }
    })

    // Display grouped logs
    for (const [timestamp, logs] of requests.entries()) {
      console.log(`\n=== Request at ${timestamp} ===`)
      logs.forEach(log => console.log(log))
    }

    // Extract error patterns
    console.log('\n[Monitor] Error Summary:')
    const errorPatterns = new Map()
    
    transcriptLogs.forEach(line => {
      if (line.toLowerCase().includes('error')) {
        // Extract error message
        const errorMatch = line.match(/error[:\s]+(.+?)$/i)
        if (errorMatch) {
          const error = errorMatch[1].trim()
          errorPatterns.set(error, (errorPatterns.get(error) || 0) + 1)
        }
      }
    })

    if (errorPatterns.size > 0) {
      for (const [error, count] of errorPatterns.entries()) {
        console.log(`  - "${error}" (${count} occurrences)`)
      }
    } else {
      console.log('  No errors found in recent logs')
    }

  } catch (error) {
    console.error('[Monitor] Failed to fetch logs:', error.message)
  }
}

// Run monitoring
monitorLogs().then(() => {
  console.log('\n[Monitor] Log analysis complete')
}).catch(error => {
  console.error('[Monitor] Fatal error:', error)
})