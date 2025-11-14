import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

/**
 * GET /api/projects/[projectId]/stats
 * Get project statistics (tasks, team members, hours logged)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    const { projectId } = await params

    // Count total tasks
    const { count: totalTasks } = await supabase
      .from('tache')
      .select('*', { count: 'exact', head: true })
      .eq('projet_id', projectId)

    // Count completed tasks
    const { count: completedTasks } = await supabase
      .from('tache')
      .select('*', { count: 'exact', head: true })
      .eq('projet_id', projectId)
      .eq('statut', 'DONE')

    // Count team members (affectations)
    const { count: teamMembers } = await supabase
      .from('affectation')
      .select('*', { count: 'exact', head: true })
      .eq('projet_id', projectId)

    // Sum hours logged for this project
    const { data: timeEntries } = await supabase
      .from('temps_passe')
      .select('heures_travaillees')
      .eq('projet_id', projectId)

    const hoursLogged = timeEntries?.reduce((sum: number, entry: any) => {
      return sum + (parseFloat(entry.heures_travaillees as string) || 0)
    }, 0) || 0

    // Get project details for additional stats
    const { data: project } = await supabase
      .from('projet')
      .select('statut, date_debut, date_fin_prevue')
      .eq('id', projectId)
      .single()

    return successResponse({
      stats: {
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        teamMembers: teamMembers || 0,
        hoursLogged: Math.round(hoursLogged * 10) / 10,
        status: project?.statut || 'UNKNOWN',
        startDate: project?.date_debut,
        expectedEndDate: project?.date_fin_prevue,
      },
    })
  } catch (error) {
    console.error('Unexpected error in project stats:', error)
    return errorResponse('Internal server error')
  }
}
