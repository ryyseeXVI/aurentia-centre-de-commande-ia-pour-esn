import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="grid h-svh lg:grid-cols-2">
      <div className="flex flex-col h-full">
        <div className="flex justify-center gap-2 md:justify-start p-4 md:p-6 shrink-0">
          <a href="/" className="group flex items-center gap-2 font-medium hover:opacity-80 transition-all">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md group-hover:scale-110 transition-transform">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Hacktogone
            </span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-6 md:px-10">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block overflow-hidden">
        <img
          src="/auth-image.jpeg"
          alt="Hacktogone Event"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-chart-3/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      </div>
    </div>
  )
}
