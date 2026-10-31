import { describe, expect, it } from "vitest";
import { buildAffiliateUrl, domainOf, isBot, matchMerchantDomain } from "@/lib/affiliate";
import { alertMatches } from "@/lib/alerts";
import { hotScore, temperatureFromCounts, temperatureLevel } from "@/lib/temperature";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("temperature", () => {
  it("counts hot minus cold", () => {
    expect(temperatureFromCounts(10, 3)).toBe(7);
  });
  it("maps to levels", () => {
    expect(temperatureLevel(-1)).toBe("cold");
    expect(temperatureLevel(0)).toBe("neutral");
    expect(temperatureLevel(5)).toBe("warm");
    expect(temperatureLevel(15)).toBe("hot");
    expect(temperatureLevel(50)).toBe("burning");
  });
  it("decays over time", () => {
    const now = new Date("2026-11-01T12:00:00Z");
    const fresh = hotScore(10, new Date("2026-11-01T11:00:00Z"), now);
    const old = hotScore(10, new Date("2026-10-30T12:00:00Z"), now);
    expect(fresh).toBeGreaterThan(old);
  });
});

describe("affiliate", () => {
  it("returns the plain url without merchant settings", () => {
    expect(buildAffiliateUrl("https://noon.com/x", null)).toBe("https://noon.com/x");
    expect(buildAffiliateUrl("https://noon.com/x", { affiliateTemplate: null, affiliateParams: null })).toBe("https://noon.com/x");
  });
  it("adds params and keeps existing query", () => {
    const url = buildAffiliateUrl("https://www.amazon.ae/dp/B0?th=1", { affiliateTemplate: null, affiliateParams: "tag=golf-21" });
    expect(url).toBe("https://www.amazon.ae/dp/B0?th=1&tag=golf-21");
  });
  it("fills a deeplink template", () => {
    const url = buildAffiliateUrl("https://www.noon.com/a?b=1", { affiliateTemplate: "https://track.example/c?aid=9&r={url}", affiliateParams: null });
    expect(url).toBe("https://track.example/c?aid=9&r=https%3A%2F%2Fwww.noon.com%2Fa%3Fb%3D1");
  });
  it("recognises merchant domains incl. subdomains", () => {
    expect(domainOf("https://www.Amazon.ae/dp/1")).toBe("amazon.ae");
    expect(matchMerchantDomain("m.noon.com", ["noon.com", "amazon.ae"])).toBe("noon.com");
    expect(matchMerchantDomain("fakenoon.com", ["noon.com"])).toBeNull();
  });
  it("filters bots", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("TelegramBot (like TwitterBot)")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari/604.1")).toBe(false);
  });
});

describe("alerts", () => {
  const deal = { title: "iPhone 16 Pro 256GB for AED 3,999", description: "At noon", categoryId: "phones", price: 3999, temperature: 12 };
  const base = { keyword: null, categoryId: null, maxPrice: null, minTemperature: null };
  it("needs a keyword or category", () => {
    expect(alertMatches(base, deal)).toBe(false);
  });
  it("matches all keyword words, case-insensitive", () => {
    expect(alertMatches({ ...base, keyword: "iphone 16" }, deal)).toBe(true);
    expect(alertMatches({ ...base, keyword: "iphone 15" }, deal)).toBe(false);
  });
  it("respects category, price and temperature", () => {
    expect(alertMatches({ ...base, categoryId: "phones", maxPrice: 4000 }, deal)).toBe(true);
    expect(alertMatches({ ...base, categoryId: "phones", maxPrice: 3000 }, deal)).toBe(false);
    expect(alertMatches({ ...base, categoryId: "laptops" }, deal)).toBe(false);
    expect(alertMatches({ ...base, keyword: "iphone", minTemperature: 20 }, deal)).toBe(false);
  });
});

describe("password", () => {
  it("hashes and verifies", async () => {
    const h = await hashPassword("geheim12345");
    expect(await verifyPassword("geheim12345", h)).toBe(true);
    expect(await verifyPassword("fout", h)).toBe(false);
  });
});
