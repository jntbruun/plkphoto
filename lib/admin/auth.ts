/**
 * Auth for the admin area.
 *
 * - Magic link: short-lived signed JWT with a per-link nonce. The verify
 *   endpoint sets a long-lived iron-session cookie on success.
 * - Email whitelist via ALLOWED_ADMIN_EMAILS (comma-separated).
 * - No DB. The single-use guarantee comes from a tiny in-memory nonce store
 *   on the server. Acceptable because (a) one user, (b) tokens expire in 15
 *   minutes anyway, (c) re-using a link only works if the same Vercel
 *   function instance is hit. Worst case: a leaked link is usable twice
 *   within 15 min on different instances. Tradeoff accepted for now.
 */
import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, createHash } from "node:crypto";

export interface AdminSession {
  email?: string;
  loggedInAt?: number;
}

const SESSION_COOKIE_NAME = "plk_admin_session";

function sessionOptions(): SessionOptions {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set and at least 32 chars long");
  }
  return {
    password,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}

export async function getSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  return getIronSession<AdminSession>(cookieStore, sessionOptions());
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session.email) {
    throw new UnauthorizedError("Not signed in");
  }
  return session;
}

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export function isAllowedEmail(email: string): boolean {
  const list = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

// ---------- Magic link tokens ----------

const MAGIC_LINK_TTL_SECONDS = 15 * 60;
const usedNonces = new Set<string>();
// Periodic cleanup so the set doesn't grow unbounded.
setInterval(
  () => {
    if (usedNonces.size > 1000) usedNonces.clear();
  },
  60 * 60 * 1000,
).unref?.();

function magicLinkSecret(): Uint8Array {
  const secret = process.env.ADMIN_MAGIC_LINK_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_MAGIC_LINK_SECRET must be set and at least 32 chars long");
  }
  return new TextEncoder().encode(secret);
}

export async function signMagicLink(email: string): Promise<string> {
  const nonce = randomBytes(16).toString("hex");
  return new SignJWT({ email: email.toLowerCase(), nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAGIC_LINK_TTL_SECONDS}s`)
    .sign(magicLinkSecret());
}

export async function verifyMagicLink(
  token: string,
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, magicLinkSecret());
    const email = typeof payload.email === "string" ? payload.email : null;
    const nonce = typeof payload.nonce === "string" ? payload.nonce : null;
    if (!email || !nonce) return null;
    const nonceKey = createHash("sha256").update(nonce).digest("hex");
    if (usedNonces.has(nonceKey)) return null;
    usedNonces.add(nonceKey);
    if (!isAllowedEmail(email)) return null;
    return { email };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  // iron-session 8 stores under a Symbol; nuke fields and call destroy().
  // @ts-expect-error iron-session attaches destroy() at runtime
  await session.destroy?.();
}
