import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { DEFAULT_COUNTRY } from "./config";

export type FeedSort = "hot" | "new" | "top";

export const dealCardInclude = {
  user: { select: { username: true } },
  category: true,
  merchant: { select: { name: true, domain: true } },
} satisfies Prisma.DealInclude;

export type DealCard = Prisma.DealGetPayload<{ include: typeof dealCardInclude }>;

export async function listDeals(opts: {
  sort: FeedSort;
  q?: string;
  categoryId?: string;
  country?: string;
  limit?: number;
  offset?: number;
}): Promise<DealCard[]> {
  const country = opts.country ?? DEFAULT_COUNTRY;
  const limit = Math.min(opts.limit ?? 30, 100);
  const offset = opts.offset ?? 0;
  const q = opts.q?.trim();

  const where: Prisma.Sql[] = [
    Prisma.sql`"status" = 'PUBLISHED'`,
    Prisma.sql`"country" = ${country}`,
  ];
  if (opts.categoryId) where.push(Prisma.sql`"categoryId" = ${opts.categoryId}`);
  if (opts.sort === "top") where.push(Prisma.sql`"publishedAt" > now() - interval '7 days'`);
  if (q) {
    where.push(
      Prisma.sql`to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("description", '')) @@ plainto_tsquery('simple', ${q})`,
    );
  }

  const order =
    opts.sort === "new"
      ? Prisma.sql`"publishedAt" DESC`
      : opts.sort === "top"
        ? Prisma.sql`"temperature" DESC, "publishedAt" DESC`
        : Prisma.sql`(("temperature" + 1)::float / power(extract(epoch from (now() - "publishedAt")) / 3600 + 2, 1.5)) DESC`;

  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Deal"
    WHERE ${Prisma.join(where, " AND ")}
    ORDER BY ${order}
    LIMIT ${limit} OFFSET ${offset}`;

  if (rows.length === 0) return [];
  const deals = await db.deal.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    include: dealCardInclude,
  });
  const byId = new Map(deals.map((d) => [d.id, d]));
  return rows.map((r) => byId.get(r.id)).filter((d): d is DealCard => !!d);
}

export async function getDeal(id: string) {
  return db.deal.findUnique({
    where: { id },
    include: {
      ...dealCardInclude,
      comments: {
        where: { hidden: false },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { username: true } } },
      },
    },
  });
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { sort: "asc" } });
}

export function toNumber(d: Prisma.Decimal | null | undefined) {
  return d == null ? null : Number(d);
}
