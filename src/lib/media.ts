/** Shared constants for chunked media storage. */
export const CHUNK_SIZE = 768 * 1024; // < 1MB so default nginx client_max_body_size works
export const MAX_IMAGE = 10 * 1024 * 1024;
export const MAX_VIDEO = 150 * 1024 * 1024;

/** Return the small preview endpoint for an image uploaded to this application. */
export function imagePreviewUrl(src: string): string | null {
  if (!src.startsWith("/")) return null;
  try {
    const url = new URL(src, "https://atalar.invalid");
    if (url.origin !== "https://atalar.invalid" || !/^\/api\/files\/[a-z0-9]{8,64}$/i.test(url.pathname)) return null;
    url.searchParams.set("variant", "preview");
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
