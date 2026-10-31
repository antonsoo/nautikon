import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve("test-results/browser");
await mkdir(out, { recursive: true });
const server = reviewServer("dist");
await server.start();
const receipts = [];
const hash = (b) => createHash("sha256").update(b).digest("hex");
const assets = JSON.parse(await readFile("src/asset-manifest.json", "utf8"));
const wait = async (page, id, text) => page.locator(`#${id}`).filter({ hasText: text }).waitFor();
const slider = async (page, id, value) =>
  page.locator(`#${id}`).evaluate((e, v) => {
    e.value = String(v);
    e.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
const save = async (page, id, name) => {
  const pending = page.waitForEvent("download");
  await page.locator(`#${id}`).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  const path = resolve(out, name);
  await d.saveAs(path);
  return path;
};
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const width of [1440, 375]) {
        const context = await browser.newContext({
          viewport: { width, height: 1100 },
          acceptDownloads: true,
          reducedMotion: "reduce",
        });
        context.setDefaultTimeout(25000);
        console.log(`${name}/${width}: start`);
        const page = await context.newPage();
        const errors = [];
        const external = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (r) => {
          if (/^https?:/.test(r.url()) && !r.url().startsWith(new URL(server.base).origin))
            external.push(r.url());
        });
        await page.goto(server.base);
        await wait(page, "source-status", "complete checked image");
        await wait(page, "offline", "Complete edition available offline");
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        await page.screenshot({ path: resolve(out, `${name}-${width}-opening.png`) });
        await wait(page, "ledger", "3,675");
        await page.locator("#pin").focus();
        await page.keyboard.press("Enter");
        await slider(page, "arrival", 55);
        await wait(page, "ledger", "675");
        await slider(page, "departure", 1);
        await wait(page, "ledger", "3,900");
        const changed = await page.locator("#comparison tr.changed").allTextContents();
        assert.ok(changed.some((t) => t.includes("3,675") && t.includes("3,900")));
        await page.locator('[data-preset="unknown"]').click();
        await wait(page, "ledger", "Undetermined");
        await wait(page, "ledger", "departure evidence is missing");
        await page.locator('[data-preset="loss"]').click();
        await wait(page, "loss-result", "0 drachmas deducted");
        await page.locator("#loss").selectOption("jettison");
        await wait(page, "loss-result", "300 drachmas deducted");
        await page.locator("#consent").uncheck();
        await wait(page, "loss-result", "0 drachmas deducted");
        await page.locator("#loss").selectOption("enemies");
        await wait(page, "loss-result", "300 drachmas deducted");
        await page.locator('[data-preset="default"]').click();
        await wait(page, "collection", "1,675");
        await slider(page, "sale", 5000);
        await wait(page, "collection", "does not allocate the excess");
        await slider(page, "sale", 2000);
        await page.locator("#paid").check();
        await wait(page, "collection", "Security released");
        await page.locator("#paid").uncheck();
        await page.locator("#otherPledge").check();
        await wait(page, "ledger", "Terms contradicted");
        await page.locator("#sameVessel").uncheck();
        await wait(page, "ledger", "changed vessel");
        await page.locator('[data-preset="salvage"]').click();
        await wait(page, "collection", "joint property");
        await wait(page, "ledger", "Undetermined");
        await page.locator('[data-preset="exception"]').click();
        await wait(page, "ledger", "written last year");
        await wait(page, "cargo", "Hellespont");
        await page.locator('[data-preset="default"]').click();
        // Native source link selects its reading as well as scrolling to it.
        await page.locator('#default a[href="#read-default"]').click();
        await wait(page, "reading-text", "A smaller cargo does not cap");
        await wait(page, "source-status", "Page 108");
        await page.locator('#ledger a[href="#read-rate"]').first().click();
        await wait(page, "reading-text", "Which event changes the rate?");
        await page.locator("#read-default").click();
        await page.locator('#ledger a[href="#read-rate"]').first().click();
        await wait(page, "reading-text", "Which event changes the rate?");
        await page.locator("#read-default").click();
        await wait(page, "source-status", "Page 108");
        await page.locator("#enlarge").click();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        await page.locator(".source-viewport").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(150);
        assert.ok(await page.locator(".source-viewport").evaluate((e) => e.scrollLeft > 0));
        await page.locator("#page").selectOption("title");
        await wait(page, "source-status", "Page title");
        await page.locator("#page").selectOption("108");
        await wait(page, "source-status", "Page 108");
        await page.locator("#enlarge").click();
        await page
          .locator("#note")
          .fill('Arrival is not departure. §10 chooses the rate. <img src=x onerror="alert(1)">');
        const json = await save(page, "json", `${name}-${width}.json`);
        const record = JSON.parse(await readFile(json, "utf8"));
        assert.equal(record.pinned.departure, -5);
        assert.equal(record.voyage.days, 21);
        await slider(page, "departure", 10);
        await page.locator("#import").setInputFiles(json);
        await wait(page, "status", "Notebook reopened");
        assert.equal(await page.locator("#departure").inputValue(), "-5");
        const exact = { ...record, voyage: { ...record.voyage, lossAmount: 301, sale: 2001 } };
        await page.locator("#import").setInputFiles({
          name: "exact.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(exact)),
        });
        await wait(page, "status", "Notebook reopened");
        assert.equal(await page.locator("#lossAmount").inputValue(), "301");
        assert.equal(await page.locator("#sale").inputValue(), "2001");
        await page.locator("#import").setInputFiles(json);
        await wait(page, "status", "Notebook reopened");
        await page.locator("#import").setInputFiles({
          name: "invalid.json",
          mimeType: "application/json",
          buffer: Buffer.from(
            JSON.stringify({ ...record, voyage: { ...record.voyage, days: 99 } }),
          ),
        });
        await wait(page, "status", "Notebook not opened");
        assert.equal(await page.locator("#days").inputValue(), "21");
        const reading = await save(page, "html", `${name}-${width}-reading.html`);
        const html = await readFile(reading, "utf8");
        assert.ok(html.includes("&lt;img src=x"));
        assert.ok(!html.includes("<script"));
        // Verify actual embedded bytes, not just captions or an inventory.
        for (const asset of assets) {
          const expected = await readFile(`public/${asset.path}`);
          if (/\.(jpg|woff2|xml)$/.test(asset.path))
            assert.ok(
              html.includes(expected.toString("base64")),
              `${asset.path} absent from reading`,
            );
          assert.equal(hash(expected), asset.sha256);
        }
        const csv = await save(page, "csv", `${name}-${width}.csv`);
        assert.match(await readFile(csv, "utf8"), /1,675/);
        const svg = await save(page, "svg", `${name}-${width}.svg`);
        assert.match(await readFile(svg, "utf8"), /Arrival 25/);
        const offlinePage = await context.newPage();
        const requests = [];
        offlinePage.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        await offlinePage.goto(pathToFileURL(reading).href);
        await offlinePage.locator("img").last().waitFor();
        await offlinePage.evaluate(() => document.fonts.ready);
        assert.deepEqual(requests, []);
        console.log(`${name}/${width}: embedded notebook`);
        const embeddedPending = offlinePage.waitForEvent("download", { timeout: 25000 });
        await offlinePage.getByRole("link", { name: "Editable notebook JSON" }).click();
        const embedded = await embeddedPending;
        assert.deepEqual(JSON.parse(await readFile(await embedded.path(), "utf8")), record);
        assert.equal(await offlinePage.locator("img").count(), 5);
        assert.equal(await offlinePage.locator("script").count(), 0);
        if (name === "chromium" && width === 1440)
          await offlinePage.pdf({
            path: resolve(out, "default-reading.pdf"),
            format: "A4",
            printBackground: true,
            margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
          });
        await offlinePage.close();
        console.log(`${name}/${width}: offline and cache recovery`);
        const axe = await new AxeBuilder({ page }).analyze();
        await writeFile(
          resolve(out, `${name}-${width}-axe.json`),
          JSON.stringify(axe.violations, null, 2),
        );
        assert.deepEqual(
          axe.violations.map((v) => v.id),
          [],
        );
        // Two controlled tabs, then an actual unavailable origin rather than a warm-load claim.
        const second = await context.newPage();
        await second.goto(server.base);
        await wait(second, "offline", "Complete edition available offline");
        await server.stop();
        await page.reload();
        await wait(page, "offline", "Complete edition available offline");
        await wait(page, "source-status", "complete checked image");
        await page.locator('[data-preset="default"]').click();
        await wait(page, "collection", "1,675");
        await save(page, "html", `${name}-${width}-offline.html`);
        await page.evaluate(async () => {
          const keys = await caches.keys();
          for (const key of keys.filter((k) => k.startsWith("nautikon-"))) {
            const cache = await caches.open(key);
            await cache.delete(new URL("/nautikon/sources/rennie-p108.jpg", location.origin));
          }
        });
        await second.bringToFront();
        await wait(second, "offline", "not retained");
        await page.locator("#read-default").click();
        await page.locator("#retry-source").click();
        await wait(page, "source-status", "Could not load");
        await server.start();
        await page.locator("#retry-offline").click();
        await wait(page, "offline", "Complete edition available offline");
        await page.locator("#retry-source").click();
        await wait(page, "source-status", "complete checked image");
        await second.bringToFront();
        await wait(second, "offline", "Complete edition available offline");
        console.log(`${name}/${width}: explicit offline`);
        await context.setOffline(true);
        await page.reload();
        await page.locator("#read-default").click();
        await wait(page, "source-status", "complete checked image");
        await context.setOffline(false);
        await page.bringToFront();
        await page.locator("#bench").scrollIntoViewIfNeeded();
        await page.screenshot({ path: resolve(out, `${name}-${width}-bench.png`) });
        await page.locator("#reading").scrollIntoViewIfNeeded();
        await page.screenshot({ path: resolve(out, `${name}-${width}-source.png`) });
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        receipts.push({
          browser: name,
          width,
          sourceAssets: assets.length,
          externalRequests: external,
          errors,
          axe: axe.violations.length,
          actualOriginOutage: true,
          explicitBrowserOffline: true,
          embeddedNotebookReopened: true,
          twoTabCacheDamageAndRepair: true,
          downloads: [json, csv, svg, reading].map((p) => p.split("/").at(-1)),
        });
        await context.close();
      }
    } finally {
      await browser.close();
    }
  }
  await writeFile(resolve(out, "receipts.json"), JSON.stringify(receipts, null, 2));
  console.log(JSON.stringify(receipts, null, 2));
} finally {
  await server.stop();
}
