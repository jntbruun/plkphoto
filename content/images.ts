/**
 * images.ts
 *
 * Source of truth: the `photos` table in Supabase. These helpers are async and
 * meant to be called from Server Components, Route Handlers, and other
 * server-side code.
 */
import "server-only";
import type { PhotoImage, CollectionId } from "@/types/content";
import {
  listPhotos,
  getPhotoBySlug,
  listFeaturedPhotos,
  listPrintablePhotos,
} from "@/lib/admin/photos-repo";

export function getPhotos(filter?: { collection?: CollectionId }): Promise<PhotoImage[]> {
  return listPhotos(filter);
}

export function getPhoto(slug: string): Promise<PhotoImage | null> {
  return getPhotoBySlug(slug);
}

export function getFeaturedPhotos(): Promise<PhotoImage[]> {
  return listFeaturedPhotos();
}

export function getPrintablePhotos(): Promise<PhotoImage[]> {
  return listPrintablePhotos();
}
