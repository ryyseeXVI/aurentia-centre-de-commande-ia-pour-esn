// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  Briefcase,
  Building2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalOrganizations: number;
  totalProjects: number;
  activeProjects: number;
  totalConsultants: number;
  totalHoursThisMonth: number;
  revenueThisMonth: number;
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { organizations, loading: workspaceLoading } = useWorkspace();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats from new API routes
      const [orgsRes, projectsRes, consultantsRes, hoursRes, recentProjectsRes] = await Promise.all([
        fetch("/api/stats/organizations"),
        fetch("/api/stats/projects"),
        fetch("/api/stats/consultants"),
        fetch("/api/stats/hours-this-month"),
        fetch("/api/projects?limit=5"),
      ]);

      const orgsData = orgsRes.ok ? await orgsRes.json() : { count: 0 };
      const projectsData = projectsRes.ok ? await projectsRes.json() : { count: 0 };
      const consultantsData = consultantsRes.ok ? await consultantsRes.json() : { count: 0 };
      const hoursData = hoursRes.ok ? await hoursRes.json() : { total: 0 };
      const recentProjects = recentProjectsRes.ok ? await recentProjectsRes.json() : { projects: [] };

      setStats({
        totalOrganizations: orgsData.count || 0,
        totalProjects: projectsData.count || 0,
        activeProjects: projectsData.count || 0,
        totalConsultants: consultantsData.count || 0,
        totalHoursThisMonth: hoursData.total || 0,
        revenueThisMonth: 0, // TODO: Add revenue endpoint if needed
      });

      setRecentProjects(recentProjects.projects || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || workspaceLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-36" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.prenom || user.email?.split("@")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your ESN today
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-chart-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Client Organizations
            </CardTitle>
            <div className="p-2 bg-chart-1/10 rounded-lg">
              <Building2 className="h-4 w-4 text-chart-1" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalOrganizations || organizations.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total client companies
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-chart-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <div className="p-2 bg-chart-2/10 rounded-lg">
              <Briefcase className="h-4 w-4 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.activeProjects || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {stats?.totalProjects || 0} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-chart-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultants</CardTitle>
            <div className="p-2 bg-chart-3/10 rounded-lg">
              <Users className="h-4 w-4 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalConsultants || 0}
                </div>
                <p className="text-xs text-muted-foreground">Active team members</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Month</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalHoursThisMonth || 0}h
                </div>
                <p className="text-xs text-muted-foreground">Tracked time</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Client Organizations */}
        <Card>
          <CardHeader>
            <CardTitle>Client Organizations</CardTitle>
            <CardDescription>
              Manage your client companies and their projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workspaceLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : organizations.length > 0 ? (
              <div className="space-y-2">
                {organizations.slice(0, 5).map((org) => (
                  <Link
                    key={org.id}
                    href={`/app/organizations/${org.id}`}
                    className="group flex items-center justify-between rounded-lg border p-3 hover:bg-accent hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 rounded-md group-hover:bg-primary/10 transition-colors">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{org.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {org.role}
                        </p>
                      </div>
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/app/organizations">View All Organizations</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">No client organizations yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Get started by adding your first client
                </p>
                {isAdmin && (
                  <Button asChild size="sm">
                    <Link href="/app/admin">Add Organization</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              Your latest active projects across all clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="space-y-2">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/app/organizations/${project.organization_id}/projects/${project.id}`}
                    className="group flex items-center justify-between rounded-lg border p-3 hover:bg-accent hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-chart-2/10 rounded-md group-hover:bg-chart-2/20 transition-colors">
                        <Briefcase className="h-5 w-5 text-chart-2" />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{project.nom}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {project.statut}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 rounded-full bg-chart-2/10 flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-chart-2" />
                </div>
                <p className="text-sm font-medium mb-1">No projects yet</p>
                <p className="text-xs text-muted-foreground">
                  Projects will appear here once created
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/organizations">View Organizations</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/chat">Open Team Chat</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/profile">Edit Profile</Link>
          </Button>
          {isAdmin && (
            <>
              <Button asChild variant="outline">
                <Link href="/app/admin">Admin Panel</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app/analytics">View Analytics</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <RecentActivity limit={10} />
    </div>
  );
}
