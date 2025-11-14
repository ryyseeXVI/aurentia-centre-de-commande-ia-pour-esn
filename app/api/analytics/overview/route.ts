import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Get user's organizations
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)

    if (membershipsError) {
      console.error('Error fetching user organizations:', membershipsError)
      return errorResponse('Failed to fetch user organizations')
    }

    if (!memberships || memberships.length === 0) {
      // User has no organizations, return zeros
      return successResponse({
        stats: {
          totalRevenue: 0,
          paidRevenue: 0,
          totalCosts: 0,
          margin: 0,
          hoursWorked: 0,
          activeConsultants: 0,
          projectsAtRisk: 0,
        },
      })
    }

    const organizationIds = memberships.map(m => m.organization_id)

    // Fetch invoices to calculate revenue (filtered by user's organizations)
    const { data: invoices, error: invoicesError } = await supabase
      .from('facture')
      .select('montant, statut_paiement, organization_id')
      .in('organization_id', organizationIds)

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    }

    const totalRevenue = invoices?.reduce((sum: number, inv: any) => {
      return sum + (parseFloat(inv.montant as string) || 0)
    }, 0) || 0

    const paidRevenue = invoices?.reduce((sum: number, inv: any) => {
      if (inv.statut_paiement === 'PAYEE') {
        return sum + (parseFloat(inv.montant as string) || 0)
      }
      return sum
    }, 0) || 0

    // Fetch time entries to calculate costs (filtered by user's organizations)
    const { data: timeEntries, error: timeEntriesError } = await supabase
      .from('temps_passe')
      .select(`
        heures_travaillees,
        organization_id,
        profiles!temps_passe_profile_id_fkey (
          consultant_details (
            taux_journalier_cout
          )
        )
      `)
      .in('organization_id', organizationIds)

    if (timeEntriesError) {
      console.error('Error fetching time entries:', timeEntriesError)
    }

    const totalCosts = timeEntries?.reduce((sum: number, entry: any) => {
      const hours = parseFloat(entry.heures_travaillees as string) || 0
      const dailyRate = parseFloat(entry.profiles?.consultant_details?.taux_journalier_cout as string) || 0
      const hourlyRate = dailyRate / 8 // Assume 8-hour work day
      return sum + (hours * hourlyRate)
    }, 0) || 0

    // Calculate margin
    const margin = paidRevenue > 0 ? ((paidRevenue - totalCosts) / paidRevenue) * 100 : 0

    // Count hours worked
    const hoursWorked = timeEntries?.reduce((sum: number, entry: any) => {
      return sum + (parseFloat(entry.heures_travaillees as string) || 0)
    }, 0) || 0

    // Count active consultants (filtered by user's organizations)
    const { count: activeConsultants, error: consultantsError } = await supabase
      .from('consultant_details')
      .select('*', { count: 'exact', head: true })
      .in('statut', ['AVAILABLE', 'ON_MISSION'])
      .in('organization_id', organizationIds)

    if (consultantsError) {
      console.error('Error fetching consultants:', consultantsError)
    }

    // Count projects at risk (health score < 60, filtered by user's organizations)
    const { count: projectsAtRisk, error: projectsAtRiskError } = await supabase
      .from('score_sante_projet')
      .select('*', { count: 'exact', head: true })
      .lt('score_global', 60)
      .in('organization_id', organizationIds)

    if (projectsAtRiskError) {
      console.error('Error fetching projects at risk:', projectsAtRiskError)
    }

    return successResponse({
      stats: {
        totalRevenue: Math.round(totalRevenue),
        paidRevenue: Math.round(paidRevenue),
        totalCosts: Math.round(totalCosts),
        margin: Math.round(margin * 10) / 10,
        hoursWorked: Math.round(hoursWorked * 10) / 10,
        activeConsultants: activeConsultants || 0,
        projectsAtRisk: projectsAtRisk || 0,
      },
    })
  } catch (error) {
    console.error('Unexpected error in analytics overview:', error)
    return errorResponse('Internal server error')
  }
}
