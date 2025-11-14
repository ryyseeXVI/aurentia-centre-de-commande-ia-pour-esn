// Access control and permission checking utilities
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "../../types";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface AccessCheckResult {
  hasAccess: boolean;
  role?: UserRole;
  consultantId?: string;
  reason?: string;
}

export interface ProjectAccessResult extends AccessCheckResult {
  isProjectManager?: boolean;
  isAssigned?: boolean;
}

// =============================================================================
// ORGANIZATION ACCESS
// =============================================================================

/**
 * Check if user has access to an organization as MANAGER or ADMIN
 * (CONSULTANT and CLIENT roles are excluded)
 */
export async function checkOrganizationAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<AccessCheckResult> {
  const { data, error } = await supabase
    .from("user_organizations")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return {
      hasAccess: false,
      reason: "User is not a member of this organization",
    };
  }

  // Only MANAGER and ADMIN have access
  const allowedRoles: UserRole[] = ["MANAGER", "ADMIN"];
  const hasAccess = allowedRoles.includes(data.role as UserRole);

  return {
    hasAccess,
    role: data.role as UserRole,
    reason: hasAccess
      ? undefined
      : "Insufficient permissions (requires MANAGER or ADMIN role)",
  };
}

/**
 * Check if user is an admin of an organization
 * Required for sensitive operations like managing members, deleting resources
 */
export async function checkOrganizationAdminAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<AccessCheckResult> {
  const { data, error } = await supabase
    .from("user_organizations")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return {
      hasAccess: false,
      reason: "User is not a member of this organization",
    };
  }

  const allowedRoles: UserRole[] = ["ADMIN"];
  const hasAccess = allowedRoles.includes(data.role as UserRole);

  return {
    hasAccess,
    role: data.role as UserRole,
    reason: hasAccess
      ? undefined
      : "Insufficient permissions (requires ADMIN role)",
  };
}

/**
 * Check if user is an admin of an organization
 * Required for critical operations like deleting organization, managing billing
 *
 * Note: This is an alias for checkOrganizationAdminAccess for backward compatibility
 */
export async function checkOrganizationOwnerAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<AccessCheckResult> {
  const { data, error } = await supabase
    .from("user_organizations")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return {
      hasAccess: false,
      reason: "User is not a member of this organization",
    };
  }

  const hasAccess = data.role === "ADMIN";

  return {
    hasAccess,
    role: data.role as UserRole,
    reason: hasAccess
      ? undefined
      : "Insufficient permissions (requires ADMIN role)",
  };
}

// =============================================================================
// CONSULTANT ACCESS
// =============================================================================

/**
 * Check if user is a consultant in the organization
 * Returns consultant ID if found
 */
