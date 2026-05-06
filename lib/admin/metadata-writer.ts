/**
 * Read + mutate the JSON shadow files that back content/images.{generated,metadata}.ts.
 *
 * Each admin write fetches the latest JSON from GitHub HEAD, applies the change,
 * and returns serialized strings ready to commit alongside any binary blob.
 */
import "server-only";
import { readFile } from "./github";
import type { GeneratedImageData } from "@/content/images.generated";
import type { PhotoMetadata } from "@/content/images.metadata";

const GENERATED_PATH = "content/images.generated.json";
const METADATA_PATH = "content/images.metadata.json";

interface CurrentState {
  generated: GeneratedImageData[];
  metadata: PhotoMetadata[];
}

export async function readCurrentState(): Promise<CurrentState> {
  const [g, m] = await Promise.all([readFile(GENERATED_PATH), readFile(METADATA_PATH)]);
  if (!g || !m) {
    throw new Error("Could not read current photo state from GitHub");
  }
  return {
    generated: JSON.parse(g.content) as GeneratedImageData[],
    metadata: JSON.parse(m.content) as PhotoMetadata[],
  };
}

function stringify<T>(arr: T[]): string {
  return JSON.stringify(arr, null, 2) + "\n";
}

export interface AddPhotoChanges {
  generatedJson: string;
  metadataJson: string;
}

export function addPhoto(
  state: CurrentState,
  generated: GeneratedImageData,
  metadata: PhotoMetadata,
): AddPhotoChanges {
  if (state.metadata.some((p) => p.slug === metadata.slug)) {
    throw new Error(`Slug already exists: ${metadata.slug}`);
  }
  return {
    generatedJson: stringify([...state.generated, generated]),
    metadataJson: stringify([...state.metadata, metadata]),
  };
}

export function updatePhoto(
  state: CurrentState,
  slug: string,
  patch: Partial<PhotoMetadata>,
): AddPhotoChanges {
  const idx = state.metadata.findIndex((p) => p.slug === slug);
  if (idx === -1) throw new Error(`Photo not found: ${slug}`);
  const updated = [...state.metadata];
  updated[idx] = { ...updated[idx]!, ...patch, slug }; // slug is immutable
  return {
    generatedJson: stringify(state.generated),
    metadataJson: stringify(updated),
  };
}

export function deletePhoto(state: CurrentState, slug: string): AddPhotoChanges {
  return {
    generatedJson: stringify(state.generated.filter((g) => g.slug !== slug)),
    metadataJson: stringify(state.metadata.filter((m) => m.slug !== slug)),
  };
}

export function existingSlugs(state: CurrentState): string[] {
  return state.metadata.map((m) => m.slug);
}

export const PATHS = {
  generated: GENERATED_PATH,
  metadata: METADATA_PATH,
};
