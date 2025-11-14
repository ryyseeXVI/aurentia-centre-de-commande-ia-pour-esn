// @ts-nocheck
// @ts-nocheck
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateProjectForm } from './create-project-form'

export const metadata = {
  title: 'Create New Project',
  description: 'Create a new project in your organization',
}

export default async function NewProjectPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/sign-in')
  }

  // Get user's organization
  const { data: userOrg, error: orgError } = await supabase
    .from('user_organizations')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (orgError || !userOrg) {
    redirect('/app')
  }

  // Check permissions
  if ((userOrg as any).role !== 'ADMIN' && (userOrg as any).role !== 'MANAGER') {
    redirect('/app/projects')
  }

  // Fetch clients for the dropdown
  const { data: clients, error: clientsError } = await supabase
    .from('client')
    .select('id, nom, contact_principal')
    .eq('organization_id', userOrg.organization_id)
    .order('nom')

  if (clientsError) {
    console.error('Error fetching clients:', clientsError)
  }

  // Fetch potential project managers (users with appropriate roles)
  const { data: managers, error: managersError } = await supabase
    .from('user_organizations')
    .select(`
      user_id,
      role,
      profiles:user_id (
        id,
        nom,
        prenom,
        email
      )
    `)
    .eq('organization_id', userOrg.organization_id)
    .in('role', ['ADMIN', 'MANAGER', 'CONSULTANT'])

  if (managersError) {
    console.error('Error fetching managers:', managersError)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground mt-2">
          Add a new project to your organization
        </p>
      </div>

      <CreateProjectForm
        clients={clients || []}
        managers={managers || []}
      />
    </div>
  )
}
