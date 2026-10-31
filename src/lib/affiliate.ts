export type AffiliateMerchant = {
  affiliateTemplate: string | null;
  affiliateParams: string | null;
} | null;

/** Bouwt de uitgaande affiliate-URL voor een deal. */
export function buildAffiliateUrl(targetUrl: string, merchant: AffiliateMerchant): string {
  if (!merchant) return targetUrl;
  if (merchant.affiliateTemplate) {
    return merchant.affiliateTemplate.replaceAll("{url}", encodeURIComponent(targetUrl));
  }
  if (merchant.affiliateParams) {
    const url = new URL(targetUrl);
    const extra = new URLSearchParams(merchant.affiliateParams);
    extra.forEach((value, key) => url.searchParams.set(key, value));
    return url.toString();
  }
  return targetUrl;
}

/** Haalt de hostnaam zonder www. op, om een winkel te herkennen. */
export function domainOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Zoekt de winkel bij een domein, ook voor subdomeinen (bv. m.noon.com -> noon.com). */
export function matchMerchantDomain(host: string, domains: string[]): string | null {
  const hit = domains
    .filter((d) => host === d || host.endsWith("." + d))
    .sort((a, b) => b.length - a.length)[0];
  return hit ?? null;
}

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|headless/i;

export function isBot(userAgent: string | null) {
  if (!userAgent) return true;
  return BOT_RE.test(userAgent);
}
