import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/deals";
import { deleteAlert } from "@/app/actions/alerts";
import { AlertForm } from "@/components/AlertForm";

export default async function AlertsPage({ params }: PageProps<"/[locale]/alerts">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/alerts`);
  const t = getDictionary(locale);
  const [alerts, cats] = await Promise.all([
    db.alert.findMany({ where: { userId: user.id }, include: { category: true }, orderBy: { createdAt: "desc" } }),
    getCategories(),
  ]);
  const categories = cats.map((c) => ({ id: c.id, name: locale === "ar" ? c.nameAr : c.nameEn }));
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t.alerts.title}</h1>
      <p className="text-gray-600 dark:text-zinc-400">{t.alerts.intro}</p>
      <AlertForm locale={locale} t={t.alerts} categories={categories} />
      {alerts.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400">{t.alerts.none}</p>
      ) : (
        <ul className="card divide-y divide-black/5 dark:divide-white/10">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <span className="flex flex-wrap gap-2">
                {a.keyword && <b dir="auto">“{a.keyword}”</b>}
                {a.category && <span className="rounded bg-gray-100 dark:bg-zinc-800 px-2">{locale === "ar" ? a.category.nameAr : a.category.nameEn}</span>}
                {a.maxPrice != null && <span dir="ltr">≤ AED {Number(a.maxPrice)}</span>}
                {a.minTemperature != null && <span dir="ltr">≥ {a.minTemperature}°</span>}
              </span>
              <form action={deleteAlert}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={a.id} />
                <button className="text-red-600 dark:text-red-400 underline">{t.alerts.delete}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
