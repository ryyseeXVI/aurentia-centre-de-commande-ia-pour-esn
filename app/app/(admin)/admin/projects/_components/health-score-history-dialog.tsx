"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { toast } from "sonner";

interface HealthScore {
  id: string;
  dateAnalyse: string;
  scoreGlobal: number;
  couleurRisque: "VERT" | "ORANGE" | "ROUGE";
  scoreBudget?: number;
  scoreDelais?: number;
  scoreQualite?: number;
  scoreRessources?: number;
  scoreCommunication?: number;
  raisonnementIa?: string;
  trend: "improving" | "declining" | "stable";
  scoreDelta: number;
}

interface HealthScoreHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function HealthScoreHistoryDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: HealthScoreHistoryDialogProps) {
  const [history, setHistory] = useState<HealthScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && projectId) {
      fetchHistory();
    }
  }, [open, projectId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/health-history`);
      if (!response.ok) throw new Error("Failed to fetch history");
      const result = await response.json();
      setHistory(result.data.history || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load health score history");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700 dark:text-green-400";
    if (score >= 50) return "text-orange-700 dark:text-orange-400";
    return "text-red-700 dark:text-red-400";
  };

  const getHealthBadgeStyle = (couleurRisque: string) => {
    switch (couleurRisque) {
      case "VERT":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200";
      case "ORANGE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200";
      case "ROUGE":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200 border-gray-200";
    }
  };

  const getHealthLabel = (couleurRisque: string) => {
    switch (couleurRisque) {
      case "VERT": return "Healthy";
      case "ORANGE": return "At Risk";
      case "ROUGE": return "Critical";
      default: return "Unknown";
    }
  };

  const getTrendIcon = (trend: string, delta: number) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendText = (trend: string, delta: number) => {
    if (trend === "improving") return `+${delta.toFixed(0)}`;
    if (trend === "declining") return `${delta.toFixed(0)}`;
    return "—";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Health Score History</DialogTitle>
          <DialogDescription>
            Historical health scores for <strong>{projectName}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No health score history</p>
              <p className="text-sm text-muted-foreground">
                This project doesn't have any health scores yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((score, index) => (
                <div
                  key={score.id}
                  className="relative border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Timeline connector */}
                  {index < history.length - 1 && (
                    <div className="absolute left-8 top-full h-4 w-0.5 bg-border" />
                  )}

                  <div className="flex items-start gap-4">
                    {/* Score circle */}
                    <div className="flex-shrink-0">
                      <div className={`flex items-center justify-center w-16 h-16 rounded-full border-4 ${getScoreColor(score.scoreGlobal)} bg-background`}>
                        <span className={`text-2xl font-bold ${getScoreColor(score.scoreGlobal)}`}>
                          {Math.round(score.scoreGlobal)}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(score.dateAnalyse).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {index < history.length - 1 && (
                            <div className="flex items-center gap-1 text-sm">
                              {getTrendIcon(score.trend, score.scoreDelta)}
                              <span className={score.scoreDelta > 0 ? "text-green-600" : score.scoreDelta < 0 ? "text-red-600" : "text-muted-foreground"}>
                                {getTrendText(score.trend, score.scoreDelta)}
                              </span>
                            </div>
                          )}
                          <Badge variant="outline" className={getHealthBadgeStyle(score.couleurRisque)}>
                            {getHealthLabel(score.couleurRisque)}
                          </Badge>
                        </div>
                      </div>

                      {/* Score breakdown */}
                      {(score.scoreBudget !== undefined ||
                        score.scoreDelais !== undefined ||
                        score.scoreQualite !== undefined ||
                        score.scoreRessources !== undefined ||
                        score.scoreCommunication !== undefined) && (
                        <div className="grid grid-cols-5 gap-3">
                          {score.scoreBudget !== undefined && (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Budget</div>
                              <div className={`text-lg font-semibold ${getScoreColor(score.scoreBudget)}`}>
                                {Math.round(score.scoreBudget)}
                              </div>
                            </div>
                          )}
                          {score.scoreDelais !== undefined && (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Timeline</div>
                              <div className={`text-lg font-semibold ${getScoreColor(score.scoreDelais)}`}>
                                {Math.round(score.scoreDelais)}
                              </div>
                            </div>
                          )}
                          {score.scoreQualite !== undefined && (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Quality</div>
                              <div className={`text-lg font-semibold ${getScoreColor(score.scoreQualite)}`}>
                                {Math.round(score.scoreQualite)}
                              </div>
                            </div>
                          )}
                          {score.scoreRessources !== undefined && (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Resources</div>
                              <div className={`text-lg font-semibold ${getScoreColor(score.scoreRessources)}`}>
                                {Math.round(score.scoreRessources)}
                              </div>
                            </div>
                          )}
                          {score.scoreCommunication !== undefined && (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Communication</div>
                              <div className={`text-lg font-semibold ${getScoreColor(score.scoreCommunication)}`}>
                                {Math.round(score.scoreCommunication)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI reasoning (expandable) */}
                      {score.raisonnementIa && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View AI Analysis
                          </summary>
                          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                            {score.raisonnementIa}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
