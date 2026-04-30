/**
 * importPhotos.ts
 *
 * Reads ~/Desktop/wildlife-id/work/manifest.csv and ingests every original
 * photo it points to into the site:
 *
 * 1. Copy each original from `originals[0]` to /public/images/photos/wildlife/<slug>.jpg
 * 2. Read EXIF (camera, lens, capture date) via exifr
 * 3. Read dimensions + blur placeholder via plaiceholder
 * 4. Generate human metadata (NO/EN/Latin) using the by-species folder as EN→NO map
 * 5. Write content/images.generated.ts AND content/images.metadata.ts (full rewrite)
 *
 * Run: npm run import-photos
 */

import fs from "fs";
import path from "path";
import os from "os";
import sharp from "sharp";
import { getPlaiceholder } from "plaiceholder";
import exifr from "exifr";

// Web display target — long edge in pixels.
const MAX_LONG_EDGE = 2400;
const JPEG_QUALITY = 82;

// Perceptual hash threshold (Hamming distance on a 64-bit aHash).
// 0 = identical, ~5 = visually identical, ~10+ = same scene different frame.
const PHASH_DUPLICATE_THRESHOLD = 6;

const MANIFEST_PATH = path.join(os.homedir(), "Desktop/wildlife-id/work/manifest.csv");
const BY_SPECIES_DIR = path.join(os.homedir(), "Desktop/wildlife-id/work/by-species");
const DEST_DIR = path.resolve(process.cwd(), "public/images/photos/wildlife");
const OUT_GENERATED = path.resolve(process.cwd(), "content/images.generated.ts");
const OUT_METADATA = path.resolve(process.cwd(), "content/images.metadata.ts");

// ---------- CSV parsing ----------

interface ManifestRow {
  hash: string;
  copy: string;
  originals: string[];
  common_name: string;
  scientific_name: string;
  confidence: "low" | "medium" | "high";
  notes: string;
}

function parseCsv(text: string): ManifestRow[] {
  // Minimal CSV parser supporting quoted fields with embedded commas/quotes/newlines.
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  if (!header) return [];
  const idx = (name: string) => header.indexOf(name);
  return body
    .filter((r) => r.length >= header.length && r[idx("hash")])
    .map((r) => ({
      hash: r[idx("hash")]!,
      copy: r[idx("copy")]!,
      originals: r[idx("originals")]!.split(";").map((s) => s.trim()).filter(Boolean),
      common_name: r[idx("common_name")]!,
      scientific_name: r[idx("scientific_name")]!,
      confidence: (r[idx("confidence")] || "medium") as ManifestRow["confidence"],
      notes: r[idx("notes")] || "",
    }));
}

// ---------- EN → NO map ----------

function buildSpeciesMap(): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(BY_SPECIES_DIR)) return map;
  for (const folder of fs.readdirSync(BY_SPECIES_DIR)) {
    const m = folder.match(/^(.+?) - (.+)$/);
    if (!m) continue;
    const [, en, no] = m;
    map.set(en!.toLowerCase(), no!);
  }
  return map;
}

// Manual additions / overrides for species not in the folder or where the
// manifest's common_name doesn't match the folder name.
const MANUAL_NO: Record<string, string> = {
  "eurasian red squirrel": "ekorn",
};

function lookupNorwegian(commonName: string, map: Map<string, string>): string {
  const key = commonName.toLowerCase();
  return map.get(key) ?? MANUAL_NO[key] ?? commonName;
}

// ---------- Slug normalization ----------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Group manifest rows under a canonical species slug.
// Lion + Lioness collapse to "lion". Stoat variants collapse to "stoat".
function canonicalSpecies(commonName: string, scientific: string): {
  slugBase: string;
  enLabel: string;
  noOverride?: string;
} {
  const lc = commonName.toLowerCase();
  if (lc === "lion" || lc === "lioness") {
    return { slugBase: "lion", enLabel: "Lion" };
  }
  if (lc.startsWith("stoat")) {
    return { slugBase: "stoat", enLabel: "Stoat" };
  }
  if (lc === "eurasian red squirrel") {
    return { slugBase: "eurasian-red-squirrel", enLabel: "Eurasian Red Squirrel" };
  }
  return { slugBase: slugify(commonName), enLabel: commonName };
}

// ---------- EXIF ----------

function formatCamera(make?: string, model?: string): string | undefined {
  if (!model) return undefined;
  if (make && !model.toLowerCase().includes(make.toLowerCase())) {
    return `${make} ${model}`.trim();
  }
  return model.trim();
}

// ---------- Perceptual hash (aHash) ----------

async function perceptualHash(filePath: string): Promise<bigint> {
  const buf = await sharp(filePath)
    .rotate()
    .resize(8, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i]!;
  const avg = sum / buf.length;
  let h = 0n;
  for (let i = 0; i < buf.length; i++) {
    h = (h << 1n) | (buf[i]! >= avg ? 1n : 0n);
  }
  return h;
}

