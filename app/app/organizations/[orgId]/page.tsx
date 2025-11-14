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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
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
}

export default function OrganizationDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
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

      // Fetch organization details
      const orgRes = await fetch(`/api/organizations/${orgId}`);
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrganization(orgData.organization);
      }

      // Fetch projects for this organization
      const projectsRes = await fetch(
        `/api/projects?organizationId=${orgId}`,
      );
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
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
        <div className="space-y-4 w-full max-w-4xl p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!user || !organization) {
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

  return (
    <div className="flex flex-col gap-6 p-6">
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
              {organization.website && (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  {organization.website}
                </a>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Projects</h2>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </Badge>
        </div>

        {projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="group hover:shadow-lg hover:border-primary/50 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-chart-2/10 rounded-md group-hover:bg-chart-2/20 transition-colors">
                        <Briefcase className="h-5 w-5 text-chart-2" />
                      </div>
                      <div>
                        <CardTitle className="group-hover:text-primary transition-colors">{project.nom}</CardTitle>
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
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Start: {new Date(project.date_debut).toLocaleDateString()}
                    </div>
                    {project.date_fin_prevue && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        End:{" "}
                        {new Date(project.date_fin_prevue).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Button asChild className="w-full">
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
      </div>
    </div>
  );
}
