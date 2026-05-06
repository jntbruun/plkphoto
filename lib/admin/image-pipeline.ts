/**
 * Server-side image processing for admin uploads.
 *
 * Mirrors the relevant parts of scripts/importPhotos.ts so that a photo
 * uploaded through the UI ends up byte-shaped the same as one ingested via
 * the CSV manifest workflow.
 */
import sharp from "sharp";
import { getPlaiceholder } from "plaiceholder";
import exifr from "exifr";

const MAX_LONG_EDGE = 2400;
const JPEG_QUALITY = 82;

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  blurDataURL: string;
  camera?: string;
  lens?: string;
  capturedAt?: string;
}

function formatCamera(make?: string, model?: string): string | undefined {
  if (!model) return undefined;
  if (make && !model.toLowerCase().includes(make.toLowerCase())) {
    return `${make} ${model}`.trim();
  }
  return model.trim();
}

async function readExif(buffer: Buffer): Promise<{
  camera?: string;
  lens?: string;
  capturedAt?: string;
}> {
  try {
    const data = await exifr.parse(buffer, {
      pick: ["Make", "Model", "LensModel", "LensMake", "DateTimeOriginal"],
    });
    if (!data) return {};
    return {
      camera: formatCamera(data.Make, data.Model),
      lens: formatCamera(data.LensMake, data.LensModel),
      capturedAt: data.DateTimeOriginal
        ? new Date(data.DateTimeOriginal).toISOString().slice(0, 10)
        : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Resize, recompress, and extract metadata.
 *
 * GPS data is stripped by NOT calling .withMetadata() — sharp drops EXIF by
 * default. We still read EXIF (camera/lens/date) from the *input* buffer
 * before stripping.
 */
export async function processUpload(input: Buffer): Promise<ProcessedImage> {
  const exif = await readExif(input);

  const buffer = await sharp(input)
    .rotate()
    .resize({
      width: MAX_LONG_EDGE,
      height: MAX_LONG_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  const { base64, metadata: dim } = await getPlaiceholder(buffer, { size: 10 });

  return {
    buffer,
    width: dim.width ?? 1200,
    height: dim.height ?? 800,
    blurDataURL: base64,
    ...exif,
  };
}
