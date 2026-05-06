/**
 * Browser-side Supabase client. Used in client components for sign-in flows
 * and to read the current session.
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
  }
  return createBrowserClient(url, anonKey);
}
