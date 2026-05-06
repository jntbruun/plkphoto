import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { processUpload } from "@/lib/admin/image-pipeline";
import { canonicalSpecies, nextSlug } from "@/lib/admin/slug";
import {
  insertPhoto,
  listExistingSlugs,
  uploadPhotoBinary,
  type PhotoInsert,
} from "@/lib/admin/photos-repo";
import { getPhotos } from "@/content/images";

const FormSchema = z.object({
  collection: z.enum(["wildlife", "nature", "other"]).default("wildlife"),
  commonNameEn: z.string().min(1).max(120),
  commonNameNo: z.string().min(1).max(120),
  latinName: z.string().max(120).optional(),
  locationNo: z.string().max(160).default(""),
  locationEn: z.string().max(160).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  featuredOnHome: z.coerce.boolean().default(false),
  availableAsPrint: z.coerce.boolean().default(true),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const photos = await getPhotos();
  return NextResponse.json({ photos });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const fields = Object.fromEntries(
    Array.from(form.entries()).filter(([k]) => k !== "file"),
  );
  const parsed = FormSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid fields", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const f = parsed.data;

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  if (inputBuffer.byteLength > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: "file too large; resize to <4MB before upload" },
      { status: 413 },
    );
  }

  const processed = await processUpload(inputBuffer);

  const { slugBase } = canonicalSpecies(f.commonNameEn);
  const slug = nextSlug(slugBase, await listExistingSlugs());

  const date = f.date ?? processed.capturedAt ?? new Date().toISOString().slice(0, 10);
  const storagePath = `${f.collection}/${slug}.jpg`;

  // Storage first; if it fails, we never insert a row pointing at a missing file.
  await uploadPhotoBinary(storagePath, processed.buffer);

  const insert: PhotoInsert = {
    slug,
    collection: f.collection,
    title: { no: f.commonNameNo, en: f.commonNameEn },
    latinName: f.latinName || undefined,
    location: { no: f.locationNo, en: f.locationEn },
    date,
    camera: processed.camera,
    lens: processed.lens,
    alt: {
      no: `${f.commonNameNo} i naturen`,
      en: `${f.commonNameEn} in the wild`,
    },
    featuredOnHome: f.featuredOnHome,
    availableAsPrint: f.availableAsPrint,
    metadataStatus: "confirmed",
    confidence: "high",
    storagePath,
    width: processed.width,
    height: processed.height,
    blurDataURL: processed.blurDataURL,
  };

  await insertPhoto(insert);

  return NextResponse.json({ slug });
}
