"use client";

import { useActionState } from "react";
import { Loader2, LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import { login } from "@/app/actions/admin";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">ایمیل</label>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="email" type="email" dir="ltr" defaultValue="admin@atalar.ir" className="input pr-10 text-left" required />
        </div>
      </div>
      <div>
        <label className="label">رمز عبور</label>
        <div className="relative">
          <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="password" type="password" dir="ltr" defaultValue="admin123" className="input pr-10 text-left" required />
        </div>
      </div>
      {state?.error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </div>
      )}
      <button disabled={pending} className="btn-primary w-full py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} ورود به پنل
      </button>
    </form>
  );
}
