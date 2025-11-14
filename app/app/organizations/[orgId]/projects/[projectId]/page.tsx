// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BarChart3, Calendar, CheckCircle2, Clock, KanbanSquare, ListTodo, MapPin, Users, TrendingUp, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import KanbanBoard from "@/components/projects/kanban-board";
import EnhancedTaskDialog from "@/components/projects/enhanced-task-dialog";
import EditTaskDialog from "@/components/projects/edit-task-dialog";
import { MilestoneList } from "@/components/milestones/milestone-list";
import { MilestoneForm } from "@/components/milestones/milestone-form";
import { RoadmapVisualization } from "@/components/milestones/roadmap-visualization";
import { MilestoneDetailDialog } from "@/components/milestones/milestone-detail-dialog";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone
} from "@/hooks/use-milestones";
import { toast } from "sonner";
import type { TaskCard, TaskColumn, DEFAULT_COLUMNS } from "@/types/tasks";
import { DEFAULT_COLUMNS as TASK_COLUMNS } from "@/types/tasks";

export default function ProjectDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [preselectedColumn, setPreselectedColumn] = useState<string>();
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);

  // Task management - fetch tasks
  const {
    tasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useTasks(projectId);

  // Task mutations
  const { createTask, isCreating: creatingTask } = useCreateTask();
  const { updateTask, isUpdating: updatingTask } = useUpdateTask();
  const { deleteTask: removeTask, isDeleting: deletingTask } = useDeleteTask();

  // Milestone management - fetch milestones
  const {
    milestones,
    loading: milestonesLoading,
    fetchMilestones,
    refetch: refetchMilestones,
  } = useMilestones(projectId);

  // Milestone mutations
  const { createMilestone: createMilestoneAction, creating: creatingMilestone } = useCreateMilestone(projectId);
  const { updateMilestone: updateMilestoneAction, updating: updatingMilestone } = useUpdateMilestone();
  const { deleteMilestone: deleteMilestoneAction, deleting: deletingMilestone } = useDeleteMilestone();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && projectId) {
      fetchProjectData();
      refetchTasks();
      fetchMilestones();
    }
  }, [user, projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      const [projectRes, statsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/stats`),
      ]);

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        // API returns { data: project }, so use projectData.data
        setProject(projectData.data || projectData.project || projectData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || statsData);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskMoved = (taskId: string, columnId: string, position: number) => {
    // Optimistic update handled by KanbanBoard
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setEditTaskDialogOpen(true);
  };

  const handleCreateTask = (columnId?: string) => {
    setPreselectedColumn(columnId);
    setCreateTaskDialogOpen(true);
  };

  const handleTaskCreated = (task: TaskCard) => {
    toast.success("Task created successfully");
    setCreateTaskDialogOpen(false);
    refetchTasks();
  };

  const handleTaskUpdated = (task: TaskCard) => {
    toast.success("Task updated successfully");
    setEditTaskDialogOpen(false);
    refetchTasks();
  };

  const handleTaskDeleted = (taskId: string) => {
    toast.success("Task deleted successfully");
    setEditTaskDialogOpen(false);
    refetchTasks();
  };

  const handleMilestoneCreated = async (data: any) => {
    try {
      await createMilestoneAction(data);
      setShowMilestoneForm(false);
      await fetchMilestones();
      toast.success("Milestone created successfully");
    } catch (error) {
      toast.error("Failed to create milestone");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!user || !project) {
    return null;
  }

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

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.statut === "TODO").length,
    inProgress: tasks.filter(t => t.statut === "IN_PROGRESS").length,
    done: tasks.filter(t => t.statut === "DONE").length,
    blocked: tasks.filter(t => t.statut === "BLOCKED").length,
  };

  const milestoneStats = {
    total: milestones.length,
    completed: milestones.filter(m => String(m.status) === "COMPLETED").length,
    inProgress: milestones.filter(m => String(m.status) === "IN_PROGRESS").length,
    notStarted: milestones.filter(m => String(m.status) === "NOT_STARTED").length,
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link
          href={`/app/organizations/${orgId}/projects`}
          className="flex items-center gap-2 hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Projects</span>
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">{project.nom}</span>
      </nav>

      {/* Enhanced Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight truncate">{project.nom}</h1>
            <Badge
              variant={getStatusColor(project.statut)}
              className="text-xs px-3 py-1 font-semibold shrink-0"
            >
              {project.statut?.replace(/_/g, ' ') || 'Unknown'}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">
              {project.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Started {new Date(project.date_debut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {project.date_fin_prevue && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Due {new Date(project.date_fin_prevue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-grid h-auto p-1 bg-muted/50">
          <TabsTrigger
            value="overview"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="kanban"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <KanbanSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger
            value="milestones"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Milestones</span>
          </TabsTrigger>
          <TabsTrigger
            value="roadmap"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-300">
          {/* Section Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Project Overview</h2>
            <p className="text-muted-foreground">Key metrics and progress indicators for this project</p>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-chart-1 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
                <div className="p-2.5 bg-chart-1/10 rounded-lg group-hover:bg-chart-1/20 transition-colors">
                  <ListTodo className="h-5 w-5 text-chart-1" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">{taskStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {taskStats.done} completed • {taskStats.todo} pending
                  </p>
                </div>
                <Progress
                  value={taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0}
                  className="h-2"
                />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-chart-2 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                <div className="p-2.5 bg-chart-2/10 rounded-lg group-hover:bg-chart-2/20 transition-colors">
                  <Clock className="h-5 w-5 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">{taskStats.inProgress}</div>
                  <p className="text-xs text-muted-foreground">
                    {taskStats.todo} to do • {taskStats.blocked} blocked
                  </p>
                </div>
                <Progress
                  value={taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0}
                  className="h-2"
                />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-chart-3 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Milestones</CardTitle>
                <div className="p-2.5 bg-chart-3/10 rounded-lg group-hover:bg-chart-3/20 transition-colors">
                  <MapPin className="h-5 w-5 text-chart-3" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">{milestoneStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {milestoneStats.completed} completed • {milestoneStats.inProgress} active
                  </p>
                </div>
                <Progress
                  value={milestoneStats.total > 0 ? (milestoneStats.completed / milestoneStats.total) * 100 : 0}
                  className="h-2"
                />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-primary group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completion</CardTitle>
                <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">
                    {taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overall project progress
                  </p>
                </div>
                <Progress
                  value={taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0}
                  className="h-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Project Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Timeline
                </CardTitle>
                <CardDescription>Project schedule and duration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between pb-3 border-b">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="text-base font-semibold">
                        {new Date(project.date_debut).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {project.date_fin_prevue && (
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Target End Date</p>
                        <p className="text-base font-semibold">
                          {new Date(project.date_fin_prevue).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Status & Progress
                </CardTitle>
                <CardDescription>Current project state</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                    <Badge variant={getStatusColor(project.statut)} className="text-xs px-3 py-1">
                      {project.statut?.replace(/_/g, ' ') || 'Unknown'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Task Completion</span>
                      <span className="font-semibold">
                        {taskStats.done} / {taskStats.total}
                      </span>
                    </div>
                    <Progress
                      value={taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Milestone Progress</span>
                      <span className="font-semibold">
                        {milestoneStats.completed} / {milestoneStats.total}
                      </span>
                    </div>
                    <Progress
                      value={milestoneStats.total > 0 ? (milestoneStats.completed / milestoneStats.total) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Kanban Tab */}
        <TabsContent value="kanban" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Task Board</h2>
              <p className="text-sm text-muted-foreground">
                Drag and drop tasks to update their status
              </p>
            </div>
            <Button
              onClick={() => handleCreateTask()}
              size="default"
              className="shrink-0"
            >
              <ListTodo className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          <Card className="p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <KanbanBoard
              projectId={projectId}
              columns={TASK_COLUMNS}
              tasks={tasks as TaskCard[]}
              onTaskMoved={handleTaskMoved}
              onTaskClick={handleTaskClick}
              onCreateTask={handleCreateTask}
              onRefresh={refetchTasks}
            />
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Milestones</h2>
              <p className="text-sm text-muted-foreground">
                Track key project milestones and deliverables
              </p>
            </div>
            <Button
              onClick={() => setShowMilestoneForm(true)}
              size="default"
              className="shrink-0"
            >
              <MapPin className="mr-2 h-4 w-4" />
              New Milestone
            </Button>
          </div>

          {showMilestoneForm && (
            <Card className="border-2 border-primary/20 shadow-sm animate-in slide-in-from-top-4 duration-300">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Create Milestone
                </CardTitle>
                <CardDescription>Add a new milestone to track project progress</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <MilestoneForm
                  onSubmit={handleMilestoneCreated}
                  onCancel={() => setShowMilestoneForm(false)}
                />
              </CardContent>
            </Card>
          )}

          <MilestoneList
            projectId={projectId}
            onEdit={(milestone) => console.log("Edit milestone:", milestone)}
            onDelete={async (milestone) => {
              try {
                await deleteMilestoneAction(milestone.id);
                await fetchMilestones();
                toast.success("Milestone deleted");
              } catch (error) {
                toast.error("Failed to delete milestone");
              }
            }}
            emptyMessage="No milestones yet. Create one to get started!"
          />
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Project Roadmap</h2>
            <p className="text-sm text-muted-foreground">
              Visual timeline of milestones and dependencies
            </p>
          </div>

          <div className="rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
            <RoadmapVisualization
              milestones={milestones}
              onMilestoneClick={(milestone) => {
                setSelectedMilestone(milestone);
                setMilestoneDialogOpen(true);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Creation Dialog */}
      <EnhancedTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        projectId={projectId}
        columns={TASK_COLUMNS}
        preselectedColumnId={preselectedColumn}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Edit Dialog */}
      <EditTaskDialog
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        taskId={selectedTaskId}
        projectId={projectId}
        columns={TASK_COLUMNS}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
        currentUserId={user?.id || ""}
      />

      {/* Milestone Detail Dialog */}
      <MilestoneDetailDialog
        milestone={selectedMilestone}
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
      />
    </div>
  );
}
