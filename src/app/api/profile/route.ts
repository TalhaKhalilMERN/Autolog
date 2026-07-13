import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile, updateUserProfile } from "@/lib/services/profile";
import type { UserProfileUpdate } from "@/lib/types";

/**
 * GET /api/profile
 *
 * Retrieves the current authenticated user's profile details.
 */
export async function GET() {
  const supabase = await createClient();

  const result = await getUserProfile(supabase);

  if (result.error) {
    const isAuthError = result.error.includes("No authenticated user") || result.error.toLowerCase().includes("unauthorized");
    return NextResponse.json(
      { error: result.error },
      { status: isAuthError ? 401 : 500 }
    );
  }

  return NextResponse.json({ data: result.data });
}

/**
 * PUT /api/profile
 *
 * Updates the current authenticated user's profile metadata.
 * Body: UserProfileUpdate
 */
export async function PUT(request: Request) {
  const supabase = await createClient();

  // Simple auth check first
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UserProfileUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { full_name, country, timezone } = body;

  // Validation
  if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2 || full_name.trim().length > 80) {
    return NextResponse.json(
      { error: "Full Name is required and must be between 2 and 80 characters." },
      { status: 422 }
    );
  }

  if (country !== undefined && country !== null && (typeof country !== "string" || country.length > 100)) {
    return NextResponse.json(
      { error: "Country must be a string and under 100 characters." },
      { status: 422 }
    );
  }

  if (timezone !== undefined && timezone !== null && typeof timezone !== "string") {
    return NextResponse.json(
      { error: "Timezone must be a valid string." },
      { status: 422 }
    );
  }

  const result = await updateUserProfile(supabase, {
    full_name: full_name.trim(),
    country: country ? country.trim() : null,
    timezone: timezone ? timezone.trim() : null,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
