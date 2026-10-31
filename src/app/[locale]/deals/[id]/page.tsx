import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, timeAgo } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getDeal, toNumber } from "@/lib/deals";
import { myVotes } from "@/lib/votes";
import { temperatureLevel } from "@/lib/temperature";
import { addComment, markExpired, reportContent } from "@/app/actions/deals";
import { VoteBox } from "@/components/VoteBox";
import { Price } from "@/components/Price";
import { CouponCode } from "@/components/CouponCode";
import { DealImage } from "@/components/DealImage";

export async function generateMetadata({ params }: PageProps<"/[locale]/deals/[id]">): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) return {};
  return {
    title: deal.title,
    description: deal.description.slice(0, 160),
    robots: deal.status === "PUBLISHED" || deal.status === "EXPIRED" ? undefined : { index: false },
    openGraph: { title: deal.title, images: deal.imageUrl ? [deal.imageUrl] : undefined },
  };
}

export default async function DealPage({ params, searchParams }: PageProps<"/[locale]/deals/[id]">) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const t = getDictionary(locale);
  const [deal, user] = await Promise.all([getDeal(id), getCurrentUser()]);
  if (!deal) notFound();

  const isOwner = user?.id === deal.userId;
  const isMod = hasRole(user, "MODERATOR");
  if ((deal.status === "PENDING" || deal.status === "REJECTED") && !isOwner && !isMod) notFound();

  const vote = (await myVotes(user?.id, [deal.id])).get(deal.id) ?? 0;
  const category = locale === "ar" ? deal.category.nameAr : deal.category.nameEn;
  const pageUrl = `${process.env.APP_URL ?? ""}/${locale}/deals/${deal.id}`;
  const shareText = encodeURIComponent(`${deal.title} ${pageUrl}`);
  const expired = deal.status === "EXPIRED" || (deal.expiresAt != null && deal.expiresAt < new Date());
  const level = temperatureLevel(deal.temperature);

  return (
    <div className="flex flex-col gap-4">
      {sp.posted === "live" && <p className="card border-brand-500 bg-brand-50 p-3 text-sm text-brand-700">{t.post.published}</p>}
      {sp.posted === "queued" && <p className="card bg-amber-50 p-3 text-sm text-amber-800">{t.post.queued}</p>}
      {sp.reported && <p className="card bg-gray-50 p-3 text-sm">{t.deal.reported}</p>}

      <article className="card flex flex-col gap-4 p-5 sm:flex-row">
        <DealImage src={deal.imageUrl} alt={deal.title} size={220} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <VoteBox
              dealId={deal.id}
              temperature={deal.temperature}
              myVote={vote}
              locale={locale}
              canVote={!!user}
              disabled={isOwner || deal.status !== "PUBLISHED"}
              labels={t.vote}
            />
            <span className="font-semibold">{t.temp[level]}</span>
            <Link href={`/${locale}?cat=${deal.category.slug}`} className="underline">{category}</Link>
            {deal.status === "PENDING" && <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">{t.deal.pending}</span>}
            {deal.status === "REJECTED" && <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">{t.deal.rejected}</span>}
            {expired && <span className="rounded bg-gray-200 px-2 py-0.5 text-gray-700">{t.deal.expired}</span>}
          </div>
          <h1 className="text-2xl font-extrabold leading-tight" dir="auto">{deal.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Price price={toNumber(deal.price)} originalPrice={toNumber(deal.originalPrice)} currency={deal.currency} locale={locale} t={t} />
            {deal.merchant && <span className="text-gray-600">{deal.merchant.name}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {deal.couponCode && <CouponCode code={deal.couponCode} labels={t.deal} />}
            <a href={`/go/${deal.id}`} target="_blank" rel="nofollow sponsored noopener" className="btn-primary px-6 py-3 text-base">
              {t.deal.getDeal} ↗
            </a>
          </div>
          <p className="whitespace-pre-line text-gray-800" dir="auto">{deal.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>
              {t.deal.postedBy} <b>{deal.user.username}</b> · {timeAgo(deal.publishedAt ?? deal.createdAt, t.time)}
            </span>
            <a className="underline" target="_blank" rel="noopener" href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(deal.title)}`}>{t.deal.shareTelegram}</a>
            <a className="underline" target="_blank" rel="noopener" href={`https://wa.me/?text=${shareText}`}>{t.deal.shareWhatsApp}</a>
            {(isOwner || hasRole(user, "CURATOR")) && deal.status === "PUBLISHED" && (
              <form action={markExpired}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="dealId" value={deal.id} />
                <button className="underline">{t.deal.markExpired}</button>
              </form>
            )}
          </div>
          <p className="text-xs text-gray-400">{t.deal.affiliateNote}</p>
        </div>
      </article>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-bold">{t.deal.comments} ({deal.comments.length})</h2>
        {deal.comments.length === 0 && <p className="text-sm text-gray-500">{t.deal.noComments}</p>}
        <ul className="flex flex-col divide-y divide-black/5">
          {deal.comments.map((c) => (
            <li key={c.id} className="py-3">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span><b className="text-gray-700">{c.user.username}</b> · {timeAgo(c.createdAt, t.time)}</span>
                {user && user.id !== c.userId && (
                  <details>
                    <summary className="cursor-pointer">{t.deal.report}</summary>
                    <form action={reportContent} className="mt-2 flex gap-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="dealId" value={deal.id} />
                      <input type="hidden" name="commentId" value={c.id} />
                      <input name="reason" className="input" placeholder={t.deal.reportReason} />
                      <button className="btn-ghost">{t.deal.send}</button>
                    </form>
                  </details>
                )}
              </div>
              <p className="whitespace-pre-line text-sm" dir="auto">{c.body}</p>
            </li>
          ))}
        </ul>
        {deal.status === "PUBLISHED" &&
          (user ? (
            <form action={addComment} className="mt-4 flex flex-col gap-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="dealId" value={deal.id} />
              <textarea name="body" required maxLength={2000} rows={3} className="input" placeholder={t.deal.writeComment} dir="auto" />
              <button className="btn-primary self-end">{t.deal.send}</button>
            </form>
          ) : (
            <p className="mt-4 text-sm">
              <Link href={`/${locale}/login?next=/${locale}/deals/${deal.id}`} className="underline">{t.deal.loginToComment}</Link>
            </p>
          ))}
      </section>

      {user && !isOwner && deal.status === "PUBLISHED" && (
        <details className="text-sm text-gray-500">
          <summary className="cursor-pointer">{t.deal.report}</summary>
          <form action={reportContent} className="mt-2 flex max-w-md gap-2">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="dealId" value={deal.id} />
            <input name="reason" className="input" placeholder={t.deal.reportReason} required />
            <button className="btn-ghost">{t.deal.send}</button>
          </form>
        </details>
      )}
    </div>
  );
}
