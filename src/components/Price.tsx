import type { Dictionary } from "@/i18n/en";
import type { Locale } from "@/i18n/config";

export function formatMoney(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function Price({
  price,
  originalPrice,
  currency,
  locale,
  t,
}: {
  price: number | null;
  originalPrice: number | null;
  currency: string;
  locale: Locale;
  t: Dictionary;
}) {
  if (price == null) return null;
  const pct = originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : null;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span className="text-lg font-extrabold text-hot">{price === 0 ? t.deal.free : formatMoney(price, currency, locale)}</span>
      {originalPrice != null && originalPrice > price && (
        <span className="text-sm text-gray-400 dark:text-zinc-500 line-through">{formatMoney(originalPrice, currency, locale)}</span>
      )}
      {pct != null && <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400" dir="ltr">−{pct}%</span>}
    </span>
  );
}
