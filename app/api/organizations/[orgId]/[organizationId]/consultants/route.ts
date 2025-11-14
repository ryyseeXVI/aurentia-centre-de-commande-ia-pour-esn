import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import {
  consultantFromDb,
  consultantForInsert,
} from "@/utils/consultant-transformers";
import type { ConsultantDb } from "@/types/consultants";
import { ConsultantRole } from "@/types/consultants";

/**
 * GET /api/organizations/[organizationId]/consultants
 * List all consultants in an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const organizationId = resolvedParams.organizationId;

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
      .eq("organization_id", organizationId)
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

    // Build query
    let query = supabase
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
      `,
        { count: "exact" }
      )
      .eq("organization_id", organizationId)
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
      consultantFromDb(c as ConsultantDb & { profile?: any })
    );

    return NextResponse.json({
      consultants: transformed,
      total: count || 0,
    });
  } catch (error) {
    console.error(
      "Error in GET /api/organizations/[organizationId]/consultants:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[organizationId]/consultants
 * Create a new consultant in an organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const organizationId = resolvedParams.organizationId;

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
      .eq("organization_id", organizationId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins can add consultants." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, nom, prenom, role = "CONSULTANT" } = body;

    if (!email || !nom || !prenom) {
      return NextResponse.json(
        { error: "Email, nom, and prenom are required" },
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

    // Find user by email in profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, nom, prenom, email, avatar_url")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    // Check if consultant already exists
    const { data: existingConsultant } = await supabase
      .from("consultant")
      .select("id")
      .eq("user_id", profile.id)
      .eq("organization_id", organizationId)
      .single();

    if (existingConsultant) {
      return NextResponse.json(
        { error: "User is already a consultant in this organization" },
        { status: 400 }
      );
    }

    // Create consultant
    const consultantData = consultantForInsert(
      { email, nom, prenom, role: role as ConsultantRole },
      organizationId,
      profile.id
    );

    const { data: consultant, error: insertError } = await supabase
      .from("consultant")
      .insert(consultantData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating consultant:", insertError);
      return NextResponse.json(
        { error: "Failed to create consultant" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: organizationId,
      action: "CONSULTANT_ADDED",
      description: `Added ${prenom} ${nom} as ${role}`,
      metadata: { consultantId: consultant.id, role },
    });

    // Transform response
    const transformed = consultantFromDb({
      ...consultant,
      profile,
    } as ConsultantDb & { profile?: any });

    return NextResponse.json({ consultant: transformed }, { status: 201 });
  } catch (error) {
    console.error(
      "Error in POST /api/organizations/[organizationId]/consultants:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
