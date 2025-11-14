/**
 * Application Logger
 *
 * Centralized logging utility that:
 * - Prevents console.log in production
 * - Provides structured logging
 * - Can be easily integrated with external services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMetadata {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  /**
   * Log debug information (development only)
   */
  debug(message: string, metadata?: LogMetadata) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, metadata || '')
    }
  }

  /**
   * Log general information
   */
  info(message: string, metadata?: LogMetadata) {
    if (this.isDevelopment || this.isTest) {
      console.log(`[INFO] ${message}`, metadata || '')
    }
    // In production, send to logging service
    // this.sendToLoggingService('info', message, metadata)
  }

  /**
   * Log warnings
   */
  warn(message: string, metadata?: LogMetadata) {
    if (this.isDevelopment || this.isTest) {
      console.warn(`[WARN] ${message}`, metadata || '')
    }
    // In production, send to logging service
    // this.sendToLoggingService('warn', message, metadata)
  }

  /**
   * Log errors (always logged)
   */
  error(message: string, error?: Error | unknown, metadata?: LogMetadata) {
    const errorInfo = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error

    if (this.isDevelopment || this.isTest) {
      console.error(`[ERROR] ${message}`, errorInfo, metadata || '')
    }

    // In production, send to error tracking service
    // this.sendToErrorTracking(message, errorInfo, metadata)
  }

  /**
   * Log API requests (useful for debugging)
   */
  apiRequest(method: string, path: string, metadata?: LogMetadata) {
    this.debug(`API ${method} ${path}`, metadata)
  }

  /**
   * Log API responses
   */
  apiResponse(method: string, path: string, status: number, metadata?: LogMetadata) {
    const level = status >= 400 ? 'warn' : 'debug'
    this[level](`API ${method} ${path} - ${status}`, metadata)
  }

  /**
   * Log database queries (development only)
   */
  dbQuery(query: string, metadata?: LogMetadata) {
    this.debug(`DB Query: ${query}`, metadata)
  }

  /**
   * Log authentication events
   */
  auth(event: string, metadata?: LogMetadata) {
    this.info(`Auth: ${event}`, metadata)
  }

  /**
   * Send to external logging service (implement when needed)
   */
  private sendToLoggingService(level: LogLevel, message: string, metadata?: LogMetadata) {
    // TODO: Integrate with logging service (e.g., LogRocket, Datadog)
    // Example:
    // if (process.env.NODE_ENV === 'production') {
    //   logService.log(level, message, metadata)
    // }
  }

  /**
   * Send to error tracking service (implement when needed)
   */
  private sendToErrorTracking(message: string, error: any, metadata?: LogMetadata) {
    // TODO: Integrate with error tracking (e.g., Sentry)
    // Example:
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, {
    //     tags: { message },
    //     extra: metadata
    //   })
    // }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for use in other files
export type { LogLevel, LogMetadata }
