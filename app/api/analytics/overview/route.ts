import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Fetch invoices to calculate revenue
    const { data: invoices } = await supabase
      .from('facture')
      .select('montant, statut_paiement')

    const totalRevenue = invoices?.reduce((sum: number, inv: any) => {
      return sum + (parseFloat(inv.montant as string) || 0)
    }, 0) || 0

    const paidRevenue = invoices?.reduce((sum: number, inv: any) => {
      if (inv.statut_paiement === 'PAYEE') {
        return sum + (parseFloat(inv.montant as string) || 0)
      }
      return sum
    }, 0) || 0

    // Fetch time entries to calculate costs
    const { data: timeEntries } = await supabase
      .from('temps_passe')
      .select(`
        heures_travaillees,
        consultant(taux_journalier_cout)
      `)

    const totalCosts = timeEntries?.reduce((sum: number, entry: any) => {
      const hours = parseFloat(entry.heures_travaillees as string) || 0
      const dailyRate = parseFloat(entry.consultant?.taux_journalier_cout as string) || 0
      const hourlyRate = dailyRate / 8 // Assume 8-hour work day
      return sum + (hours * hourlyRate)
    }, 0) || 0

    // Calculate margin
    const margin = paidRevenue > 0 ? ((paidRevenue - totalCosts) / paidRevenue) * 100 : 0

    // Count hours worked
    const hoursWorked = timeEntries?.reduce((sum: number, entry: any) => {
      return sum + (parseFloat(entry.heures_travaillees as string) || 0)
    }, 0) || 0

    // Count active consultants
    const { count: activeConsultants } = await supabase
      .from('consultant')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'ACTIF')

    // Count projects at risk (health score < 60)
    const { count: projectsAtRisk } = await supabase
      .from('score_sante_projet')
      .select('*', { count: 'exact', head: true })
      .lt('score_global', 60)

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
