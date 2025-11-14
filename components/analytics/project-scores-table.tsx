'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Search, ArrowUpDown, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

interface ProjectScoresTableProps {
  scores: ProjectScore[]
}

export function ProjectScoresTable({ scores }: ProjectScoresTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortColumn, setSortColumn] = useState<string>('dateAnalyse')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filter and sort data
  const filteredAndSortedScores = useMemo(() => {
    let filtered = scores

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        score =>
          score.projectName.toLowerCase().includes(term) ||
          score.clientName.toLowerCase().includes(term) ||
          score.projectManager.toLowerCase().includes(term)
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortColumn as keyof ProjectScore]
      let bValue: any = b[sortColumn as keyof ProjectScore]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [scores, searchTerm, riskFilter, statusFilter, sortColumn, sortDirection])

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Project Name',
      'Client',
      'Status',
      'Project Manager',
      'Score',
      'Risk Level',
      'Budget Score',
      'Delay Score',
      'Quality Score',
      'Resources Score',
      'Communication Score',
      'Analysis Date',
      'Trend',
    ]

    const rows = filteredAndSortedScores.map(score => [
      score.projectName,
      score.clientName,
      score.projectStatus,
      score.projectManager,
      score.scoreGlobal,
      score.couleurRisque,
      score.scoreBudget || 'N/A',
      score.scoreDelais || 'N/A',
      score.scoreQualite || 'N/A',
      score.scoreRessources || 'N/A',
      score.scoreCommunication || 'N/A',
      new Date(score.dateAnalyse).toLocaleDateString(),
      score.tendance || 'N/A',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `project-scores-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Risk badge component
  const getRiskBadge = (couleurRisque: string, score: number) => {
    const colors = {
      VERT: 'bg-green-100 text-green-800 border-green-300',
      ORANGE: 'bg-orange-100 text-orange-800 border-orange-300',
      ROUGE: 'bg-red-100 text-red-800 border-red-300',
    }

    const icons = {
      VERT: <CheckCircle2 className="h-3 w-3" />,
      ORANGE: <AlertTriangle className="h-3 w-3" />,
      ROUGE: <AlertCircle className="h-3 w-3" />,
    }

    return (
      <Badge variant="outline" className={colors[couleurRisque as keyof typeof colors]}>
        <span className="flex items-center gap-1">
          {icons[couleurRisque as keyof typeof icons]}
          {couleurRisque} ({score})
        </span>
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Health Scores</CardTitle>
        <CardDescription>
          Detailed health scores for all projects across your organizations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, clients, or managers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Risk Levels</SelectItem>
              <SelectItem value="VERT">Green (Low Risk)</SelectItem>
              <SelectItem value="ORANGE">Orange (Medium Risk)</SelectItem>
              <SelectItem value="ROUGE">Red (High Risk)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIF">Active</SelectItem>
              <SelectItem value="PLANIFIE">Planned</SelectItem>
              <SelectItem value="TERMINE">Completed</SelectItem>
              <SelectItem value="ANNULE">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportToCSV} variant="outline" className="w-full md:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedScores.length} of {scores.length} projects
        </p>

        {/* Table */}
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableCaption>
              {filteredAndSortedScores.length === 0
                ? 'No project scores found matching your filters'
                : 'Latest health score analysis for each project'}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('projectName')}
                    className="h-8 px-2"
                  >
                    Project
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('clientName')}
                    className="h-8 px-2"
                  >
                    Client
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('projectStatus')}
                    className="h-8 px-2"
                  >
                    Status
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('scoreGlobal')}
                    className="h-8 px-2"
                  >
                    Global Score
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">Budget</TableHead>
                <TableHead className="text-center">Delays</TableHead>
                <TableHead className="text-center">Quality</TableHead>
                <TableHead className="text-center">Resources</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('projectManager')}
                    className="h-8 px-2"
                  >
                    Manager
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('dateAnalyse')}
                    className="h-8 px-2"
                  >
                    Analysis Date
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedScores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No project scores available
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedScores.map(score => (
                  <TableRow key={score.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={score.projectName}>
                        {score.projectName}
                      </div>
                    </TableCell>
                    <TableCell>{score.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{score.projectStatus}</Badge>
                    </TableCell>
                    <TableCell>{getRiskBadge(score.couleurRisque, score.scoreGlobal)}</TableCell>
                    <TableCell className="text-center">
                      {score.scoreBudget !== undefined ? score.scoreBudget : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {score.scoreDelais !== undefined ? score.scoreDelais : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {score.scoreQualite !== undefined ? score.scoreQualite : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {score.scoreRessources !== undefined ? score.scoreRessources : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={score.projectManagerEmail}>
                        {score.projectManager}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(score.dateAnalyse).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
