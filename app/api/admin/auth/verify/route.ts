import { NextResponse } from "next/server";
import { getSession, verifyMagicLink } from "@/lib/admin/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login?error=missing", url));
  }
  const result = await verifyMagicLink(token);
  if (!result) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", url));
  }
  const session = await getSession();
  session.email = result.email;
  session.loggedInAt = Date.now();
  // @ts-expect-error iron-session attaches save() at runtime
  await session.save?.();
  return NextResponse.redirect(new URL("/admin", url));
}
