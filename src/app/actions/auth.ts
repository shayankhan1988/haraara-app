"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";

export type FormState = { error?: string; ok?: string } | undefined;

function localeOf(form: FormData): Locale {
  const l = String(form.get("locale") ?? "en");
  return isLocale(l) ? l : "en";
}

function safeNext(form: FormData, locale: Locale) {
  const next = String(form.get("next") ?? "");
  return next.startsWith(`/${locale}`) && !next.startsWith("//") ? next : `/${locale}`;
}

const registerSchema = z.object({
  email: z.email().max(200),
  username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(200),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const parsed = registerSchema.safeParse({
    email: String(form.get("email") ?? "").toLowerCase().trim(),
    username: form.get("username"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "email") return { error: t.auth.invalidEmail };
    if (field === "username") return { error: `${t.auth.username}: ${t.auth.usernameHint}` };
    return { error: `${t.auth.password}: ${t.auth.passwordHint}` };
  }
  const { email, username, password } = parsed.data;
  const exists = await db.user.findFirst({
    where: { OR: [{ email }, { username: { equals: username, mode: "insensitive" } }] },
  });
  if (exists) return { error: t.auth.taken };
  const user = await db.user.create({
    data: { email, username, passwordHash: await hashPassword(password), locale },
  });
  await createSession(user.id);
  redirect(safeNext(form, locale));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: t.auth.invalid };
  if (user.banned) return { error: t.auth.banned };
  await createSession(user.id);
  redirect(safeNext(form, locale));
}

export async function logout(form: FormData) {
  await destroySession();
  redirect(`/${localeOf(form)}`);
}
