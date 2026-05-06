// Source of truth: content/images.generated.json
// The admin UI mutates the JSON directly; this file is a typed re-export.

import data from "./images.generated.json";

export interface GeneratedImageData {
  slug: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  camera?: string;
  lens?: string;
  capturedAt?: string;
}

export const generatedImages: GeneratedImageData[] = data as GeneratedImageData[];
