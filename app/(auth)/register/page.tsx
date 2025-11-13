import { GalleryVerticalEnd } from "lucide-react"
import { RegisterForm } from "@/components/auth/register-form"

export default function SignupPage() {
  return (
    <div className="grid h-svh lg:grid-cols-2">
      <div className="flex flex-col h-full">
        <div className="flex justify-center gap-2 md:justify-start p-4 md:p-6 shrink-0">
          <a href="/" className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Hacktogone
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-6 md:px-10">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/auth-image.jpeg"
          alt="Hacktogone Event"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
