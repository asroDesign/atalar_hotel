import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { mediaFiles } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) return NextResponse.json({ error: "فقط تصویر، GIF یا ویدیو مجاز است" }, { status: 400 });
  if (isImage && file.size > MAX_IMAGE) return NextResponse.json({ error: "حداکثر حجم تصویر ۱۰ مگابایت" }, { status: 400 });
  if (isVideo && file.size > MAX_VIDEO) return NextResponse.json({ error: "حداکثر حجم ویدیو ۸۰ مگابایت" }, { status: 400 });
  const id = randomBytes(12).toString("hex");
  const data = Buffer.from(await file.arrayBuffer());
  await db.insert(mediaFiles).values({ id, mime: file.type, name: file.name, size: data.length, data });
  return NextResponse.json({ url: `/api/files/${id}`, type: isVideo ? "video" : "image", mime: file.type });
}
