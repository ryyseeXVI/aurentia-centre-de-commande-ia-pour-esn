'use client'

import { useState, useMemo } from 'react'
import { ProjectHealthCard } from './project-health-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, SlidersHorizontal, X, Download, Grid3x3, List } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProjectScoresTable } from './project-scores-table'

interface ProjectScore {
  id: string
  projectId: string
  projectName: string
  projectDescription?: string
  projectStatus: string
  projectStartDate?: string
  projectEndDate?: string
  clientName: string
  projectManager: string
  projectManagerEmail?: string
  dateAnalyse: string
  scoreGlobal: number
  couleurRisque: 'VERT' | 'ORANGE' | 'ROUGE'
  scoreBudget?: number
  scoreDelais?: number
  scoreQualite?: number
  scoreRessources?: number
  scoreCommunication?: number
  raisonnementIa?: string
  facteursCritiques?: string[]
  recommandations?: string[]
  tendance?: 'AMELIORATION' | 'STABLE' | 'DEGRADATION'
  organizationId: string
}

interface ProjectHealthDashboardProps {
  scores: ProjectScore[]
}

export function ProjectHealthDashboard({ scores }: ProjectHealthDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [tendanceFilter, setTendanceFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort data
  const filteredScores = useMemo(() => {
    let filtered = scores

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        score =>
          score.projectName.toLowerCase().includes(term) ||
          score.clientName.toLowerCase().includes(term) ||
          score.projectManager.toLowerCase().includes(term) ||
          score.projectDescription?.toLowerCase().includes(term)
      )
    }

    // Apply risk filter
    if (riskFilter !== 'ALL') {
      filtered = filtered.filter(score => score.couleurRisque === riskFilter)
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(score => score.projectStatus === statusFilter)
    }

    // Apply tendance filter
    if (tendanceFilter !== 'ALL') {
      filtered = filtered.filter(score => score.tendance === tendanceFilter)
    }

    // Sort by score (critical projects first)
    return filtered.sort((a, b) => {
      // First sort by risk color (ROUGE > ORANGE > VERT)
      const riskOrder = { ROUGE: 0, ORANGE: 1, VERT: 2 }
      const riskDiff = riskOrder[a.couleurRisque] - riskOrder[b.couleurRisque]
      if (riskDiff !== 0) return riskDiff

      // Then by score (lower scores first within same risk category)
      return a.scoreGlobal - b.scoreGlobal
    })
  }, [scores, searchTerm, riskFilter, statusFilter, tendanceFilter])

  // Stats
  const stats = useMemo(() => {
    const total = scores.length
    const critical = scores.filter(s => s.couleurRisque === 'ROUGE').length
    const atRisk = scores.filter(s => s.couleurRisque === 'ORANGE').length
    const healthy = scores.filter(s => s.couleurRisque === 'VERT').length
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.scoreGlobal, 0) / scores.length)
      : 0

    return { total, critical, atRisk, healthy, avgScore }
  }, [scores])

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setRiskFilter('ALL')
    setStatusFilter('ALL')
    setTendanceFilter('ALL')
  }

  const hasActiveFilters = searchTerm || riskFilter !== 'ALL' || statusFilter !== 'ALL' || tendanceFilter !== 'ALL'

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Project Name',
      'Client',
      'Status',
      'Manager',
      'Health Score',
      'Risk Level',
      'Budget',
      'Timeline',
      'Quality',
      'Resources',
      'Communication',
      'Trend',
      'Last Analysis',
    ]

    const rows = filteredScores.map(score => [
      score.projectName,
      score.clientName,
      score.projectStatus,
      score.projectManager,
      score.scoreGlobal,
      score.couleurRisque,
      score.scoreBudget ?? 'N/A',
      score.scoreDelais ?? 'N/A',
      score.scoreQualite ?? 'N/A',
      score.scoreRessources ?? 'N/A',
      score.scoreCommunication ?? 'N/A',
      score.tendance ?? 'N/A',
      new Date(score.dateAnalyse).toLocaleDateString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `project-health-scores-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.avgScore}</div>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
            <p className="text-xs text-muted-foreground">Healthy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.atRisk}</div>
            <p className="text-xs text-muted-foreground">At Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, clients, or managers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('cards')}
              title="Card view"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="whitespace-nowrap"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </Button>

          {/* Export */}
          <Button variant="outline" onClick={exportToCSV} className="whitespace-nowrap">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Risk Level</label>
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All risk levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Risk Levels</SelectItem>
                      <SelectItem value="VERT">Healthy (Green)</SelectItem>
                      <SelectItem value="ORANGE">At Risk (Orange)</SelectItem>
                      <SelectItem value="ROUGE">Critical (Red)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Project Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="ACTIF">Active</SelectItem>
                      <SelectItem value="PLANIFIE">Planned</SelectItem>
                      <SelectItem value="TERMINE">Completed</SelectItem>
                      <SelectItem value="ANNULE">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Trend</label>
                  <Select value={tendanceFilter} onValueChange={setTendanceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All trends" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Trends</SelectItem>
                      <SelectItem value="AMELIORATION">Improving</SelectItem>
                      <SelectItem value="STABLE">Stable</SelectItem>
                      <SelectItem value="DEGRADATION">Degrading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{filteredScores.length}</span> of{' '}
            <span className="font-medium">{scores.length}</span> projects
          </p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearFilters} className="text-sm">
              Clear all filters
            </Button>
          )}
        </div>
      </div>

      {/* Content: Cards or Table */}
      {viewMode === 'cards' ? (
        filteredScores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredScores.map(score => (
              <ProjectHealthCard
                key={score.id}
                projectId={score.projectId}
                projectName={score.projectName}
                projectDescription={score.projectDescription}
                projectStatus={score.projectStatus}
                clientName={score.clientName}
                projectManager={score.projectManager}
                scoreGlobal={score.scoreGlobal}
                couleurRisque={score.couleurRisque}
                scoreBudget={score.scoreBudget}
                scoreDelais={score.scoreDelais}
                scoreQualite={score.scoreQualite}
                scoreRessources={score.scoreRessources}
                scoreCommunication={score.scoreCommunication}
                tendance={score.tendance}
                dateAnalyse={score.dateAnalyse}
              />
            ))}
          </div>
        )
      ) : (
        <ProjectScoresTable scores={filteredScores} />
      )}
    </div>
  )
}
