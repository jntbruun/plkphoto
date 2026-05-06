/**
 * One-shot migration: takes the current content/images.{generated,metadata}.json
 * and the public/images/photos/wildlife/*.jpg files and:
 *
 *   1. Uploads each JPG to Supabase Storage (bucket: photos)
 *   2. Inserts a corresponding row in the public.photos table
 *
 * Idempotent: if a slug already exists, it skips. Safe to re-run.
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: npx tsx scripts/migrateToSupabase.ts
 */
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface GeneratedRow {
  slug: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  camera?: string;
  lens?: string;
  capturedAt?: string;
}

interface MetadataRow {
  slug: string;
  collection: "wildlife" | "nature" | "other";
  title: { no: string; en: string };
  latinName?: string;
  location: { no: string; en: string };
  date: string;
  camera?: string;
  lens?: string;
  alt: { no: string; en: string };
  description?: { no: string; en: string };
  featuredOnHome: boolean;
  availableAsPrint: boolean;
  printSizes?: string[];
  metadataStatus?: "placeholder" | "confirmed";
  confidence?: "low" | "medium" | "high";
}

async function main() {
  const root = process.cwd();
  const generated = JSON.parse(
    readFileSync(join(root, "content/images.generated.json"), "utf-8"),
  ) as GeneratedRow[];
  const metadata = JSON.parse(
    readFileSync(join(root, "content/images.metadata.json"), "utf-8"),
  ) as MetadataRow[];

  const generatedBySlug = new Map(generated.map((g) => [g.slug, g]));

  let uploaded = 0;
  let skipped = 0;
  let errored = 0;

  for (const m of metadata) {
    const g = generatedBySlug.get(m.slug);
    if (!g) {
      console.warn(`[skip] ${m.slug} — no generated entry`);
      errored++;
      continue;
    }

    const localPath = join(root, "public", g.src.replace(/^\//, ""));
    let buffer: Buffer;
    try {
      buffer = readFileSync(localPath);
    } catch {
      console.warn(`[skip] ${m.slug} — file not found at ${localPath}`);
      errored++;
      continue;
    }

    const storagePath = `${m.collection}/${m.slug}.jpg`;

    // Upload (skip if exists)
    const { error: uploadErr } = await supabase.storage
      .from("photos")
      .upload(storagePath, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      });
    if (uploadErr && !/already exists|Duplicate/i.test(uploadErr.message)) {
      console.error(`[err]  ${m.slug} upload — ${uploadErr.message}`);
      errored++;
      continue;
    }

    // Insert (skip if slug exists)
    const { error: insertErr } = await supabase.from("photos").insert({
      slug: m.slug,
      collection: m.collection,
      title_no: m.title.no,
      title_en: m.title.en,
      latin_name: m.latinName ?? null,
      location_no: m.location.no ?? "",
      location_en: m.location.en ?? "",
      date: m.date,
      camera: m.camera ?? g.camera ?? null,
      lens: m.lens ?? g.lens ?? null,
      alt_no: m.alt.no,
      alt_en: m.alt.en,
      description_no: m.description?.no ?? null,
      description_en: m.description?.en ?? null,
      featured_on_home: m.featuredOnHome,
      available_as_print: m.availableAsPrint,
      print_sizes: m.printSizes ?? null,
      metadata_status: m.metadataStatus ?? "placeholder",
      confidence: m.confidence ?? "high",
      storage_path: storagePath,
      width: g.width,
      height: g.height,
      blur_data_url: g.blurDataURL,
    });
    if (insertErr) {
      if (insertErr.code === "23505") {
        console.log(`[skip] ${m.slug} — already in db`);
        skipped++;
        continue;
      }
      console.error(`[err]  ${m.slug} insert — ${insertErr.message}`);
      errored++;
      continue;
    }

    uploaded++;
    if (uploaded % 10 === 0) console.log(`  …${uploaded}/${metadata.length}`);
  }

  console.log(`\nDone. Inserted ${uploaded}, skipped ${skipped}, errored ${errored}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
