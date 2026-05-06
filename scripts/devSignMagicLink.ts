/**
 * Local-only: prints a valid magic-link URL using the secrets in .env.local.
 * Use this to smoke test the admin without configuring Resend.
 *
 * Run: npx tsx scripts/devSignMagicLink.ts
 */
import { SignJWT } from "jose";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf-8")
  .split("\n")
  .filter((l) => l && !l.startsWith("#"))
  .reduce<Record<string, string>>((acc, line) => {
    const idx = line.indexOf("=");
    if (idx > 0) acc[line.slice(0, idx)] = line.slice(idx + 1);
    return acc;
  }, {});

const secret = env.ADMIN_MAGIC_LINK_SECRET;
const email = env.ALLOWED_ADMIN_EMAILS?.split(",")[0]?.trim();
const port = process.argv[2] ?? "3000";

if (!secret) throw new Error("ADMIN_MAGIC_LINK_SECRET not in .env.local");
if (!email) throw new Error("ALLOWED_ADMIN_EMAILS not in .env.local");

async function main() {
  const token = await new SignJWT({
    email,
    nonce: randomBytes(16).toString("hex"),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(secret));

  console.log(
    `http://localhost:${port}/api/admin/auth/verify?token=${encodeURIComponent(token)}`,
  );
}

main();
