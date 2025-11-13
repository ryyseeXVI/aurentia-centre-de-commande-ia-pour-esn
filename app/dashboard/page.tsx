import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/types'
import { signOut } from '@/app/(auth)/actions'

export default async function DashboardPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/register')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Welcome back, {user.email}!
          </p>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-2xl font-semibold">User Information</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">User ID:</span> {user.id}
            </div>
            <div>
              <span className="font-medium">Created at:</span>{' '}
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
