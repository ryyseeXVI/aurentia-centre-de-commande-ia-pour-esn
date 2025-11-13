"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
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

        <FieldSeparator className="my-2">Or continue with</FieldSeparator>

        <Field className="gap-2">
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            className="w-full transition-all h-9"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Login with Google
          </Button>
          <FieldDescription className="text-center text-xs">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
