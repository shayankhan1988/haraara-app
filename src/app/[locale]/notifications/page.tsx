import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary, timeAgo } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { markNotificationsRead } from "@/app/actions/alerts";

export default async function NotificationsPage({ params }: PageProps<"/[locale]/notifications">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/notifications`);
  const t = getDictionary(locale);
  const items = await db.notification.findMany({
    where: { userId: user.id, deal: { status: "PUBLISHED" } },
    include: { deal: { select: { id: true, title: true, temperature: true } }, alert: { select: { keyword: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t.notifications.title}</h1>
        {items.some((i) => !i.read) && (
          <form action={markNotificationsRead}>
            <input type="hidden" name="locale" value={locale} />
            <button className="btn-ghost">{t.notifications.markRead}</button>
          </form>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{t.notifications.none}</p>
      ) : (
        <ul className="card divide-y divide-black/5">
          {items.map((n) => (
            <li key={n.id} className={`p-4 text-sm ${n.read ? "" : "bg-brand-50"}`}>
              <p className="text-xs text-gray-500">
                {t.notifications.matched}
                {n.alert?.keyword ? ` “${n.alert.keyword}”` : ""} · {timeAgo(n.createdAt, t.time)}
              </p>
              <Link href={`/${locale}/deals/${n.deal.id}`} className="font-semibold hover:underline" dir="auto">
                {n.deal.title}
              </Link>{" "}
              <span className="text-hot" dir="ltr">{n.deal.temperature}°</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
