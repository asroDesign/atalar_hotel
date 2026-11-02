"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  admins,
  amenities,
  attractions,
  messages,
  reservations,
  rooms,
  services,
  settings,
  testimonials,
  type ReservationStatus,
} from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  requireAdmin,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { defaultSettings } from "@/lib/data";
import { bookedSlots, roomConflicts } from "@/lib/availability";
import { formatJalali, genReservationCode, linesToArray, slugify, toEnDigits } from "@/lib/utils";
import { defaultBooking, defaultHome } from "@/lib/content";
import { sendSms } from "@/lib/sms";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(toEnDigits(str(fd, k)).replace(/[,٬]/g, "")) || 0;
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

function revalidateSite() {
  revalidatePath("/", "layout");
}

/* ---------------- auth ---------------- */
export async function login(_p: ActionState, fd: FormData): Promise<ActionState> {
  await ensureSeeded();
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const [admin] = await db.select().from(admins).where(eq(admins.email, email));
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return { error: "ایمیل یا رمز عبور اشتباه است." };
  }
  await createSession(admin.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePassword(_p: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const current = str(fd, "current");
  const next = str(fd, "next");
  const [admin] = await db.select().from(admins).where(eq(admins.id, me.id));
  if (!admin || !verifyPassword(current, admin.passwordHash)) return { error: "رمز فعلی اشتباه است." };
  if (next.length < 6) return { error: "رمز جدید باید حداقل ۶ کاراکتر باشد." };
  await db.update(admins).set({ passwordHash: hashPassword(next) }).where(eq(admins.id, me.id));
  return { ok: true, message: "رمز عبور با موفقیت تغییر کرد." };
}

/* ---------------- rooms ---------------- */
export async function saveRoom(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = num(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "نام اتاق الزامی است." };
  const data = {
    name,
    slug: slugify(str(fd, "slug") || `room-${str(fd, "roomNumber") || name}`),
    roomNumber: toEnDigits(str(fd, "roomNumber")),
    type: str(fd, "type"),
    floor: num(fd, "floor"),
    capacity: Math.max(1, num(fd, "capacity")),
    extraBeds: num(fd, "extraBeds"),
    beds: str(fd, "beds"),
    size: num(fd, "size"),
    view: str(fd, "view"),
    pricePerNight: num(fd, "pricePerNight"),
    shortDescription: str(fd, "shortDescription"),
    description: str(fd, "description"),
    features: linesToArray(fd.get("features")),
    images: linesToArray(fd.get("images")),
    videoUrl: str(fd, "videoUrl"),
    isActive: bool(fd, "isActive"),
    isFeatured: bool(fd, "isFeatured"),
    sortOrder: num(fd, "sortOrder"),
  };
  try {
    if (id) await db.update(rooms).set(data).where(eq(rooms.id, id));
    else await db.insert(rooms).values(data);
  } catch {
    return { error: "نامک (slug) تکراری است. مقدار دیگری وارد کنید." };
  }
  revalidateSite();
  redirect("/admin/rooms?saved=1");
}

export async function deleteRoom(id: number) {
  await requireAdmin();
  await db.delete(rooms).where(eq(rooms.id, id));
  revalidateSite();
}

export async function toggleRoom(id: number, field: "isActive" | "isFeatured", value: boolean) {
  await requireAdmin();
  await db.update(rooms).set({ [field]: value }).where(eq(rooms.id, id));
  revalidateSite();
}

/* ---------------- services ---------------- */
export async function saveService(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = num(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "نام خدمت الزامی است." };
  const gallery = linesToArray(fd.get("gallery"));
  let slotRows: { time: string; price: number }[] = [];
  try {
    slotRows = JSON.parse(str(fd, "slots") || "[]");
  } catch {
    return { error: "فرمت سانس‌ها نامعتبر است." };
  }
  const timeSlots: string[] = [];
  const slotPrices: Record<string, number> = {};
  for (const row of slotRows) {
    const t = toEnDigits(String(row.time ?? "")).trim();
    if (!t || timeSlots.includes(t)) continue;
    timeSlots.push(t);
    slotPrices[t] = Math.max(0, Number(row.price) || 0);
  }
  const data = {
    name,
    slug: slugify(str(fd, "slug") || name),
    icon: str(fd, "icon") || "Sparkles",
    shortDescription: str(fd, "shortDescription"),
    description: str(fd, "description"),
    image: gallery[0] ?? "",
    gallery,
    videoUrl: str(fd, "videoUrl"),
    price: num(fd, "price"),
    priceUnit: str(fd, "priceUnit"),
    workingHours: str(fd, "workingHours"),
    rules: linesToArray(fd.get("rules")),
    timeSlots,
    slotPrices,
    includedGuests: Math.max(1, num(fd, "includedGuests") || 1),
    extraGuestPrice: num(fd, "extraGuestPrice"),
    maxGuests: Math.max(1, num(fd, "maxGuests")),
    isBookable: bool(fd, "isBookable"),
    isActive: bool(fd, "isActive"),
    sortOrder: num(fd, "sortOrder"),
  };
  try {
    if (id) await db.update(services).set(data).where(eq(services.id, id));
    else await db.insert(services).values(data);
  } catch {
    return { error: "نامک (slug) تکراری است." };
  }
  revalidateSite();
  redirect("/admin/services?saved=1");
}

export async function deleteService(id: number) {
  await requireAdmin();
  await db.delete(services).where(eq(services.id, id));
  revalidateSite();
}

/* ---------------- amenities ---------------- */
export async function saveAmenity(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = num(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "عنوان الزامی است." };
  const data = {
    title,
    icon: str(fd, "icon") || "Sparkles",
    description: str(fd, "description"),
    category: str(fd, "category") || "عمومی",
    sortOrder: num(fd, "sortOrder"),
  };
  if (id) await db.update(amenities).set(data).where(eq(amenities.id, id));
  else await db.insert(amenities).values(data);
  revalidateSite();
  return { ok: true, message: id ? "امکان ویرایش شد." : "امکان جدید افزوده شد." };
}

export async function deleteAmenity(id: number) {
  await requireAdmin();
  await db.delete(amenities).where(eq(amenities.id, id));
  revalidateSite();
}

/* ---------------- attractions ---------------- */
export async function saveAttraction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = num(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "نام مکان الزامی است." };
  const data = {
    name,
    category: str(fd, "category") || "طبیعی",
    description: str(fd, "description"),
    image: str(fd, "image"),
    distanceKm: Number(toEnDigits(str(fd, "distanceKm"))) || 0,
    travelTime: str(fd, "travelTime"),
    lat: Number(toEnDigits(str(fd, "lat"))) || 0,
    lng: Number(toEnDigits(str(fd, "lng"))) || 0,
    sortOrder: num(fd, "sortOrder"),
  };
  if (id) await db.update(attractions).set(data).where(eq(attractions.id, id));
  else await db.insert(attractions).values(data);
  revalidateSite();
  return { ok: true, message: id ? "مکان ویرایش شد." : "مکان جدید افزوده شد." };
}

