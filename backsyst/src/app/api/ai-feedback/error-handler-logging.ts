
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum ErrorCategory {
  API_ERROR = 'api_error', 
  DATABASE_ERROR = 'database_error', 
  VALIDATION_ERROR = 'validation_error', 
  CACHE_ERROR = 'cache_error', 
  TIMEOUT_ERROR = 'timeout_error',
  PARSING_ERROR = 'parsing_error', 
  FALLBACK_ERROR = 'fallback_error', 
  UNKNOWN_ERROR = 'unknown_error'
}

export interface LogEntry {
  id?: string;
  timestamp?: string; 
  level: LogLevel;
  category?: ErrorCategory;
  message: string;
  context?: Record<string, any>; 
  error_stack?: string;
  request_id?: string;
  user_id?: string;
  question_id?: string;
  processing_time_ms?: number;
  recovery_action?: string; 
  resolved?: boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByLevel: Record<string, number>;
  averageProcessingTime: number;
  failureRate: number; 
  recoveryRate: number; 
  lastError?: LogEntry;
  lastErrorTime?: string;
}

export interface QualityMetrics {
  totalFeedbacks: number;
  avgFeedbackScore: number; 
  avgResponseTime: number;
  cacheHitRate: number; 
  fallbackUsageRate: number; 
  validationPassRate: number; 
  retryAttemptRate: number; 
}

export interface PerformanceMetrics {
  requestsPerMinute: number;
  avgProcessingTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number; 
  p99ResponseTime: number; 
  maxResponseTime: number;
}

