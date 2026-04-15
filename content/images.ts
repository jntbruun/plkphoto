/**
 * images.ts
 *
 * Merges generated image data (dimensions, blur, src) with human metadata
 * into the final PhotoImage[] used throughout the app.
 *
 * In Phase 2: replace this file with a Sanity client fetch.
 * The exported functions stay the same — components won't need to change.
 */

import type { PhotoImage, CollectionId } from "@/types/content";
import { generatedImages } from "./images.generated";
import { photoMetadata } from "./images.metadata";

// Merge generated + metadata
const allImages: PhotoImage[] = photoMetadata.map((meta) => {
  const gen = generatedImages.find((g) => g.slug === meta.slug);
  if (!gen) {
    throw new Error(`Generated data missing for slug: ${meta.slug}. Run npm run import-photos.`);
  }
  return {
    ...meta,
    src: gen.src,
    width: gen.width,
    height: gen.height,
    blurDataURL: gen.blurDataURL,
  };
});

export function getPhotos(filter?: { collection?: CollectionId }): PhotoImage[] {
  if (filter?.collection) {
    return allImages.filter((img) => img.collection === filter.collection);
  }
  return allImages;
}

export function getPhoto(slug: string): PhotoImage | null {
  return allImages.find((img) => img.slug === slug) ?? null;
}

export function getFeaturedPhotos(): PhotoImage[] {
  return allImages.filter((img) => img.featuredOnHome);
}

export function getPrintablePhotos(): PhotoImage[] {
  return allImages.filter((img) => img.availableAsPrint);
}
