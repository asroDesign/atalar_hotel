import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <SiteHeader hotelName={s.hotelName} phone={s.phone} />
      <main className="min-h-screen">{children}</main>
      <SiteFooter s={s} />
    </>
  );
}