export async function getConsultantId(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<{ consultantId: string | null; consultant: any | null }> {
  const { data, error } = await supabase
    .from("consultant")
    .select("id, statut")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("statut", "ACTIF")
    .single();

  if (error || !data) {
    return { consultantId: null, consultant: null };
  }

  return { consultantId: data.id, consultant: data };
}

// =============================================================================
// PROJECT ACCESS
// =============================================================================

/**
 * Check if user has access to a specific project
 * Access is granted if:
 * 1. User is MANAGER or ADMIN in the organization
 * 2. User is a consultant assigned to the project (via affectation)
 * 3. User is the project manager (chef_projet_id)
 */
export async function checkProjectAccess(
  supabase: SupabaseClient,
  userId: string,
  projetId: string,
): Promise<ProjectAccessResult> {
  // Get project details
  const { data: projet, error: projetError } = await supabase
    .from("projet")
    .select("organization_id, chef_projet_id")
    .eq("id", projetId)
    .single();

  if (projetError || !projet) {
    return {
      hasAccess: false,
      reason: "Project not found",
    };
  }

  // Check organization-level access
  const orgAccess = await checkOrganizationAccess(
    supabase,
    userId,
    projet.organization_id,
  );
  if (orgAccess.hasAccess) {
    return {
      hasAccess: true,
      role: orgAccess.role,
      isProjectManager: false,
      isAssigned: false,
    };
  }

  // Get consultant ID
  const { consultantId } = await getConsultantId(
    supabase,
    userId,
    projet.organization_id,
  );
  if (!consultantId) {
    return {
      hasAccess: false,
      reason: "User is not a consultant in this organization",
    };
  }

  // Check if user is the project manager
  if (projet.chef_projet_id === consultantId) {
    return {
      hasAccess: true,
      consultantId,
      isProjectManager: true,
      isAssigned: false,
    };
  }

  // Check if consultant is assigned to the project
  const { data: affectation } = await supabase
    .from("affectation")
    .select("id")
    .eq("projet_id", projetId)
    .eq("consultant_id", consultantId)
    .single();

  if (affectation) {
    return {
      hasAccess: true,
      consultantId,
      isProjectManager: false,
      isAssigned: true,
    };
  }

  return {
    hasAccess: false,
    consultantId,
    reason: "User is not assigned to this project",
  };
}

/**
 * Get all projects accessible by a user, categorized
 */
export async function getCategorizedProjects(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
) {
  // Check organization-level access
  const orgAccess = await checkOrganizationAccess(
    supabase,
    userId,
    organizationId,
  );

  // Get consultant ID
  const { consultantId } = await getConsultantId(
    supabase,
    userId,
    organizationId,
  );

  // If user has org-level access, return all projects
  if (orgAccess.hasAccess) {
    const { data: allProjets } = await supabase
      .from("projet")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    return {
      myProjets: [],
      managedProjets: [],
      otherProjets: allProjets || [],
    };
  }

  // If not org-level access, categorize by consultant relationship
  if (!consultantId) {
    return {
      myProjets: [],
      managedProjets: [],
      otherProjets: [],
    };
  }

  // Get projects where consultant is assigned
  const { data: affectations } = await supabase
    .from("affectation")
    .select("projet_id")
    .eq("consultant_id", consultantId);

  const assignedProjetIds = affectations?.map((a) => a.projet_id) || [];

  // Get projects where consultant is the manager
  const { data: managedProjets } = await supabase
    .from("projet")
    .select("*")
    .eq("chef_projet_id", consultantId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  // Get projects where consultant is assigned (but not manager)
  const managedProjetIds = managedProjets?.map((p) => p.id) || [];
  const assignedOnlyProjetIds = assignedProjetIds.filter(
    (id) => !managedProjetIds.includes(id),
  );

  const { data: myProjets } =
    assignedOnlyProjetIds.length > 0
      ? await supabase
          .from("projet")
          .select("*")
          .in("id", assignedOnlyProjetIds)
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
      : { data: [] };

  return {
    myProjets: myProjets || [],
    managedProjets: managedProjets || [],
    otherProjets: [],
  };
}

// =============================================================================
// TASK ACCESS
// =============================================================================

/**
 * Check if user has access to a specific task
 * Access is granted if user has access to the task's project
 */
export async function checkTaskAccess(
  supabase: SupabaseClient,
  userId: string,
  tacheId: string,
): Promise<ProjectAccessResult> {
  // Get task details
  const { data: tache, error: tacheError } = await supabase
    .from("tache")
    .select("projet_id")
    .eq("id", tacheId)
    .single();

  if (tacheError || !tache) {
    return {
      hasAccess: false,
      reason: "Task not found",
    };
  }

  // Check project access
  return checkProjectAccess(supabase, userId, tache.projet_id);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Require organization access or throw error
 * Useful for API routes
 */
export async function requireOrganizationAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<{ role: UserRole; consultantId?: string }> {
  const access = await checkOrganizationAccess(
    supabase,
    userId,
    organizationId,
  );

  if (!access.hasAccess) {
    throw new Error(access.reason || "Access denied");
  }

  const { consultantId } = await getConsultantId(
    supabase,
    userId,
    organizationId,
  );

  return {
    role: access.role!,
    consultantId: consultantId || undefined,
  };
}

/**
 * Require project access or throw error
 */
export async function requireProjectAccess(
  supabase: SupabaseClient,
  userId: string,
  projetId: string,
): Promise<ProjectAccessResult> {
  const access = await checkProjectAccess(supabase, userId, projetId);

  if (!access.hasAccess) {
    throw new Error(access.reason || "Access denied");
  }

  return access;
}
