// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import {
  consultantFromDb,
  consultantForProfileUpdate,
  consultantForDetailsUpdate,
} from "@/utils/consultant-transformers";
import type { UpdateConsultantRequest } from "@/types/consultants";
import { ConsultantRole } from "@/types/consultants";

/**
 * GET /api/organizations/[orgId]/consultants/[consultantId]
 * Get a specific consultant's details
 */
export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ orgId: string; consultantId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const { orgId, consultantId } = resolvedParams;

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
      .eq("organization_id", orgId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this organization" },
        { status: 403 }
      );
    }

    // Get consultant (profile with consultant_details)
    const { data: consultant, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        consultant_details (
          date_embauche,
          taux_journalier_cout,
          taux_journalier_vente,
          statut,
          job_title
        ),
        manager:manager_id (
          id,
          nom,
          prenom,
          email
        )
      `
      )
      .eq("id", consultantId)
      .eq("organization_id", orgId)
      .single();

    if (error || !consultant) {
      return NextResponse.json(
        { error: "Consultant not found" },
        { status: 404 }
      );
    }

    // Transform to camelCase
    const transformed = consultantFromDb(consultant);

    return NextResponse.json({ consultant: transformed });
  } catch (error) {
    console.error(
      "Error in GET /api/organizations/[orgId]/consultants/[consultantId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[orgId]/consultants/[consultantId]
 * Update a consultant's details or role
 */
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ orgId: string; consultantId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const { orgId, consultantId } = resolvedParams;

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
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins can update consultants." },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdateConsultantRequest = await request.json();
    const {
      nom,
      prenom,
      email,
      phone,
      role,
      managerId,
      avatarUrl,
      dateEmbauche,
      tauxJournalierCout,
      tauxJournalierVente,
      jobTitle,
      statut
    } = body;

    // Validate role if provided
    if (role && !Object.values(ConsultantRole).includes(role as ConsultantRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN, MANAGER, or CONSULTANT" },
        { status: 400 }
      );
    }

    // Get existing consultant
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, nom, prenom, role")
      .eq("id", consultantId)
      .eq("organization_id", orgId)
      .single();

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Consultant not found" },
        { status: 404 }
      );
    }

    // Prepare profile update data
    const profileUpdate = consultantForProfileUpdate(body);

    // Prepare consultant_details update data
    const detailsUpdate = consultantForDetailsUpdate(body);

    if (Object.keys(profileUpdate).length === 0 && Object.keys(detailsUpdate).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update profile if there are changes
    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", consultantId)
        .eq("organization_id", orgId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
    }

    // Update consultant_details if there are changes
    if (Object.keys(detailsUpdate).length > 0) {
      const { error: detailsError } = await supabase
        .from("consultant_details")
        .update(detailsUpdate)
        .eq("profile_id", consultantId)
        .eq("organization_id", orgId);

      if (detailsError) {
        console.error("Error updating consultant details:", detailsError);
        return NextResponse.json(
          { error: "Failed to update consultant details" },
          { status: 500 }
        );
      }
    }

    // Fetch updated consultant
    const { data: consultant, error: fetchError } = await supabase
      .from("profiles")
      .select(
        `
        *,
        consultant_details (
          date_embauche,
          taux_journalier_cout,
          taux_journalier_vente,
          statut,
          job_title
        ),
        manager:manager_id (
          id,
          nom,
          prenom,
          email
        )
      `
      )
      .eq("id", consultantId)
      .single();

    if (fetchError) {
      console.error("Error fetching updated consultant:", fetchError);
      return NextResponse.json(
        { error: "Consultant updated but failed to fetch" },
        { status: 500 }
      );
    }

    // Log activity
    const changes = [];
    if (nom) changes.push(`nom: ${nom}`);
    if (prenom) changes.push(`prenom: ${prenom}`);
    if (email) changes.push(`email: ${email}`);
    if (role && role !== existingProfile.role)
      changes.push(`role: ${existingProfile.role} → ${role}`);
    if (jobTitle) changes.push(`jobTitle: ${jobTitle}`);
    if (statut) changes.push(`statut: ${statut}`);

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: orgId,
      action: "CONSULTANT_UPDATED",
      description: `Updated consultant ${existingProfile.prenom} ${existingProfile.nom}: ${changes.join(", ")}`,
      metadata: { consultantId, changes },
    });

    // Transform response
    const transformed = consultantFromDb(consultant);

    return NextResponse.json({ consultant: transformed });
  } catch (error) {
    console.error(
      "Error in PATCH /api/organizations/[orgId]/consultants/[consultantId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[orgId]/consultants/[consultantId]
 * Remove a consultant from an organization
 */
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ orgId: string; consultantId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const { orgId, consultantId } = resolvedParams;

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
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins can remove consultants." },
        { status: 403 }
      );
    }

    // Get consultant info before deletion
    const { data: consultant } = await supabase
      .from("profiles")
      .select("id, nom, prenom, role")
      .eq("id", consultantId)
      .eq("organization_id", orgId)
      .single();

    if (!consultant) {
      return NextResponse.json(
        { error: "Consultant not found" },
        { status: 404 }
      );
    }

    // Delete consultant_details (this removes consultant status, but profile remains)
    const { error: deleteError } = await supabase
      .from("consultant_details")
      .delete()
      .eq("profile_id", consultantId)
      .eq("organization_id", orgId);

    if (deleteError) {
      console.error("Error deleting consultant details:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete consultant" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: orgId,
      action: "CONSULTANT_REMOVED",
      description: `Removed consultant status from ${consultant.prenom} ${consultant.nom} (${consultant.role})`,
      metadata: { profileId: consultantId, role: consultant.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error in DELETE /api/organizations/[orgId]/consultants/[consultantId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
