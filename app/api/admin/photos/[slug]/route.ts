import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/admin/auth";
import { commitFiles } from "@/lib/admin/github";
import {
  PATHS,
  deletePhoto,
  readCurrentState,
  updatePhoto,
} from "@/lib/admin/metadata-writer";

export const runtime = "nodejs";

const PatchSchema = z.object({
  collection: z.enum(["wildlife", "nature", "other"]).optional(),
  title: z.object({ no: z.string(), en: z.string() }).optional(),
  latinName: z.string().optional(),
  location: z.object({ no: z.string(), en: z.string() }).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  alt: z.object({ no: z.string(), en: z.string() }).optional(),
  description: z.object({ no: z.string(), en: z.string() }).optional(),
  featuredOnHome: z.boolean().optional(),
  availableAsPrint: z.boolean().optional(),
  printSizes: z.array(z.string()).optional(),
  metadataStatus: z.enum(["placeholder", "confirmed"]).optional(),
  confidence: z.enum(["low", "medium", "high"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getSession();
  if (!session.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const state = await readCurrentState();
  const changes = updatePhoto(state, slug, parsed.data);

  const commit = await commitFiles({
    message: `Update photo: ${slug}`,
    files: [
      { path: PATHS.generated, content: changes.generatedJson },
      { path: PATHS.metadata, content: changes.metadataJson },
    ],
  });

  return NextResponse.json({ slug, commit });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getSession();
  if (!session.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { slug } = await params;

  const state = await readCurrentState();
  const photo = state.metadata.find((m) => m.slug === slug);
  if (!photo) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const changes = deletePhoto(state, slug);

  const commit = await commitFiles({
    message: `Delete photo: ${slug}`,
    files: [
      {
        path: `public/images/photos/${photo.collection}/${slug}.jpg`,
        content: null,
      },
      { path: PATHS.generated, content: changes.generatedJson },
      { path: PATHS.metadata, content: changes.metadataJson },
    ],
  });

  return NextResponse.json({ slug, commit });
}
