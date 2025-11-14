'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  User,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectHealthCardProps {
  projectId: string
  projectName: string
  projectDescription?: string
  projectStatus: string
  clientName: string
  projectManager: string
  scoreGlobal: number
  couleurRisque: 'VERT' | 'ORANGE' | 'ROUGE'
  scoreBudget?: number
  scoreDelais?: number
  scoreQualite?: number
  scoreRessources?: number
  scoreCommunication?: number
  tendance?: 'AMELIORATION' | 'STABLE' | 'DEGRADATION'
  dateAnalyse: string
  onViewDetails?: () => void
}

export function ProjectHealthCard({
  projectName,
  projectDescription,
  projectStatus,
  clientName,
  projectManager,
  scoreGlobal,
  couleurRisque,
  scoreBudget,
  scoreDelais,
  scoreQualite,
  scoreRessources,
  scoreCommunication,
  tendance,
  dateAnalyse,
  onViewDetails,
}: ProjectHealthCardProps) {
  // Color schemes based on risk level
  const riskStyles = {
    VERT: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      border: 'border-green-200 dark:border-green-800',
      scoreBg: 'bg-green-500 dark:bg-green-600',
      scoreText: 'text-white',
      icon: CheckCircle2,
      iconColor: 'text-green-600 dark:text-green-400',
      badgeBg: 'bg-green-100 dark:bg-green-900/50',
      badgeText: 'text-green-800 dark:text-green-200',
      label: 'Healthy',
      glow: 'shadow-green-100 dark:shadow-green-900/20',
    },
    ORANGE: {
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
      border: 'border-orange-200 dark:border-orange-800',
      scoreBg: 'bg-orange-500 dark:bg-orange-600',
      scoreText: 'text-white',
      icon: AlertTriangle,
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeBg: 'bg-orange-100 dark:bg-orange-900/50',
      badgeText: 'text-orange-800 dark:text-orange-200',
      label: 'At Risk',
      glow: 'shadow-orange-100 dark:shadow-orange-900/20',
    },
    ROUGE: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
      border: 'border-red-200 dark:border-red-800',
      scoreBg: 'bg-red-500 dark:bg-red-600',
      scoreText: 'text-white',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      badgeBg: 'bg-red-100 dark:bg-red-900/50',
      badgeText: 'text-red-800 dark:text-red-200',
      label: 'Critical',
      glow: 'shadow-red-100 dark:shadow-red-900/20',
    },
  }

  const style = riskStyles[couleurRisque]
  const Icon = style.icon

  // Trend icon
  const getTrendIcon = () => {
    if (!tendance) return <Minus className="h-4 w-4" />
    if (tendance === 'AMELIORATION') return <TrendingUp className="h-4 w-4 text-green-600" />
    if (tendance === 'DEGRADATION') return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIF':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
      case 'TERMINE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
      case 'PLANIFIE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
      case 'ANNULE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
    }
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        style.bg,
        style.border,
        style.glow,
        'border-2'
      )}
    >
      <CardHeader className="pb-3">
        {/* Header with status and trend */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={getStatusColor(projectStatus)}>
              {projectStatus}
            </Badge>
            <Badge variant="outline" className={cn(style.badgeBg, style.badgeText, 'flex items-center gap-1')}>
              <Icon className="h-3 w-3" />
              {style.label}
            </Badge>
          </div>
          {tendance && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getTrendIcon()}
            </div>
          )}
        </div>

        {/* Project name */}
        <h3 className="text-xl font-bold leading-tight line-clamp-2 mb-1">{projectName}</h3>

        {/* Description */}
        {projectDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">{projectDescription}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Large score display */}
        <div className="flex items-center justify-center py-6">
          <div
            className={cn(
              'relative flex items-center justify-center w-32 h-32 rounded-full',
              style.scoreBg,
              'shadow-lg'
            )}
          >
            <div className="text-center">
              <div className={cn('text-5xl font-bold', style.scoreText)}>{scoreGlobal}</div>
              <div className={cn('text-xs font-medium uppercase tracking-wide', style.scoreText, 'opacity-90')}>
                Health Score
              </div>
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        {(scoreBudget !== undefined ||
          scoreDelais !== undefined ||
          scoreQualite !== undefined ||
          scoreRessources !== undefined ||
          scoreCommunication !== undefined) && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t">
            {scoreBudget !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Budget</div>
                <div className="text-lg font-semibold">{scoreBudget}</div>
              </div>
            )}
            {scoreDelais !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Timeline</div>
                <div className="text-lg font-semibold">{scoreDelais}</div>
              </div>
            )}
            {scoreQualite !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Quality</div>
                <div className="text-lg font-semibold">{scoreQualite}</div>
              </div>
            )}
            {scoreRessources !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Resources</div>
                <div className="text-lg font-semibold">{scoreRessources}</div>
              </div>
            )}
            {scoreCommunication !== undefined && (
              <div className="text-center col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Communication</div>
                <div className="text-lg font-semibold">{scoreCommunication}</div>
              </div>
            )}
          </div>
        )}

        {/* Project details */}
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Client:</span>
            <span className="font-medium truncate">{clientName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Manager:</span>
            <span className="font-medium truncate">{projectManager}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Last Analysis:</span>
            <span className="font-medium">{new Date(dateAnalyse).toLocaleDateString()}</span>
          </div>
        </div>

        {/* View details button */}
        {onViewDetails && (
          <Button onClick={onViewDetails} variant="outline" className="w-full mt-4 group">
            View Details
            <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
