import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import ContactNotification from "@/emails/ContactNotification";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
  reference: z.string().max(200).optional(),
  // Honeypot — must be empty
  website: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, email, message, reference, website } = result.data;

    // Honeypot check
    if (website) {
      // Silently succeed to not reveal the honeypot
      return NextResponse.json({ ok: true });
    }

    const toEmail = process.env.CONTACT_TO_EMAIL;
    if (!toEmail) {
      console.error("CONTACT_TO_EMAIL env var not set");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "PLKPHOTO <onboarding@resend.dev>", // TODO: update to verified domain
      to: [toEmail],
      replyTo: email,
      subject: reference
        ? `Print-forespørsel: ${reference} — fra ${name}`
        : `Ny melding fra ${name}`,
      react: ContactNotification({ name, email, message, reference }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
