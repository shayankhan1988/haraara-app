import "server-only";
import { db } from "./db";
import { alertMatches } from "./alerts";
import { toNumber } from "./deals";

/** Zet een deal live en maakt meldingen aan voor gebruikers met een passende alert. */
export async function publishDeal(dealId: string) {
  const deal = await db.deal.update({
    where: { id: dealId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await notifyAlerts(deal.id);
  return deal;
}

/** Controleert alle alerts voor een gepubliceerde deal. Dubbele meldingen worden genegeerd. */
export async function notifyAlerts(dealId: string) {
  const deal = await db.deal.findUnique({ where: { id: dealId } });
  if (!deal || deal.status !== "PUBLISHED") return 0;

  // MVP: alle alerts in het geheugen controleren. Bij >10k alerts naar een zoekindex verplaatsen.
  const alerts = await db.alert.findMany({ where: { userId: { not: deal.userId } } });
  const dealForAlert = {
    title: deal.title,
    description: deal.description,
    categoryId: deal.categoryId,
    price: toNumber(deal.price),
    temperature: deal.temperature,
  };
  const matches = alerts.filter((a) =>
    alertMatches(
      {
        keyword: a.keyword,
        categoryId: a.categoryId,
        maxPrice: toNumber(a.maxPrice),
        minTemperature: a.minTemperature,
      },
      dealForAlert,
    ),
  );
  if (matches.length === 0) return 0;
  const res = await db.notification.createMany({
    data: matches.map((a) => ({ userId: a.userId, dealId: deal.id, alertId: a.id })),
    skipDuplicates: true,
  });
  return res.count;
}
