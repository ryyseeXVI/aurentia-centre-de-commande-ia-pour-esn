"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
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
  const [role, setRole] = React.useState<"OWNER" | "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT" | "">("")
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const router = useRouter()

  // Real-time password validation
  const validatePasswordMatch = React.useCallback(() => {
    if (confirmPassword && password !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
    } else {
      setFieldErrors(prev => {
        const { confirmPassword, ...rest } = prev
        return rest
      })
    }
  }, [password, confirmPassword])

  React.useEffect(() => {
    validatePasswordMatch()
  }, [validatePasswordMatch])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)

    const email = formData.get('email') as string
    const prenom = formData.get('prenom') as string
    const nom = formData.get('nom') as string

    // Client-side validation
    const errors: Record<string, string> = {}

    if (!prenom.trim()) errors.prenom = "First name is required"
    if (!nom.trim()) errors.nom = "Last name is required"
    if (!email.trim()) errors.email = "Email is required"
    if (password.length < 8) errors.password = "Password must be at least 8 characters"
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match"
    if (!role) errors.role = "Please select a role"

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp({
        email,
        password,
        confirmPassword,
        prenom,
        nom,
        role: role as "OWNER" | "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT"
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

        <div className="grid grid-cols-2 gap-3">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="prenom" className="text-sm">First Name</FieldLabel>
            <Input
              id="prenom"
              name="prenom"
              type="text"
              placeholder="John"
              required
              disabled={isLoading}
              autoComplete="given-name"
              className="h-9"
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="nom" className="text-sm">Last Name</FieldLabel>
            <Input
              id="nom"
              name="nom"
              type="text"
              placeholder="Doe"
              required
              disabled={isLoading}
              autoComplete="family-name"
              className="h-9"
            />
          </Field>
        </div>

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
            className={cn("h-9", fieldErrors.password && "border-destructive")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
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
            className={cn("h-9", fieldErrors.confirmPassword && "border-destructive")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
          )}
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="role" className="text-sm">Role</FieldLabel>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as typeof role)}
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
              <SelectItem value="OWNER">Owner (Super Admin)</SelectItem>
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

        <div className="text-center text-xs text-muted-foreground mt-2">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
          >
            Sign in
          </Link>
        </div>
      </FieldGroup>
    </form>
  )
}
