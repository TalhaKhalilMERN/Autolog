import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * Use this inside Client Components ("use client") for things like:
 * - Auth state (onAuthStateChange)
 * - Reading data in client components via React Query
 *
 * The session is persisted automatically in the browser cookie/localStorage.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
