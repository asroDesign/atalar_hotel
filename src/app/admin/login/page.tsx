import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "ورود مدیریت" };

export default async function LoginPage() {
  await ensureSeeded();
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-950 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/70" />
      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-3xl font-black text-brand-950 shadow-xl">آ</span>
          <h1 className="mt-4 text-2xl font-black">پنل مدیریت هتل آتالار</h1>
          <p className="mt-1 text-sm text-white/60">برای ادامه وارد حساب خود شوید</p>
        </div>
        <div className="rounded-3xl bg-white p-7 shadow-2xl">
          <LoginForm />
          <div className="mt-5 rounded-xl bg-amber-50 p-3 text-center text-xs leading-6 text-amber-800">
            حساب نمایشی: admin@atalar.ir / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
