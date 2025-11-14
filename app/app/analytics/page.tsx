// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectHealthDashboard } from '@/components/analytics/project-health-dashboard'
import { FinancialAnalyticsTab } from '@/components/analytics/financial-analytics-tab'
import { TimeTrackingAnalyticsTab } from '@/components/analytics/time-tracking-analytics-tab'
import { TeamPerformanceAnalyticsTab } from '@/components/analytics/team-performance-analytics-tab'

export default function AnalyticsPage() {
  const [projectScores, setProjectScores] = useState<any[]>([])
  const [scoresLoading, setScoresLoading] = useState(true)

  useEffect(() => {
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

  if (scoresLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Real-time insights into project health, performance, and organizational metrics
        </p>
      </div>

      {/* Project Health Dashboard - Main Feature */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Project Health Scores</h2>
          <p className="text-muted-foreground">
            Visual overview of all projects with health scores, risk levels, and performance metrics
          </p>
        </div>
        <ProjectHealthDashboard scores={projectScores} />
      </div>

      {/* Additional Analytics Tabs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Detailed Analytics</h2>
        <Tabs defaultValue="time" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="space-y-4">
            <TimeTrackingAnalyticsTab />
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <FinancialAnalyticsTab />
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamPerformanceAnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
