"use client";

/**
 * Roadmap Visualization Component
 * Interactive timeline visualization of project milestones with dependencies
 */

import { useEffect, useState } from "react";
import type { Milestone } from "@/types/milestones";
import {
  getEffectiveProgress,
  getStatusColor,
  isMilestoneOverdue,
} from "@/utils/milestone-transformers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface RoadmapVisualizationProps {
  milestones: Milestone[];
  onMilestoneClick?: (milestone: Milestone) => void;
}

interface TimelinePosition {
  milestone: Milestone;
  x: number; // Position percentage (0-100)
  y: number; // Row number
}

export function RoadmapVisualization({
  milestones,
  onMilestoneClick,
}: RoadmapVisualizationProps) {
  const [positions, setPositions] = useState<TimelinePosition[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(
    null,
  );

  useEffect(() => {
    if (milestones.length === 0) return;

    // Calculate date range
    const dates = milestones.flatMap((m) => [
      new Date(m.startDate),
      new Date(m.dueDate),
    ]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add padding to date range (10% on each side)
    const rangeDuration = maxDate.getTime() - minDate.getTime();
    const padding = rangeDuration * 0.1;
    const paddedStart = new Date(minDate.getTime() - padding);
    const paddedEnd = new Date(maxDate.getTime() + padding);

    setDateRange({ start: paddedStart, end: paddedEnd });

    // Calculate positions for each milestone
    const totalDuration = paddedEnd.getTime() - paddedStart.getTime();
    const sortedMilestones = [...milestones].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const newPositions: TimelinePosition[] = [];
    const rows: { endX: number }[] = [];

    sortedMilestones.forEach((milestone) => {
      const startDate = new Date(milestone.startDate);
      const dueDate = new Date(milestone.dueDate);
      const startX =
        ((startDate.getTime() - paddedStart.getTime()) / totalDuration) * 100;
      const endX =
        ((dueDate.getTime() - paddedStart.getTime()) / totalDuration) * 100;

      // Find available row (avoid overlaps)
      let rowIndex = 0;
      while (rowIndex < rows.length && rows[rowIndex].endX > startX - 2) {
        rowIndex++;
      }

      if (rowIndex >= rows.length) {
        rows.push({ endX });
      } else {
        rows[rowIndex] = { endX };
      }

      newPositions.push({
        milestone,
        x: startX,
        y: rowIndex,
      });
    });

    setPositions(newPositions);
  }, [milestones]);

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Milestones</h3>
            <p className="text-sm text-muted-foreground">
              Create milestones to see them visualized on the roadmap timeline
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dateRange) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading roadmap...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxRows = Math.max(...positions.map((p) => p.y), 0) + 1;
  const rowHeight = 180; // Increased from 120 for more vertical space

  // Generate month markers
  const monthMarkers: { date: Date; x: number; label: string }[] = [];
  const currentDate = new Date(dateRange.start);
  currentDate.setDate(1); // Start of month

  while (currentDate <= dateRange.end) {
    const x =
      ((currentDate.getTime() - dateRange.start.getTime()) /
        (dateRange.end.getTime() - dateRange.start.getTime())) *
      100;

    monthMarkers.push({
      date: new Date(currentDate),
      x,
      label: currentDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return (
    <Card>
      <CardContent className="pt-6 overflow-x-auto">
        <div
          className="relative min-w-[1000px]"
          style={{ height: `${Math.max(maxRows * rowHeight + 150, 400)}px` }}
        >
          {/* Timeline base line */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-border"></div>

          {/* Month markers */}
          {monthMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute top-0"
              style={{ left: `${marker.x}%` }}
            >
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-border mb-1"></div>
                <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                  {marker.label}
                </span>
              </div>
            </div>
          ))}

          {/* Milestones */}
          {positions.map(({ milestone, x, y }) => {
            const progress = getEffectiveProgress(milestone);
            const isOverdue = isMilestoneOverdue(milestone);
            const startDate = new Date(milestone.startDate);
            const dueDate = new Date(milestone.dueDate);
            const duration =
              ((dueDate.getTime() - startDate.getTime()) /
                (dateRange.end.getTime() - dateRange.start.getTime())) *
              100;

            const statusColors = {
              not_started: "bg-gray-400",
              in_progress: "bg-blue-500",
              completed: "bg-green-500",
              blocked: "bg-red-500",
              at_risk: "bg-orange-500",
            };

            return (
              <div
                key={milestone.id}
                className="absolute group cursor-pointer"
                style={{
                  left: `${x}%`,
                  top: `${y * rowHeight + 60}px`,
                  width: `${Math.max(duration, 8)}%`,
                }}
                onClick={() => onMilestoneClick?.(milestone)}
              >
                {/* Milestone bar */}
                <div
                  className="relative h-28 rounded-lg border-2 transition-all group-hover:shadow-lg group-hover:scale-105"
                  style={{
                    borderColor: milestone.color || "#3B82F6",
                    backgroundColor: `${milestone.color || "#3B82F6"}15`,
                  }}
                >
                  {/* Progress fill */}
                  <div
                    className="absolute inset-0 rounded-lg opacity-30"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: milestone.color || "#3B82F6",
                    }}
                  ></div>

                  {/* Content */}
                  <div className="relative h-full p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base truncate">
                          {milestone.name}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {progress}% complete
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {String(milestone.status) === "COMPLETED" && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {isOverdue && (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {startDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {dueDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status indicator dot */}
                  <div
                    className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white ${statusColors[milestone.status as keyof typeof statusColors] || statusColors.not_started}`}
                  ></div>
                </div>

                {/* Hover tooltip */}
                <div className="absolute left-0 top-full mt-3 hidden group-hover:block z-10 min-w-[300px]">
                  <div className="bg-popover border rounded-lg shadow-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-base">{milestone.name}</h4>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-sm">
                        {String(milestone.status).replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        {String(milestone.priority).toUpperCase()}
                      </Badge>
                    </div>
                    {milestone.totalTasks > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {milestone.completedTasks}/{milestone.totalTasks} tasks
                        completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Dependencies - simplified version */}
          {positions.map(({ milestone, x, y }) => {
            if (!milestone.dependencies || milestone.dependencies.length === 0)
              return null;

            return milestone.dependencies.map((dep) => {
              const depPosition = positions.find(
                (p) => p.milestone.id === dep.dependsOnMilestoneId,
              );
              if (!depPosition) return null;

              const startX = depPosition.x;
              const startY = depPosition.y * rowHeight + 60 + 56; // 56 is half of h-28 (112px)
              const endX = x;
              const endY = y * rowHeight + 60 + 56; // 56 is half of h-28 (112px)

              // Simple curved line using SVG
              return (
                <svg
                  key={`${milestone.id}-${dep.id}`}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 0 }}
                >
                  <path
                    d={`M ${startX}% ${startY} Q ${(startX + endX) / 2}% ${startY - 20} ${endX}% ${endY}`}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrowhead)"
                  />
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3, 0 6"
                        fill="#94a3b8"
                      />
                    </marker>
                  </defs>
                </svg>
              );
            });
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-base font-semibold mb-4">Status Legend</h4>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span>Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Blocked</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
