import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { PageHero, RoomCard, EmptyState } from "@/components/site/ui";
import { cn, faNum } from "@/lib/utils";

export const metadata = { title: "اتاق‌ها و سوئیت‌ها" };

export default async function RoomsPage({ searchParams }: { searchParams: Promise<{ type?: string; guests?: string }> }) {
  const sp = await searchParams;
  const all = await db.select().from(rooms).where(eq(rooms.isActive, true)).orderBy(asc(rooms.sortOrder));
  const types = Array.from(new Set(all.map((r) => r.type)));
  const guests = Number(sp.guests) || 0;
  const list = all.filter((r) => (!sp.type || r.type === sp.type) && (!guests || r.capacity + r.extraBeds >= guests));

  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { type: sp.type, guests: sp.guests, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return s ? `/rooms?${s}` : "/rooms";
  };

  return (
    <>
      <PageHero eyebrow={`${faNum(all.length)} اتاق و سوئیت`} title="اتاق‌ها و سوئیت‌ها" subtitle="اتاقی متناسب با سفر خود انتخاب کنید؛ همه اتاق‌ها دارای آب گرم معدنی، صبحانه محلی و اینترنت رایگان هستند." image="/images/hero.jpg" />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="card card-border bg-base-100 shadow-sm mb-8 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <Link href={href({ type: undefined })} className={cn("whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium", !sp.type ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>همه</Link>
            {types.map((t) => (
              <Link key={t} href={href({ type: t })} className={cn("whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium", sp.type === t ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{t}</Link>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">تعداد نفرات:</span>
            {[undefined, "2", "3", "4", "5"].map((g) => (
              <Link key={g ?? "all"} href={href({ guests: g })} className={cn("grid h-9 min-w-9 place-items-center rounded-lg px-2", (sp.guests ?? undefined) === g ? "bg-gold-400 font-bold text-brand-950" : "bg-slate-100 text-slate-600")}>{g ? `${faNum(g)}+` : "همه"}</Link>
            ))}
          </div>
        </div>
        {list.length === 0 ? (
          <EmptyState title="اتاقی با این فیلتر پیدا نشد" desc="فیلترها را تغییر دهید." action={<Link href="/rooms" className="btn btn-primary">حذف فیلترها</Link>} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => <RoomCard key={r.id} room={r} />)}
          </div>
        )}
      </section>
    </>
  );
}
