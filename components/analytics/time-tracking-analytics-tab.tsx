'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartConfig } from '@/components/ui/chart'
import { Clock, TrendingUp, Users, Briefcase, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface TimeTrackingData {
  totalHours: number
  hoursByProject: Array<{
    projectId: string
    projectName: string
    organizationName: string
    hours: number
  }>
  hoursByConsultant: Array<{
    consultantId: string
    consultantName: string
    email: string
    hours: number
  }>
  hoursByMonth: Array<{
    month: string
    hours: number
  }>
}

export function TimeTrackingAnalyticsTab() {
  const [data, setData] = useState<TimeTrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/analytics/time-tracking')
      if (!response.ok) {
        throw new Error('Failed to fetch time tracking analytics')
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
        <AlertDescription>{error || 'Failed to load time tracking analytics'}</AlertDescription>
      </Alert>
    )
  }

  const topProjects = [...data.hoursByProject]
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10)

  const topConsultants = [...data.hoursByConsultant]
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10)

  // Calculate average hours per month
  const avgHoursPerMonth = data.hoursByMonth.length > 0
    ? data.totalHours / data.hoursByMonth.length
    : 0

  // Prepare chart data
  const monthlyChartData = data.hoursByMonth.map(item => ({
    date: item.month,
    hours: item.hours,
  }))

  const projectsChartData = topProjects.map(item => ({
    name: item.projectName.length > 20 ? item.projectName.substring(0, 20) + '...' : item.projectName,
    hours: item.hours,
  }))

  const consultantsChartData = topConsultants.map(item => ({
    name: item.consultantName.length > 20 ? item.consultantName.substring(0, 20) + '...' : item.consultantName,
    hours: item.hours,
  }))

  const monthlyChartConfig: ChartConfig = {
    hours: {
      label: 'Hours',
      color: 'var(--chart-1)',
    },
  }

  const barChartConfig: ChartConfig = {
    hours: {
      label: 'Hours',
      color: 'var(--chart-2)',
    },
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours Tracked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalHours.toLocaleString()}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all projects and consultants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgHoursPerMonth).toLocaleString()}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Over {data.hoursByMonth.length} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Resources</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.hoursByConsultant.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Consultants logging time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4">
        {/* Hours Trend Over Time */}
        {monthlyChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Hours Trend Over Time</CardTitle>
              <CardDescription>Monthly hours worked across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={monthlyChartConfig} className="h-[300px] w-full">
                <AreaChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-')
                      const date = new Date(parseInt(year), parseInt(month) - 1)
                      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          const [year, month] = value.split('-')
                          const date = new Date(parseInt(year), parseInt(month) - 1)
                          return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        }}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="var(--color-hours)"
                    fill="var(--color-hours)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Hours by Project */}
          {projectsChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hours by Project</CardTitle>
                <CardDescription>Top {projectsChartData.length} projects by hours logged</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                  <BarChart data={projectsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `${value}h`} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [`${value}h`, 'Hours']}
                        />
                      }
                    />
                    <Bar dataKey="hours" fill="var(--color-hours)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Hours by Consultant */}
          {consultantsChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hours by Consultant</CardTitle>
                <CardDescription>Top {consultantsChartData.length} consultants by hours logged</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                  <BarChart data={consultantsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `${value}h`} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [`${value}h`, 'Hours']}
                        />
                      }
                    />
                    <Bar dataKey="hours" fill="var(--color-hours)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detailed Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Project Details */}
          {topProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Project Time Details</CardTitle>
                <CardDescription>Complete breakdown by project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProjects.map((project, index) => {
                    const percentage = data.totalHours > 0 ? (project.hours / data.totalHours) * 100 : 0
                    return (
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
                        <div className="text-right">
                          <p className="font-semibold">{project.hours.toLocaleString()}h</p>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consultant Details */}
          {topConsultants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Consultant Time Details</CardTitle>
                <CardDescription>Complete breakdown by consultant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topConsultants.map((consultant, index) => {
                    const percentage = data.totalHours > 0 ? (consultant.hours / data.totalHours) * 100 : 0
                    return (
                      <div key={consultant.consultantId} className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate" title={consultant.consultantName}>
                            {consultant.consultantName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate" title={consultant.email}>
                            {consultant.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{consultant.hours.toLocaleString()}h</p>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Empty State */}
      {data.hoursByProject.length === 0 && data.hoursByConsultant.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-[250px]">
            <div className="text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No time tracking data available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