export async function deleteAttraction(id: number) {
  await requireAdmin();
  await db.delete(attractions).where(eq(attractions.id, id));
  revalidateSite();
}

/* ---------------- testimonials ---------------- */
export async function saveTestimonial(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = num(fd, "id");
  const name = str(fd, "name");
  const body = str(fd, "body");
  if (!name || !body) return { error: "نام و متن نظر الزامی است." };
  const data = { name, body, city: str(fd, "city"), rating: Math.min(5, Math.max(1, num(fd, "rating") || 5)) };
  if (id) await db.update(testimonials).set(data).where(eq(testimonials.id, id));
  else await db.insert(testimonials).values(data);
  revalidateSite();
  return { ok: true, message: "نظر ذخیره شد." };
}

export async function deleteTestimonial(id: number) {
  await requireAdmin();
  await db.delete(testimonials).where(eq(testimonials.id, id));
  revalidateSite();
}

/* ---------------- reservations ---------------- */
export async function setReservationStatus(
  id: number,
  status: ReservationStatus,
): Promise<{ ok: boolean; error?: string; reservationCode?: string | null }> {
  await requireAdmin();
  const [res] = await db.select().from(reservations).where(eq(reservations.id, id));
  if (!res) return { ok: false, error: "رزرو یافت نشد." };

  const patch: Partial<typeof reservations.$inferInsert> = { status };

  if (status === "confirmed") {
    if (res.kind === "room" && res.roomId && res.checkOut) {
      const c = await roomConflicts(res.roomId, res.checkIn, res.checkOut, res.id);
      if (c.length) return { ok: false, error: "تداخل با رزرو قطعی/پرداخت‌شده دیگر برای این اتاق وجود دارد." };
    }
    if (res.kind === "service" && res.serviceId) {
      const taken = await bookedSlots(res.serviceId, res.checkIn, res.id);
      if (taken.includes(res.timeSlot)) return { ok: false, error: "این سانس برای مهمان دیگری قطعی شده است." };
    }
    patch.reservationCode = res.reservationCode ?? genReservationCode();
    patch.confirmedAt = new Date();
    if (!res.paidAt) patch.paidAt = new Date();
  } else if (status === "paid") {
    patch.reservationCode = null;
    patch.paidAt = res.paidAt ?? new Date();
    if (!res.paymentMethod) patch.paymentMethod = "manual";
  } else {
    patch.reservationCode = null;
    patch.confirmedAt = null;
    if (status === "pending_payment") patch.paidAt = null;
  }

  if (status === "confirmed" && patch.reservationCode && res.status !== "confirmed") {
    const when = res.kind === "room" ? `ورود ${formatJalali(res.checkIn)}` : `${formatJalali(res.checkIn)} سانس ${res.timeSlot}`;
    const sms = await sendSms(
      res.phone,
      `${res.guestName} عزیز، رزرو شما در هتل آتالار قطعی شد.\nکد رزرو: ${patch.reservationCode}\n${res.itemName} - ${when}`,
    );
    patch.smsStatus = sms;
  }

  await db.update(reservations).set(patch).where(eq(reservations.id, id));
  revalidatePath("/admin", "layout");
  revalidatePath(`/track/${res.trackingCode}`);
  return { ok: true, reservationCode: patch.reservationCode ?? null };
}

