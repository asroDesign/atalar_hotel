"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Waves,
  Sparkles,
  MapPinned,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Star,
  Loader2,
  Upload,
  Trash2,
  Plus,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Home,
  FileText,
} from "lucide-react";
import { logout } from "@/app/actions/admin";
import { cn, faNum, statusMeta } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "داشبورد", Icon: LayoutDashboard },
  { href: "/admin/reservations", label: "رزروها", Icon: CalendarCheck, badge: "pending" as const },
  { href: "/admin/home", label: "صفحه اصلی", Icon: Home },
  { href: "/admin/booking-page", label: "صفحه رزرو و قوانین", Icon: FileText },
  { href: "/admin/rooms", label: "اتاق‌ها", Icon: BedDouble },
  { href: "/admin/services", label: "خدمات و استخر", Icon: Waves },
  { href: "/admin/amenities", label: "امکانات", Icon: Sparkles },
  { href: "/admin/attractions", label: "جاذبه‌های گردشگری", Icon: MapPinned },
  { href: "/admin/testimonials", label: "نظرات مهمانان", Icon: Star },
  { href: "/admin/messages", label: "پیام‌ها", Icon: MessageSquare, badge: "messages" as const },
  { href: "/admin/settings", label: "تنظیمات", Icon: Settings },
];

export function AdminShell({
  children,
  admin,
  counts,
}: {
  children: ReactNode;
  admin: { name: string; email: string };
  counts: { pending: number; messages: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 text-lg font-black text-brand-950">آ</span>
        <div>
          <div className="font-extrabold text-white">پنل مدیریت آتالار</div>
          <div className="text-xs text-white/50">Atalar Admin</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map(({ href, label, Icon, badge }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          const n = badge ? counts[badge] : 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                active ? "bg-white text-brand-900 shadow-lg" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{label}</span>
              {n > 0 && <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-bold text-brand-950">{faNum(n)}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 font-bold text-white">{admin.name[0]}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{admin.name}</div>
            <div className="truncate text-xs text-white/50">{admin.email}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/" target="_blank" className="flex items-center justify-center gap-1 rounded-lg bg-white/10 py-2 text-xs text-white hover:bg-white/20">
            <ExternalLink className="h-3.5 w-3.5" /> مشاهده سایت
          </Link>
          <form action={logout}>
            <button className="flex w-full items-center justify-center gap-1 rounded-lg bg-rose-500/20 py-2 text-xs text-rose-200 hover:bg-rose-500/30">
              <LogOut className="h-3.5 w-3.5" /> خروج
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 bg-gradient-to-b from-brand-900 to-brand-950 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 animate-fade-up bg-gradient-to-b from-brand-900 to-brand-950">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pr-72">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-extrabold text-slate-800">پنل مدیریت آتالار</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const m = statusMeta[status] ?? statusMeta.cancelled;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1", m.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function SubmitButton({ children, className = "btn-primary" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function FormAlert({ state }: { state: { ok?: boolean; error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.error)
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
        <AlertCircle className="h-4 w-4" /> {state.error}
      </div>
    );
  if (state.ok)
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-4 w-4" /> {state.message}
      </div>
    );
  return null;
}

export function Toast({ message, onDone, tone = "success" }: { message: string | null; onDone: () => void; tone?: "success" | "error" }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className={cn("fixed bottom-6 left-6 z-[90] flex animate-fade-up items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-2xl", tone === "success" ? "bg-brand-800" : "bg-rose-600")}>
      {tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {message}
    </div>
  );
}

export function EmptyBox({ title, desc, action, icon }: { title: string; desc?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">{icon ?? <ImageIcon className="h-6 w-6" />}</div>
      <h3 className="mt-4 font-bold text-slate-800">{title}</h3>
      {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ImageListInput({ name, initial, single = false }: { name: string; initial: string[]; single?: boolean }) {
  const [list, setList] = useState<string[]>(initial.filter(Boolean));
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (u: string) => setList((l) => (single ? [u] : [...l, u]));

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setErr("");
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطا در آپلود");
        add(data.url);
        if (single) break;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "خطا در آپلود");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={list.join("\n")} />
      {list.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {list.map((src, i) => (
            <div key={src + i} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && !single && <span className="absolute right-1 top-1 rounded-md bg-gold-400 px-1.5 py-0.5 text-[10px] font-bold text-brand-950">کاور</span>}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition group-hover:opacity-100">
                {i > 0 && (
                  <button type="button" onClick={() => setList((l) => [l[i], ...l.filter((_, j) => j !== i)])} className="rounded-lg bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700">
                    کاور
                  </button>
                )}
                <button type="button" onClick={() => setList((l) => l.filter((_, j) => j !== i))} className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500 text-white">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="آدرس تصویر (https://...)" dir="ltr" className="input flex-1 text-left" />
        <button
          type="button"
          onClick={() => {
            if (url.trim()) {
              add(url.trim());
              setUrl("");
            }
          }}
          className="btn-ghost"
        >
          <Plus className="h-4 w-4" /> افزودن لینک
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-ghost">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} آپلود
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => onFiles(e.target.files)} />
      </div>
      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-xl animate-fade-up overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 hover:bg-slate-200"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
