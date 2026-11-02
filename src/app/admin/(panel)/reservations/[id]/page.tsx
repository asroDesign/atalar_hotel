import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, BedDouble, Waves, ExternalLink } from "lucide-react";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { PageHeader } from "@/components/admin/ui";
import { ReservationActions, ReservationEditForm } from "@/components/admin/reservation-detail";
import { faNum, formatDateTime, formatJalali, formatPrice } from "@/lib/utils";

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [r] = await db.select().from(reservations).where(eq(reservations.id, Number(id)));
  if (!r) notFound();
  const rows: [string, React.ReactNode][] = [
    ["کد پیگیری", <span key="t" className="font-mono" dir="ltr">{r.trackingCode}</span>],
    ["نوع", r.kind === "room" ? "اقامت در اتاق" : "خدمات / استخر"],
    ["مورد رزرو", r.itemName],
    [r.kind === "room" ? "ورود" : "تاریخ", formatJalali(r.checkIn, true)],
    r.kind === "room" ? ["خروج", `${formatJalali(r.checkOut, true)} · ${faNum(r.nights)} شب`] : ["سانس", <span key="s" dir="ltr">{faNum(r.timeSlot)}</span>],
    ["تعداد نفرات", `${faNum(r.guests)} نفر`],
    ["مبلغ کل", `${formatPrice(r.totalPrice)} تومان`],
    ...(r.extraGuestFee > 0 ? ([["هزینه نفر اضافه", `${formatPrice(r.extraGuestFee)} تومان`]] as [string, React.ReactNode][]) : []),
    ["پیش‌پرداخت", `${formatPrice(r.depositAmount)} تومان`],
    ["روش پرداخت", r.paymentMethod === "gateway" ? "درگاه آنلاین" : r.paymentMethod === "card" ? "کارت به کارت" : r.paymentMethod === "manual" ? "ثبت دستی" : "—"],
    ["مرجع تراکنش", r.paymentRef ? <span key="p" className="font-mono" dir="ltr">{faNum(r.paymentRef)}</span> : "—"],
    ["زمان پرداخت", formatDateTime(r.paidAt)],
    ["زمان تایید", formatDateTime(r.confirmedAt)],
    ["پیامک کد رزرو", r.smsStatus === "sent" ? "ارسال شد" : r.smsStatus === "simulated" ? "شبیه‌سازی (پنل پیامک تنظیم نشده)" : r.smsStatus === "failed" ? "ناموفق" : "—"],
    ["زمان ثبت", formatDateTime(r.createdAt)],
  ];
  return (
    <div>
      <Link href="/admin/reservations" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700"><ArrowRight className="h-4 w-4" /> بازگشت به رزروها</Link>
      <PageHeader
        title={`رزرو ${r.guestName}`}
        desc={r.itemName}
        action={<Link href={`/track/${r.trackingCode}?phone=${r.phone}`} target="_blank" className="btn"><ExternalLink className="h-4 w-4" /> صفحه مهمان</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="card card-border bg-base-100 shadow-sm overflow-hidden block">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">{r.kind === "room" ? <BedDouble className="h-5 w-5" /> : <Waves className="h-5 w-5" />}</span>
              <h3 className="font-extrabold text-slate-900">جزئیات درخواست</h3>
            </div>
            <dl className="grid sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-100 px-5 py-3 text-sm sm:odd:border-l">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-left font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
            {r.notes && <div className="bg-amber-50/60 p-5 text-sm leading-7 text-slate-700"><b>توضیحات مهمان:</b> {r.notes}</div>}
          </div>
          <ReservationEditForm r={r} />
        </div>
        <div className="lg:sticky lg:top-8 lg:self-start">
          <ReservationActions r={r} />
        </div>
      </div>
    </div>
  );
}
