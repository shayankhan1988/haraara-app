import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, listDeals, type FeedSort } from "@/lib/deals";
import { myVotes } from "@/lib/votes";
import { DealCard } from "@/components/DealCard";

const SORTS: FeedSort[] = ["hot", "new", "top"];

export default async function FeedPage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const t = getDictionary(locale);
  const sort = (SORTS.includes(sp.sort as FeedSort) ? sp.sort : "hot") as FeedSort;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const [user, categories] = await Promise.all([getCurrentUser(), getCategories()]);
  const category = categories.find((c) => c.slug === cat);
  const deals = await listDeals({ sort, q, categoryId: category?.id, limit: 30, offset: (page - 1) * 30 });
  const votes = await myVotes(user?.id, deals.map((d) => d.id));

  const link = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { sort, q, cat, ...over };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && !(k === "sort" && v === "hot") && !(k === "page" && String(v) === "1")) p.set(k, String(v));
    });
    const s = p.toString();
    return `/${locale}${s ? `?${s}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {SORTS.map((s) => (
          <Link
            key={s}
            href={link({ sort: s, page: undefined })}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${s === sort ? "bg-brand-600 text-white" : "bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"}`}
          >
            {t.feed[s]}
          </Link>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link
          href={link({ cat: undefined, page: undefined })}
          className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${!category ? "border-brand-600 bg-brand-50 dark:bg-brand-700/25 text-brand-700 dark:text-brand-100" : "border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300"}`}
        >
          {t.feed.all}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={link({ cat: c.slug, page: undefined })}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${category?.id === c.id ? "border-brand-600 bg-brand-50 dark:bg-brand-700/25 text-brand-700 dark:text-brand-100" : "border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300"}`}
          >
            {locale === "ar" ? c.nameAr : c.nameEn}
          </Link>
        ))}
      </div>
      {q && (
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          {t.feed.resultsFor} <b dir="auto">“{q}”</b> ·{" "}
          <Link href={link({ q: undefined, page: undefined })} className="underline">{t.feed.clear}</Link>
        </p>
      )}
      {deals.length === 0 ? (
        <p className="card p-8 text-center text-gray-600 dark:text-zinc-400">{t.feed.empty}</p>
      ) : (
        deals.map((d) => (
          <DealCard
            key={d.id}
            deal={d}
            locale={locale}
            t={t}
            myVote={votes.get(d.id) ?? 0}
            canVote={!!user}
            isOwn={user?.id === d.userId}
          />
        ))
      )}
      <div className="flex justify-between">
        {page > 1 ? <Link className="btn-ghost" href={link({ page: page - 1 })}>‹</Link> : <span />}
        {deals.length === 30 && <Link className="btn-ghost" href={link({ page: page + 1 })}>›</Link>}
      </div>
    </div>
  );
}
