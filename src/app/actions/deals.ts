"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { TRUST, DEFAULT_COUNTRY, currencyFor } from "@/lib/config";
import { domainOf, matchMerchantDomain } from "@/lib/affiliate";
import { temperatureFromCounts } from "@/lib/temperature";
import { publishDeal, notifyAlerts } from "@/lib/publish";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import type { FormState } from "./auth";

function localeOf(form: FormData): Locale {
  const l = String(form.get("locale") ?? "en");
  return isLocale(l) ? l : "en";
}

async function requireUser(locale: Locale, next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  return user;
}

const optionalNumber = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 1e9));

const dealSchema = z.object({
  title: z.string().trim().min(8).max(140),
  url: z.url({ protocol: /^https?$/ }).max(2000),
  price: optionalNumber,
  originalPrice: optionalNumber,
  couponCode: z.string().trim().max(60),
  imageUrl: z.union([z.literal(""), z.url({ protocol: /^https$/ }).max(2000)]),
  categoryId: z.string().min(1),
  description: z.string().trim().min(10).max(5000),
  expiresAt: z.union([z.literal(""), z.iso.date()]),
});

export async function createDeal(_: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const user = await requireUser(locale, `/${locale}/deals/new`);

  const parsed = dealSchema.safeParse(Object.fromEntries(
    ["title", "url", "price", "originalPrice", "couponCode", "imageUrl", "categoryId", "description", "expiresAt"].map(
      (k) => [k, String(form.get(k) ?? "")],
    ),
  ));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    if (field === "url" || field === "imageUrl") return { error: t.errors.invalidUrl };
    const label = (t.post as Record<string, string>)[field === "title" ? "dealTitle" : field] ?? field;
    return { error: `${label}: ${t.errors.required}` };
  }
  const d = parsed.data;

  const since = new Date(Date.now() - 864e5);
  const recent = await db.deal.count({ where: { userId: user.id, createdAt: { gt: since } } });
  if (recent >= TRUST.maxDealsPerDay && !hasRole(user, "CURATOR")) return { error: t.post.rateLimited };

  const dup = await db.deal.findFirst({
    where: { url: d.url, createdAt: { gt: new Date(Date.now() - 7 * 864e5) }, status: { in: ["PUBLISHED", "PENDING"] } },
  });
  if (dup) return { error: t.post.duplicate };

  const category = await db.category.findUnique({ where: { id: d.categoryId } });
  if (!category) return { error: `${t.post.category}: ${t.errors.required}` };

  const host = domainOf(d.url);
  const merchants = await db.merchant.findMany({ select: { id: true, domain: true } });
  const merchantDomain = host ? matchMerchantDomain(host, merchants.map((m) => m.domain)) : null;
  const merchantId = merchants.find((m) => m.domain === merchantDomain)?.id ?? null;

  const publishedCount = await db.deal.count({ where: { userId: user.id, status: "PUBLISHED" } });
  const trusted = hasRole(user, "CURATOR") || publishedCount >= TRUST.autoPublishAfter;

  const deal = await db.deal.create({
    data: {
      title: d.title,
      url: d.url,
      price: d.price,
      originalPrice: d.originalPrice,
      couponCode: d.couponCode || null,
      imageUrl: d.imageUrl || null,
      description: d.description,
      expiresAt: d.expiresAt ? new Date(`${d.expiresAt}T23:59:59+04:00`) : null,
      categoryId: category.id,
      merchantId,
      userId: user.id,
      country: DEFAULT_COUNTRY,
      currency: currencyFor(DEFAULT_COUNTRY),
      locale,
      status: "PENDING",
    },
  });

  if (trusted) await publishDeal(deal.id);
  revalidatePath(`/${locale}`);
  redirect(`/${locale}/deals/${deal.id}?posted=${trusted ? "live" : "queued"}`);
}

