import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, FolderKanban, CheckSquare, Activity } from "lucide-react";

/**
 * Admin Dashboard
 *
 * Overview page for the admin backoffice showing key metrics and quick stats.
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch all stats in parallel
  const [
    { count: usersCount },
    { count: orgsCount },
    { count: consultantsCount },
    { count: projectsCount },
    { count: tasksCount },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("consultant").select("*", { count: "exact", head: true }),
    supabase.from("projet").select("*", { count: "exact", head: true }),
    supabase.from("tache").select("*", { count: "exact", head: true }),
    supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const stats = [
    {
      title: "Total Users",
      value: usersCount || 0,
      description: "Registered user accounts",
      icon: Users,
      href: "/app/admin/users",
    },
    {
      title: "Organizations",
      value: orgsCount || 0,
      description: "Active organizations",
      icon: Building2,
      href: "/app/admin/organizations",
    },
    {
      title: "Consultants",
      value: consultantsCount || 0,
      description: "Consultant profiles",
      icon: Briefcase,
      href: "/app/admin/consultants",
    },
    {
      title: "Projects",
      value: projectsCount || 0,
      description: "Total projects",
      icon: FolderKanban,
      href: "/app/admin/projects",
    },
    {
      title: "Tasks",
      value: tasksCount || 0,
      description: "All tasks across projects",
      icon: CheckSquare,
      href: "/app/admin/tasks",
    },
    {
      title: "Recent Activity",
      value: recentActivity?.length || 0,
      description: "Latest actions logged",
      icon: Activity,
      href: "/app/admin/activity-logs",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your ESN management platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <a key={stat.title} href={stat.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest administrative actions across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0"
                >
                  <div className="h-8 w-8 rounded-full bg-chart-1/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-chart-1" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>
            Jump to common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/app/admin/users"
            className="p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Manage Users</span>
            </div>
          </a>
          <a
            href="/app/admin/organizations"
            className="p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">Manage Organizations</span>
            </div>
          </a>
          <a
            href="/app/admin/consultants"
            className="p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-medium">Manage Consultants</span>
            </div>
          </a>
          <a
            href="/app/admin/projects"
            className="p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              <span className="text-sm font-medium">Manage Projects</span>
            </div>
          </a>
          <a
            href="/app/admin/activity-logs"
            className="p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">View Activity Logs</span>
            </div>
          </a>
          <a
            href="/app/admin/messaging"
            className="p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Monitor Messaging</span>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
