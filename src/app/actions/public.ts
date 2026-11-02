"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { messages, reservations, rooms, services } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { getContent } from "@/lib/content";
import { bookedSlots, roomConflicts } from "@/lib/availability";
import { diffDays, genTrackingCode, todayISO, toEnDigits } from "@/lib/utils";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

function s(fd: FormData, key: string) {
  return toEnDigits(String(fd.get(key) ?? "").trim());
}

export async function createReservation(_prev: FormState, fd: FormData): Promise<FormState> {
  const kind = s(fd, "kind") === "service" ? "service" : "room";
  const itemId = Number(s(fd, "itemId"));
  const guestName = String(fd.get("guestName") ?? "").trim();
  const phone = s(fd, "phone").replace(/[\s-]/g, "");
  const email = s(fd, "email");
  const nationalId = s(fd, "nationalId");
  const guests = Math.max(1, Number(s(fd, "guests")) || 1);
  const checkIn = s(fd, "checkIn");
  const checkOut = s(fd, "checkOut");
  const timeSlot = s(fd, "timeSlot");
  const notes = String(fd.get("notes") ?? "").trim();

  if (!itemId) return { error: "لطفاً اتاق یا خدمت مورد نظر را انتخاب کنید." };
  if (guestName.length < 3) return { error: "نام و نام خانوادگی را کامل وارد کنید." };
  if (!/^09\d{9}$/.test(phone)) return { error: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷)." };
  if (nationalId && !/^\d{10}$/.test(nationalId)) return { error: "کد ملی باید ۱۰ رقم باشد." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) return { error: "تاریخ را انتخاب کنید." };
  if (checkIn < todayISO()) return { error: "تاریخ انتخاب‌شده گذشته است." };

  const { booking } = await getContent();
  if (booking.requireRulesAccept && fd.get("acceptRules") !== "on")
    return { error: "لطفاً قوانین رزرو را مطالعه کرده و تأیید کنید." };

  const settings = await getSettings();
  const pct = Number(settings.depositPercent) || 30;

  let itemName = "";
  let total = 0;
  let extraGuestFee = 0;
  let nights = 1;
  let roomId: number | null = null;
  let serviceId: number | null = null;

  if (kind === "room") {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, itemId));
    if (!room || !room.isActive) return { error: "اتاق انتخاب‌شده در دسترس نیست." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) return { error: "تاریخ خروج را انتخاب کنید." };
    nights = diffDays(checkIn, checkOut);
    if (nights < 1) return { error: "تاریخ خروج باید بعد از تاریخ ورود باشد." };
    if (nights > 30) return { error: "حداکثر مدت اقامت ۳۰ شب است." };
    if (guests > room.capacity + room.extraBeds)
      return { error: `ظرفیت این اتاق حداکثر ${room.capacity + room.extraBeds} نفر است.` };
    const conflicts = await roomConflicts(room.id, checkIn, checkOut);
    if (conflicts.length) return { error: "متأسفانه اتاق در این بازه رزرو شده است. تاریخ دیگری انتخاب کنید." };
    itemName = room.name;
    total = room.pricePerNight * nights;
    roomId = room.id;
  } else {
    const [svc] = await db.select().from(services).where(eq(services.id, itemId));
    if (!svc || !svc.isActive || !svc.isBookable) return { error: "این خدمت قابل رزرو نیست." };
    if (svc.timeSlots.length && !svc.timeSlots.includes(timeSlot)) return { error: "لطفاً سانس را انتخاب کنید." };
    if (guests > svc.maxGuests) return { error: `حداکثر تعداد نفرات ${svc.maxGuests} نفر است.` };
    const taken = await bookedSlots(svc.id, checkIn);
    if (taken.includes(timeSlot)) return { error: "این سانس قبلاً رزرو شده است. سانس دیگری انتخاب کنید." };
    itemName = svc.name;
    const base = svc.slotPrices[timeSlot] ?? svc.price;
    extraGuestFee = Math.max(0, guests - svc.includedGuests) * svc.extraGuestPrice;
    total = base + extraGuestFee;
    serviceId = svc.id;
  }

  const deposit = Math.round((total * pct) / 100 / 1000) * 1000;
  const trackingCode = genTrackingCode();

  await db.insert(reservations).values({
    trackingCode,
    kind,
    roomId,
    serviceId,
    itemName,
    guestName,
    phone,
    email,
    nationalId,
    guests,
    checkIn,
    checkOut: kind === "room" ? checkOut : null,
    timeSlot: kind === "service" ? timeSlot : "",
    nights,
    totalPrice: total,
    extraGuestFee,
    depositAmount: deposit,
    notes,
    status: "pending_payment",
  });

  revalidatePath("/admin");
  redirect(`/track/${trackingCode}?phone=${phone}&new=1`);
}