export async function vote(dealId: string, value: 1 | -1, locale: Locale) {
  const user = await requireUser(locale, `/${locale}/deals/${dealId}`);
  if (value !== 1 && value !== -1) return;
  const deal = await db.deal.findUnique({ where: { id: dealId }, select: { status: true, userId: true } });
  if (!deal || deal.status !== "PUBLISHED" || deal.userId === user.id) return;

  await db.$transaction(async (tx) => {
    const existing = await tx.vote.findUnique({ where: { userId_dealId: { userId: user.id, dealId } } });
    if (existing?.value === value) {
      await tx.vote.delete({ where: { userId_dealId: { userId: user.id, dealId } } });
    } else {
      await tx.vote.upsert({
        where: { userId_dealId: { userId: user.id, dealId } },
        create: { userId: user.id, dealId, value },
        update: { value },
      });
    }
    const [hot, cold] = await Promise.all([
      tx.vote.count({ where: { dealId, value: 1 } }),
      tx.vote.count({ where: { dealId, value: -1 } }),
    ]);
    await tx.deal.update({
      where: { id: dealId },
      data: { hotCount: hot, coldCount: cold, temperature: temperatureFromCounts(hot, cold) },
    });
  });
  // Alerts met een minimumtemperatuur kunnen nu pas raak zijn.
  await notifyAlerts(dealId);
  revalidatePath(`/${locale}/deals/${dealId}`);
  revalidatePath(`/${locale}`);
}

export async function addComment(form: FormData) {
  const locale = localeOf(form);
  const dealId = String(form.get("dealId") ?? "");
  const user = await requireUser(locale, `/${locale}/deals/${dealId}`);
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);
  if (!body) return;
  const recent = await db.comment.count({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 36e5) } },
  });
  if (recent >= TRUST.maxCommentsPerHour && !hasRole(user, "CURATOR")) return;
  const deal = await db.deal.findUnique({ where: { id: dealId }, select: { status: true } });
  if (!deal || deal.status !== "PUBLISHED") return;
  await db.$transaction([
    db.comment.create({ data: { body, dealId, userId: user.id } }),
    db.deal.update({ where: { id: dealId }, data: { commentCount: { increment: 1 } } }),
  ]);
  revalidatePath(`/${locale}/deals/${dealId}`);
}

export async function reportContent(form: FormData) {
  const locale = localeOf(form);
  const dealId = String(form.get("dealId") ?? "") || null;
  const commentId = String(form.get("commentId") ?? "") || null;
  const user = await requireUser(locale, `/${locale}/deals/${dealId ?? ""}`);
  const reason = String(form.get("reason") ?? "").trim().slice(0, 500) || "-";
  if (!dealId && !commentId) return;
  const already = await db.report.findFirst({ where: { userId: user.id, dealId, commentId, status: "OPEN" } });
  if (!already) await db.report.create({ data: { userId: user.id, dealId, commentId, reason } });

  // Veel meldingen op een deal: terug naar de wachtrij tot een moderator kijkt.
  if (dealId && !commentId) {
    const open = await db.report.count({ where: { dealId, commentId: null, status: "OPEN" } });
    if (open >= TRUST.autoHideAfterReports) {
      await db.deal.update({ where: { id: dealId }, data: { status: "PENDING" } });
    }
  }
  redirect(`/${locale}/deals/${dealId ?? ""}?reported=1`);
}

export async function markExpired(form: FormData) {
  const locale = localeOf(form);
  const dealId = String(form.get("dealId") ?? "");
  const user = await requireUser(locale, `/${locale}/deals/${dealId}`);
  const deal = await db.deal.findUnique({ where: { id: dealId } });
  if (!deal) return;
  if (deal.userId !== user.id && !hasRole(user, "CURATOR")) return;
  await db.deal.update({ where: { id: dealId }, data: { status: "EXPIRED" } });
  revalidatePath(`/${locale}/deals/${dealId}`);
  revalidatePath(`/${locale}`);
}
