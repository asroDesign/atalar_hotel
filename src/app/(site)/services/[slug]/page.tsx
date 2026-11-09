import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { CalendarCheck, ChevronLeft, Clock, ShieldAlert, Users, Phone } from "lucide-react";
import { db } from "@/db";
import { rooms, services } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { getContent } from "@/lib/content";
import { minServicePrice, toBookRoom, toBookService } from "@/lib/booking";
import { faNum, formatPrice } from "@/lib/utils";
import { Gallery, VideoPlayer } from "@/components/media";
import { BookingForm } from "@/components/booking-form";
import { DynIcon } from "@/components/dyn-icon";

export default async function ServiceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [svc] = await db.select().from(services).where(eq(services.slug, decodeURIComponent(slug)));
  if (!svc || !svc.isActive) notFound();
  const [s, { booking }] = await Promise.all([getSettings(), getContent()]);
  const fromPrice = minServicePrice(svc);
  const [allRooms, bookable] = await Promise.all([
    db.select().from(rooms).where(eq(rooms.isActive, true)).orderBy(asc(rooms.sortOrder)),
    db.select().from(services).where(and(eq(services.isActive, true), eq(services.isBookable, true))),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pt-32">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">خانه</Link><ChevronLeft className="h-4 w-4" />
        <Link href="/services" className="hover:text-brand-700">خدمات</Link><ChevronLeft className="h-4 w-4" />
        <span className="min-w-0 break-words text-slate-800">{svc.name}</span>
      </nav>
      <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        <div className="min-w-0 space-y-8 sm:space-y-10">
          <Gallery images={svc.gallery.length ? svc.gallery : [svc.image]} alt={svc.name} hasVideo={!!svc.videoUrl} />
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-700 text-white"><DynIcon name={svc.icon} className="h-7 w-7" /></span>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-black text-slate-900 sm:text-3xl md:text-4xl">{svc.name}</h1>
              <p className="mt-2 break-words text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">{svc.shortDescription}</p>
              {svc.isBookable && <a href="#service-booking" className="btn btn-secondary mt-5 h-12 w-full sm:w-auto lg:hidden"><CalendarCheck className="h-4 w-4" /> رزرو {svc.name}</a>}
            </div>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {svc.workingHours && <div className="card card-border bg-base-100 shadow-sm flex min-w-0 items-center gap-3 p-3 text-sm flex-row sm:p-4"><Clock className="h-5 w-5 shrink-0 text-brand-600" /><span className="min-w-0 break-words">{svc.workingHours}</span></div>}
            {svc.isBookable && <div className="card card-border bg-base-100 shadow-sm flex min-w-0 items-center gap-3 p-3 text-sm flex-row sm:p-4"><Users className="h-5 w-5 shrink-0 text-brand-600" /><span className="min-w-0 break-words">حداکثر {faNum(svc.maxGuests)} نفر</span></div>}
            {fromPrice > 0 && <div className="card card-border bg-base-100 shadow-sm min-w-0 p-3 text-sm block sm:p-4"><span className="text-slate-500">{Object.keys(svc.slotPrices).length ? "از " : ""}</span><span className="break-words font-black text-brand-700">{formatPrice(fromPrice)} تومان</span><span className="break-words text-slate-500"> / {svc.priceUnit}</span></div>}
          </div>
          <div className="space-y-4 break-words leading-7 text-slate-600 sm:leading-8">
            {svc.description.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {svc.timeSlots.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-extrabold text-slate-900">سانس‌ها و قیمت‌ها</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 sm:gap-3">
                {svc.timeSlots.map((t) => (
                  <div key={t} className="min-w-0 rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50 to-white p-3 text-center sm:p-4">
                    <div dir="ltr" className="font-mono text-xs font-bold text-brand-800 sm:text-sm">{faNum(t)}</div>
                    <div className="mt-1 break-words text-xs font-black text-slate-900 sm:text-sm">{formatPrice(svc.slotPrices[t] ?? svc.price)}</div>
                    <div className="text-[11px] text-slate-400">تومان</div>
                  </div>
                ))}
              </div>
              {svc.extraGuestPrice > 0 && (
                <p className="mt-4 flex items-start gap-2 rounded-2xl bg-gold-400/10 px-3 py-3 text-sm text-slate-700 sm:px-4">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                  <span className="min-w-0 break-words">قیمت هر سانس برای حداکثر {faNum(svc.includedGuests)} نفر است؛ به ازای هر نفر اضافه {formatPrice(svc.extraGuestPrice)} تومان (حداکثر {faNum(svc.maxGuests)} نفر).</span>
                </p>
              )}
            </section>
          )}
          {svc.rules.length > 0 && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-amber-900"><ShieldAlert className="h-5 w-5" /> قوانین و مقررات</h2>
              <ul className="space-y-2 text-sm leading-7 text-amber-900/80">
                {svc.rules.map((r) => <li key={r} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /><span className="min-w-0 break-words">{r}</span></li>)}
              </ul>
            </section>
          )}
          {svc.videoUrl && (
            <section id="video" className="scroll-mt-28">
              <h2 className="mb-4 text-xl font-extrabold text-slate-900">ویدیو</h2>
              <VideoPlayer url={svc.videoUrl} poster={svc.image} />
            </section>
          )}
        </div>
        <aside id="service-booking" className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start">
          {svc.isBookable ? (
            <div className="card card-border bg-base-100 shadow-sm block">
              <div className="rounded-t-[1.25rem] bg-gradient-to-l from-brand-800 to-brand-950 p-4 text-white sm:p-5">
                <div className="break-words text-sm text-white/70">رزرو {svc.name}</div>
                <div className="mt-1 break-words text-xl font-black sm:text-2xl">{Object.keys(svc.slotPrices).length ? <span className="text-sm font-medium text-white/70">از </span> : null}{formatPrice(fromPrice)} <span className="text-sm font-medium text-white/70">تومان · {svc.priceUnit}</span></div>
              </div>
              <div className="p-4 sm:p-5">
                <BookingForm
                  compact
                  depositPercent={Number(s.depositPercent) || 30}
                  defaultKind="service"
                  defaultItemId={svc.id}
                  rooms={allRooms.map(toBookRoom)}
                  services={bookable.map(toBookService)}
                  hotelRules={booking.hotelRules}
                  requireRulesAccept={booking.requireRulesAccept}
                />
              </div>
            </div>
          ) : (
            <div className="card card-border bg-base-100 shadow-sm p-4 text-center block sm:p-6">
              <h3 className="font-extrabold text-slate-900">اطلاعات بیشتر</h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">این خدمت برای مهمانان هتل در دسترس است. برای هماهنگی با پذیرش تماس بگیرید.</p>
              <a href={`tel:${s.phone}`} className="btn btn-primary mt-4 w-full"><Phone className="h-4 w-4" /><span dir="ltr">{faNum(s.phone)}</span></a>
              <Link href="/booking" className="btn btn-secondary mt-2 w-full">رزرو اتاق</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
