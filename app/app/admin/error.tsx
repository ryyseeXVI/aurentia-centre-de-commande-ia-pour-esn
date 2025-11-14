'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin page error:', error)
  }, [error])

  return (
    <div className="flex flex-col gap-6 p-6">
      <Button variant="ghost" asChild className="w-fit">
        <Link href="/app">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Failed to load admin panel</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              We encountered an error loading the admin panel. Please verify your permissions and try again.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-destructive/10 p-4 text-left w-full max-w-md">
              <p className="text-xs font-mono text-destructive break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={reset} variant="default">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/app">Back to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
