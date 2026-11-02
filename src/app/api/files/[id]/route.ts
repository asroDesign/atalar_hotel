import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";

export const runtime = "nodejs";

const CHUNK = 4 * 1024 * 1024;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const meta = await db.execute<{ mime: string; size: number }>(
    sql`select mime, octet_length(data)::int as size from media_files where id = ${id}`,
  );
  const m = meta.rows[0];

  if (!m) {
    // legacy base64 uploads
    const [file] = await db.select().from(uploads).where(eq(uploads.id, id));
    if (!file) return new Response("Not found", { status: 404 });
    return new Response(Buffer.from(file.data, "base64"), {
      headers: { "Content-Type": file.mime, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }

  const size = Number(m.size);
  const range = req.headers.get("range");
  const common = {
    "Content-Type": m.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    let start = match?.[1] ? Number(match[1]) : 0;
    let end = match?.[2] ? Number(match[2]) : size - 1;
    if (!match?.[1] && match?.[2]) {
      start = Math.max(0, size - Number(match[2]));
      end = size - 1;
    }
    end = Math.min(end, size - 1, start + CHUNK - 1);
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const len = end - start + 1;
    const r = await db.execute<{ chunk: Buffer }>(
      sql`select substring(data from ${start + 1} for ${len}) as chunk from media_files where id = ${id}`,
    );
    return new Response(new Uint8Array(r.rows[0].chunk), {
      status: 206,
      headers: { ...common, "Content-Length": String(len), "Content-Range": `bytes ${start}-${end}/${size}` },
    });
  }

  const r = await db.execute<{ data: Buffer }>(sql`select data from media_files where id = ${id}`);
  return new Response(new Uint8Array(r.rows[0].data), {
    headers: { ...common, "Content-Length": String(size) },
  });
}
