'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartBarInteractive } from '@/components/graphviz/bar-chart-interactive'
import { ChartPieLabel } from '@/components/graphviz/pie-chart-label'
import { ChartConfig } from '@/components/ui/chart'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FinancialData {
  revenueByClient: Array<{
    organizationId: string
    organizationName: string
    revenue: number
  }>
  revenueByProject: Array<{
    projectId: string
    projectName: string
    organizationName: string
    revenue: number
  }>
  budgetVsActual: Array<{
    projectId: string
    projectName: string
    organizationName: string
    budgetedRevenue: number
    actualRevenue: number
    estimatedCost: number
    targetMargin: number
    variance: number
  }>
  invoiceStatus: {
    paid: number
    pending: number
    overdue: number
  }
}

export function FinancialAnalyticsTab() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/analytics/financial')
      if (!response.ok) {
        throw new Error('Failed to fetch financial analytics')
      }
      const result = await response.json()
      setData(result.data || result) // Extract data property from successResponse wrapper
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Failed to load financial analytics'}</AlertDescription>
      </Alert>
    )
  }

  // Prepare invoice status pie chart data
  const invoiceStatusData = [
    { name: 'Paid', value: data.invoiceStatus.paid, fill: 'var(--chart-1)' },
    { name: 'Pending', value: data.invoiceStatus.pending, fill: 'var(--chart-2)' },
    { name: 'Overdue', value: data.invoiceStatus.overdue, fill: 'var(--chart-3)' },
  ].filter(item => item.value > 0)

  const invoiceStatusConfig: ChartConfig = {
    paid: { label: 'Paid', color: 'var(--chart-1)' },
    pending: { label: 'Pending', color: 'var(--chart-2)' },
    overdue: { label: 'Overdue', color: 'var(--chart-3)' },
  }

  // Calculate total revenue
  const totalRevenue = data.revenueByClient.reduce((sum, item) => sum + item.revenue, 0)
  const totalBudgetVariance = data.budgetVsActual.reduce((sum, item) => sum + item.variance, 0)

  // Top clients by revenue
  const topClients = [...data.revenueByClient]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Top projects by revenue
  const topProjects = [...data.revenueByProject]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Projects with significant budget variance
  const budgetConcerns = data.budgetVsActual
    .filter(item => Math.abs(item.variance) > item.budgetedRevenue * 0.1) // >10% variance
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Paid)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {data.revenueByClient.length} organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
            {totalBudgetVariance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBudgetVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalBudgetVariance >= 0 ? '+' : ''}€{totalBudgetVariance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {data.budgetVsActual.length} projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.invoiceStatus.paid + data.invoiceStatus.pending + data.invoiceStatus.overdue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.invoiceStatus.overdue > 0 && (
                <span className="text-red-600">{data.invoiceStatus.overdue} overdue</span>
              )}
              {data.invoiceStatus.overdue === 0 && 'All invoices on track'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Client */}
        {topClients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Organization</CardTitle>
              <CardDescription>Top {topClients.length} organizations by paid revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map(client => {
                  const percentage = totalRevenue > 0 ? (client.revenue / totalRevenue) * 100 : 0
                  return (
                    <div key={client.organizationId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[200px]" title={client.organizationName}>
                          {client.organizationName}
                        </span>
                        <span className="text-muted-foreground">€{client.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Status Pie Chart */}
        {invoiceStatusData.length > 0 && (
          <ChartPieLabel
            data={invoiceStatusData}
            title="Invoice Status Distribution"
            description={`Total: ${data.invoiceStatus.paid + data.invoiceStatus.pending + data.invoiceStatus.overdue} invoices`}
            config={invoiceStatusConfig}
          />
        )}

        {/* Top Projects by Revenue */}
        {topProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Projects by Revenue</CardTitle>
              <CardDescription>Highest revenue generating projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProjects.map((project, index) => (
                  <div key={project.projectId} className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate" title={project.projectName}>
                        {project.projectName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate" title={project.organizationName}>
                        {project.organizationName}
                      </p>
                    </div>
                    <div className="font-semibold">€{project.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget Concerns */}
        {budgetConcerns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Budget Variance Alerts</CardTitle>
              <CardDescription>Projects with significant budget variance ({'>'}10%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetConcerns.map(project => {
                  const variancePercent = project.budgetedRevenue > 0
                    ? (project.variance / project.budgetedRevenue) * 100
                    : 0
                  return (
                    <div key={project.projectId} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={project.projectName}>
                            {project.projectName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Budget: €{project.budgetedRevenue.toLocaleString()} |
                            Actual: €{project.actualRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${project.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {project.variance >= 0 ? '+' : ''}€{project.variance.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {data.revenueByClient.length === 0 && data.revenueByProject.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-[250px]">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No financial data available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
