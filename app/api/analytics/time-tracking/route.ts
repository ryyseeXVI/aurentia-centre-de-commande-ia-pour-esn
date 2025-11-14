// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Fetch time entries with project and consultant info
    const { data: timeEntries, error } = await supabase
      .from('temps_passe')
      .select(`
        id,
        date,
        heures_travaillees,
        validation_statut,
        consultant(id, nom, prenom, email),
        projet(id, nom, organization_id, organizations(name))
      `)
      .order('date', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Error fetching time entries:', error)
      return errorResponse('Failed to fetch time entries')
    }

    // Group by project
    const hoursByProject: Record<string, { name: string; hours: number; orgName: string }> = {}
    timeEntries?.forEach((entry: any) => {
      const projectId = entry.projet?.id
      if (projectId) {
        if (!hoursByProject[projectId]) {
          hoursByProject[projectId] = {
            name: entry.projet.nom,
            hours: 0,
            orgName: entry.projet.organizations?.name || 'Unknown',
          }
        }
        hoursByProject[projectId].hours += parseFloat(entry.heures_travaillees as string) || 0
      }
    })

    // Group by consultant
    const hoursByConsultant: Record<string, { name: string; hours: number; email: string }> = {}
    timeEntries?.forEach((entry: any) => {
      const consultantId = entry.consultant?.id
      if (consultantId) {
        if (!hoursByConsultant[consultantId]) {
          hoursByConsultant[consultantId] = {
            name: `${entry.consultant.prenom} ${entry.consultant.nom}`,
            hours: 0,
            email: entry.consultant.email,
          }
        }
        hoursByConsultant[consultantId].hours += parseFloat(entry.heures_travaillees as string) || 0
      }
    })

    // Group by month
    const hoursByMonth: Record<string, number> = {}
    timeEntries?.forEach((entry: any) => {
      const date = new Date(entry.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!hoursByMonth[monthKey]) {
        hoursByMonth[monthKey] = 0
      }
      hoursByMonth[monthKey] += parseFloat(entry.heures_travaillees as string) || 0
    })

    // Calculate total hours
    const totalHours = timeEntries?.reduce((sum: number, entry: any) => {
      return sum + (parseFloat(entry.heures_travaillees as string) || 0)
    }, 0) || 0

    return successResponse({
      totalHours: Math.round(totalHours * 10) / 10,
      hoursByProject: Object.entries(hoursByProject).map(([id, data]) => ({
        projectId: id,
        projectName: data.name,
        organizationName: data.orgName,
        hours: Math.round(data.hours * 10) / 10,
      })),
      hoursByConsultant: Object.entries(hoursByConsultant).map(([id, data]) => ({
        consultantId: id,
        consultantName: data.name,
        email: data.email,
        hours: Math.round(data.hours * 10) / 10,
      })),
      hoursByMonth: Object.entries(hoursByMonth)
        .sort()
        .map(([month, hours]) => ({
          month,
          hours: Math.round(hours * 10) / 10,
        })),
    })
  } catch (error) {
    console.error('Unexpected error in time-tracking analytics:', error)
    return errorResponse('Internal server error')
  }
}
