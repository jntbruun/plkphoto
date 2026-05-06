import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { isAllowedEmail, signMagicLink } from "@/lib/admin/auth";

const RequestSchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  // Always return 200 so we don't leak which addresses are allowed.
  if (!isAllowedEmail(email)) {
    return NextResponse.json({ ok: true });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADMIN_MAGIC_LINK_FROM;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (!apiKey || !from) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const token = await signMagicLink(email);
  const url = `${siteUrl}/admin/login/verify?token=${encodeURIComponent(token)}`;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: email,
    subject: "Sign in to PLKPHOTO admin",
    text: `Click this link to sign in. The link expires in 15 minutes.\n\n${url}\n\nIf you didn't request this, ignore the email.`,
    html: `
      <p>Click the link below to sign in to the PLKPHOTO admin. It expires in 15 minutes.</p>
      <p><a href="${url}">Sign in to admin</a></p>
      <p>If you didn't request this, ignore the email.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
