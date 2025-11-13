/**
 * React Error Boundary Component
 *
 * @fileoverview Global error boundary that catches and handles React errors
 * in the component tree. Provides a fallback UI when errors occur and
 * prevents the entire app from crashing.
 *
 * @module components/error-boundary
 *
 * @see {@link https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary|React Error Boundaries}
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean
  /** The caught error object */
  error: Error | null
  /** Error info including component stack */
  errorInfo: React.ErrorInfo | null
}

/**
 * Error boundary props interface
 */
interface ErrorBoundaryProps {
  /** Child components to protect with error boundary */
  children: React.ReactNode
  /** Optional custom fallback UI component */
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application.
 *
 * @class
 * @extends {React.Component<ErrorBoundaryProps, ErrorBoundaryState>}
 *
 * @example
 * ```typescript
 * // Wrap your app or specific components
 * import { ErrorBoundary } from '@/components/error-boundary'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ErrorBoundary>
 *           {children}
 *         </ErrorBoundary>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom fallback
 * function CustomFallback({ error, reset }) {
 *   return (
 *     <div>
 *       <h1>Oops! Something went wrong</h1>
 *       <p>{error.message}</p>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )
 * }
 *
 * <ErrorBoundary fallback={CustomFallback}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @remarks
 * **What Error Boundaries Catch:**
 * - Errors during rendering
 * - Errors in lifecycle methods
 * - Errors in constructors of child components
 *
 * **What Error Boundaries DO NOT Catch:**
 * - Event handlers (use try-catch instead)
 * - Asynchronous code (setTimeout, promises)
 * - Server-side rendering errors
 * - Errors in the error boundary itself
 *
 * **Production vs Development:**
 * - In development: Shows detailed error info and stack trace
 * - In production: Shows user-friendly message only
 * - Errors are logged to console for debugging
 *
 * @security
 * ✅ SECURE:
 * - Does not expose sensitive error details in production
 * - Prevents app crashes from poor user experience
 * - Logs errors for monitoring and debugging
 *
 * @todo Integrate with error tracking service (e.g., Sentry)
 * @todo Add error reporting to backend logs
 * @todo Customize fallback UI based on error type
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Update state when an error is caught
   *
   * This lifecycle method is called after an error has been thrown by a
   * descendant component. It receives the error that was thrown and should
   * return a value to update state.
   *
   * @param error - The error that was thrown
   * @returns Updated state object
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Log error information after component catches an error
   *
   * This lifecycle method is called after an error has been caught.
   * It's used for logging error information to an error reporting service.
   *
   * @param error - The error that was thrown
   * @param errorInfo - Object with componentStack key containing information about component stack
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging and monitoring
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // TODO: Send error to error tracking service (e.g., Sentry)
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
  }

  /**
   * Reset error boundary state
   *
   * Allows users to try recovering from the error by resetting
   * the error boundary state and attempting to re-render.
   */
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback: FallbackComponent } = this.props

    // If error was caught, render fallback UI
    if (hasError && error) {
      // Use custom fallback component if provided
      if (FallbackComponent) {
        return <FallbackComponent error={error} reset={this.resetErrorBoundary} />
      }

      // Default fallback UI
      return <DefaultErrorFallback error={error} reset={this.resetErrorBoundary} />
    }

    // Normally, render children
    return children
  }
}

/**
 * Default Error Fallback UI Component
 *
 * Provides a user-friendly error message with options to:
 * - Try again (reset error boundary)
 * - Go back to home page
 * - View error details (development only)
 *
 * @param props - Component props
 * @param props.error - The caught error
 * @param props.reset - Function to reset the error boundary
 */
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-destructive/50 bg-card p-6 text-center shadow-lg">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        {/* Error Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Oops! Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <div className="rounded-md bg-destructive/10 p-4 text-left">
            <p className="text-xs font-mono text-destructive break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="w-full sm:w-auto"
          >
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Go to Home
          </Button>
        </div>

        {/* Support Message */}
        <p className="text-xs text-muted-foreground">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  )
}

/**
 * Hook-based Error Boundary (Simpler Alternative)
 *
 * For Next.js 15+ App Router, you can use this hook with error.tsx files
 *
 * @example
 * ```typescript
 * // app/error.tsx
 * 'use client'
 *
 * export default function Error({ error, reset }: {
 *   error: Error & { digest?: string }
 *   reset: () => void
 * }) {
 *   return <DefaultErrorFallback error={error} reset={reset} />
 * }
 * ```
 */
export { DefaultErrorFallback }
