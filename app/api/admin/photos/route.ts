import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/admin/auth";
import { processUpload } from "@/lib/admin/image-pipeline";
import { canonicalSpecies, nextSlug } from "@/lib/admin/slug";
import { commitFiles } from "@/lib/admin/github";
import {
  PATHS,
  addPhoto,
  existingSlugs,
  readCurrentState,
} from "@/lib/admin/metadata-writer";
import type { GeneratedImageData } from "@/content/images.generated";
import type { PhotoMetadata } from "@/content/images.metadata";
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
  const session = await getSession();
  if (!session.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const photos = getPhotos();
  return NextResponse.json({ photos });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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

  const state = await readCurrentState();
  const { slugBase } = canonicalSpecies(f.commonNameEn);
  const slug = nextSlug(slugBase, existingSlugs(state));

  const date = f.date ?? processed.capturedAt ?? new Date().toISOString().slice(0, 10);

  const generated: GeneratedImageData = {
    slug,
    src: `/images/photos/${f.collection}/${slug}.jpg`,
    width: processed.width,
    height: processed.height,
    blurDataURL: processed.blurDataURL,
    camera: processed.camera,
    lens: processed.lens,
    capturedAt: processed.capturedAt,
  };

  const metadata: PhotoMetadata = {
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
  };

  const changes = addPhoto(state, generated, metadata);

  const commit = await commitFiles({
    message: `Add photo: ${slug}`,
    files: [
      {
        path: `public/images/photos/${f.collection}/${slug}.jpg`,
        content: processed.buffer,
      },
      { path: PATHS.generated, content: changes.generatedJson },
      { path: PATHS.metadata, content: changes.metadataJson },
    ],
  });

  return NextResponse.json({ slug, commit });
}
