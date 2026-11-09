import sharp from "sharp";

/** Keep the uploaded original intact; serve this small WebP while it loads. */
export async function createImagePreview(source: Buffer): Promise<Buffer> {
  return sharp(source, { limitInputPixels: 100_000_000 })
    .rotate()
    .resize({ width: 640, height: 480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 52, effort: 4 })
    .toBuffer();
}