export async function updateReservation(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = num(fd, "id");
  if (!id) return { error: "شناسه نامعتبر" };
  await db
    .update(reservations)
    .set({
      guestName: str(fd, "guestName"),
      phone: toEnDigits(str(fd, "phone")),
      email: str(fd, "email"),
      nationalId: toEnDigits(str(fd, "nationalId")),
      guests: Math.max(1, num(fd, "guests")),
      totalPrice: num(fd, "totalPrice"),
      depositAmount: num(fd, "depositAmount"),
      paymentRef: str(fd, "paymentRef"),
      adminNote: str(fd, "adminNote"),
    })
    .where(eq(reservations.id, id));
  revalidatePath("/admin", "layout");
  return { ok: true, message: "اطلاعات رزرو ذخیره شد." };
}

export async function deleteReservation(id: number) {
  await requireAdmin();
  await db.delete(reservations).where(eq(reservations.id, id));
  revalidatePath("/admin", "layout");
}

/* ---------------- messages ---------------- */
export async function setMessageRead(id: number, isRead: boolean) {
  await requireAdmin();
  await db.update(messages).set({ isRead }).where(eq(messages.id, id));
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(id: number) {
  await requireAdmin();
  await db.delete(messages).where(eq(messages.id, id));
  revalidatePath("/admin", "layout");
}

/* ---------------- settings ---------------- */
export async function saveSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const keys = Object.keys(defaultSettings);
  for (const key of keys) {
    if (!fd.has(key)) continue;
    const value = str(fd, key);
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  revalidateSite();
  return { ok: true, message: "تنظیمات ذخیره شد." };
}

/* ---------------- page content (home / booking) ---------------- */
export async function saveContent(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const key = str(fd, "key");
  if (key !== "home" && key !== "booking") return { error: "کلید نامعتبر" };
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(String(fd.get("json") ?? "{}"));
  } catch {
    return { error: "داده نامعتبر است." };
  }
  const defaults = (key === "home" ? defaultHome : defaultBooking) as Record<string, unknown>;
  const clean: Record<string, unknown> = {};
  for (const k of Object.keys(defaults)) {
    if (parsed[k] !== undefined && typeof parsed[k] === typeof defaults[k]) clean[k] = parsed[k];
  }
  const value = JSON.stringify(clean);
  await db
    .insert(settings)
    .values({ key: `content_${key}`, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });

  // per-service rules edited from the booking page editor
  if (key === "booking") {
    const raw = fd.get("serviceRules");
    if (raw) {
      try {
        const map = JSON.parse(String(raw)) as Record<string, string[]>;
        for (const [sid, rules] of Object.entries(map)) {
          await db
            .update(services)
            .set({ rules: rules.map((r) => String(r).trim()).filter(Boolean) })
            .where(eq(services.id, Number(sid)));
        }
      } catch {
        return { error: "قوانین خدمات نامعتبر است." };
      }
    }
  }
  revalidateSite();
  return { ok: true, message: "تغییرات با موفقیت ذخیره و در سایت منتشر شد." };
}

export async function resetContent(key: "home" | "booking") {
  await requireAdmin();
  await db.delete(settings).where(eq(settings.key, `content_${key}`));
  revalidateSite();
}
