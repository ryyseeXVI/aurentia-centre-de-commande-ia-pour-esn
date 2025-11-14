"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  Mail,
  Phone,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Consultant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  phone: string | null;
  role: string | null;
  statut: string;
  taux_journalier_cout: number;
  taux_journalier_vente: number;
  date_embauche: string;
  avatar_url: string | null;
  manager: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
  } | null;
  consultant_competence: Array<{
    competence: {
      id: string;
      nom: string;
      description: string | null;
    };
  }>;
}

interface Assignment {
  id: string;
  date_debut: string;
  date_fin: string | null;
  taux_allocation: number;
  projet: {
    id: string;
    nom: string;
    statut: string;
    organization_id: string;
  };
}

interface TimeStats {
  totalHours: number;
  thisMonthHours: number;
  avgHoursPerWeek: number;
  utilizationRate: number;
}

export default function ConsultantDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const consultantId = params.consultantId as string;

  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && consultantId) {
      fetchData();
    }
  }, [user, consultantId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch consultant details
      const consultantRes = await fetch(`/api/consultants/${consultantId}`);
      if (consultantRes.ok) {
        const data = await consultantRes.json();
        setConsultant(data.consultant);
        setAssignments(data.assignments || []);
        setTimeStats(data.timeStats || {
          totalHours: 0,
          thisMonthHours: 0,
          avgHoursPerWeek: 0,
          utilizationRate: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching consultant data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-48" />

        {/* Header Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !consultant) {
    return null;
  }

  const userInitials = `${consultant.prenom?.[0] || ""}${consultant.nom?.[0] || ""}`.toUpperCase();
  const activeAssignments = assignments.filter(
    (a) => !a.date_fin || new Date(a.date_fin) > new Date()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIF":
        return "default";
      case "EN_CONGE":
        return "secondary";
      case "DISPONIBLE":
        return "outline";
      case "INACTIF":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="w-fit">
        <Link href="/app/consultants">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Consultants
        </Link>
      </Button>

      {/* Consultant Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={consultant.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl">
                    {consultant.prenom} {consultant.nom}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {consultant.role || "Consultant"}
                  </CardDescription>
                </div>
                <Badge variant={getStatusColor(consultant.statut)}>
                  {consultant.statut}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{consultant.email}</span>
                </div>
                {consultant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{consultant.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {new Date(consultant.date_embauche).toLocaleDateString()}
                  </span>
                </div>
                {consultant.manager && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      Manager: {consultant.manager.prenom} {consultant.manager.nom}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Rate (Sale)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{consultant.taux_journalier_vente}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost: €{consultant.taux_journalier_cout}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignments.length} total assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeStats?.thisMonthHours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              {timeStats?.totalHours || 0}h total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeStats?.utilizationRate || 0}%
            </div>
            <Progress value={timeStats?.utilizationRate || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Current Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Current Assignments</CardTitle>
                <CardDescription>
                  Active projects and allocations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {activeAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{assignment.projet.nom}</p>
                          <p className="text-xs text-muted-foreground">
                            Allocation: {assignment.taux_allocation}%
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/app/organizations/${assignment.projet.organization_id}/projects/${assignment.projet.id}`}
                          >
                            View
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No active assignments
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
                <CardDescription>
                  Technical competencies and certifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {consultant.consultant_competence.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {consultant.consultant_competence.map((cc) => (
                      <Badge key={cc.competence.id} variant="secondary">
                        {cc.competence.nom}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      No skills added yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
              <CardDescription>
                Complete history of project assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{assignment.projet.nom}</p>
                          <Badge
                            variant={
                              assignment.projet.statut === "ACTIF"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {assignment.projet.statut}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            Start: {new Date(assignment.date_debut).toLocaleDateString()}
                          </span>
                          {assignment.date_fin && (
                            <span>
                              End: {new Date(assignment.date_fin).toLocaleDateString()}
                            </span>
                          )}
                          <span>Allocation: {assignment.taux_allocation}%</span>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/app/organizations/${assignment.projet.organization_id}/projects/${assignment.projet.id}`}
                        >
                          View Project
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No assignment history
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Skills</CardTitle>
              <CardDescription>
                Competencies, certifications, and expertise areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consultant.consultant_competence.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {consultant.consultant_competence.map((cc) => (
                    <div
                      key={cc.competence.id}
                      className="p-4 border rounded-lg"
                    >
                      <h4 className="font-medium">{cc.competence.nom}</h4>
                      {cc.competence.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {cc.competence.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground mb-4">
                    No skills recorded for this consultant
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
