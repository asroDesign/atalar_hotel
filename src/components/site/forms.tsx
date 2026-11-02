"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, Send, CreditCard, Landmark, Copy, Search } from "lucide-react";
import { sendMessage, payDeposit, lookupReservation } from "@/app/actions/public";
import { cn, faNum, formatPrice } from "@/lib/utils";

function Alert({ state }: { state: { ok?: boolean; error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.error)
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
        <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
      </div>
    );
  if (state.ok)
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" /> {state.message}
      </div>
    );
  return null;
}

export function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label">نام و نام خانوادگی *</label>
        <input name="name" className="input" required />
      </div>
      <div>
        <label className="label">شماره تماس</label>
        <input name="phone" className="input text-left" dir="ltr" />
      </div>
      <div>
        <label className="label">ایمیل</label>
        <input name="email" type="email" className="input text-left" dir="ltr" />
      </div>
      <div>
        <label className="label">موضوع</label>
        <select name="subject" className="input">
          <option>سؤال درباره رزرو</option>
          <option>استخر خانوادگی</option>
          <option>رزرو گروهی و تخفیف</option>
          <option>پیشنهاد و انتقاد</option>
          <option>سایر</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">متن پیام *</label>
        <textarea name="body" rows={5} className="input" required />
      </div>
      <div className="sm:col-span-2">
        <Alert state={state} />
      </div>
      <div className="sm:col-span-2">
        <button disabled={pending} className="btn-primary w-full py-3 sm:w-auto sm:px-10">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {pending ? "در حال ارسال..." : "ارسال پیام"}
        </button>
      </div>
    </form>
  );
}

export function PaymentPanel({
  code,
  phone,
  amount,
  cardNumber,
  cardHolder,
  bankName,
}: {
  code: string;
  phone: string;
  amount: number;
  cardNumber: string;
  cardHolder: string;
  bankName: string;
}) {
  const [state, action, pending] = useActionState(payDeposit, null);
  const [method, setMethod] = useState<"gateway" | "card">("gateway");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="method" value={method} />
      <div className="grid grid-cols-2 gap-3">
        {[
          { k: "gateway" as const, label: "درگاه پرداخت آنلاین", Icon: CreditCard },
          { k: "card" as const, label: "کارت به کارت", Icon: Landmark },
        ].map(({ k, label, Icon }) => (
          <button
            type="button"
            key={k}
            onClick={() => setMethod(k)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-semibold transition",
              method === k ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-600 hover:border-slate-300",
            )}
          >
            <Icon className="h-6 w-6" /> {label}
          </button>
        ))}
      </div>

      {method === "card" ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-5 text-white shadow-xl">
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-gold-400/20 blur-2xl" />
            <div className="text-xs text-white/60">{bankName}</div>
            <div className="mt-4 flex items-center justify-between">
              <span dir="ltr" className="font-mono text-xl tracking-widest">{faNum(cardNumber)}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(cardNumber.replace(/-/g, ""));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="glass grid h-9 w-9 place-items-center rounded-lg"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-3 text-sm text-white/80">به نام: {cardHolder}</div>
          </div>
          <div>
            <label className="label">شماره پیگیری / مرجع تراکنش *</label>
            <input name="ref" className="input text-left" dir="ltr" placeholder="مثلاً 123456" inputMode="numeric" />
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-500">
          با کلیک بر روی دکمه زیر به درگاه پرداخت امن منتقل می‌شوید. (در نسخه نمایشی، پرداخت به‌صورت شبیه‌سازی‌شده انجام می‌شود.)
        </p>
      )}

      <Alert state={state} />

      <button disabled={pending} className="btn-gold w-full py-3.5 text-base">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
        {method === "gateway" ? `پرداخت ${formatPrice(amount)} تومان` : "ثبت اطلاعات واریز"}
      </button>
    </form>
  );
}

export function TrackLookup() {
  const [state, action, pending] = useActionState(lookupReservation, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">کد پیگیری یا کد رزرو</label>
        <input name="code" className="input text-left font-mono uppercase" dir="ltr" placeholder="TR-XXXXXX" required />
      </div>
      <div>
        <label className="label">شماره موبایل</label>
        <input name="phone" className="input text-left" dir="ltr" placeholder="09121234567" required />
      </div>
      <Alert state={state} />
      <button disabled={pending} className="btn-primary w-full py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        پیگیری رزرو
      </button>
    </form>
  );
}
