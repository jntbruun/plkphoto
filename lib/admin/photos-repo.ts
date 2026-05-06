/**
 * Photo data access. Reads use the public anon client (subject to RLS, which
 * grants public select on photos). Writes use the service-role client and
 * happen only after the API layer has authenticated the caller as an admin.
 */
import "server-only";
import { getSupabaseAdmin, getSupabaseAnon, getStoragePublicUrl } from "@/lib/supabase/server";
import type { CollectionId, LocalizedString, PhotoImage } from "@/types/content";

export interface PhotoRow {
  slug: string;
  collection: CollectionId;
  title_no: string;
  title_en: string;
  latin_name: string | null;
  location_no: string;
  location_en: string;
  date: string;
  camera: string | null;
  lens: string | null;
  alt_no: string;
  alt_en: string;
  description_no: string | null;
  description_en: string | null;
  featured_on_home: boolean;
  available_as_print: boolean;
  print_sizes: string[] | null;
  metadata_status: "placeholder" | "confirmed";
  confidence: "low" | "medium" | "high";
  storage_path: string;
  width: number;
  height: number;
  blur_data_url: string;
}

function rowToPhoto(row: PhotoRow): PhotoImage {
  const title: LocalizedString = { no: row.title_no, en: row.title_en };
  const location: LocalizedString = { no: row.location_no, en: row.location_en };
  const alt: LocalizedString = { no: row.alt_no, en: row.alt_en };
  const description: LocalizedString | undefined =
    row.description_no || row.description_en
      ? { no: row.description_no ?? "", en: row.description_en ?? "" }
      : undefined;
  return {
    slug: row.slug,
    collection: row.collection,
    title,
    latinName: row.latin_name ?? undefined,
    location,
    date: row.date,
    camera: row.camera ?? undefined,
    lens: row.lens ?? undefined,
    src: getStoragePublicUrl(row.storage_path),
    width: row.width,
    height: row.height,
    blurDataURL: row.blur_data_url,
    alt,
    description,
    featuredOnHome: row.featured_on_home,
    availableAsPrint: row.available_as_print,
    printSizes: row.print_sizes ?? undefined,
  };
}

export async function listPhotos(filter?: {
  collection?: CollectionId;
}): Promise<PhotoImage[]> {
  const supabase = getSupabaseAnon();
  let q = supabase.from("photos").select("*").order("date", { ascending: false });
  if (filter?.collection) q = q.eq("collection", filter.collection);
  const { data, error } = await q;
  if (error) throw error;
  return (data as PhotoRow[]).map(rowToPhoto);
}

export async function getPhotoBySlug(slug: string): Promise<PhotoImage | null> {
  const supabase = getSupabaseAnon();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPhoto(data as PhotoRow) : null;
}

export async function listFeaturedPhotos(): Promise<PhotoImage[]> {
  const supabase = getSupabaseAnon();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("featured_on_home", true)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data as PhotoRow[]).map(rowToPhoto);
}

export async function listPrintablePhotos(): Promise<PhotoImage[]> {
  const supabase = getSupabaseAnon();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("available_as_print", true)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data as PhotoRow[]).map(rowToPhoto);
}

// ─── Admin writes ────────────────────────────────────────────────────

export interface PhotoInsert {
  slug: string;
  collection: CollectionId;
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
  storagePath: string;
  width: number;
  height: number;
  blurDataURL: string;
}

function toRow(input: PhotoInsert): Omit<PhotoRow, "metadata_status" | "confidence"> & {
  metadata_status?: PhotoRow["metadata_status"];
  confidence?: PhotoRow["confidence"];
} {
  return {
    slug: input.slug,
    collection: input.collection,
    title_no: input.title.no,
    title_en: input.title.en,
    latin_name: input.latinName ?? null,
    location_no: input.location.no,
    location_en: input.location.en,
    date: input.date,
    camera: input.camera ?? null,
    lens: input.lens ?? null,
    alt_no: input.alt.no,
    alt_en: input.alt.en,
    description_no: input.description?.no ?? null,
    description_en: input.description?.en ?? null,
    featured_on_home: input.featuredOnHome,
    available_as_print: input.availableAsPrint,
    print_sizes: input.printSizes ?? null,
    metadata_status: input.metadataStatus,
    confidence: input.confidence,
    storage_path: input.storagePath,
    width: input.width,
    height: input.height,
    blur_data_url: input.blurDataURL,
  };
}

export async function insertPhoto(input: PhotoInsert): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("photos").insert(toRow(input));
  if (error) throw error;
}

export type PhotoPatch = Partial<Omit<PhotoInsert, "slug" | "storagePath" | "width" | "height" | "blurDataURL">>;

export async function updatePhoto(slug: string, patch: PhotoPatch): Promise<void> {
  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = {};
  if (patch.collection !== undefined) update.collection = patch.collection;
  if (patch.title) {
    update.title_no = patch.title.no;
    update.title_en = patch.title.en;
  }
  if (patch.latinName !== undefined) update.latin_name = patch.latinName || null;
  if (patch.location) {
    update.location_no = patch.location.no;
    update.location_en = patch.location.en;
  }
  if (patch.date !== undefined) update.date = patch.date;
  if (patch.alt) {
    update.alt_no = patch.alt.no;
    update.alt_en = patch.alt.en;
  }
  if (patch.description) {
    update.description_no = patch.description.no;
    update.description_en = patch.description.en;
  }
  if (patch.featuredOnHome !== undefined) update.featured_on_home = patch.featuredOnHome;
  if (patch.availableAsPrint !== undefined) update.available_as_print = patch.availableAsPrint;
  if (patch.printSizes !== undefined) update.print_sizes = patch.printSizes;
  if (patch.metadataStatus !== undefined) update.metadata_status = patch.metadataStatus;
  if (patch.confidence !== undefined) update.confidence = patch.confidence;

  const { error } = await supabase.from("photos").update(update).eq("slug", slug);
  if (error) throw error;
}

export async function deletePhoto(slug: string): Promise<{ storagePath: string } | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("photos")
    .delete()
    .eq("slug", slug)
    .select("storage_path")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // Also remove the binary
  const { error: storageErr } = await supabase.storage.from("photos").remove([data.storage_path]);
  if (storageErr) {
    // Don't fail the whole operation — row is already gone.
    console.error("Failed to remove storage object", storageErr);
  }
  return { storagePath: data.storage_path };
}

export async function uploadPhotoBinary(
  storagePath: string,
  buffer: Buffer,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from("photos").upload(storagePath, buffer, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
}

export async function listExistingSlugs(): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("photos").select("slug");
  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}
