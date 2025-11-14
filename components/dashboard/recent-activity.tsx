"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  description: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    email: string;
    prenom: string | null;
    nom: string | null;
    avatarUrl: string | null;
  } | null;
}

interface RecentActivityProps {
  limit?: number;
  organizationId?: string;
}

export function RecentActivity({ limit = 10, organizationId }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [organizationId, limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (organizationId) {
        params.append("organizationId", organizationId);
      }

      const response = await fetch(`/api/activity?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const result = await response.json();
      setActivities(result.data.activities || []);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Failed to load recent activity");
    } finally {
      setLoading(false);
    }
  };

  // Map action types to badge variants and icons
  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes("CREATED")) return "default";
    if (action.includes("UPDATED")) return "secondary";
    if (action.includes("DELETED")) return "destructive";
    return "outline";
  };

  const formatActionText = (action: string): string => {
    return action
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>Your latest actions across all organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>Your latest actions across all organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>
          Your latest actions across all organizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">No recent activity</p>
            <p className="text-xs text-muted-foreground">
              Your actions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                {/* User Avatar or Icon */}
                <div className="flex-shrink-0">
                  {activity.user?.avatarUrl ? (
                    <img
                      src={activity.user.avatarUrl}
                      alt={`${activity.user.prenom} ${activity.user.nom}`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {activity.user?.prenom?.[0] || activity.user?.email?.[0] || "?"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getActionBadgeVariant(activity.action)} className="text-xs">
                      {formatActionText(activity.action)}
                    </Badge>
                    {activity.resourceType && (
                      <span className="text-xs text-muted-foreground">
                        {activity.resourceType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground mb-1">{activity.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <time dateTime={activity.createdAt}>
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
