import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client.
 *
 * Uses the SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security.
 * NEVER import or expose this on the client side.
 * Only use this in API Routes or Server Actions.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