export async function payDeposit(_prev: FormState, fd: FormData): Promise<FormState> {
  const code = s(fd, "code");
  const phone = s(fd, "phone");
  const method = s(fd, "method") === "gateway" ? "gateway" : "card";
  let ref = s(fd, "ref");

  const [res] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.trackingCode, code), eq(reservations.phone, phone)));
  if (!res) return { error: "درخواست رزرو یافت نشد." };
  if (res.status !== "pending_payment") return { error: "پیش‌پرداخت این رزرو قبلاً ثبت شده است." };

  if (method === "card") {
    if (!/^\d{4,20}$/.test(ref)) return { error: "شماره پیگیری / مرجع تراکنش را صحیح وارد کنید." };
  } else {
    ref = `GW${Date.now().toString().slice(-8)}`;
  }

  if (res.kind === "room" && res.roomId && res.checkOut) {
    const c = await roomConflicts(res.roomId, res.checkIn, res.checkOut, res.id);
    if (c.length) return { error: "متأسفانه در این فاصله اتاق توسط مهمان دیگری رزرو شد. لطفاً با پذیرش تماس بگیرید." };
  }
  if (res.kind === "service" && res.serviceId) {
    const taken = await bookedSlots(res.serviceId, res.checkIn, res.id);
    if (taken.includes(res.timeSlot)) return { error: "این سانس به‌تازگی رزرو شد. لطفاً با پذیرش تماس بگیرید." };
  }

  await db
    .update(reservations)
    .set({ status: "paid", paymentMethod: method, paymentRef: ref, paidAt: new Date() })
    .where(eq(reservations.id, res.id));

  revalidatePath(`/track/${code}`);
  revalidatePath("/admin");
  return { ok: true, message: "پیش‌پرداخت با موفقیت ثبت شد. پس از تایید پذیرش، کد رزرو برای شما صادر می‌شود." };
}

export async function sendMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = String(fd.get("name") ?? "").trim();
  const phone = s(fd, "phone");
  const email = s(fd, "email");
  const subject = String(fd.get("subject") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (name.length < 2) return { error: "نام خود را وارد کنید." };
  if (!phone && !email) return { error: "یکی از راه‌های ارتباطی (تلفن یا ایمیل) را وارد کنید." };
  if (body.length < 5) return { error: "متن پیام خیلی کوتاه است." };
  await db.insert(messages).values({ name, phone, email, subject, body });
  revalidatePath("/admin/messages");
  return { ok: true, message: "پیام شما با موفقیت ارسال شد. به‌زودی با شما تماس می‌گیریم." };
}

export async function lookupReservation(_prev: FormState, fd: FormData): Promise<FormState> {
  const code = s(fd, "code").toUpperCase();
  const phone = s(fd, "phone");
  if (!code || !phone) return { error: "کد پیگیری و شماره موبایل را وارد کنید." };
  const [res] = await db
    .select({ id: reservations.id, trackingCode: reservations.trackingCode })
    .from(reservations)
    .where(and(eq(reservations.phone, phone), eq(reservations.trackingCode, code)));
  if (!res) {
    const [byRes] = await db
      .select({ trackingCode: reservations.trackingCode })
      .from(reservations)
      .where(and(eq(reservations.phone, phone), eq(reservations.reservationCode, code)));
    if (!byRes) return { error: "رزروی با این مشخصات یافت نشد." };
    redirect(`/track/${byRes.trackingCode}?phone=${phone}`);
  }
  redirect(`/track/${res.trackingCode}?phone=${phone}`);
}
