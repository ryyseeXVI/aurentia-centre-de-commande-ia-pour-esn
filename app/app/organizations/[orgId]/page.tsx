"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  nom: string;
  description: string | null;
  statut: string;
  date_debut: string;
  date_fin_prevue: string | null;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  website: string | null;
  created_at: string;
}

interface Analytics {
  organization: Organization;
  stats: {
    projects: {
      total: number;
      active: number;
      paused: number;
      completed: number;
      cancelled: number;
    };
    consultants: number;
    tasks: {
      total: number;
      todo: number;
      inProgress: number;
      review: number;
      done: number;
      blocked: number;
    };
    hours: {
      thisMonth: number;
      total: number;
    };
    budget: {
      totalRevenue: number;
      totalCost: number;
      margin: number;
      marginPercentage: number;
    };
    team: {
      total: number;
      admins: number;
      managers: number;
      members: number;
    };
    incidents: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    created_at: string;
    profiles: {
      nom: string;
      prenom: string;
      avatar_url: string | null;
    };
  }>;
}

export default function OrganizationDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [projects, setProjects] = useState<{
    myProjets: Project[];
    managedProjets: Project[];
    otherProjets: Project[];
  }>({ myProjets: [], managedProjets: [], otherProjets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && orgId) {
      fetchData();
    }
  }, [user, orgId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch analytics
      const analyticsRes = await fetch(`/api/organizations/${orgId}/analytics`);
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      // Fetch projects for this organization
      const projectsRes = await fetch(
        `/api/projects?organizationId=${orgId}`,
      );
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.data || { myProjets: [], managedProjets: [], otherProjets: [] });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-6xl p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user || !analytics) {
    return null;
  }

  const { organization, stats, recentActivity } = analytics;
  const allProjects = [
    ...projects.myProjets,
    ...projects.managedProjets,
    ...projects.otherProjets,
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIF":
        return "default";
      case "EN_PAUSE":
        return "secondary";
      case "TERMINE":
        return "outline";
      case "ANNULE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  const tasksCompletionRate =
    stats.tasks.total > 0
      ? ((stats.tasks.done / stats.tasks.total) * 100).toFixed(1)
      : 0;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" asChild className="w-fit">
        <Link href="/app/organizations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Link>
      </Button>

      {/* Organization Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {organization.image ? (
                <img
                  src={organization.image}
                  alt={organization.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-3xl">{organization.name}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {organization.description || "No description available"}
                </CardDescription>
                <div className="flex items-center gap-4 mt-3">
                  {organization.website && (
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {organization.website}
                    </a>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Created {formatDate(organization.created_at)}
                  </span>
                </div>
              </div>
            </div>
            {stats.incidents > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.incidents} Open {stats.incidents === 1 ? "Issue" : "Issues"}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Projects Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.projects.active} active, {stats.projects.completed} completed
            </p>
          </CardContent>
        </Card>

        {/* Consultants Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consultants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.team.total} team {stats.team.total === 1 ? "member" : "members"}
            </p>
          </CardContent>
        </Card>

        {/* Hours This Month Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hours.thisMonth}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.hours.total}h total
            </p>
          </CardContent>
        </Card>

        {/* Budget Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.budget.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.budget.marginPercentage.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({stats.projects.total})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Tasks Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tasks Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Completion Rate</span>
                    <span className="font-bold">{tasksCompletionRate}%</span>
                  </div>
                  <Progress value={parseFloat(tasksCompletionRate.toString())} />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">To Do</div>
                    <div className="text-lg font-bold">{stats.tasks.todo}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">In Progress</div>
                    <div className="text-lg font-bold">{stats.tasks.inProgress}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Review</div>
                    <div className="text-lg font-bold">{stats.tasks.review}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Done</div>
                    <div className="text-lg font-bold text-green-600">{stats.tasks.done}</div>
                  </div>
                </div>
                {stats.tasks.blocked > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      {stats.tasks.blocked} blocked {stats.tasks.blocked === 1 ? "task" : "tasks"}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Budget Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(stats.budget.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cost</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(stats.budget.totalCost)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Margin</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(stats.budget.margin)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {stats.budget.marginPercentage.toFixed(2)}% margin rate
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Composition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm">Admins</span>
                  </div>
                  <span className="font-bold">{stats.team.admins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-sm">Managers</span>
                  </div>
                  <span className="font-bold">{stats.team.managers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm">Members</span>
                  </div>
                  <span className="font-bold">{stats.team.members}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-sm">Total Team Members</span>
                  <span className="text-lg">{stats.team.total}</span>
                </div>
              </CardContent>
            </Card>

            {/* Project Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Project Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm">Active</span>
                  </div>
                  <span className="font-bold">{stats.projects.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-sm">Paused</span>
                  </div>
                  <span className="font-bold">{stats.projects.paused}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="font-bold">{stats.projects.completed}</span>
                </div>
                {stats.projects.cancelled > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-sm">Cancelled</span>
                    </div>
                    <span className="font-bold">{stats.projects.cancelled}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {allProjects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group hover:shadow-lg hover:border-primary/50 transition-all"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-chart-2/10 rounded-md group-hover:bg-chart-2/20 transition-colors">
                          <Briefcase className="h-5 w-5 text-chart-2" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="group-hover:text-primary transition-colors truncate">
                            {project.nom}
                          </CardTitle>
                          <Badge
                            variant={getStatusColor(project.statut)}
                            className="mt-1"
                          >
                            {project.statut}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Start: {formatDate(project.date_debut)}
                      </div>
                      {project.date_fin_prevue && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          End: {formatDate(project.date_fin_prevue)}
                        </div>
                      )}
                    </div>
                    <Button asChild className="w-full mt-2">
                      <Link
                        href={`/app/organizations/${orgId}/projects/${project.id}`}
                      >
                        View Project
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mx-auto h-16 w-16 rounded-full bg-chart-2/10 flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-chart-2" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-sm text-muted-foreground text-center">
                  This organization doesn't have any projects yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest actions and updates in this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="shrink-0">
                        {activity.profiles.avatar_url ? (
                          <img
                            src={activity.profiles.avatar_url}
                            alt={`${activity.profiles.prenom} ${activity.profiles.nom}`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {activity.profiles.prenom?.[0]}
                              {activity.profiles.nom?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.profiles.prenom} {activity.profiles.nom}
                          </span>{" "}
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(activity.created_at)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
