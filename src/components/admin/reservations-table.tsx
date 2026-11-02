"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { BedDouble, Waves, Check, X, Trash2, Eye, CalendarX2, BadgeCheck } from "lucide-react";
import type { Reservation, ReservationStatus } from "@/db/schema";
import { setReservationStatus, deleteReservation } from "@/app/actions/admin";
import { StatusBadge, Toast, EmptyBox } from "./ui";
import { cn, faNum, formatJalali, formatPrice, relativeTime } from "@/lib/utils";

type Action = { type: "status"; id: number; status: ReservationStatus } | { type: "delete"; id: number };

export function ReservationsTable({ initial }: { initial: Reservation[] }) {
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "error" } | null>(null);
  const [, start] = useTransition();
  const [items, apply] = useOptimistic(initial, (state: Reservation[], a: Action) =>
    a.type === "delete" ? state.filter((r) => r.id !== a.id) : state.map((r) => (r.id === a.id ? { ...r, status: a.status } : r)),
  );

  const changeStatus = (id: number, status: ReservationStatus) =>
    start(async () => {
      apply({ type: "status", id, status });
      const res = await setReservationStatus(id, status);
      if (!res.ok) setToast({ msg: res.error ?? "خطا", tone: "error" });
      else setToast({ msg: status === "confirmed" ? `رزرو تایید شد · کد ${res.reservationCode}` : "وضعیت به‌روزرسانی شد", tone: "success" });
    });

  const remove = (id: number) => {
    if (!confirm("این رزرو حذف شود؟")) return;
    start(async () => {
      apply({ type: "delete", id });
      await deleteReservation(id);
      setToast({ msg: "رزرو حذف شد", tone: "success" });
    });
  };

  if (items.length === 0)
    return <EmptyBox title="رزروی یافت نشد" desc="با تغییر فیلترها دوباره جستجو کنید یا منتظر ثبت رزرو جدید باشید." icon={<CalendarX2 className="h-6 w-6" />} />;

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-right font-medium">مهمان</th>
                <th className="px-4 py-3 text-right font-medium">مورد رزرو</th>
                <th className="px-4 py-3 text-right font-medium">تاریخ</th>
                <th className="px-4 py-3 text-right font-medium">مبلغ / پیش‌پرداخت</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-left font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{r.guestName}</div>
                    <div className="text-xs text-slate-500" dir="ltr" style={{ textAlign: "right" }}>{faNum(r.phone)}</div>
                    <div className="font-mono text-[11px] text-slate-400">{r.trackingCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("grid h-8 w-8 place-items-center rounded-lg", r.kind === "room" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700")}>
                        {r.kind === "room" ? <BedDouble className="h-4 w-4" /> : <Waves className="h-4 w-4" />}
                      </span>
                      <div>
                        <div className="font-medium text-slate-700">{r.itemName}</div>
                        <div className="text-xs text-slate-400">{faNum(r.guests)} نفر</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>{formatJalali(r.checkIn)}</div>
                    <div className="text-slate-400">{r.kind === "room" ? `${faNum(r.nights)} شب` : <span dir="ltr">{faNum(r.timeSlot)}</span>}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-semibold text-slate-700">{formatPrice(r.totalPrice)}</div>
                    <div className="text-brand-700">{formatPrice(r.depositAmount)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                    {r.reservationCode && <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-emerald-700"><BadgeCheck className="h-3 w-3" />{r.reservationCode}</div>}
                    <div className="mt-1 text-[11px] text-slate-400">{relativeTime(r.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {(r.status === "paid" || r.status === "pending_payment") && (
                        <button onClick={() => changeStatus(r.id, "confirmed")} title="تایید و صدور کد رزرو" className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {r.status !== "rejected" && r.status !== "cancelled" && (
                        <button onClick={() => changeStatus(r.id, "rejected")} title="رد درخواست" className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <Link href={`/admin/reservations/${r.id}`} title="جزئیات" className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(r.id)} title="حذف" className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Toast message={toast?.msg ?? null} tone={toast?.tone} onDone={() => setToast(null)} />
    </>
  );
}
