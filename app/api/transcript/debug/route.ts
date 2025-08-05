import { NextResponse } from 'next/server'
import { transcriptMonitor } from '@/lib/transcript-monitor'

export async function GET() {
  const metrics = transcriptMonitor.getMetrics()
  
  return NextResponse.json({
    metrics,
    successRate: transcriptMonitor.getSuccessRate(),
    koreanContentSuccessRate: transcriptMonitor.getKoreanContentSuccessRate(),
    methodSuccessRates: Object.entries(metrics.methodSuccessRates).reduce((acc, [method, stats]) => {
      acc[method] = transcriptMonitor.getMethodSuccessRate(method)
      return acc
    }, {} as Record<string, number>)
  })
}