"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register } from "@/app/actions/auth";
import type { Dictionary } from "@/i18n/en";
import type { Locale } from "@/i18n/config";

export function AuthForm({ mode, locale, t, next }: { mode: "login" | "register"; locale: Locale; t: Dictionary["auth"]; next: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : register, undefined);
  return (
    <form action={action} className="card mx-auto flex w-full max-w-sm flex-col gap-4 p-6">
      <h1 className="text-xl font-extrabold">{mode === "login" ? t.loginTitle : t.registerTitle}</h1>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">{t.email}</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" dir="ltr" />
      </div>
      {mode === "register" && (
        <div>
          <label className="label" htmlFor="username">{t.username}</label>
          <input id="username" name="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoComplete="username" className="input" dir="ltr" />
          <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{t.usernameHint}</p>
        </div>
      )}
      <div>
        <label className="label" htmlFor="password">{t.password}</label>
        <input id="password" name="password" type="password" required minLength={mode === "register" ? 8 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} className="input" dir="ltr" />
        {mode === "register" && <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{t.passwordHint}</p>}
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-700 dark:text-red-300">{state.error}</p>}
      <button disabled={pending} className="btn-primary">{mode === "login" ? t.submitLogin : t.submitRegister}</button>
      <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
        {mode === "login" ? t.noAccount : t.haveAccount}{" "}
        <Link className="underline" href={`/${locale}/${mode === "login" ? "register" : "login"}?next=${encodeURIComponent(next)}`}>
          {mode === "login" ? t.submitRegister : t.submitLogin}
        </Link>
      </p>
    </form>
  );
}
