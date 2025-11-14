import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { WorkflowList } from './workflow-list'

export const metadata: Metadata = {
  title: 'Workflows - Documentation',
  description: 'Gérez la documentation de vos workflows automatisés'
}

export default async function WorkflowsPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Vous devez être connecté pour voir cette page.
        </p>
      </div>
    )
  }

  // Get user's organization
  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!userOrg) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Aucune organisation trouvée pour votre compte.
        </p>
      </div>
    )
  }

  const typedUserOrg = userOrg as unknown as { organization_id: string; role: string }

  // Fetch workflows with counts
  const { data: workflows } = await supabase
    .from('v_workflow_overview')
    .select('*')
    .eq('organization_id', typedUserOrg.organization_id)
    .order('workflow_code', { ascending: true })

  const isReadOnly = !['ADMIN', 'MANAGER'].includes(typedUserOrg.role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Documentation des Workflows
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez et documentez vos workflows automatisés avec des sticky notes
          interactifs
        </p>
      </div>

      <WorkflowList
        workflows={(workflows || []) as any}
        readonly={isReadOnly}
        canCreate={!isReadOnly}
      />
    </div>
  )
}
