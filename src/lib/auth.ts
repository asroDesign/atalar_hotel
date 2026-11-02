import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { admins, sessions } from "@/db/schema";

const COOKIE = "atalar_session";
const MAX_AGE_DAYS = 14;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

export async function createSession(adminId: number) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAX_AGE_DAYS * 86400000);
  await db.insert(sessions).values({ id, adminId, expiresAt });
  const store = await cookies();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (id) await db.delete(sessions).where(eq(sessions.id, id));
  store.delete(COOKIE);
}

export async function getCurrentAdmin() {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (!id) return null;
  const rows = await db
    .select({ id: admins.id, name: admins.name, email: admins.email })
    .from(sessions)
    .innerJoin(admins, eq(admins.id, sessions.adminId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
