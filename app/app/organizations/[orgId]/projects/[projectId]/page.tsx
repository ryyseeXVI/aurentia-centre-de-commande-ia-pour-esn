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
import { ArrowLeft, BarChart3, Calendar, CheckCircle2, Clock, KanbanSquare, ListTodo, MapPin, Users } from "lucide-react";
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
        setProject(projectData.project || projectData);
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
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.nom}</h1>
            <Badge variant={getStatusColor(project.statut)}>{project.statut}</Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <KanbanSquare className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2">
            <MapPin className="h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-2">
            <Calendar className="h-4 w-4" />
            Roadmap
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-chart-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <div className="p-2 bg-chart-1/10 rounded-lg">
                  <ListTodo className="h-4 w-4 text-chart-1" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taskStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {taskStats.done} completed
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-chart-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <Clock className="h-4 w-4 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taskStats.inProgress}</div>
                <p className="text-xs text-muted-foreground">
                  {taskStats.todo} to do
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-chart-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Milestones</CardTitle>
                <div className="p-2 bg-chart-3/10 rounded-lg">
                  <MapPin className="h-4 w-4 text-chart-3" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{milestoneStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {milestoneStats.completed} completed
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall progress
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Key details about this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-sm font-semibold">
                    {new Date(project.date_debut).toLocaleDateString()}
                  </p>
                </div>
                {project.date_fin_prevue && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target End Date</p>
                    <p className="text-sm font-semibold">
                      {new Date(project.date_fin_prevue).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(project.statut)} className="mt-1">
                    {project.statut}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kanban Tab */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Task Board</h2>
              <p className="text-sm text-muted-foreground">
                Drag and drop tasks to update their status
              </p>
            </div>
            <Button onClick={() => handleCreateTask()}>
              <ListTodo className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
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
        <TabsContent value="milestones" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Milestones</h2>
              <p className="text-sm text-muted-foreground">
                Track key project milestones and deliverables
              </p>
            </div>
            <Button onClick={() => setShowMilestoneForm(true)}>
              <MapPin className="mr-2 h-4 w-4" />
              New Milestone
            </Button>
          </div>

          {showMilestoneForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Milestone</CardTitle>
                <CardDescription>Add a new milestone to track</CardDescription>
              </CardHeader>
              <CardContent>
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
        <TabsContent value="roadmap" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Project Roadmap</h2>
            <p className="text-sm text-muted-foreground">
              Visual timeline of milestones and dependencies
            </p>
          </div>

          <RoadmapVisualization
            milestones={milestones}
            onMilestoneClick={(milestone) => {
              setSelectedMilestone(milestone);
              setMilestoneDialogOpen(true);
            }}
          />
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
