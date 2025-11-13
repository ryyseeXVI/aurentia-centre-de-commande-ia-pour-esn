"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { signUp } from "@/app/(auth)/actions"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [role, setRole] = React.useState<"ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT" | "">("")
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm-password') as string
    const name = formData.get('name') as string

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!role) {
      setError("Please select a role")
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp({
        email,
        password,
        confirmPassword,
        name,
        role
      })
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
          <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
          <p className="text-muted-foreground text-xs text-balance">
            Fill in the form below to create your account
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 py-2">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <Field className="gap-1.5">
          <FieldLabel htmlFor="name" className="text-sm">Full Name</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            disabled={isLoading}
            autoComplete="name"
            className="h-9"
          />
        </Field>

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
            className="h-9"
          />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="password" className="text-sm">Password (min 8 characters)</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
            autoComplete="new-password"
            minLength={8}
            className="h-9"
          />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="confirm-password" className="text-sm">Confirm Password</FieldLabel>
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            disabled={isLoading}
            autoComplete="new-password"
            minLength={8}
            className="h-9"
          />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="role" className="text-sm">Role</FieldLabel>
          <Select
            value={role}
            onValueChange={setRole}
            disabled={isLoading}
            required
          >
            <SelectTrigger
              id="role"
              className="w-full h-9"
              aria-label="Select your role"
              size="sm"
            >
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONSULTANT">Consultant</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="CLIENT">Client</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
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
                Creating...
              </>
            ) : (
              "Create Account"
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
            Sign up with Google
          </Button>
          <FieldDescription className="text-center text-xs">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
