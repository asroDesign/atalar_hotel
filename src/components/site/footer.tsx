import Link from "next/link";
import { Camera as Instagram, MapPin, Phone, Mail, Send, MessageCircle, Clock } from "lucide-react";
import type { SiteSettings } from "@/lib/data";
import { faNum } from "@/lib/utils";

export function SiteFooter({ s }: { s: SiteSettings }) {
  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-950 text-slate-300">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 text-lg font-black text-brand-950">آ</span>
            <div>
              <div className="text-lg font-extrabold text-white">{s.hotelName}</div>
              <div className="text-xs text-slate-400">{s.tagline}</div>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            اقامتی گرم و خانوادگی در قلب سرعین؛ با ۱۶ اتاق و سوئیت دنج، استخر خانوادگی اختصاصی و مهمان‌نوازی اصیل آذربایجانی.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { href: `https://instagram.com/${s.instagram}`, Icon: Instagram },
              { href: `https://t.me/${s.telegram}`, Icon: Send },
              { href: `https://wa.me/${s.whatsapp}`, Icon: MessageCircle },
            ].map(({ href, Icon }) => (
              <a key={href} href={href} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 transition hover:bg-gold-400 hover:text-brand-950">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-white">دسترسی سریع</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/rooms", "اتاق‌ها و سوئیت‌ها"],
              ["/services/family-pool", "استخر خانوادگی"],
              ["/amenities", "امکانات هتل"],
              ["/attractions", "جاذبه‌های گردشگری"],
              ["/booking", "رزرو آنلاین"],
              ["/track", "پیگیری رزرو"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="transition hover:text-gold-300">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-white">قوانین اقامت</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-gold-400" /> ساعت ورود: {faNum(s.checkInTime)}</li>
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-gold-400" /> ساعت خروج: {faNum(s.checkOutTime)}</li>
            <li>پیش‌پرداخت: {faNum(s.depositPercent)}٪ مبلغ کل</li>
            <li>رزرو فقط پس از صدور کد رزرو قطعی است.</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-white">ارتباط با ما</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />{s.address}</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 text-gold-400" /><span dir="ltr">{faNum(s.phone)}</span></li>
            <li className="flex gap-2"><Phone className="h-4 w-4 text-gold-400" /><span dir="ltr">{faNum(s.mobile)}</span></li>
            <li className="flex gap-2"><Mail className="h-4 w-4 text-gold-400" />{s.email}</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {faNum(1404)} تمامی حقوق برای {s.hotelName} محفوظ است. ·{" "}
        <Link href="https://asrodev.ir" className="hover:text-gold-300">طراحی توسط آسرودیزاین</Link>
      </div>
    </footer>
  );
}
