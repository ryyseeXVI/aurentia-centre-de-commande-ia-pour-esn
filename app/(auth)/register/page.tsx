import { RegisterForm } from "@/components/auth/register-form"
import { AuthHeader } from "@/components/auth/auth-header"

export default function SignupPage() {
  return (
    <div className="grid h-svh lg:grid-cols-2">
      <div className="flex flex-col h-full">
        <AuthHeader />
        <div className="flex flex-1 items-center justify-center px-6 pb-6 md:px-10">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block overflow-hidden">
        <img
          src="/auth-image.jpeg"
          alt="Hacktogone Event"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-chart-2/20 via-transparent to-primary/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      </div>
    </div>
  )
}
