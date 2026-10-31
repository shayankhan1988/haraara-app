import Link from "next/link";
import type { DealCard as DealCardType } from "@/lib/deals";
import { toNumber } from "@/lib/deals";
import { timeAgo } from "@/i18n";
import type { Dictionary } from "@/i18n/en";
import type { Locale } from "@/i18n/config";
import { VoteBox } from "./VoteBox";
import { Price } from "./Price";
import { CouponCode } from "./CouponCode";
import { DealImage } from "./DealImage";

export function DealCard({
  deal,
  locale,
  t,
  myVote,
  canVote,
  isOwn,
}: {
  deal: DealCardType;
  locale: Locale;
  t: Dictionary;
  myVote: number;
  canVote: boolean;
  isOwn: boolean;
}) {
  const href = `/${locale}/deals/${deal.id}`;
  const category = locale === "ar" ? deal.category.nameAr : deal.category.nameEn;
  return (
    <article className="card flex gap-4 p-4">
      <Link href={href} className="shrink-0">
        <DealImage src={deal.imageUrl} alt={deal.title} size={88} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <VoteBox
            dealId={deal.id}
            temperature={deal.temperature}
            myVote={myVote}
            locale={locale}
            canVote={canVote}
            disabled={isOwn}
            labels={t.vote}
          />
          <span>
            {deal.publishedAt ? timeAgo(deal.publishedAt, t.time) : ""} · {category}
          </span>
        </div>
        <h2 className="text-base font-bold leading-snug">
          <Link href={href} className="hover:text-brand-700" dir="auto">{deal.title}</Link>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Price
            price={toNumber(deal.price)}
            originalPrice={toNumber(deal.originalPrice)}
            currency={deal.currency}
            locale={locale}
            t={t}
          />
          {deal.merchant && <span className="text-sm text-gray-600">{deal.merchant.name}</span>}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-gray-500">
            {t.deal.postedBy} <b>{deal.user.username}</b> · 💬 {deal.commentCount}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {deal.couponCode && <CouponCode code={deal.couponCode} labels={t.deal} />}
            <a href={`/go/${deal.id}`} target="_blank" rel="nofollow sponsored noopener" className="btn-primary">
              {t.deal.getDeal} ↗
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
