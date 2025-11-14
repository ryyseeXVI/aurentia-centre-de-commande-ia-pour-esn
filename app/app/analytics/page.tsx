// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, Clock, DollarSign, Users, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectScoresTable } from '@/components/analytics/project-scores-table'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [projectScores, setProjectScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scoresLoading, setScoresLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
    fetchProjectScores()
  }, [])

  const fetchProjectScores = async () => {
    try {
      const response = await fetch('/api/analytics/project-scores')
      if (response.ok) {
        const data = await response.json()
        setProjectScores(data.scores || [])
      } else {
        console.error('Failed to fetch project scores:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Project scores error details:', errorData)
        setProjectScores([])
      }
    } catch (error) {
      console.error('Error fetching project scores:', error)
      setProjectScores([])
    } finally {
      setScoresLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/overview')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        console.error('Failed to fetch analytics:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Analytics error details:', errorData)
        // Set empty stats on error
        setStats({
          totalRevenue: 0,
          paidRevenue: 0,
          totalCosts: 0,
          margin: 0,
          hoursWorked: 0,
          activeConsultants: 0,
          projectsAtRisk: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Set empty stats on error
      setStats({
        totalRevenue: 0,
        paidRevenue: 0,
        totalCosts: 0,
        margin: 0,
        hoursWorked: 0,
        activeConsultants: 0,
        projectsAtRisk: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Overview</h1>
        <p className="text-muted-foreground mt-2">
          Global insights across all clients and projects
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">From all invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.margin || 0}%</div>
            <p className="text-xs text-muted-foreground">Profit margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hoursWorked || 0}h</div>
            <p className="text-xs text-muted-foreground">Total tracked time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Consultants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeConsultants || 0}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects at Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.projectsAtRisk || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.totalCosts?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Operational costs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {scoresLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <ProjectScoresTable scores={projectScores} />
          )}
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking Analytics</CardTitle>
              <CardDescription>Hours logged by project, consultant, and time period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visit /app/analytics/time-tracking for detailed breakdown
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Analytics</CardTitle>
              <CardDescription>Revenue, costs, invoices, and budget tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visit /app/analytics/financial for detailed breakdown
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Consultant utilization, skills coverage, and productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visit /app/analytics/team for detailed breakdown
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
