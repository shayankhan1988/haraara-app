// End-to-endtest: start eerst de app (npm run build && npm start) met een geseede database.
// Uitvoeren: mkdir -p test-results && node tests/e2e/flow.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require("playwright");
const B = "http://localhost:3000";
const log = (...a) => console.log("✓", ...a);

(async () => {
  const browser = await chromium.launch();
  const user = await browser.newContext({ viewport: { width: 420, height: 900 }, userAgent: "Mozilla/5.0 (iPhone) Safari/604.1" });
  const p = await user.newPage();
  p.on("pageerror", (e) => console.log("PAGEERROR", e.message));

  // registreren
  const name = "tester" + Date.now().toString().slice(-6);
  await p.goto(`${B}/en/register`);
  await p.fill("#email", `${name}@example.com`);
  await p.fill("#username", name);
  await p.fill("#password", "wachtwoord123");
  await p.click("button:has-text('Create account')");
  await p.waitForURL(`${B}/en`);
  log("register + login");

  // alert aanmaken
  await p.goto(`${B}/en/alerts`);
  await p.fill("#keyword", "galaxy");
  await p.click("button:has-text('Create alert')");
  await p.waitForSelector("text=“galaxy”");
  log("alert created");

  // stemmen
  await p.goto(`${B}/en`);
  const first = p.locator("article").first();
  const href = await first.locator("h2 a").getAttribute("href");
  const before = parseInt(await first.locator("span.tabular-nums").innerText());
  await first.locator("button[title='Hot']").click();
  await p.waitForTimeout(1000);
  await p.goto(B + href);
  const after = parseInt(await p.locator("span.tabular-nums").first().innerText());
  if (after !== before + 1) throw new Error(`vote: ${before} -> ${after}`);
  await p.locator("button[title='Hot']").first().click();
  await p.waitForTimeout(1000);
  await p.reload();
  const undone = parseInt(await p.locator("span.tabular-nums").first().innerText());
  if (undone !== before) throw new Error(`unvote: ${after} -> ${undone}`);
  await p.locator("button[title='Cold']").first().click();
  await p.waitForTimeout(1000);
  await p.reload();
  const cold = parseInt(await p.locator("span.tabular-nums").first().innerText());
  if (cold !== before - 1) throw new Error(`cold: ${cold}`);
  log("vote hot/undo/cold", before, after, undone, cold);

  // deal plaatsen (nieuwe gebruiker -> wachtrij)
  await p.goto(`${B}/en/deals/new`);
  await p.fill("#url", "https://www.noon.com/uae-en/demo-galaxy");
  await p.fill("#title", "[Test] Galaxy S25 for AED 2,499 at noon");
  await p.fill("#price", "2499");
  await p.fill("#originalPrice", "3199");
  await p.selectOption("#categoryId", { label: "Smartphones" });
  await p.fill("#description", "Test deal from the end-to-end script.");
  await p.click("button:has-text('Post deal')");
  await p.waitForURL(/deals\/.+\?posted=queued/);
  const dealUrl = p.url().split("?")[0];
  const dealId = dealUrl.split("/").pop();
  log("deal posted to queue", dealId);
  await p.screenshot({ path: "./test-results/deal-queued.png", fullPage: true });

  // admin keurt goed
  const admin = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const a = await admin.newPage();
  await a.goto(`${B}/en/login`);
  await a.fill("#email", "admin@example.com");
  await a.fill("#password", "changeme123");
  await a.click("button:has-text('Log in')");
  await a.waitForURL(`${B}/en`);
  await a.goto(`${B}/en/mod`);
  await a.screenshot({ path: "./test-results/mod.png", fullPage: true });
  await a.locator(`form:has(input[value='${dealId}']) button:has-text('Approve')`).first().click();
  await a.waitForTimeout(800);
  log("moderator approved");

  // admin heeft een alert op 'galaxy'? nee - gebruiker wel, maar gebruiker is zelf auteur -> geen melding.
  // admin plaatst een tweede deal (direct live) die de alert van de gebruiker raakt
  await a.goto(`${B}/en/deals/new`);
  await a.fill("#url", "https://www.amazon.ae/dp/DEMO-GALAXY-BUDS");
  await a.fill("#title", "[Test] Galaxy Buds 3 for AED 399");
  await a.fill("#price", "399");
  await a.selectOption("#categoryId", { label: "Audio & headphones" });
  await a.fill("#description", "Second test deal, should trigger the alert.");
  await a.click("button:has-text('Post deal')");
  await a.waitForURL(/posted=live/);
  log("admin deal live");

  // reactie + melding
  await p.goto(`${B}/en/notifications`);
  await p.waitForSelector("text=Galaxy Buds 3");
  log("alert notification received");
  await p.click("text=Galaxy Buds 3");
  await p.fill("textarea[name=body]", "Great price, thanks!");
  await p.click("form:has(textarea) button:has-text('Send')");
  await p.waitForSelector("text=Great price, thanks!");
  log("comment posted");

  // affiliate redirect
  const resp = await p.request.get(`${B}/go/${dealId}`, { maxRedirects: 0 });
  log("go redirect", resp.status(), resp.headers()["location"]);

  // Arabisch / RTL
  await p.goto(`${B}/ar`);
  const dir = await p.getAttribute("html", "dir");
  if (dir !== "rtl") throw new Error("not rtl");
  await p.screenshot({ path: "./test-results/feed-ar.png", fullPage: true });
  await p.goto(`${B}/en`);
  await p.screenshot({ path: "./test-results/feed-en.png", fullPage: true });
  log("arabic rtl");

  // zoeken
  await p.goto(`${B}/en?q=galaxy`);
  const n = await p.locator("article").count();
  if (n < 2) throw new Error("search found " + n);
  log("search", n);

  await a.goto(`${B}/en/deals/${dealId}`);
  await a.screenshot({ path: "./test-results/deal-desktop.png", fullPage: true });
  await browser.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
