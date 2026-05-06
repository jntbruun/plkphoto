/**
 * Admin auth helpers built on Supabase Auth.
 *
 * Authentication is handled by Supabase (magic-link OTP). Authorization — i.e.
 * "is this signed-in user actually an admin?" — happens at the API layer by
 * checking the user's email against ALLOWED_ADMIN_EMAILS.
 */
import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function getCurrentAdmin(): Promise<{ email: string } | null> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  if (!isAllowedEmail(user.email)) return null;
  return { email: user.email };
}

export function isAllowedEmail(email: string): boolean {
  const list = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
