"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CreditCard, XCircle, Ban, RotateCcw, Trash2, Loader2 } from "lucide-react";
import type { Reservation, ReservationStatus } from "@/db/schema";
import { setReservationStatus, deleteReservation, updateReservation } from "@/app/actions/admin";
import { FormAlert, StatusBadge, SubmitButton, Toast } from "./ui";

export function ReservationActions({ r }: { r: Reservation }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState(r.status);
  const [code, setCode] = useState(r.reservationCode);
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "error" } | null>(null);

  const go = (s: ReservationStatus) =>
    start(async () => {
      setBusy(s);
      const prev = status;
      setStatus(s);
      const res = await setReservationStatus(r.id, s);
      setBusy(null);
      if (!res.ok) {
        setStatus(prev);
        setToast({ msg: res.error ?? "خطا", tone: "error" });
      } else {
        setCode(res.reservationCode ?? null);
        setToast({ msg: s === "confirmed" ? "رزرو قطعی شد و کد رزرو صادر گردید" : "وضعیت به‌روزرسانی شد", tone: "success" });
        router.refresh();
      }
    });

  const btn = (s: ReservationStatus, label: string, Icon: typeof BadgeCheck, cls: string) => (
    <button disabled={pending || status === s} onClick={() => go(s)} className={`btn w-full justify-start ${cls}`}>
      {busy === s ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />} {label}
    </button>
  );

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-slate-900">وضعیت</h3>
        <StatusBadge status={status} />
      </div>
      {code && status === "confirmed" ? (
        <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-950 p-4 text-center text-white">
          <div className="text-xs text-white/70">کد رزرو صادر شده</div>
          <div className="mt-1 font-mono text-2xl font-black tracking-widest text-gold-300" dir="ltr">{code}</div>
        </div>
      ) : (
        <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">
          تا زمان تایید و صدور کد رزرو، این رزرو قطعی نیست. پیش از تایید، پیش‌پرداخت را با مرجع تراکنش تطبیق دهید.
        </p>
      )}
      <div className="space-y-2">
        {btn("confirmed", "تایید پذیرش و صدور کد رزرو", BadgeCheck, "bg-emerald-600 text-white hover:bg-emerald-700")}
        {btn("paid", "ثبت دستی پرداخت (منتظر تایید)", CreditCard, "bg-sky-50 text-sky-700 hover:bg-sky-100")}
        {btn("pending_payment", "بازگشت به انتظار پرداخت", RotateCcw, "bg-slate-100 text-slate-700 hover:bg-slate-200")}
        {btn("rejected", "رد درخواست", XCircle, "bg-amber-50 text-amber-700 hover:bg-amber-100")}
        {btn("cancelled", "لغو رزرو", Ban, "bg-slate-100 text-slate-700 hover:bg-slate-200")}
      </div>
      <button
        onClick={() => {
          if (!confirm("رزرو به‌طور کامل حذف شود؟")) return;
          start(async () => {
            await deleteReservation(r.id);
            router.push("/admin/reservations");
          });
        }}
        className="btn w-full text-rose-600 hover:bg-rose-50"
      >
        <Trash2 className="h-4 w-4" /> حذف رزرو
      </button>
      <Toast message={toast?.msg ?? null} tone={toast?.tone} onDone={() => setToast(null)} />
    </div>
  );
}

export function ReservationEditForm({ r }: { r: Reservation }) {
  const [state, action] = useActionState(updateReservation, null);
  return (
    <form action={action} className="card space-y-4 p-5">
      <h3 className="font-extrabold text-slate-900">ویرایش اطلاعات</h3>
      <input type="hidden" name="id" value={r.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">نام مهمان</label><input name="guestName" defaultValue={r.guestName} className="input" /></div>
        <div><label className="label">موبایل</label><input name="phone" defaultValue={r.phone} dir="ltr" className="input text-left" /></div>
        <div><label className="label">ایمیل</label><input name="email" defaultValue={r.email} dir="ltr" className="input text-left" /></div>
        <div><label className="label">کد ملی</label><input name="nationalId" defaultValue={r.nationalId} dir="ltr" className="input text-left" /></div>
        <div><label className="label">تعداد نفرات</label><input name="guests" type="number" min={1} defaultValue={r.guests} className="input" /></div>
        <div><label className="label">مرجع پرداخت</label><input name="paymentRef" defaultValue={r.paymentRef} dir="ltr" className="input text-left" /></div>
        <div><label className="label">مبلغ کل (تومان)</label><input name="totalPrice" type="number" defaultValue={r.totalPrice} className="input" /></div>
        <div><label className="label">پیش‌پرداخت (تومان)</label><input name="depositAmount" type="number" defaultValue={r.depositAmount} className="input" /></div>
      </div>
      <div><label className="label">یادداشت مدیر (برای رد/لغو به مهمان نمایش داده می‌شود)</label><textarea name="adminNote" rows={3} defaultValue={r.adminNote} className="input" /></div>
      <FormAlert state={state} />
      <SubmitButton>ذخیره تغییرات</SubmitButton>
    </form>
  );
}
