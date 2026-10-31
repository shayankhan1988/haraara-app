"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import type { FormState } from "./auth";

function localeOf(form: FormData): Locale {
  const l = String(form.get("locale") ?? "en");
  return isLocale(l) ? l : "en";
}

function num(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function createAlert(_: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/alerts`);
  const keyword = String(form.get("keyword") ?? "").trim().slice(0, 80) || null;
  const categoryId = String(form.get("categoryId") ?? "") || null;
  if (!keyword && !categoryId) return { error: t.alerts.needOne };
  const count = await db.alert.count({ where: { userId: user.id } });
  if (count >= 25) return { error: t.errors.generic };
  await db.alert.create({
    data: {
      userId: user.id,
      keyword,
      categoryId,
      maxPrice: num(form.get("maxPrice")),
      minTemperature: num(form.get("minTemperature")),
    },
  });
  revalidatePath(`/${locale}/alerts`);
  return { ok: "1" };
}

export async function deleteAlert(form: FormData) {
  const locale = localeOf(form);
  const user = await getCurrentUser();
  if (!user) return;
  await db.alert.deleteMany({ where: { id: String(form.get("id")), userId: user.id } });
  revalidatePath(`/${locale}/alerts`);
}

export async function markNotificationsRead(form: FormData) {
  const locale = localeOf(form);
  const user = await getCurrentUser();
  if (!user) return;
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath(`/${locale}/notifications`);
}
