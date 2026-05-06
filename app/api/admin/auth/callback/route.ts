/**
 * Supabase magic-link callback. The link in the user's email lands here with
 * a one-time `code`; we exchange it for a session and redirect to /admin.
 */
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/admin/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=missing", url));
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAllowedEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?error=forbidden", url));
  }

  return NextResponse.redirect(new URL("/admin", url));
}
