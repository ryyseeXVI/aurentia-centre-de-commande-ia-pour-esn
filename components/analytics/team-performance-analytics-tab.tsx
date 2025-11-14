'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartConfig } from '@/components/ui/chart'
import { Users, TrendingUp, Award, Briefcase, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Skill {
  name: string
  level: number
}

interface TeamMember {
  consultantId: string
  name: string
  email: string
  role: string
  activeProjects: number
  hoursLogged: number
  utilizationRate: number
  skills: Skill[]
}

interface SkillCoverage {
  skillName: string
  consultantCount: number
  averageLevel: number
}

interface TeamPerformanceData {
  teamPerformance: TeamMember[]
  skillsCoverage: SkillCoverage[]
}

export function TeamPerformanceAnalyticsTab() {
  const [data, setData] = useState<TeamPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/analytics/team')
      if (!response.ok) {
        throw new Error('Failed to fetch team analytics')
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
        <AlertDescription>{error || 'Failed to load team analytics'}</AlertDescription>
      </Alert>
    )
  }

  // Calculate metrics
  const avgUtilization = data.teamPerformance.length > 0
    ? data.teamPerformance.reduce((sum, member) => sum + member.utilizationRate, 0) / data.teamPerformance.length
    : 0

  const totalActiveProjects = data.teamPerformance.reduce((sum, member) => sum + member.activeProjects, 0)

  const totalHours = data.teamPerformance.reduce((sum, member) => sum + member.hoursLogged, 0)

  // Sort team members by utilization
  const sortedByUtilization = [...data.teamPerformance].sort((a, b) => b.utilizationRate - a.utilizationRate)

  // Top performers (high utilization, multiple projects)
  const topPerformers = sortedByUtilization.filter(m => m.utilizationRate >= 70).slice(0, 5)

  // Underutilized (low utilization)
  const underutilized = sortedByUtilization.filter(m => m.utilizationRate < 50 && m.utilizationRate > 0).slice(0, 5)

  // Top skills by coverage
  const topSkills = [...data.skillsCoverage]
    .sort((a, b) => b.consultantCount - a.consultantCount)
    .slice(0, 10)

  // Prepare chart data
  const utilizationChartData = sortedByUtilization.slice(0, 10).map(member => ({
    name: member.name.length > 20 ? member.name.substring(0, 20) + '...' : member.name,
    utilization: Math.round(member.utilizationRate),
  }))

  const skillsChartData = topSkills.map(skill => ({
    name: skill.skillName.length > 20 ? skill.skillName.substring(0, 20) + '...' : skill.skillName,
    count: skill.consultantCount,
    avgLevel: skill.averageLevel,
  }))

  const utilizationChartConfig: ChartConfig = {
    utilization: {
      label: 'Utilization %',
      color: 'var(--chart-1)',
    },
  }

  const skillsChartConfig: ChartConfig = {
    count: {
      label: 'Consultants',
      color: 'var(--chart-2)',
    },
  }

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getUtilizationBadge = (rate: number) => {
    if (rate >= 80) return 'default'
    if (rate >= 60) return 'secondary'
    return 'destructive'
  }

  const getSkillLevelBadge = (level: number) => {
    if (level >= 4) return { variant: 'default' as const, label: 'Expert' }
    if (level >= 3) return { variant: 'secondary' as const, label: 'Advanced' }
    if (level >= 2) return { variant: 'outline' as const, label: 'Intermediate' }
    return { variant: 'outline' as const, label: 'Beginner' }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teamPerformance.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active consultants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getUtilizationColor(avgUtilization)}`}>
              {Math.round(avgUtilization)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 3 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all consultants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Tracked</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.skillsCoverage.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique skills</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Utilization Rates */}
        {utilizationChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Utilization Rates</CardTitle>
              <CardDescription>Top {utilizationChartData.length} consultants by utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={utilizationChartConfig} className="h-[300px] w-full">
                <BarChart data={utilizationChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
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
                        formatter={(value) => [`${value}%`, 'Utilization']}
                      />
                    }
                  />
                  <Bar dataKey="utilization" fill="var(--color-utilization)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Skills Coverage */}
        {skillsChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills Coverage</CardTitle>
              <CardDescription>Top {skillsChartData.length} skills by team coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={skillsChartConfig} className="h-[300px] w-full">
                <BarChart data={skillsChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
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
                        formatter={(value) => [`${value} consultants`, 'Count']}
                      />
                    }
                  />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Consultants with high utilization ({'>'}=70%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map(member => (
                  <div key={member.consultantId} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate" title={member.name}>
                            {member.name}
                          </p>
                          <Badge variant={getUtilizationBadge(member.utilizationRate)}>
                            {Math.round(member.utilizationRate)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.activeProjects} active projects • {member.hoursLogged}h logged
                        </p>
                      </div>
                    </div>
                    <Progress value={member.utilizationRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Underutilized */}
        {underutilized.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Capacity Available</CardTitle>
              <CardDescription>Consultants with low utilization ({'<'}50%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {underutilized.map(member => (
                  <div key={member.consultantId} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate" title={member.name}>
                            {member.name}
                          </p>
                          <Badge variant="outline">
                            {Math.round(member.utilizationRate)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.activeProjects} active projects • {member.hoursLogged}h logged
                        </p>
                      </div>
                    </div>
                    <Progress value={member.utilizationRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Skills Details */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Skills */}
        {topSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Skills</CardTitle>
              <CardDescription>Most common skills in the team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSkills.map((skill, index) => {
                  const levelBadge = getSkillLevelBadge(skill.averageLevel)
                  return (
                    <div key={skill.skillName} className="flex items-center gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate" title={skill.skillName}>
                          {skill.skillName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {skill.consultantCount} consultants • Avg level: {skill.averageLevel.toFixed(1)}
                        </p>
                      </div>
                      <Badge variant={levelBadge.variant}>{levelBadge.label}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Overview */}
        {data.teamPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
              <CardDescription>All consultants with key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {sortedByUtilization.map(member => (
                  <div key={member.consultantId} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate" title={member.name}>
                            {member.name}
                          </p>
                          <Badge variant={getUtilizationBadge(member.utilizationRate)} className="text-xs">
                            {Math.round(member.utilizationRate)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.role} • {member.activeProjects} projects • {member.hoursLogged}h
                        </p>
                        {member.skills.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {member.skills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {skill.name}
                              </Badge>
                            ))}
                            {member.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{member.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {data.teamPerformance.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-[250px]">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No team data available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
