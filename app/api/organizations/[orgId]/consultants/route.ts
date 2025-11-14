// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import {
  consultantFromDb,
  consultantForProfileInsert,
  consultantForDetailsInsert,
} from "@/utils/consultant-transformers";
import type { CreateConsultantRequest } from "@/types/consultants";
import { ConsultantRole } from "@/types/consultants";

/**
 * GET /api/organizations/[orgId]/consultants
 * List all consultants in an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const orgId = resolvedParams.orgId;

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
      .select("id, role")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this organization" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    // Build query - fetch profiles with role='CONSULTANT' and join with consultant_details
    let query = supabase
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
      `,
        { count: "exact" }
      )
      .eq("organization_id", orgId)
      .eq("role", "CONSULTANT")
      .order("created_at", { ascending: false });

    // Apply filters
    if (role && Object.values(ConsultantRole).includes(role as ConsultantRole)) {
      query = query.eq("role", role);
    }

    if (search) {
      query = query.or(
        `nom.ilike.%${search}%,prenom.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data: consultants, error, count } = await query;

    if (error) {
      console.error("Error fetching consultants:", error);
      return NextResponse.json(
        { error: "Failed to fetch consultants" },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformed = (consultants || []).map((c: any) =>
      consultantFromDb(c)
    );

    return NextResponse.json({
      consultants: transformed,
      total: count || 0,
    });
  } catch (error) {
    console.error(
      "Error in GET /api/organizations/[orgId]/consultants:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[orgId]/consultants
 * Create a new consultant in an organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const orgId = resolvedParams.orgId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user has admin/manager access
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "OWNER"].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins and owners can add consultants." },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateConsultantRequest = await request.json();
    const {
      email,
      nom,
      prenom,
      phone,
      role = "CONSULTANT",
      managerId,
      dateEmbauche,
      tauxJournalierCout,
      tauxJournalierVente,
      jobTitle,
      statut = "AVAILABLE"
    } = body;

    // Validate required fields
    if (!email || !nom || !prenom || !dateEmbauche || !tauxJournalierCout) {
      return NextResponse.json(
        { error: "Email, nom, prenom, dateEmbauche, and tauxJournalierCout are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(ConsultantRole).includes(role as ConsultantRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN, MANAGER, or CONSULTANT" },
        { status: 400 }
      );
    }

    // Check if profile already exists with this email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("email", email)
      .eq("organization_id", orgId)
      .single();

    let profileId: string;

    if (existingProfile) {
      // Profile exists, check if they already have consultant_details
      const { data: existingDetails } = await supabase
        .from("consultant_details")
        .select("id")
        .eq("profile_id", (existingProfile as any).id)
        .eq("organization_id", orgId)
        .single();

      if (existingDetails) {
        return NextResponse.json(
          { error: "User is already a consultant in this organization" },
          { status: 400 }
        );
      }

      // Update existing profile's role to CONSULTANT
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role, manager_id: managerId || null })
        .eq("id", (existingProfile as any).id);

      if (updateError) {
        console.error("Error updating profile role:", updateError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }

      profileId = (existingProfile as any).id;
    } else {
      // Create new profile
      const profileData = consultantForProfileInsert(body, orgId);

      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error("Error creating profile:", profileError);
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }

      profileId = (newProfile as any).id;
    }

    // Create consultant_details
    const detailsData = consultantForDetailsInsert(body, profileId, orgId);

    const { error: detailsError } = await supabase
      .from("consultant_details")
      .insert(detailsData);

    if (detailsError) {
      console.error("Error creating consultant details:", detailsError);
      return NextResponse.json(
        { error: "Failed to create consultant details" },
        { status: 500 }
      );
    }

    // Fetch complete consultant data with joins
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
      .eq("id", profileId)
      .single();

    if (fetchError) {
      console.error("Error fetching created consultant:", fetchError);
      return NextResponse.json(
        { error: "Consultant created but failed to fetch" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: orgId,
      action: "CONSULTANT_ADDED",
      description: `Added ${prenom} ${nom} as ${role}`,
      metadata: { profileId, role },
    });

    // Transform response
    const transformed = consultantFromDb(consultant);

    return NextResponse.json({ consultant: transformed }, { status: 201 });
  } catch (error) {
    console.error(
      "Error in POST /api/organizations/[orgId]/consultants:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