function hammingDistance(a: bigint, b: bigint): number {
  let x = a ^ b;
  let d = 0;
  while (x) {
    d += Number(x & 1n);
    x >>= 1n;
  }
  return d;
}

// Strip trailing "-N" before the extension (DxO/Lightroom alt-export pattern).
function dedupBasename(p: string): string {
  return path.basename(p).replace(/-\d+(\.[a-z]+)$/i, "$1");
}

async function readExif(buffer: Buffer): Promise<{
  camera?: string;
  lens?: string;
  capturedAt?: string;
}> {
  try {
    const data = await exifr.parse(buffer, {
      pick: ["Make", "Model", "LensModel", "LensMake", "DateTimeOriginal"],
    });
    if (!data) return {};
    return {
      camera: formatCamera(data.Make, data.Model),
      lens: formatCamera(data.LensMake, data.LensModel),
      capturedAt: data.DateTimeOriginal
        ? new Date(data.DateTimeOriginal).toISOString().slice(0, 10)
        : undefined,
    };
  } catch {
    return {};
  }
}

// ---------- Output ----------

interface GeneratedImage {
  slug: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  camera?: string;
  lens?: string;
  capturedAt?: string;
}

interface MetadataEntry {
  slug: string;
  collection: "wildlife";
  title: { no: string; en: string };
  latinName: string;
  location: { no: string; en: string };
  date: string;
  alt: { no: string; en: string };
  featuredOnHome: boolean;
  availableAsPrint: boolean;
  metadataStatus: "placeholder" | "confirmed";
  confidence: "low" | "medium" | "high";
}

function jsonString(v: string): string {
  return JSON.stringify(v);
}

function escapeForTs(v?: string): string {
  return v === undefined ? "undefined" : JSON.stringify(v);
}

