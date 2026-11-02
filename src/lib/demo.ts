import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { admins, journalEntries, messages, reservations, smsLogs, testimonials } from "@/db/schema";
import { verifyPassword } from "./auth";
import { getSettingsFresh } from "./data";

export const DEMO_EMAIL = "admin@atalar.ir";
export const DEMO_PASSWORD = "admin123";

/** Exact signatures of the records created by the demo seed – used to remove ONLY demo data. */
export const DEMO_RESERVATIONS: [string, string][] = [
  ["حسین رضایی", "09121234567"],
  ["نگار شریفی", "09351112233"],
  ["امیر حسینی", "09141239876"],
  ["فاطمه جعفری", "09193334455"],
  ["محمد صادقی", "09127778899"],
  ["زهرا کاظمی", "09381212121"],
  ["کامران عباسی", "09145556677"],
  ["لیلا مرادی", "09367654321"],
];
export const DEMO_MESSAGES = ["پریسا نادری", "مهدی فرهادی", "Elena Petrova"];
export const DEMO_TESTIMONIALS = ["مریم احمدی", "رضا کریمی", "سارا محمدی", "علی نوروزی"];
export const DEMO_VOUCHERS = [
  "واریز سرمایه اولیه به حساب بانکی",
  "پرداخت حقوق کارکنان",
  "قبوض آب، برق و گاز",
  "خرید مواد غذایی رستوران",
  "سرویس دوره‌ای و مواد ضدعفونی استخر",
  "تبلیغات اینترنتی",
  "فروش رستوران به مهمانان غیرمقیم",
];

export type DemoCategory = "reservations" | "messages" | "testimonials" | "vouchers" | "smsLogs";

/**
 * Demo mode decides whether the demo login is advertised on the login page.
 *  - DEMO_MODE=false / true in the environment forces it off / on.
 *  - Otherwise the "demoMode" setting (toggle in the admin panel) is used.
 *  - Credentials are shown ONLY while the demo account still has the default password.
 */
export async function getDemoState() {
  const s = await getSettingsFresh();
  const env = process.env.DEMO_MODE;
  const forced = env === "true" || env === "false";
  const enabled = env === "false" ? false : env === "true" ? true : s.demoMode === "1";
  const [demoAdmin] = await db.select().from(admins).where(eq(admins.email, DEMO_EMAIL));
  const defaultCredentials = !!demoAdmin && verifyPassword(DEMO_PASSWORD, demoAdmin.passwordHash);
  return { enabled, forced, defaultCredentials, showCredentials: enabled && defaultCredentials };
}

/** Does this admin still use the publicly known default password? */
export async function adminUsesDefaultPassword(adminId: number) {
  const [a] = await db.select().from(admins).where(eq(admins.id, adminId));
  return !!a && verifyPassword(DEMO_PASSWORD, a.passwordHash);
}

function reservationFilter() {
  return or(...DEMO_RESERVATIONS.map(([n, p]) => and(eq(reservations.guestName, n), eq(reservations.phone, p))))!;
}
function voucherFilter() {
  return and(inArray(journalEntries.description, DEMO_VOUCHERS), eq(journalEntries.createdBy, "مدیر هتل"), ne(journalEntries.source, "reservation"))!;
}

export async function demoDataCounts(): Promise<Record<DemoCategory, number>> {
  const count = sql<number>`count(*)::int`;
  const [[r], [m], [t], [v], [s]] = await Promise.all([
    db.select({ c: count }).from(reservations).where(reservationFilter()),
    db.select({ c: count }).from(messages).where(inArray(messages.name, DEMO_MESSAGES)),
    db.select({ c: count }).from(testimonials).where(inArray(testimonials.name, DEMO_TESTIMONIALS)),
    db.select({ c: count }).from(journalEntries).where(voucherFilter()),
    db.select({ c: count }).from(smsLogs),
  ]);
  return { reservations: r.c, messages: m.c, testimonials: t.c, vouchers: v.c, smsLogs: s.c };
}

export async function removeDemoData(categories: DemoCategory[]) {
  const removed: Partial<Record<DemoCategory, number>> = {};
  await db.transaction(async (tx) => {
    if (categories.includes("reservations")) {
      const ids = (await tx.select({ id: reservations.id }).from(reservations).where(reservationFilter())).map((x) => x.id);
      if (ids.length) {
        await tx.delete(journalEntries).where(and(eq(journalEntries.source, "reservation"), inArray(journalEntries.reservationId, ids)));
        await tx.delete(reservations).where(inArray(reservations.id, ids));
      }
      removed.reservations = ids.length;
    }
    if (categories.includes("messages")) {
      removed.messages = (await tx.delete(messages).where(inArray(messages.name, DEMO_MESSAGES)).returning({ id: messages.id })).length;
    }
    if (categories.includes("testimonials")) {
      removed.testimonials = (await tx.delete(testimonials).where(inArray(testimonials.name, DEMO_TESTIMONIALS)).returning({ id: testimonials.id })).length;
    }
    if (categories.includes("vouchers")) {
      removed.vouchers = (await tx.delete(journalEntries).where(voucherFilter()).returning({ id: journalEntries.id })).length;
    }
    if (categories.includes("smsLogs")) {
      removed.smsLogs = (await tx.delete(smsLogs).returning({ id: smsLogs.id })).length;
    }
  });
  return removed;
}
