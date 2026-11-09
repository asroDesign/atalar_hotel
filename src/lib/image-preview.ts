import sharp from "sharp";
import libheif from "libheif-js/wasm-bundle";

const MAX_INPUT_PIXELS = 100_000_000;
const HEIF_MIMES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);

async function toWebp(source: Buffer, animated: boolean): Promise<Buffer> {
  return sharp(source, { limitInputPixels: MAX_INPUT_PIXELS, ...(animated ? { animated: true } : {}) })
    .rotate()
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
}

async function decodeHeif(source: Buffer): Promise<{ width: number; height: number; pixels: Uint8ClampedArray }> {
  const decoder = new libheif.HeifDecoder();
  let images: ReturnType<typeof decoder.decode> = [];
  try {
    images = decoder.decode(source);
    const image = images[0];
    if (!image) throw new Error("HEIF image not found");
    const width = image.get_width();
    const height = image.get_height();
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1 ||
      width * height > MAX_INPUT_PIXELS
    ) {
      throw new Error("Invalid HEIC dimensions");
    }
    const pixels = new Uint8ClampedArray(width * height * 4);
    const decoded = await new Promise<{ data: Uint8ClampedArray }>((resolve, reject) => {
      image.display({ data: pixels, width, height }, (result) => {
        if (!result) reject(new Error("HEIF processing error"));
        else resolve(result);
      });
    });
    if (decoded.data.byteLength !== width * height * 4) throw new Error("Invalid HEIC pixel data");
    return { width, height, pixels: decoded.data };
  } finally {
    for (const image of images) image.free();
    decoder.decoder.delete();
  }
}

/** Make the full-resolution WebP and the small progressive WebP preview. */
export async function convertImageToWebp(source: Buffer, mime: string): Promise<{ full: Buffer; preview: Buffer }> {
  const isHeif = HEIF_MIMES.has(mime);
  const isAnimated = mime === "image/gif";
  let full: Buffer;

  if (isHeif) {
    const decoded = await decodeHeif(source);
    const pixels = Buffer.from(decoded.pixels.buffer, decoded.pixels.byteOffset, decoded.pixels.byteLength);
    full = await sharp(pixels, {
      raw: { width: decoded.width, height: decoded.height, channels: 4 },
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .webp({ quality: 84, effort: 4 })
      .toBuffer();
  } else {
    full = await toWebp(source, isAnimated);
  }

  const preview = await createImagePreview(full, isAnimated);
  return { full, preview };
}

/** Create the small WebP served before the full-resolution image loads. */
export async function createImagePreview(source: Buffer, animated = false): Promise<Buffer> {
  return sharp(source, { limitInputPixels: MAX_INPUT_PIXELS, ...(animated ? { animated: true } : {}) })
    .resize({ width: 640, height: 480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 52, effort: 4 })
    .toBuffer();
}
