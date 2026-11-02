"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, CalendarCheck, Phone, SearchCheck } from "lucide-react";
import { cn, faNum } from "@/lib/utils";

const links = [
  { href: "/", label: "خانه" },
  { href: "/rooms", label: "اتاق‌ها" },
  { href: "/services", label: "خدمات" },
  { href: "/amenities", label: "امکانات" },
  { href: "/attractions", label: "جاذبه‌ها" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس" },
];

export function SiteHeader({ hotelName, phone }: { hotelName: string; phone: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const transparent = pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500",
          transparent ? "frost text-white" : "frost-light text-slate-800 shadow-lg shadow-slate-900/5",
        )}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 text-lg font-black text-brand-950 shadow-md">
            آ
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold">{hotelName}</span>
            <span className={cn("block text-[10px] tracking-[0.25em]", transparent ? "text-white/70" : "text-slate-500")}>
              ATALAR HOTEL
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? transparent
                      ? "bg-white/20"
                      : "bg-brand-50 text-brand-700"
                    : transparent
                      ? "hover:bg-white/10"
                      : "hover:bg-slate-100",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/track"
            title="پیگیری رزرو"
            className={cn(
              "hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium md:flex",
              transparent ? "hover:bg-white/10" : "hover:bg-slate-100",
              pathname.startsWith("/track") && (transparent ? "bg-white/20" : "bg-brand-50 text-brand-700"),
            )}
          >
            <SearchCheck className="h-4 w-4" />
            <span className="hidden xl:inline">پیگیری رزرو</span>
          </Link>
          <a
            href={`tel:${phone}`}
            className={cn(
              "hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium 2xl:flex",
              transparent ? "hover:bg-white/10" : "hover:bg-slate-100",
            )}
          >
            <Phone className="h-4 w-4" />
            <span dir="ltr">{faNum(phone)}</span>
          </a>
          <Link href="/booking" className="btn btn-secondary hidden sm:inline-flex">
            <CalendarCheck className="h-4 w-4" />
            رزرو آنلاین
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn("grid h-10 w-10 place-items-center rounded-xl lg:hidden", transparent ? "bg-white/10" : "bg-slate-100")}
            aria-label="منو"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="frost-light mx-auto mt-2 max-w-7xl animate-fade-up rounded-2xl p-3 shadow-xl lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-xl bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white">
                {l.label}
              </Link>
            ))}
            <Link href="/track" className="rounded-xl bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white">
              پیگیری رزرو
            </Link>
          </div>
          <Link href="/booking" className="btn btn-secondary mt-3 w-full">
            <CalendarCheck className="h-4 w-4" /> رزرو آنلاین
          </Link>
        </div>
      )}
    </header>
  );
}
