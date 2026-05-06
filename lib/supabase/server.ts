/**
 * Server-side Supabase clients.
 *
 * - `getSupabaseServer()` — uses the user's session cookies. Reads/writes are
 *   subject to RLS. Use when you need to know who is logged in.
 * - `getSupabaseAdmin()` — uses the service-role key. Bypasses RLS. Use ONLY
 *   on the server, after you have already authenticated and authorized the
 *   request via getSupabaseServer().
 */
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function publicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  }
  return { url, anonKey };
}

export async function getSupabaseServer() {
  const { url, anonKey } = publicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Setting cookies during a server component render is forbidden;
          // ignore — middleware/Route Handlers are responsible for refreshing
          // sessions.
        }
      },
    },
  });
}

export function getSupabaseAdmin() {
  const { url } = publicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set on the server");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getStoragePublicUrl(storagePath: string): string {
  const { url } = publicEnv();
  return `${url}/storage/v1/object/public/photos/${storagePath}`;
}
