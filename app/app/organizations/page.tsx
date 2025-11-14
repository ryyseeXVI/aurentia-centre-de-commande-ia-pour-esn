// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { Building2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrganizationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { organizations, loading: workspaceLoading } = useWorkspace();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || workspaceLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="max-w-md">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Organizations Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredOrganizations = organizations.filter((org) =>
    org?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Organizations</h1>
          <p className="text-muted-foreground">
            Browse and manage client companies
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Organizations Grid */}
      {filteredOrganizations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrganizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {org.image ? (
                    <img
                      src={org.image}
                      alt={org.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle>{org.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">
                      {org.role}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2">
                  {org.description || "No description available"}
                </CardDescription>
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 block"
                  >
                    {org.website}
                  </a>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/app/organizations/${org.id}`}>
                    View Projects
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery
                ? "No organizations found"
                : "No client organizations"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {searchQuery
                ? "Try a different search query"
                : "Get started by adding your first client organization"}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/app/admin">Go to Admin Panel</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
