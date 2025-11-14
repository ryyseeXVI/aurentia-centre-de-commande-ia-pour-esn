import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Fetch consultants with their assignments and time tracking
    const { data: consultants, error } = await supabase
      .from('consultant')
      .select(`
        id,
        nom,
        prenom,
        email,
        statut,
        role,
        affectation(
          id,
          date_debut,
          date_fin_prevue,
          charge_allouee_pct,
          projet(id, nom)
        ),
        consultant_competence(
          niveau,
          competence(nom)
        )
      `)
      .eq('statut', 'ACTIF')

    if (error) {
      console.error('Error fetching consultants:', error)
      return errorResponse('Failed to fetch consultants')
    }

    // Fetch time entries for utilization calculation
    const { data: timeEntries } = await supabase
      .from('temps_passe')
      .select('consultant_id, heures_travaillees, date')
      .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]) // Last 3 months

    // Calculate utilization per consultant
    const utilizationByConsultant: Record<string, { hours: number; name: string }> = {}
    timeEntries?.forEach((entry: any) => {
      const consultantId = entry.consultant_id
      if (!utilizationByConsultant[consultantId]) {
        utilizationByConsultant[consultantId] = { hours: 0, name: '' }
      }
      utilizationByConsultant[consultantId].hours += parseFloat(entry.heures_travaillees as string) || 0
    })

    // Enrich consultant data with utilization
    const teamPerformance = consultants?.map((consultant: any) => {
      const consultantId = consultant.id
      const hoursLogged = utilizationByConsultant[consultantId]?.hours || 0

      // Assuming 22 working days per month, 8 hours per day, 3 months
      const availableHours = 22 * 8 * 3
      const utilizationRate = (hoursLogged / availableHours) * 100

      // Get active projects
      const activeProjects = consultant.affectation?.filter((a: any) =>
        !a.date_fin_prevue || new Date(a.date_fin_prevue) > new Date()
      ).length || 0

      // Get skills
      const skills = consultant.consultant_competence?.map((cc: any) => ({
        name: cc.competence?.nom,
        level: cc.niveau,
      })) || []

      return {
        consultantId,
        name: `${consultant.prenom} ${consultant.nom}`,
        email: consultant.email,
        role: consultant.role,
        activeProjects,
        hoursLogged: Math.round(hoursLogged * 10) / 10,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        skills,
      }
    })

    // Skills coverage matrix
    const skillsCoverage: Record<string, { count: number; avgLevel: number }> = {}
    consultants?.forEach((consultant: any) => {
      consultant.consultant_competence?.forEach((cc: any) => {
        const skillName = cc.competence?.nom
        if (skillName) {
          if (!skillsCoverage[skillName]) {
            skillsCoverage[skillName] = { count: 0, avgLevel: 0 }
          }
          skillsCoverage[skillName].count++
          skillsCoverage[skillName].avgLevel += cc.niveau || 0
        }
      })
    })

    // Calculate average levels
    Object.keys(skillsCoverage).forEach((skill) => {
      skillsCoverage[skill].avgLevel = skillsCoverage[skill].avgLevel / skillsCoverage[skill].count
    })

    return successResponse({
      teamPerformance,
      skillsCoverage: Object.entries(skillsCoverage).map(([name, data]) => ({
        skillName: name,
        consultantCount: data.count,
        averageLevel: Math.round(data.avgLevel * 10) / 10,
      })),
    })
  } catch (error) {
    console.error('Unexpected error in team analytics:', error)
    return errorResponse('Internal server error')
  }
}
