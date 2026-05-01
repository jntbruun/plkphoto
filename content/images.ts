/**
 * images.ts
 *
 * Merges generated image data (dimensions, blur, EXIF) with human metadata
 * into the final PhotoImage[] used throughout the app.
 *
 * Resolution order for camera/lens/year:
 *   manual override (images.metadata.ts) → EXIF (images.generated.ts) → undefined
 */

import type { PhotoImage, CollectionId } from "@/types/content";
import { generatedImages } from "./images.generated";
import { photoMetadata } from "./images.metadata";

const allImages: PhotoImage[] = photoMetadata
  .map((meta) => {
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
      camera: meta.camera ?? gen.camera,
      lens: meta.lens ?? gen.lens,
      date: gen.capturedAt ?? meta.date,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

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
