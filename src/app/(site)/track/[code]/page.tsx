import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CheckCircle2, ClipboardList, CreditCard, FileCheck2, PartyPopper, XCircle, Printer, Clock } from "lucide-react";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { cn, faNum, formatDateTime, formatJalali, formatPrice, statusMeta, toEnDigits } from "@/lib/utils";
import { PaymentPanel } from "@/components/site/forms";

export const metadata = { title: "وضعیت رزرو" };

export default async function TrackDetail({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ phone?: string; new?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const phone = toEnDigits(sp.phone ?? "");
  const [r] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.trackingCode, decodeURIComponent(code)), eq(reservations.phone, phone)));
  if (!r) notFound();
  const s = await getSettings();
  const meta = statusMeta[r.status];
  const failed = r.status === "rejected" || r.status === "cancelled";
  const stepIndex = { pending_payment: 1, paid: 2, confirmed: 4, rejected: 2, cancelled: 1 }[r.status];
  const steps = [
    { Icon: ClipboardList, t: "ثبت درخواست" },
    { Icon: CreditCard, t: "پیش‌پرداخت" },
    { Icon: FileCheck2, t: "تایید پذیرش" },
    { Icon: CheckCircle2, t: "صدور کد رزرو" },
  ];

  return (
    <div className="relative overflow-hidden pb-10 pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-brand-950 to-brand-800" />
      <div className="mx-auto max-w-4xl px-6">
        {sp.new && r.status === "pending_payment" && (
          <div className="mb-6 flex animate-fade-up items-center gap-3 rounded-2xl bg-emerald-500 p-4 text-white shadow-xl">
            <PartyPopper className="h-6 w-6 shrink-0" />
            <div className="text-sm leading-7">
              درخواست شما ثبت شد. کد پیگیری <b className="font-mono">{r.trackingCode}</b> را یادداشت کنید و برای قطعی شدن، پیش‌پرداخت را انجام دهید.
            </div>
          </div>
        )}

        <div className="card overflow-hidden shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <div className="text-xs text-slate-500">کد پیگیری</div>
              <div className="font-mono text-2xl font-black text-slate-900" dir="ltr">{r.trackingCode}</div>
            </div>
            <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1", meta.className)}>
              <span className={cn("h-2 w-2 rounded-full", meta.dot)} /> {meta.label}
            </span>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 px-4 py-6 sm:px-8">
            {steps.map(({ Icon, t }, i) => {
              const done = !failed && i < stepIndex;
              const current = !failed && i === stepIndex;
              const bad = failed && i === stepIndex;
              return (
                <div key={t} className="relative flex flex-col items-center text-center">
                  {i < steps.length - 1 && <div className={cn("absolute top-5 h-0.5", done && i + 1 < stepIndex ? "bg-brand-600" : "bg-slate-200")} style={{ left: "-50%", right: "50%" }} />}
                  <span className={cn("relative z-10 grid h-10 w-10 place-items-center rounded-full ring-4 ring-slate-50", done ? "bg-brand-600 text-white" : bad ? "bg-rose-500 text-white" : current ? "bg-gold-400 text-brand-950" : "bg-slate-200 text-slate-500")}>
                    {bad ? <XCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <span className={cn("mt-2 text-xs font-medium", done || current ? "text-slate-800" : "text-slate-400")}>{t}</span>
                </div>
              );
            })}
          </div>

          {r.status === "confirmed" && r.reservationCode && (
            <div className="m-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-950 p-6 text-center text-white">
              <CheckCircle2 className="mx-auto h-12 w-12 text-gold-300" />
              <div className="mt-3 text-sm text-white/70">رزرو شما قطعی شد · کد رزرو</div>
              <div className="mt-2 font-mono text-4xl font-black tracking-widest text-gold-300" dir="ltr">{r.reservationCode}</div>
              <p className="mt-3 text-sm text-white/70">این کد به شماره موبایل شما پیامک شد. آن را هنگام ورود به پذیرش ارائه دهید.</p>
            </div>
          )}
          {r.status === "paid" && (
            <div className="m-6 flex items-start gap-3 rounded-2xl bg-sky-50 p-5 text-sm leading-7 text-sky-800 ring-1 ring-sky-200">
              <Clock className="mt-1 h-5 w-5 shrink-0" />
              پیش‌پرداخت شما ثبت شد و در صف بررسی پذیرش است. پس از تایید، کد رزرو در همین صفحه نمایش داده می‌شود. توجه: تا قبل از صدور کد رزرو، رزرو قطعی نیست.
            </div>
          )}
          {failed && (
            <div className="m-6 rounded-2xl bg-rose-50 p-5 text-sm leading-7 text-rose-800 ring-1 ring-rose-200">
              این درخواست {r.status === "rejected" ? "توسط پذیرش رد شده" : "لغو شده"} است. {r.adminNote && <>توضیح: {r.adminNote}</>} در صورت پرداخت، مبلغ طی ۷۲ ساعت عودت داده می‌شود. برای اطلاعات بیشتر با <span dir="ltr">{faNum(s.phone)}</span> تماس بگیرید.
            </div>
          )}

          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              <h3 className="font-extrabold text-slate-900">جزئیات رزرو</h3>
              {[
                ["مورد رزرو", r.itemName],
                ["نام مهمان", r.guestName],
                ["موبایل", faNum(r.phone)],
                ["تعداد نفرات", `${faNum(r.guests)} نفر`],
                r.kind === "room" ? ["تاریخ ورود", formatJalali(r.checkIn, true)] : ["تاریخ", formatJalali(r.checkIn, true)],
                r.kind === "room" ? ["تاریخ خروج", `${formatJalali(r.checkOut, true)} (${faNum(r.nights)} شب)`] : ["سانس", faNum(r.timeSlot)],
                ["تاریخ ثبت", formatDateTime(r.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-dashed border-slate-100 pb-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-left font-semibold text-slate-800">{v}</span>
                </div>
              ))}
              <div className="rounded-2xl bg-slate-50 p-4">
                {r.extraGuestFee > 0 && <div className="mb-2 flex justify-between text-slate-500"><span>شامل هزینه نفر اضافه</span><span>{formatPrice(r.extraGuestFee)} تومان</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">مبلغ کل</span><span className="font-bold">{formatPrice(r.totalPrice)} تومان</span></div>
                <div className="mt-2 flex justify-between text-brand-800"><span>پیش‌پرداخت</span><span className="font-black">{formatPrice(r.depositAmount)} تومان</span></div>
                <div className="mt-2 flex justify-between text-slate-500"><span>مانده (هنگام ورود)</span><span>{formatPrice(r.totalPrice - r.depositAmount)} تومان</span></div>
                {r.paymentRef && <div className="mt-2 flex justify-between text-slate-500"><span>مرجع پرداخت</span><span className="font-mono" dir="ltr">{faNum(r.paymentRef)}</span></div>}
              </div>
            </div>
            <div>
              {r.status === "pending_payment" ? (
                <>
                  <h3 className="mb-3 font-extrabold text-slate-900">پرداخت پیش‌پرداخت</h3>
                  <PaymentPanel code={r.trackingCode} phone={r.phone} amount={r.depositAmount} cardNumber={s.cardNumber} cardHolder={s.cardHolder} bankName={s.bankName} />
                </>
              ) : (
                <div className="flex h-full flex-col justify-center gap-3 rounded-3xl bg-slate-50 p-6 text-center text-sm text-slate-600">
                  <p>برای هرگونه تغییر یا لغو، با پذیرش هتل تماس بگیرید.</p>
                  <a href={`tel:${s.phone}`} className="btn-primary" dir="ltr">{faNum(s.phone)}</a>
                  <Link href="/" className="btn-ghost">بازگشت به صفحه اصلی</Link>
                  {r.status === "confirmed" && <span className="flex items-center justify-center gap-1 text-xs text-slate-400"><Printer className="h-3.5 w-3.5" /> برای چاپ از Ctrl+P استفاده کنید</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