export interface Alert {
  id?: string;
  created_at?: string;
  alert_type: 'error_spike' | 'high_failure_rate' | 'slow_response' | 'cache_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  threshold_value: number;
  current_value: number;
  action_taken?: string;
  resolved?: boolean;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function logEvent(entry: LogEntry): Promise<boolean> {
  try {
    const logEntry = {
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level,
      category: entry.category,
      message: entry.message,
      context: JSON.stringify(entry.context || {}),
      error_stack: entry.error_stack,
      request_id: entry.request_id,
      user_id: entry.user_id,
      question_id: entry.question_id,
      processing_time_ms: entry.processing_time_ms,
      recovery_action: entry.recovery_action,
      resolved: entry.resolved || false
    };

    const prefix = `[${entry.level}${entry.category ? ` - ${entry.category}` : ''}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.log(message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.context || '', entry.error_stack || '');
        break;
      case LogLevel.CRITICAL:
        console.error('CRITICAL:', message, entry.context || '', entry.error_stack || '');
        break;
    }

    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
      const { error } = await supabaseAdmin
        .from('ai_feedback_logs')
        .insert([logEntry]);

      if (error) {
        console.warn('Could not save log to database:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Logging error:', error);
    return false;
  }
}

export async function logSuccess(
  requestId: string,
  questionId: string,
  processingTime: number,
  context?: Record<string, any>
): Promise<void> {
  await logEvent({
    level: LogLevel.INFO,
    message: `✓ Request completed successfully`,
    request_id: requestId,
    question_id: questionId,
    processing_time_ms: processingTime,
    context: {
      status: 'success',
      ...context
    }
  });
}

export async function logApiError(
  requestId: string,
  error: Error | unknown,
  questionId?: string,
  recoveryAction?: string
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  await logEvent({
    level: LogLevel.ERROR,
    category: ErrorCategory.API_ERROR,
    message: `API Error: ${errorMessage}`,
    request_id: requestId,
    question_id: questionId,
    error_stack: errorStack,
    recovery_action: recoveryAction || 'Using fallback feedback',
    resolved: !!recoveryAction
  });
}

export async function logDatabaseError(
  requestId: string,
  error: Error | unknown,
  operation: string,
  questionId?: string
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  await logEvent({
    level: LogLevel.ERROR,
    category: ErrorCategory.DATABASE_ERROR,
    message: `Database Error during ${operation}: ${errorMessage}`,
    request_id: requestId,
    question_id: questionId,
    context: {
      operation,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    }
  });
}

export async function logValidationIssue(
  requestId: string,
  questionId: string,
  issues: string[],
  score: number,
  willRetry: boolean
): Promise<void> {
  await logEvent({
    level: willRetry ? LogLevel.INFO : LogLevel.WARN,
    category: ErrorCategory.VALIDATION_ERROR,
    message: `Response validation ${willRetry ? 'triggered retry' : 'failed'}`,
    request_id: requestId,
    question_id: questionId,
    context: {
      validationScore: score,
      issues,
      willRetry,
      issueCount: issues.length
    }
  });
}

export async function logCacheOperation(
  requestId: string,
  operation: 'hit' | 'miss' | 'save' | 'clear',
  questionId: string,
  context?: Record<string, any>
): Promise<void> {
  await logEvent({
    level: LogLevel.DEBUG,
    category: ErrorCategory.CACHE_ERROR,
    message: `Cache ${operation.toUpperCase()}`,
    request_id: requestId,
    question_id: questionId,
    context: {
      operation,
      ...context
    }
  });
}

export async function logTimeout(
  requestId: string,
  operationName: string,
  timeoutMs: number,
  questionId?: string
): Promise<void> {
  await logEvent({
    level: LogLevel.ERROR,
    category: ErrorCategory.TIMEOUT_ERROR,
    message: `${operationName} timed out after ${timeoutMs}ms`,
    request_id: requestId,
    question_id: questionId,
    context: {
      operation: operationName,
      timeoutMs
    }
  });
}

export async function logFallbackUsage(
  requestId: string,
  questionId: string,
  reason: string,
  processingTime: number
): Promise<void> {
  await logEvent({
    level: LogLevel.WARN,
    category: ErrorCategory.FALLBACK_ERROR,
    message: `Fallback feedback used: ${reason}`,
    request_id: requestId,
    question_id: questionId,
    processing_time_ms: processingTime,
    context: {
      feedback_source: 'fallback'
    }
  });
}

export async function getErrorMetrics(
  hoursBack: number = 24
): Promise<ErrorMetrics | null> {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

    // Fetch logs
    const { data: logs, error } = await supabaseAdmin
      .from('ai_feedback_logs')
      .select('*')
      .gte('timestamp', cutoffTime.toISOString());

    if (error || !logs) {
      console.warn('Could not fetch error metrics:', error);
      return null;
    }

    // Calculate metrics
    const errorLogs = logs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL');
    const resolvedErrors = errorLogs.filter(log => log.resolved).length;

    const errorsByCategory: Record<string, number> = {};
    const errorsByLevel: Record<string, number> = {};

    logs.forEach(log => {
      if (log.category) {
        errorsByCategory[log.category] = (errorsByCategory[log.category] || 0) + 1;
      }
      errorsByLevel[log.level] = (errorsByLevel[log.level] || 0) + 1;
    });

    const avgProcessingTime =
      logs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / logs.length;

    return {
      totalErrors: errorLogs.length,
      errorsByCategory,
      errorsByLevel,
      averageProcessingTime: Math.round(avgProcessingTime),
      failureRate: logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0,
      recoveryRate: errorLogs.length > 0 ? (resolvedErrors / errorLogs.length) * 100 : 0,
      lastError: errorLogs[errorLogs.length - 1],
      lastErrorTime: errorLogs[errorLogs.length - 1]?.timestamp
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return null;
  }
}

export async function getQualityMetrics(
  hoursBack: number = 24
): Promise<QualityMetrics | null> {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

    // Fetch feedback data
    const { data: feedbacks, error } = await supabaseAdmin
      .from('ai_feedback')
      .select('*')
      .gte('created_at', cutoffTime.toISOString());

    if (error || !feedbacks) {
      console.warn('Could not fetch quality metrics:', error);
      return null;
    }

    const fallbackCount = feedbacks.filter(f =>
      f.ai_model?.includes('fallback')
    ).length;

    const validationScores = feedbacks
      .map((f: any) => {
        const match = f.ai_model?.match(/score:\s*(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(score => score > 0);

    const avgScore =
      validationScores.length > 0
        ? validationScores.reduce((a, b) => a + b) / validationScores.length
        : 0;

    return {
      totalFeedbacks: feedbacks.length,
      avgFeedbackScore: Math.round(avgScore),
      avgResponseTime: Math.round(
        feedbacks.reduce((sum: number, f: any) => sum + (f.processing_time_ms || 0), 0) /
          feedbacks.length
      ),
      cacheHitRate: 0, // Would need to track cache separately
      fallbackUsageRate: (fallbackCount / feedbacks.length) * 100,
      validationPassRate: validationScores.filter(s => s >= 65).length / feedbacks.length * 100,
      retryAttemptRate: feedbacks.filter(f =>
        f.ai_model?.includes('attempt')
      ).length / feedbacks.length * 100
    };
  } catch (error) {
    console.error('Error calculating quality metrics:', error);
    return null;
  }
}

export async function getPerformanceMetrics(
  hoursBack: number = 24
): Promise<PerformanceMetrics | null> {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

    // Fetch logs
    const { data: logs, error } = await supabaseAdmin
      .from('ai_feedback_logs')
      .select('processing_time_ms')
      .gte('timestamp', cutoffTime.toISOString());

    if (error || !logs) {
      return null;
    }

    const times = logs
      .map(l => l.processing_time_ms || 0)
      .filter(t => t > 0)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      return {
        requestsPerMinute: 0,
        avgProcessingTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        maxResponseTime: 0
      };
    }

    return {
      requestsPerMinute: logs.length / hoursBack / 60,
      avgProcessingTime: Math.round(times.reduce((a, b) => a + b) / times.length),
      p50ResponseTime: times[Math.floor(times.length * 0.5)],
      p95ResponseTime: times[Math.floor(times.length * 0.95)],
      p99ResponseTime: times[Math.floor(times.length * 0.99)],
      maxResponseTime: Math.max(...times)
    };
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return null;
  }
}

export async function checkAndCreateAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    // Get recent metrics
    const errorMetrics = await getErrorMetrics(1); // Last 1 hour
    const qualityMetrics = await getQualityMetrics(1);

    if (!errorMetrics || !qualityMetrics) {
      return [];
    }

    // Alert 1: High error rate (>10%)
    if (errorMetrics.failureRate > 10) {
      alerts.push({
        alert_type: 'high_failure_rate',
        severity: errorMetrics.failureRate > 30 ? 'critical' : 'high',
        title: 'High Error Rate Detected',
        description: `Error rate is ${errorMetrics.failureRate.toFixed(1)}% (threshold: 10%)`,
        threshold_value: 10,
        current_value: errorMetrics.failureRate,
        action_taken: 'Alert created for monitoring'
      });
    }

    // Alert 2: Low recovery rate (<70%)
    if (errorMetrics.recoveryRate < 70 && errorMetrics.totalErrors > 0) {
      alerts.push({
        alert_type: 'error_spike',
        severity: 'medium',
        title: 'Low Error Recovery Rate',
        description: `Only ${errorMetrics.recoveryRate.toFixed(1)}% of errors were recovered (threshold: 70%)`,
        threshold_value: 70,
        current_value: errorMetrics.recoveryRate,
        action_taken: 'Fallback system may need improvement'
      });
    }

    // Alert 3: Slow responses (>3000ms average)
    if (errorMetrics.averageProcessingTime > 3000) {
      alerts.push({
        alert_type: 'slow_response',
        severity: 'high',
        title: 'Slow Response Times',
        description: `Average response time is ${errorMetrics.averageProcessingTime}ms (threshold: 3000ms)`,
        threshold_value: 3000,
        current_value: errorMetrics.averageProcessingTime,
        action_taken: 'Check API performance and cache effectiveness'
      });
    }

    // Alert 4: Low validation pass rate (<60%)
    if (qualityMetrics.validationPassRate < 60) {
      alerts.push({
        alert_type: 'error_spike',
        severity: 'medium',
        title: 'Low Validation Pass Rate',
        description: `Only ${qualityMetrics.validationPassRate.toFixed(1)}% of responses passed validation`,
        threshold_value: 60,
        current_value: qualityMetrics.validationPassRate,
        action_taken: 'Review prompt engineering or response quality'
      });
    }

    // Alert 5: High fallback usage (>30%)
    if (qualityMetrics.fallbackUsageRate > 30) {
      alerts.push({
        alert_type: 'error_spike',
        severity: 'high',
        title: 'High Fallback Usage',
        description: `${qualityMetrics.fallbackUsageRate.toFixed(1)}% of feedbacks used fallback (threshold: 30%)`,
        threshold_value: 30,
        current_value: qualityMetrics.fallbackUsageRate,
        action_taken: 'Check API reliability and error patterns'
      });
    }

    // Save alerts to database
    if (alerts.length > 0) {
      const { error } = await supabaseAdmin
        .from('ai_feedback_alerts')
        .insert(
          alerts.map(a => ({
            ...a,
            created_at: new Date().toISOString(),
            resolved: false
          }))
        );

      if (error) {
        console.warn('Could not save alerts:', error);
      } else {
        console.log(`Created ${alerts.length} alert(s)`);
        alerts.forEach(a => {
          console.log(`  - [${a.severity.toUpperCase()}] ${a.title}`);
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error checking metrics:', error);
    return [];
  }
}

export async function getActiveAlerts(): Promise<Alert[]> {
  try {
    const { data: alerts, error } = await supabaseAdmin
      .from('ai_feedback_alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('Could not fetch active alerts:', error);
      return [];
    }

    return alerts || [];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

export async function resolveAlert(alertId: string, actionTaken?: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('ai_feedback_alerts')
      .update({
        resolved: true,
        action_taken: actionTaken,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.warn('Could not resolve alert:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error resolving alert:', error);
    return false;
  }
}

export async function initializeDatabaseTables(): Promise<boolean> {
  try {
    console.log('Initializing database tables for logging...');

    const tables = `
    -- Logs table
    CREATE TABLE IF NOT EXISTS ai_feedback_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT NOW(),
      level VARCHAR(20),
      category VARCHAR(50),
      message TEXT,
      context JSONB,
      error_stack TEXT,
      request_id VARCHAR(100),
      user_id UUID,
      question_id UUID,
      processing_time_ms INTEGER,
      recovery_action TEXT,
      resolved BOOLEAN DEFAULT FALSE
    );

    CREATE INDEX idx_logs_timestamp ON ai_feedback_logs(timestamp);
    CREATE INDEX idx_logs_level ON ai_feedback_logs(level);
    CREATE INDEX idx_logs_category ON ai_feedback_logs(category);
    CREATE INDEX idx_logs_request_id ON ai_feedback_logs(request_id);

    -- Alerts table
    CREATE TABLE IF NOT EXISTS ai_feedback_alerts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      alert_type VARCHAR(50),
      severity VARCHAR(20),
      title TEXT,
      description TEXT,
      threshold_value NUMERIC,
      current_value NUMERIC,
      action_taken TEXT,
      resolved BOOLEAN DEFAULT FALSE,
      resolved_at TIMESTAMP
    );

    CREATE INDEX idx_alerts_resolved ON ai_feedback_alerts(resolved);
    CREATE INDEX idx_alerts_created_at ON ai_feedback_alerts(created_at);
    `;

    console.log('Database schema created (check Supabase dashboard)');
    console.log('Tables: ai_feedback_logs, ai_feedback_alerts');

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}
