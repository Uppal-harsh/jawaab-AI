export interface PerformanceMetrics {
  callSid: string;
  provider: string;
  latencyMs: number;
  tokensUsed?: number;
  cost?: number;
  timestamp: string;
}

export class AnalyticsTracker {
  private metricsLog: PerformanceMetrics[] = [];

  logMetrics(metrics: PerformanceMetrics): void {
    this.metricsLog.push(metrics);
    console.log('[AnalyticsTracker] Performance Metrics Registered:', JSON.stringify(metrics, null, 2));
    
    // In production, write this asynchronously to a timeseries DB or dedicated supabase analytics table
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metricsLog;
  }
}
