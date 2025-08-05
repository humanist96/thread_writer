interface TranscriptMetrics {
  attempts: number
  successes: number
  failures: number
  methodSuccessRates: Record<string, { attempts: number; successes: number }>
  averageResponseTime: number
  koreanContentAttempts: number
  koreanContentSuccesses: number
  lastError?: string
  lastSuccessfulMethod?: string
}

class TranscriptMonitor {
  private metrics: TranscriptMetrics = {
    attempts: 0,
    successes: 0,
    failures: 0,
    methodSuccessRates: {},
    averageResponseTime: 0,
    koreanContentAttempts: 0,
    koreanContentSuccesses: 0
  }

  private responseTimes: number[] = []

  recordAttempt(
    method: string,
    success: boolean,
    responseTime: number,
    error?: string,
    isKorean?: boolean
  ) {
    this.metrics.attempts++
    
    if (success) {
      this.metrics.successes++
      this.metrics.lastSuccessfulMethod = method
    } else {
      this.metrics.failures++
      if (error) {
        this.metrics.lastError = error
      }
    }

    // Track method-specific metrics
    if (!this.metrics.methodSuccessRates[method]) {
      this.metrics.methodSuccessRates[method] = { attempts: 0, successes: 0 }
    }
    this.metrics.methodSuccessRates[method].attempts++
    if (success) {
      this.metrics.methodSuccessRates[method].successes++
    }

    // Track response times
    this.responseTimes.push(responseTime)
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length

    // Track Korean content
    if (isKorean !== undefined) {
      if (isKorean) {
        this.metrics.koreanContentAttempts++
        if (success) {
          this.metrics.koreanContentSuccesses++
        }
      }
    }
  }

  getMetrics(): TranscriptMetrics {
    return { ...this.metrics }
  }

  getSuccessRate(): number {
    if (this.metrics.attempts === 0) return 0
    return (this.metrics.successes / this.metrics.attempts) * 100
  }

  getMethodSuccessRate(method: string): number {
    const methodMetrics = this.metrics.methodSuccessRates[method]
    if (!methodMetrics || methodMetrics.attempts === 0) return 0
    return (methodMetrics.successes / methodMetrics.attempts) * 100
  }

  getKoreanContentSuccessRate(): number {
    if (this.metrics.koreanContentAttempts === 0) return 0
    return (this.metrics.koreanContentSuccesses / this.metrics.koreanContentAttempts) * 100
  }

  reset() {
    this.metrics = {
      attempts: 0,
      successes: 0,
      failures: 0,
      methodSuccessRates: {},
      averageResponseTime: 0,
      koreanContentAttempts: 0,
      koreanContentSuccesses: 0
    }
    this.responseTimes = []
  }

  log() {
    console.log('=== Transcript Extraction Metrics ===')
    console.log(`Total Attempts: ${this.metrics.attempts}`)
    console.log(`Success Rate: ${this.getSuccessRate().toFixed(2)}%`)
    console.log(`Average Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms`)
    
    console.log('\nMethod Success Rates:')
    Object.entries(this.metrics.methodSuccessRates).forEach(([method, stats]) => {
      const rate = (stats.successes / stats.attempts) * 100
      console.log(`  ${method}: ${rate.toFixed(2)}% (${stats.successes}/${stats.attempts})`)
    })
    
    console.log(`\nKorean Content Success Rate: ${this.getKoreanContentSuccessRate().toFixed(2)}%`)
    
    if (this.metrics.lastError) {
      console.log(`\nLast Error: ${this.metrics.lastError}`)
    }
    if (this.metrics.lastSuccessfulMethod) {
      console.log(`Last Successful Method: ${this.metrics.lastSuccessfulMethod}`)
    }
    console.log('====================================')
  }
}

export const transcriptMonitor = new TranscriptMonitor()