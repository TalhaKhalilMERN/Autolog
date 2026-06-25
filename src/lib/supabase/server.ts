import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client.
 *
 * Use this inside:
 * - Route Handlers  (src/app/api/**)
 * - Server Components
 * - Server Actions
 *
 * It reads/writes the auth session through Next.js cookies so the user stays
 * logged in across server and client renders without any extra work.
 *
 * Must be called inside an async context (Route Handler, Server Component, etc.)
 * because it awaits the Next.js cookies() store.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component where cookies are
            // read-only. Safe to ignore — the middleware will handle refresh.
          }
        },
      },
    }
  );
}
