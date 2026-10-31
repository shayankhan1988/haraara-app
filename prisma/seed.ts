// Startdata: categorieën, winkels in de VAE, een beheerder en een paar voorbeelddeals.
// Voorbeelddeals zijn fictief en alleen bedoeld voor lokaal testen (SEED_DEMO=0 om over te slaan).
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

const categories = [
  ["smartphones", "Smartphones", "الهواتف الذكية"],
  ["laptops", "Laptops & tablets", "الحواسيب والأجهزة اللوحية"],
  ["audio", "Audio & headphones", "الصوتيات والسماعات"],
  ["gaming", "Gaming", "الألعاب"],
  ["tv", "TV & home cinema", "التلفزيونات والمسرح المنزلي"],
  ["smart-home", "Smart home", "المنزل الذكي"],
  ["wearables", "Wearables", "الأجهزة القابلة للارتداء"],
  ["accessories", "Accessories", "الإكسسوارات"],
  ["codes", "Discount codes", "رموز الخصم"],
  ["other", "Other", "أخرى"],
] as const;

// Affiliate-instellingen leeg laten tot de echte tags/deeplinks bekend zijn.
const merchants = [
  ["Amazon.ae", "amazon.ae"],
  ["noon", "noon.com"],
  ["Sharaf DG", "uae.sharafdg.com"],
  ["Jumbo", "jumbo.ae"],
  ["Virgin Megastore", "virginmegastore.ae"],
  ["Carrefour UAE", "carrefouruae.com"],
  ["Emax", "emaxme.com"],
  ["Namshi", "namshi.com"],
] as const;

async function main() {
  for (const [i, [slug, nameEn, nameAr]] of categories.entries()) {
    await db.category.upsert({ where: { slug }, create: { slug, nameEn, nameAr, sort: i }, update: { nameEn, nameAr, sort: i } });
  }
  for (const [name, domain] of merchants) {
    await db.merchant.upsert({ where: { domain }, create: { name, domain }, update: { name } });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? (process.env.VERCEL ? "" : "changeme123");
  if (!adminPassword) {
    // Online nooit een standaardwachtwoord gebruiken.
    console.warn("SEED_ADMIN_PASSWORD ontbreekt: beheerder en demodeals worden overgeslagen.");
    return;
  }
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, username: "admin", role: "ADMIN", passwordHash: await hashPassword(adminPassword) },
    update: { role: "ADMIN", passwordHash: await hashPassword(adminPassword) },
  });

  if (process.env.SEED_DEMO === "0") return;

  const cat = async (slug: string) => (await db.category.findUniqueOrThrow({ where: { slug } })).id;
  const merchant = async (domain: string) => (await db.merchant.findUniqueOrThrow({ where: { domain } })).id;
  const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5);

  // Afbeeldingen staan in public/demo en zijn zelf getekend (vrij te gebruiken).
  const demo = [
    { title: "[Demo] Wireless earbuds with ANC for AED 199", price: 199, originalPrice: 349, url: "https://www.amazon.ae/", m: "amazon.ae", c: "audio", t: 24, h: 3, img: "earbuds" },
    { title: "[Demo] 15% off electronics with app code", price: null, originalPrice: null, url: "https://www.noon.com/uae-en/", m: "noon.com", c: "codes", t: 12, h: 6, code: "DEMO15", img: "coupon" },
    { title: "[Demo] 55\" 4K TV for AED 1,299", price: 1299, originalPrice: 1899, url: "https://uae.sharafdg.com/", m: "uae.sharafdg.com", c: "tv", t: 41, h: 20, img: "tv" },
    { title: "[Demo] Game controller bundle AED 229", price: 229, originalPrice: 299, url: "https://www.virginmegastore.ae/", m: "virginmegastore.ae", c: "gaming", t: 3, h: 1, img: "gamepad" },
    { title: "[Demo] Smart plug 4-pack for AED 79", price: 79, originalPrice: 129, url: "https://www.amazon.ae/", m: "amazon.ae", c: "smart-home", t: -2, h: 30, img: "smartplug" },
    { title: "[Demo] 128GB smartphone for AED 1,049", price: 1049, originalPrice: 1399, url: "https://www.noon.com/uae-en/", m: "noon.com", c: "smartphones", t: 33, h: 5, img: "phone" },
    { title: "[Demo] 14\" ultrabook laptop for AED 2,199", price: 2199, originalPrice: 2899, url: "https://www.jumbo.ae/", m: "jumbo.ae", c: "laptops", t: 18, h: 9, img: "laptop" },
    { title: "[Demo] Fitness smartwatch AED 299", price: 299, originalPrice: 449, url: "https://www.emaxme.com/", m: "emaxme.com", c: "wearables", t: 9, h: 2, img: "watch" },
    { title: "[Demo] Over-ear headphones with ANC AED 549", price: 549, originalPrice: 899, url: "https://www.amazon.ae/", m: "amazon.ae", c: "audio", t: 57, h: 12, img: "headphones" },
    { title: "[Demo] Bluetooth party speaker AED 189", price: 189, originalPrice: 279, url: "https://www.carrefouruae.com/", m: "carrefouruae.com", c: "audio", t: 6, h: 14, img: "speaker" },
  ];
  // Stemmen van demogebruikers zodat de temperatuur klopt met de echte stemmen.
  const voters = [];
  for (let i = 1; i <= 60; i++) {
    const email = `voter${i}@example.com`;
    voters.push(
      await db.user.upsert({
        where: { email },
        create: { email, username: `demo_voter_${i}`, passwordHash: "disabled" },
        update: {},
      }),
    );
  }
  for (const d of demo) {
    const imageUrl = `/demo/${d.img}.svg`;
    const existing = await db.deal.findFirst({ where: { title: d.title } });
    if (existing) {
      // Bestaande demodeal: alleen een afbeelding toevoegen als die nog ontbreekt.
      if (!existing.imageUrl) await db.deal.update({ where: { id: existing.id }, data: { imageUrl } });
      continue;
    }
    const created = await db.deal.create({
      data: {
        title: d.title,
        description: "Demo deal for local testing. Replace with real deals before launch.",
        url: d.url,
        price: d.price,
        originalPrice: d.originalPrice,
        couponCode: d.code ?? null,
        imageUrl,
        categoryId: await cat(d.c),
        merchantId: await merchant(d.m),
        userId: admin.id,
        status: "PUBLISHED",
        temperature: d.t,
        hotCount: Math.max(d.t, 0),
        coldCount: Math.max(-d.t, 0),
        publishedAt: hoursAgo(d.h),
        createdAt: hoursAgo(d.h),
      },
    });
    const value = d.t >= 0 ? 1 : -1;
    await db.vote.createMany({
      data: voters.slice(0, Math.abs(d.t)).map((v) => ({ userId: v.id, dealId: created.id, value })),
    });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
