"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { publishDeal } from "@/lib/publish";
import { isLocale } from "@/i18n/config";

async function requireMod() {
  const user = await getCurrentUser();
  if (!hasRole(user, "MODERATOR")) notFound();
  return user!;
}

function done(form: FormData) {
  const l = String(form.get("locale") ?? "en");
  revalidatePath(`/${isLocale(l) ? l : "en"}`, "layout");
}

export async function approveDeal(form: FormData) {
  await requireMod();
  const id = String(form.get("dealId"));
  const deal = await db.deal.findUnique({ where: { id } });
  if (!deal) return;
  if (deal.publishedAt) {
    // Al eerder gepubliceerd (teruggezet na meldingen): alleen weer zichtbaar maken.
    await db.deal.update({ where: { id }, data: { status: "PUBLISHED" } });
  } else {
    await publishDeal(id);
  }
  await db.report.updateMany({ where: { dealId: id, commentId: null, status: "OPEN" }, data: { status: "DISMISSED" } });
  done(form);
}

export async function rejectDeal(form: FormData) {
  await requireMod();
  const id = String(form.get("dealId"));
  await db.deal.update({ where: { id }, data: { status: "REJECTED" } });
  await db.report.updateMany({ where: { dealId: id, status: "OPEN" }, data: { status: "RESOLVED" } });
  done(form);
}

export async function resolveReport(form: FormData) {
  await requireMod();
  const id = String(form.get("reportId"));
  const action = String(form.get("action"));
  const report = await db.report.findUnique({ where: { id } });
  if (!report) return;
  if (action === "hideComment" && report.commentId) {
    const c = await db.comment.findUnique({ where: { id: report.commentId } });
    if (c && !c.hidden) {
      await db.$transaction([
        db.comment.update({ where: { id: c.id }, data: { hidden: true } }),
        db.deal.update({ where: { id: c.dealId }, data: { commentCount: { decrement: 1 } } }),
      ]);
    }
  }
  if (action === "rejectDeal" && report.dealId) {
    await db.deal.update({ where: { id: report.dealId }, data: { status: "REJECTED" } });
  }
  await db.report.update({
    where: { id },
    data: { status: action === "dismiss" ? "DISMISSED" : "RESOLVED" },
  });
  done(form);
}

export async function banUser(form: FormData) {
  const mod = await requireMod();
  const userId = String(form.get("userId"));
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.id === mod.id || hasRole(target, "MODERATOR")) return;
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { banned: true } }),
    db.session.deleteMany({ where: { userId } }),
    db.deal.updateMany({ where: { userId, status: "PENDING" }, data: { status: "REJECTED" } }),
  ]);
  done(form);
}
