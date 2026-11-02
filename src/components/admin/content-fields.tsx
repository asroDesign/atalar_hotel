"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  desc,
  icon,
  visible,
  onToggleVisible,
  defaultOpen = false,
  children,
}: {
  title: string;
  desc?: string;
  icon?: ReactNode;
  visible?: boolean;
  onToggleVisible?: (v: boolean) => void;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={cn("card overflow-hidden transition", visible === false && "opacity-70")}>
      <div className="flex items-center gap-3 p-4">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-3 text-right">
          {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-slate-900">{title}</div>
            {desc && <div className="truncate text-xs text-slate-500">{desc}</div>}
          </div>
          <ChevronDown className={cn("h-5 w-5 text-slate-400 transition", open && "rotate-180")} />
        </button>
        {onToggleVisible && (
          <button
            type="button"
            onClick={() => onToggleVisible(!visible)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
              visible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
            )}
          >
            {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {visible ? "نمایش" : "مخفی"}
          </button>
        )}
      </div>
      {open && <div className="animate-fade-up space-y-4 border-t border-slate-100 p-5">{children}</div>}
    </section>
  );
}

export function TextField({
  label,
  value,
  onChange,
  area,
  rows = 3,
  hint,
  ltr,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  rows?: number;
  hint?: string;
  ltr?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="input" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} dir={ltr ? "ltr" : undefined} className={cn("input", ltr && "text-left")} />
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Switch({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-brand-600" : "bg-slate-300")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "right-0.5" : "right-[22px]")} />
      </button>
    </label>
  );
}
