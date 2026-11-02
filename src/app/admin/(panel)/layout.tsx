import type { ReactNode } from "react";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, reservations } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { AdminShell } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const admin = await requireAdmin();
  const [[p], [m]] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(reservations).where(inArray(reservations.status, ["paid"])),
    db.select({ c: sql<number>`count(*)::int` }).from(messages).where(eq(messages.isRead, false)),
  ]);
  return (
    <AdminShell admin={admin} counts={{ pending: p.c, messages: m.c }}>
      {children}
    </AdminShell>
  );
}
