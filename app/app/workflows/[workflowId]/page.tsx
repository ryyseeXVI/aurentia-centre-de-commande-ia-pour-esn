import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkflowDocumentationView } from './workflow-documentation-view'

interface WorkflowPageProps {
  params: {
    workflowId: string
  }
}

export async function generateMetadata({ params }: WorkflowPageProps): Promise<Metadata> {
  const supabase = await createClient()

  const { data: workflow } = await supabase
    .from('workflow_documentation')
    .select('workflow_name, workflow_code')
    .eq('id', params.workflowId)
    .single()

  if (!workflow) {
    return {
      title: 'Workflow introuvable'
    }
  }

  const typedWorkflow = workflow as unknown as { workflow_code: string; workflow_name: string }

  return {
    title: `${typedWorkflow.workflow_code} - ${typedWorkflow.workflow_name}`,
    description: `Documentation pour le workflow ${typedWorkflow.workflow_name}`
  }
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Get user's organization
  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!userOrg) {
    notFound()
  }

  const typedUserOrg = userOrg as unknown as { organization_id: string; role: string }

  // Fetch workflow with all relations
  const [
    { data: workflow, error: workflowError },
    { data: stickyNotes },
    { data: dataFlows },
    { data: dependencies },
    { data: steps }
  ] = await Promise.all([
    supabase
      .from('workflow_documentation')
      .select('*')
      .eq('id', params.workflowId)
      .eq('organization_id', typedUserOrg.organization_id)
      .single(),
    supabase
      .from('workflow_sticky_note')
      .select('*')
      .eq('workflow_id', params.workflowId)
      .eq('is_archived', false)
      .order('display_order', { ascending: true }),
    supabase
      .from('workflow_data_flow')
      .select('*')
      .eq('workflow_id', params.workflowId),
    supabase
      .from('workflow_dependency')
      .select(
        '*, depends_on:workflow_documentation!depends_on_workflow_id(workflow_code, workflow_name, status)'
      )
      .eq('workflow_id', params.workflowId),
    supabase
      .from('workflow_step')
      .select('*')
      .eq('workflow_id', params.workflowId)
      .order('step_number', { ascending: true })
  ])

  if (workflowError || !workflow) {
    notFound()
  }

  const workflowWithRelations = {
    ...(workflow as unknown as Record<string, unknown>),
    sticky_notes: stickyNotes || [],
    data_flows: dataFlows || [],
    dependencies: dependencies || [],
    steps: steps || []
  }

  const isReadOnly = !['ADMIN', 'MANAGER'].includes(typedUserOrg.role)

  return (
    <WorkflowDocumentationView
      workflow={workflowWithRelations as any}
      readonly={isReadOnly}
    />
  )
}