async function run() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  // Wipe any old jpgs so removed entries don't linger.
  for (const f of fs.readdirSync(DEST_DIR)) {
    if (/\.(jpg|jpeg|png|webp)$/i.test(f)) {
      fs.unlinkSync(path.join(DEST_DIR, f));
    }
  }

  const speciesMap = buildSpeciesMap();
  const rawManifest = parseCsv(fs.readFileSync(MANIFEST_PATH, "utf-8"));

  // Pass 1: drop manifest rows whose `originals[0]` collapses to the same
  // base filename as a previously-seen row (handles `IMG-2.jpg` re-exports).
  const seenBasenames = new Map<string, number>();
  const fileDeduped: ManifestRow[] = [];
  for (const row of rawManifest) {
    const original = row.originals[0];
    if (!original) continue;
    const key = dedupBasename(original);
    if (seenBasenames.has(key)) {
      console.log(`  [dedup-name] ${path.basename(original)} drops (matches earlier ${key})`);
      continue;
    }
    seenBasenames.set(key, fileDeduped.length);
    fileDeduped.push(row);
  }

  // Pass 2: perceptual-hash dedup so byte-different but visually identical
  // bursts collapse too. Compare against earlier accepted rows from the same
  // common_name (limits N²). Distance ≤ threshold → drop.
  const accepted: { row: ManifestRow; phash: bigint }[] = [];
  for (const row of fileDeduped) {
    const original = row.originals[0]!;
    if (!fs.existsSync(original)) {
      console.warn(`  [skip] missing original: ${original}`);
      continue;
    }
    const phash = await perceptualHash(original);
    const dupe = accepted.find(
      (a) =>
        a.row.common_name.toLowerCase() === row.common_name.toLowerCase() &&
        hammingDistance(a.phash, phash) <= PHASH_DUPLICATE_THRESHOLD,
    );
    if (dupe) {
      console.log(
        `  [dedup-phash] ${path.basename(original)} drops (≈ ${path.basename(dupe.row.originals[0]!)})`,
      );
      continue;
    }
    accepted.push({ row, phash });
  }
  const manifest = accepted.map((a) => a.row);

  // Counter per species slug to disambiguate duplicates: e.g. lion-1, lion-2…
  const counters = new Map<string, number>();

  const generated: GeneratedImage[] = [];
  const metadata: MetadataEntry[] = [];

  for (const row of manifest) {
    const original = row.originals[0];
    if (!original || !fs.existsSync(original)) {
      console.warn(`  [skip] missing original: ${original}`);
      continue;
    }

    const { slugBase, enLabel } = canonicalSpecies(row.common_name, row.scientific_name);
    const n = (counters.get(slugBase) ?? 0) + 1;
    counters.set(slugBase, n);
    const slug = `${slugBase}-${String(n).padStart(2, "0")}`;

    const destFile = path.join(DEST_DIR, `${slug}.jpg`);

    // Resize + recompress for web. EXIF kept so camera/lens/date still read.
    await sharp(original)
      .rotate() // honor EXIF orientation
      .resize({
        width: MAX_LONG_EDGE,
        height: MAX_LONG_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .withMetadata()
      .toFile(destFile);

    const buffer = fs.readFileSync(destFile);
    const { base64, metadata: dim } = await getPlaiceholder(buffer, { size: 10 });
    const exif = await readExif(buffer);

    generated.push({
      slug,
      src: `/images/photos/wildlife/${slug}.jpg`,
      width: dim.width ?? 1200,
      height: dim.height ?? 800,
      blurDataURL: base64,
      ...exif,
    });

    const noName = lookupNorwegian(row.common_name, speciesMap);
    const enName = enLabel;
    const fallbackDate = exif.capturedAt ?? "2024-01-01";

    metadata.push({
      slug,
      collection: "wildlife",
      title: { no: capitalize(noName), en: enName },
      latinName: row.scientific_name,
      location: { no: "", en: "" },
      date: fallbackDate,
      alt: {
        no: `${capitalize(noName)} i naturen`,
        en: `${enName} in the wild`,
      },
      featuredOnHome: false,
      availableAsPrint: false,
      metadataStatus: "placeholder",
      confidence: row.confidence,
    });

    console.log(`  [ok] ${slug}  (${row.common_name} · ${row.confidence})`);
  }

  // Mark a curated set as featured: first photo per top species, capped at 6.
  const featuredSlugs = new Set<string>();
  const seenSpecies = new Set<string>();
  for (const m of metadata) {
    const base = m.slug.replace(/-\d+$/, "");
    if (m.confidence !== "high") continue;
    if (seenSpecies.has(base)) continue;
    seenSpecies.add(base);
    featuredSlugs.add(m.slug);
    if (featuredSlugs.size >= 6) break;
  }
  for (const m of metadata) {
    if (featuredSlugs.has(m.slug)) m.featuredOnHome = true;
  }

  // ----- Write images.generated.ts -----
  const genLines = [
    "// AUTO-GENERATED by scripts/importPhotos.ts — do not edit manually",
    "// Re-run: npm run import-photos",
    "",
    "export interface GeneratedImageData {",
    "  slug: string;",
    "  src: string;",
    "  width: number;",
    "  height: number;",
    "  blurDataURL: string;",
    "  camera?: string;",
    "  lens?: string;",
    "  capturedAt?: string;",
    "}",
    "",
    "export const generatedImages: GeneratedImageData[] = [",
    ...generated.map(
      (r) =>
        `  { slug: ${jsonString(r.slug)}, src: ${jsonString(r.src)}, width: ${r.width}, height: ${r.height}, blurDataURL: ${jsonString(r.blurDataURL)}, camera: ${escapeForTs(r.camera)}, lens: ${escapeForTs(r.lens)}, capturedAt: ${escapeForTs(r.capturedAt)} },`,
    ),
    "];",
    "",
  ];
  fs.writeFileSync(OUT_GENERATED, genLines.join("\n"), "utf-8");

  // ----- Write images.metadata.ts -----
  const metaLines = [
    "/**",
    " * images.metadata.ts",
    " *",
    " * AUTO-GENERATED from ~/Desktop/wildlife-id/work/manifest.csv via scripts/importPhotos.ts.",
    " * Hand-edits to title/location can be made here, but will be overwritten if the importer is re-run.",
    " * Re-run: npm run import-photos",
    " */",
    "",
    `import type { CollectionId, LocalizedString } from "@/types/content";`,
    "",
    "export interface PhotoMetadata {",
    "  slug: string;",
    "  collection: CollectionId;",
    "  title: LocalizedString;",
    "  latinName?: string;",
    "  location: LocalizedString;",
    "  date: string;",
    "  camera?: string;",
    "  lens?: string;",
    "  alt: LocalizedString;",
    "  description?: LocalizedString;",
    "  featuredOnHome: boolean;",
    "  availableAsPrint: boolean;",
    "  printSizes?: string[];",
    "  wallMockup?: string;",
    `  metadataStatus?: "placeholder" | "confirmed";`,
    `  confidence?: "low" | "medium" | "high";`,
    "}",
    "",
    "export const photoMetadata: PhotoMetadata[] = [",
    ...metadata.map(
      (m) =>
        `  { slug: ${jsonString(m.slug)}, collection: ${jsonString(m.collection)}, title: { no: ${jsonString(m.title.no)}, en: ${jsonString(m.title.en)} }, latinName: ${jsonString(m.latinName)}, location: { no: ${jsonString(m.location.no)}, en: ${jsonString(m.location.en)} }, date: ${jsonString(m.date)}, alt: { no: ${jsonString(m.alt.no)}, en: ${jsonString(m.alt.en)} }, featuredOnHome: ${m.featuredOnHome}, availableAsPrint: ${m.availableAsPrint}, metadataStatus: ${jsonString(m.metadataStatus)}, confidence: ${jsonString(m.confidence)} },`,
    ),
    "];",
    "",
  ];
  fs.writeFileSync(OUT_METADATA, metaLines.join("\n"), "utf-8");

  console.log(`\nWrote ${generated.length} images.`);
  console.log(`  → ${OUT_GENERATED}`);
  console.log(`  → ${OUT_METADATA}`);
  console.log(`Featured on home: ${[...featuredSlugs].join(", ")}`);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
