import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import {
  consultantFromDb,
  consultantForUpdate,
} from "@/utils/consultant-transformers";
import type { ConsultantDb } from "@/types/consultants";
import { ConsultantRole } from "@/types/consultants";

/**
 * GET /api/organizations/[organizationId]/consultants/[consultantId]
 * Get a specific consultant's details
 */
export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ organizationId: string; consultantId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const { organizationId, consultantId } = resolvedParams;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this organization" },
        { status: 403 }
      );
    }

    // Get consultant
    const { data: consultant, error } = await supabase
      .from("consultant")
      .select(
        `
        *,
        profile:user_id (
          id,
          nom,
          prenom,
          email,
          avatar_url
        )
      `
      )
      .eq("id", consultantId)
      .eq("organization_id", organizationId)
      .single();

    if (error || !consultant) {
      return NextResponse.json(
        { error: "Consultant not found" },
        { status: 404 }
      );
    }

    // Transform to camelCase
    const transformed = consultantFromDb(
      consultant as ConsultantDb & { profile?: any }
    );

    return NextResponse.json({ consultant: transformed });
  } catch (error) {
    console.error(
      "Error in GET /api/organizations/[organizationId]/consultants/[consultantId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[organizationId]/consultants/[consultantId]
 * Update a consultant's details or role
 */
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ organizationId: string; consultantId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const { organizationId, consultantId } = resolvedParams;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user has admin access
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins can update consultants." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { nom, prenom, email, role } = body;

    // Validate role if provided
    if (role && !Object.values(ConsultantRole).includes(role as ConsultantRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN, MANAGER, or CONSULTANT" },
        { status: 400 }
      );
    }

    // Get existing consultant
    const { data: existingConsultant } = await supabase
      .from("consultant")
      .select("id, nom, prenom, role")
      .eq("id", consultantId)
      .eq("organization_id", organizationId)
      .single();

    if (!existingConsultant) {
      return NextResponse.json(
        { error: "Consultant not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = consultantForUpdate({ nom, prenom, email, role });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update consultant
    const { data: consultant, error: updateError } = await supabase
      .from("consultant")
      .update(updateData)
      .eq("id", consultantId)
      .eq("organization_id", organizationId)
      .select(
        `
        *,
        profile:user_id (
          id,
          nom,
          prenom,
          email,
          avatar_url
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating consultant:", updateError);
      return NextResponse.json(
        { error: "Failed to update consultant" },
        { status: 500 }
      );
    }

    // Log activity
    const changes = [];
    if (nom) changes.push(`nom: ${nom}`);
    if (prenom) changes.push(`prenom: ${prenom}`);
    if (email) changes.push(`email: ${email}`);
    if (role && role !== existingConsultant.role)
      changes.push(`role: ${existingConsultant.role} → ${role}`);

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: organizationId,
      action: "CONSULTANT_UPDATED",
      description: `Updated consultant ${existingConsultant.prenom} ${existingConsultant.nom}: ${changes.join(", ")}`,
      metadata: { consultantId, changes },
    });

    // Transform response
    const transformed = consultantFromDb(
      consultant as ConsultantDb & { profile?: any }
    );

    return NextResponse.json({ consultant: transformed });
  } catch (error) {
    console.error(
      "Error in PATCH /api/organizations/[organizationId]/consultants/[consultantId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[organizationId]/consultants/[consultantId]
 * Remove a consultant from an organization
 */
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ organizationId: string; consultantId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const { organizationId, consultantId } = resolvedParams;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user has admin access
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins can remove consultants." },
        { status: 403 }
      );
    }

    // Get consultant info before deletion
    const { data: consultant } = await supabase
      .from("consultant")
      .select("id, nom, prenom, role")
      .eq("id", consultantId)
      .eq("organization_id", organizationId)
      .single();

    if (!consultant) {
      return NextResponse.json(
        { error: "Consultant not found" },
        { status: 404 }
      );
    }

    // Delete consultant
    const { error: deleteError } = await supabase
      .from("consultant")
      .delete()
      .eq("id", consultantId)
      .eq("organization_id", organizationId);

    if (deleteError) {
      console.error("Error deleting consultant:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete consultant" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: organizationId,
      action: "CONSULTANT_REMOVED",
      description: `Removed consultant ${consultant.prenom} ${consultant.nom} (${consultant.role})`,
      metadata: { consultantId, role: consultant.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error in DELETE /api/organizations/[organizationId]/consultants/[consultantId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
