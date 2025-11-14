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

    // Fetch invoices with project and organization info
    const { data: invoices, error: invoicesError } = await supabase
      .from('facture')
      .select(`
        id,
        montant,
        date_facturation,
        statut_paiement,
        projet(
          id,
          nom,
          organization_id,
          organizations(name)
        )
      `)
      .order('date_facturation', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return errorResponse('Failed to fetch invoices')
    }

    // Group revenue by client
    const revenueByClient: Record<string, { name: string; revenue: number }> = {}
    invoices?.forEach((invoice: any) => {
      const orgId = invoice.projet?.organization_id
      const orgName = invoice.projet?.organizations?.name
      if (orgId && orgName) {
        if (!revenueByClient[orgId]) {
          revenueByClient[orgId] = { name: orgName, revenue: 0 }
        }
        if (invoice.statut_paiement === 'PAYEE') {
          revenueByClient[orgId].revenue += parseFloat(invoice.montant as string) || 0
        }
      }
    })

    // Group revenue by project
    const revenueByProject: Record<string, { name: string; revenue: number; orgName: string }> = {}
    invoices?.forEach((invoice: any) => {
      const projectId = invoice.projet?.id
      if (projectId) {
        if (!revenueByProject[projectId]) {
          revenueByProject[projectId] = {
            name: invoice.projet.nom,
            revenue: 0,
            orgName: invoice.projet?.organizations?.name || 'Unknown',
          }
        }
        if (invoice.statut_paiement === 'PAYEE') {
          revenueByProject[projectId].revenue += parseFloat(invoice.montant as string) || 0
        }
      }
    })

    // Fetch project budgets
    const { data: budgets } = await supabase
      .from('budget_projet')
      .select(`
        projet_id,
        montant_total_vente,
        cout_estime_total,
        marge_cible_pct,
        projet(nom, organization_id, organizations(name))
      `)

    // Calculate budget vs actual by project
    const budgetVsActual = budgets?.map((budget: any) => {
      const projectRevenue = revenueByProject[budget.projet_id]?.revenue || 0
      const budgetedRevenue = parseFloat(budget.montant_total_vente as string) || 0
      const estimatedCost = parseFloat(budget.cout_estime_total as string) || 0
      const targetMargin = parseFloat(budget.marge_cible_pct as string) || 0

      return {
        projectId: budget.projet_id,
        projectName: budget.projet?.nom,
        organizationName: budget.projet?.organizations?.name,
        budgetedRevenue: Math.round(budgetedRevenue),
        actualRevenue: Math.round(projectRevenue),
        estimatedCost: Math.round(estimatedCost),
        targetMargin,
        variance: Math.round(projectRevenue - budgetedRevenue),
      }
    })

    // Calculate invoice status summary
    const invoiceStatus = {
      paid: 0,
      pending: 0,
      overdue: 0,
    }

    invoices?.forEach((invoice: any) => {
      if (invoice.statut_paiement === 'PAYEE') {
        invoiceStatus.paid++
      } else if (invoice.statut_paiement === 'EN_ATTENTE') {
        invoiceStatus.pending++
      } else if (invoice.statut_paiement === 'EN_RETARD') {
        invoiceStatus.overdue++
      }
    })

    return successResponse({
      revenueByClient: Object.entries(revenueByClient).map(([id, data]) => ({
        organizationId: id,
        organizationName: data.name,
        revenue: Math.round(data.revenue),
      })),
      revenueByProject: Object.entries(revenueByProject).map(([id, data]) => ({
        projectId: id,
        projectName: data.name,
        organizationName: data.orgName,
        revenue: Math.round(data.revenue),
      })),
      budgetVsActual,
      invoiceStatus,
    })
  } catch (error) {
    console.error('Unexpected error in financial analytics:', error)
    return errorResponse('Internal server error')
  }
}
