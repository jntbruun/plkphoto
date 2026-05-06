// Source of truth: content/images.metadata.json
// The admin UI mutates the JSON directly; this file is a typed re-export.

import type { CollectionId, LocalizedString } from "@/types/content";
import data from "./images.metadata.json";

export interface PhotoMetadata {
  slug: string;
  collection: CollectionId;
  title: LocalizedString;
  latinName?: string;
  location: LocalizedString;
  date: string;
  camera?: string;
  lens?: string;
  alt: LocalizedString;
  description?: LocalizedString;
  featuredOnHome: boolean;
  availableAsPrint: boolean;
  printSizes?: string[];
  wallMockup?: string;
  metadataStatus?: "placeholder" | "confirmed";
  confidence?: "low" | "medium" | "high";
}

export const photoMetadata: PhotoMetadata[] = data as PhotoMetadata[];
