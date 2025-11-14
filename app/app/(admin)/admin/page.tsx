import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, FolderKanban, CheckSquare, Activity, MessageSquare, Bell } from "lucide-react";
import { AdminPageContainer } from "./_components/admin-page-container";
import { AdminPageHeader } from "./_components/admin-page-header";
import Link from "next/link";

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
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Organizations",
      value: orgsCount || 0,
      description: "Active organizations",
      icon: Building2,
      href: "/app/admin/organizations",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Consultants",
      value: consultantsCount || 0,
      description: "Consultant profiles",
      icon: Briefcase,
      href: "/app/admin/consultants",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Projects",
      value: projectsCount || 0,
      description: "Total projects",
      icon: FolderKanban,
      href: "/app/admin/projects",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    {
      title: "Tasks",
      value: tasksCount || 0,
      description: "All tasks across projects",
      icon: CheckSquare,
      href: "/app/admin/tasks",
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
    },
    {
      title: "Recent Activity",
      value: recentActivity?.length || 0,
      description: "Latest actions logged",
      icon: Activity,
      href: "/app/admin/activity-logs",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    },
  ];

  const quickActions = [
    {
      label: "Manage Users",
      icon: Users,
      href: "/app/admin/users",
      description: "View and manage all users",
    },
    {
      label: "Organizations",
      icon: Building2,
      href: "/app/admin/organizations",
      description: "Manage organizations",
    },
    {
      label: "Consultants",
      icon: Briefcase,
      href: "/app/admin/consultants",
      description: "Consultant management",
    },
    {
      label: "Projects",
      icon: FolderKanban,
      href: "/app/admin/projects",
      description: "Project oversight",
    },
    {
      label: "Activity Logs",
      icon: Activity,
      href: "/app/admin/activity-logs",
      description: "System audit trail",
    },
    {
      label: "Messaging",
      icon: MessageSquare,
      href: "/app/admin/messaging",
      description: "Monitor communications",
    },
  ];

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Admin Dashboard"
        description="Overview of your ESN management platform with key metrics and quick access to administrative functions"
        icon={Activity}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="group hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer h-full border-2 hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                    {stat.title}
                  </CardTitle>
                  <div className={`h-9 w-9 rounded-lg ${stat.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest administrative actions across the platform
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 group hover:bg-accent/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold">{activity.action}</p>
                    <p className="text-sm text-muted-foreground truncate">
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
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>
                Jump to common administrative tasks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group p-4 rounded-lg border-2 hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </AdminPageContainer>
  );
}
