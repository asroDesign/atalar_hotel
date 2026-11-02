import { db } from "@/db";
import { smsLogs, type Reservation } from "@/db/schema";
import { getSettingsFresh } from "./data";
import { faNum, formatJalali, isoToJalali } from "./utils";

/**
 * Pattern (template) based SMS via Kavenegar "verify/lookup" or sms.ir "send/verify".
 *
 * Kavenegar tokens used in every template:
 *   %token%   → main code (reservation code / tracking code)
 *   %token2%  → date (1404/05/12)
 *   %token3%  → guest mobile / amount
 *   %token10% → guest name           (spaces allowed)
 *   %token20% → room / service name  (spaces allowed)
 *
 * sms.ir template parameters (exact names, per template):
 *   admin reservation : #NAME# #ITEM# #DATE# #TRACKING# #PHONE#
 *   guest request     : #NAME# #TRACKING#
 *   guest confirmed   : #NAME# #CODE# #ITEM# #DATE#
 *   guest rejected    : #NAME# #TRACKING#
 */

export type SmsEvent = "admin_reservation" | "guest_request" | "guest_confirmed" | "guest_rejected" | "test";

export type SmsParams = {
  code?: string;
  tracking?: string;
  name?: string;
  item?: string;
  date?: string;
  phone?: string;
  amount?: string;
};

const EVENT_LABEL: Record<SmsEvent, string> = {
  admin_reservation: "اطلاع رزرو به مدیر",
  guest_request: "ثبت درخواست (مهمان)",
  guest_confirmed: "تایید و کد رزرو (مهمان)",
  guest_rejected: "رد درخواست (مهمان)",
  test: "پیامک آزمایشی",
};
export const smsEventLabel = EVENT_LABEL;

const SMSIR_PARAMS: Record<SmsEvent, (keyof SmsParams)[]> = {
  admin_reservation: ["name", "item", "date", "tracking", "phone"],
  guest_request: ["name", "tracking"],
  guest_confirmed: ["name", "code", "item", "date"],
  guest_rejected: ["name", "tracking"],
  test: ["code"],
};

const noSpace = (s = "") => s.trim().replace(/\s+/g, "\u200c").slice(0, 100);
const limitSpaces = (s = "", max: number) => {
  const parts = s.trim().split(/\s+/);
  return parts.length - 1 <= max ? parts.join(" ") : parts.slice(0, max).join(" ") + "\u200c" + parts.slice(max).join("\u200c");
};

function normalizeMobile(m: string) {
  const d = m.replace(/[^\d]/g, "");
  if (d.startsWith("98") && d.length === 12) return "0" + d.slice(2);
  if (d.length === 10 && d.startsWith("9")) return "0" + d;
  return d;
}

async function log(receptor: string, event: SmsEvent, provider: string, status: string, response: string) {
  await db
    .insert(smsLogs)
    .values({ receptor, event, provider, status, response: response.slice(0, 500) })
    .catch(() => {});
}

async function sendKavenegar(apiKey: string, template: string, receptor: string, p: SmsParams) {
  const body = new URLSearchParams({
    receptor,
    template,
    token: noSpace(p.code || p.tracking || "-"),
    token2: noSpace(p.date || "-"),
    token3: noSpace(p.phone || p.amount || "-"),
  });
  if (p.name) body.set("token10", limitSpaces(p.name, 4));
  if (p.item) body.set("token20", limitSpaces(p.item, 8));
  const res = await fetch(`https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const text = await res.text();
  let ok = res.ok;
  try {
    ok = ok && JSON.parse(text)?.return?.status === 200;
  } catch {
    ok = false;
  }
  return { ok, text };
}

async function sendSmsIr(apiKey: string, templateId: string, receptor: string, event: SmsEvent, p: SmsParams) {
  const parameters = SMSIR_PARAMS[event].map((k) => ({ name: k.toUpperCase(), value: String(p[k] || "-").slice(0, 100) }));
  const res = await fetch("https://api.sms.ir/v1/send/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/plain", "x-api-key": apiKey },
    body: JSON.stringify({ mobile: receptor, templateId: Number(templateId), parameters }),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const text = await res.text();
  let ok = res.ok;
  try {
    ok = ok && JSON.parse(text)?.status === 1;
  } catch {
    ok = false;
  }
  return { ok, text };
}

/** Send a pattern SMS. Never throws. */
export async function sendPattern(
  event: SmsEvent,
  receptor: string,
  params: SmsParams,
  templateOverride?: string,
): Promise<"sent" | "failed" | "disabled"> {
  const s = await getSettingsFresh();
  const provider = s.smsProvider;
  const to = normalizeMobile(receptor);
  const template =
    templateOverride ??
    {
      admin_reservation: s.smsTplAdminReservation,
      guest_request: s.smsTplGuestRequest,
      guest_confirmed: s.smsTplGuestConfirmed,
      guest_rejected: s.smsTplGuestRejected,
      test: s.smsTplGuestConfirmed,
    }[event];

  if (provider !== "kavenegar" && provider !== "smsir") {
    await log(to, event, "none", "disabled", "پنل پیامک فعال نیست");
    return "disabled";
  }
  if (!s.smsApiKey || !template) {
    await log(to, event, provider, "disabled", "کلید API یا قالب پیامک تنظیم نشده است");
    return "disabled";
  }
  if (!/^09\d{9}$/.test(to)) {
    await log(to, event, provider, "failed", "شماره موبایل نامعتبر");
    return "failed";
  }
  try {
    const r =
      provider === "kavenegar"
        ? await sendKavenegar(s.smsApiKey, template, to, params)
        : await sendSmsIr(s.smsApiKey, template, to, event, params);
    await log(to, event, provider, r.ok ? "sent" : "failed", r.text);
    return r.ok ? "sent" : "failed";
  } catch (e) {
    await log(to, event, provider, "failed", e instanceof Error ? e.message : "network error");
    return "failed";
  }
}

const jDate = (iso: string) => {
  const { jy, jm, jd } = isoToJalali(iso);
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
};

export function reservationParams(r: Reservation): SmsParams {
  return {
    code: r.reservationCode ?? "",
    tracking: r.trackingCode,
    name: r.guestName,
    item: r.itemName + (r.kind === "service" && r.timeSlot ? ` ${r.timeSlot}` : ""),
    date: jDate(r.checkIn),
    phone: r.phone,
    amount: String(r.depositAmount),
  };
}

/** Notify all admin mobiles about a reservation (on request and/or payment). */
export async function notifyAdmins(r: Reservation, stage: "request" | "paid") {
  const s = await getSettingsFresh();
  if (stage === "request" && s.smsNotifyAdminOnRequest !== "1") return;
  if (stage === "paid" && s.smsNotifyAdminOnPaid !== "1") return;
  const mobiles = s.smsAdminMobiles
    .split(/[,\s،]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 5);
  for (const m of mobiles) await sendPattern("admin_reservation", m, reservationParams(r));
}

export async function notifyGuest(r: Reservation, event: "guest_request" | "guest_confirmed" | "guest_rejected") {
  const s = await getSettingsFresh();
  if (event === "guest_request" && s.smsNotifyGuestOnRequest !== "1") return "disabled" as const;
  return sendPattern(event, r.phone, reservationParams(r));
}

export function describeReservation(r: Reservation) {
  return `${r.itemName} · ${formatJalali(r.checkIn)} · ${faNum(r.guests)} نفر`;
}
