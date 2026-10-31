import "server-only";
import { db } from "./db";

export async function myVotes(userId: string | undefined, dealIds: string[]) {
  if (!userId || dealIds.length === 0) return new Map<string, number>();
  const votes = await db.vote.findMany({ where: { userId, dealId: { in: dealIds } } });
  return new Map(votes.map((v) => [v.dealId, v.value]));
}
