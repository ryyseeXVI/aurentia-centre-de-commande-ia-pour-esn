"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { signIn } from "@/app/(auth)/actions"
import Link from "next/link"
import { AlertCircle, CheckCircle } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const verificationError = searchParams.get('error')
  const verified = searchParams.get('verified')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn({ email, password })
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
      // If successful, the action will redirect
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <FieldGroup className="gap-3">
        <div className="flex flex-col items-center gap-1 text-center mb-1">
          <h1 className="text-xl font-bold tracking-tight">Login to your account</h1>
          <p className="text-muted-foreground text-xs text-balance">
            Enter your email below to login to your account
          </p>
        </div>

        {verified === 'true' && !error && (
          <Alert className="animate-in fade-in-50 slide-in-from-top-2 py-2 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-xs text-green-800 dark:text-green-200">
              Email verified successfully! You can now log in.
            </AlertDescription>
          </Alert>
        )}

        {verificationError && !error && (
          <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 py-2">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">
              Email verification failed. Please try again or contact support.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 py-2">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <Field className="gap-1.5">
          <FieldLabel htmlFor="email" className="text-sm">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            disabled={isLoading}
            autoComplete="email"
            autoFocus
            className="h-9"
          />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="password" className="text-sm">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
            autoComplete="current-password"
            className="h-9"
          />
        </Field>

        <Field className="gap-2 mt-1">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full transition-all h-9"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </Field>

        <div className="text-center text-xs text-muted-foreground mt-2">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
          >
            Sign up
          </Link>
        </div>
      </FieldGroup>
    </form>
  )
}
