import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { deletePhoto, updatePhoto } from "@/lib/admin/photos-repo";

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
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await updatePhoto(slug, parsed.data);
  return NextResponse.json({ slug });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const result = await deletePhoto(slug);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ slug });
}
