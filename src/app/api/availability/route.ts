import { NextResponse } from "next/server";
import { bookedRoomRanges, bookedSlots } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = Number(url.searchParams.get("roomId"));
  const serviceId = Number(url.searchParams.get("serviceId"));
  const date = url.searchParams.get("date") ?? "";
  if (roomId) {
    const ranges = await bookedRoomRanges(roomId);
    return NextResponse.json({ ranges });
  }
  if (serviceId && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const slots = await bookedSlots(serviceId, date);
    return NextResponse.json({ slots });
  }
  return NextResponse.json({ error: "bad request" }, { status: 400 });
}
