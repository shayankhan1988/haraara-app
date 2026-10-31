export type AlertRule = {
  keyword: string | null;
  categoryId: string | null;
  maxPrice: number | null;
  minTemperature: number | null;
};

export type DealForAlert = {
  title: string;
  description: string;
  categoryId: string;
  price: number | null;
  temperature: number;
};

/** Komt een deal overeen met een alert? Alle ingevulde voorwaarden moeten kloppen. */
export function alertMatches(alert: AlertRule, deal: DealForAlert): boolean {
  if (!alert.keyword && !alert.categoryId) return false;
  if (alert.categoryId && alert.categoryId !== deal.categoryId) return false;
  if (alert.keyword) {
    const haystack = `${deal.title} ${deal.description}`.toLowerCase();
    const words = alert.keyword.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.every((w) => haystack.includes(w))) return false;
  }
  if (alert.maxPrice != null) {
    if (deal.price == null || deal.price > alert.maxPrice) return false;
  }
  if (alert.minTemperature != null && deal.temperature < alert.minTemperature) return false;
  return true;
}
