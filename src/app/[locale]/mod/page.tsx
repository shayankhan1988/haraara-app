import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, timeAgo } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { daysAgo } from "@/lib/time";
import { approveDeal, banUser, rejectDeal, resolveReport } from "@/app/actions/mod";

export default async function ModPage({ params }: PageProps<"/[locale]/mod">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!hasRole(user, "MODERATOR")) notFound();
  const t = getDictionary(locale);
  const weekAgo = daysAgo(7);

  const [queue, reports, clicks, topClicked] = await Promise.all([
    db.deal.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { id: true, username: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    db.report.findMany({
      where: { status: "OPEN" },
      include: {
        user: { select: { username: true } },
        deal: { select: { id: true, title: true } },
        comment: { select: { body: true, user: { select: { id: true, username: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    db.click.count({ where: { createdAt: { gt: weekAgo } } }),
    db.click.groupBy({
      by: ["dealId"],
      where: { createdAt: { gt: weekAgo } },
      _count: { _all: true },
      orderBy: { _count: { dealId: "desc" } },
      take: 5,
    }),
  ]);
  const topDeals = await db.deal.findMany({
    where: { id: { in: topClicked.map((c) => c.dealId) } },
    select: { id: true, title: true },
  });

  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">{t.mod.title}</h1>

      <section className="card p-5">
        <h2 className="mb-2 font-bold">{t.mod.stats}: <span dir="ltr">{clicks}</span></h2>
        <ol className="list-decimal ps-5 text-sm">
          {topClicked.map((c) => (
            <li key={c.dealId}>
              <Link className="hover:underline" href={`/${locale}/deals/${c.dealId}`} dir="auto">
                {topDeals.find((d) => d.id === c.dealId)?.title ?? c.dealId}
              </Link>{" "}
              · {c._count._all} {t.mod.clicks}
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t.mod.queue} ({queue.length})</h2>
        {queue.length === 0 && <p className="text-sm text-gray-500 dark:text-zinc-400">{t.mod.empty}</p>}
        {queue.map((d) => (
          <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <Link href={`/${locale}/deals/${d.id}`} className="font-semibold hover:underline" dir="auto">{d.title}</Link>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {d.user.username} · {timeAgo(d.createdAt, t.time)} ·{" "}
                <span dir="ltr">{new URL(d.url).hostname}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <form action={approveDeal}>{hidden("locale", locale)}{hidden("dealId", d.id)}<button className="btn-primary">{t.mod.approve}</button></form>
              <form action={rejectDeal}>{hidden("locale", locale)}{hidden("dealId", d.id)}<button className="btn-ghost">{t.mod.reject}</button></form>
              <form action={banUser}>{hidden("locale", locale)}{hidden("userId", d.user.id)}<button className="btn-ghost text-red-600 dark:text-red-400">{t.mod.banUser}</button></form>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t.mod.reports} ({reports.length})</h2>
        {reports.length === 0 && <p className="text-sm text-gray-500 dark:text-zinc-400">{t.mod.empty}</p>}
        {reports.map((r) => (
          <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div className="min-w-0">
              {r.deal && <Link href={`/${locale}/deals/${r.deal.id}`} className="font-semibold hover:underline" dir="auto">{r.deal.title}</Link>}
              {r.comment && <p className="mt-1 rounded bg-gray-50 dark:bg-zinc-800 p-2" dir="auto">“{r.comment.body}” — {r.comment.user.username}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{r.user.username}: <span dir="auto">{r.reason}</span> · {timeAgo(r.createdAt, t.time)}</p>
            </div>
            <div className="flex gap-2">
              {r.comment ? (
                <form action={resolveReport}>{hidden("locale", locale)}{hidden("reportId", r.id)}{hidden("action", "hideComment")}<button className="btn-primary">{t.mod.hideComment}</button></form>
              ) : (
                <form action={resolveReport}>{hidden("locale", locale)}{hidden("reportId", r.id)}{hidden("action", "rejectDeal")}<button className="btn-primary">{t.mod.reject}</button></form>
              )}
              <form action={resolveReport}>{hidden("locale", locale)}{hidden("reportId", r.id)}{hidden("action", "dismiss")}<button className="btn-ghost">{t.mod.dismiss}</button></form>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
