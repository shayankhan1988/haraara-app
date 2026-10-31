import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildAffiliateUrl, isBot } from "@/lib/affiliate";

// Affiliate-redirect: registreert de klik en stuurt door naar de winkel.
export async function GET(req: NextRequest, ctx: RouteContext<"/go/[id]">) {
  const { id } = await ctx.params;
  const deal = await db.deal.findUnique({
    where: { id },
    include: { merchant: { select: { affiliateTemplate: true, affiliateParams: true } } },
  });
  if (!deal || deal.status === "REJECTED") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const ua = req.headers.get("user-agent");
  if (!isBot(ua)) {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
    const salt = process.env.CLICK_SALT ?? "";
    const day = new Date().toISOString().slice(0, 10);
    const user = await getCurrentUser().catch(() => null);
    try {
      await db.$transaction([
        db.click.create({
          data: {
            dealId: deal.id,
            userId: user?.id ?? null,
            // Alleen een gehashte waarde met dagelijkse rotatie, geen ruw IP-adres (PDPL).
            ipHash: ip ? createHash("sha256").update(`${salt}:${day}:${ip}`).digest("hex").slice(0, 32) : null,
            userAgent: ua?.slice(0, 300) ?? null,
            referrer: req.headers.get("referer")?.slice(0, 500) ?? null,
            country: req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? null,
          },
        }),
        db.deal.update({ where: { id: deal.id }, data: { clickCount: { increment: 1 } } }),
      ]);
    } catch (e) {
      // Een mislukte registratie mag de bezoeker nooit tegenhouden.
      console.error("click tracking failed", e);
    }
  }

  const res = NextResponse.redirect(buildAffiliateUrl(deal.url, deal.merchant), 302);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
