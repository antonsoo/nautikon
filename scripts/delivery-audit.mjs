import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { buildIdentity, writeReceipt } from "./build-receipt.mjs";
import { reviewServer } from "./review-server.mjs";
import { slowReviewServer } from "./slow-review-server.mjs";

const out = resolve(process.env.AUDIT_OUT || "test-results/delivery-audit");
await mkdir(out, { recursive: true });
const build = await buildIdentity();
const observations = [];
const wait = (page, id, text, timeout = 30000) =>
  page.locator(`#${id}`).filter({ hasText: text }).waitFor({ timeout });
const save = async (p, name) => {
  const pending = p.waitForEvent("download", { timeout: 90000 });
  await p.locator("#html").click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  const target = resolve(out, name);
  await d.saveAs(target);
  return target;
};
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  const server = reviewServer("dist");
  await server.start();
  try {
    console.log(`${name}: corrupt cache, both rooms, actual status failures and maintenance HTML`);
    const context = await browser.newContext({ acceptDownloads: true });
    const voyage = await context.newPage();
    await voyage.goto(server.base);
    await wait(voyage, "offline", "Complete edition available offline");
    await voyage.waitForFunction(() => !!navigator.serviceWorker.controller);
    const testimony = await context.newPage();
    await testimony.goto(`${server.base}testimony.html`);
    await wait(testimony, "offline", "Complete edition available offline");
    await voyage.locator("#note").fill("Keep this voyage while source files are repaired.");
    await testimony.locator("#note").fill("Keep this testimony while source files are repaired.");
    await voyage.evaluate(async () => {
      const key = (await caches.keys()).find((k) => k.startsWith("nautikon-"));
      const cache = await caches.open(key);
      await cache.put(
        new URL("sources/rennie-p111.jpg", location.href),
        new Response("CORRUPT SCAN", { headers: { "Content-Type": "image/jpeg" } }),
      );
    });
    for (const page of [voyage, testimony]) {
      await page.bringToFront();
      await wait(page, "offline", "not retained");
    }
    await testimony.locator("#page").selectOption("111");
    await wait(testimony, "source-status", "Source check failed");
    await voyage.locator("#retry-offline").click();
    await wait(voyage, "offline", "Complete edition available offline");
    await testimony.bringToFront();
    await wait(testimony, "offline", "Complete edition available offline");
    await testimony.locator("#retry-source").click();
    await wait(testimony, "source-status", "Page 111");
    // Corruption of a runtime asset also withdraws readiness, and is not served.
    const css = build.files.find((f) => f.path.endsWith(".css")).path;
    await voyage.evaluate(async (path) => {
      const key = (await caches.keys()).find((k) => k.startsWith("nautikon-"));
      await (await caches.open(key)).put(new URL(path, location.href), new Response("BROKEN CSS"));
    }, css);
    await voyage.bringToFront();
    await wait(voyage, "offline", "not retained");
    await context.setOffline(true);
    const refused = await voyage.evaluate(async (path) => {
      try {
        return (await (await fetch(new URL(path, location.href))).text()) === "BROKEN CSS";
      } catch {
        return false;
      }
    }, css);
    assert.equal(refused, false);
    await context.setOffline(false);
    await voyage.locator("#retry-offline").click();
    await wait(voyage, "offline", "Complete edition available offline");
    for (const path of ["/nautikon/", "/nautikon/index.html", "/nautikon/testimony.html"]) {
      for (const status of [404, 503, 200]) {
        server.fault(path, {
          status,
          body: "<!doctype html><title>Maintenance</title><p>Please return later.</p>",
          contentType: "text/html",
        });
        const page = await context.newPage();
        const response = await page.goto(new URL(path, server.base).href);
        assert.equal(response.status(), 200);
        await wait(
          page,
          path.endsWith("testimony.html") ? "inference" : "ledger",
          path.endsWith("testimony.html") ? "0–499" : "3,675",
        );
        await page.close();
      }
      server.clearFaults();
    }
    // A corrupt document has no verified offline fallback. Keep the edited tab.
    await voyage.evaluate(async () => {
      const key = (await caches.keys()).find((k) => k.startsWith("nautikon-"));
      await (await caches.open(key)).put(
        new URL("index.html", location.href),
        new Response("<!doctype html><p>CORRUPT DOCUMENT</p>", {
          headers: { "Content-Type": "text/html" },
        }),
      );
    });
    await voyage.bringToFront();
    await wait(voyage, "offline", "not retained");
    await context.setOffline(true);
    const missing = await context.newPage();
    const response = await missing.goto(`${server.base}index.html`);
    assert.equal(response.status(), 503);
    assert.match(await missing.locator("body").textContent(), /no verified saved page/);
    await missing.close();
    await context.setOffline(false);
    await voyage.locator("#retry-offline").click();
    await wait(voyage, "offline", "Complete edition available offline");
    assert.match(await voyage.locator("#note").inputValue(), /Keep this voyage/);
    assert.match(await testimony.locator("#note").inputValue(), /Keep this testimony/);
    // Cancel a repair during a stalled body, then recover without replacing work.
    await voyage.evaluate(async () => {
      const key = (await caches.keys()).find((k) => k.startsWith("nautikon-"));
      await (await caches.open(key)).delete(new URL("sources/rennie-p111.jpg", location.href));
    });
    let bodyStarted;
    const bodyPending = new Promise((resolve) => {
      bodyStarted = resolve;
    });
    server.fault("/nautikon/sources/rennie-p111.jpg", { stallBody: true, onBody: bodyStarted });
    await voyage.locator("#retry-offline").click();
    await bodyPending;
    await voyage.locator("#cancel-offline").waitFor();
    await voyage.locator("#cancel-offline").click();
    await wait(voyage, "offline", "cancelled");
    assert.equal(await voyage.locator("#retry-offline").isEnabled(), true);
    server.clearFaults();
    await voyage.locator("#retry-offline").click();
    await wait(voyage, "offline", "Complete edition available offline");
    await save(voyage, `${name}-repaired-voyage.html`);
    await context.close();
    observations.push({
      browser: name,
      corruptSourceWithdrawsBothRooms: true,
      corruptSourceRefused: true,
      corruptCssNotServed: true,
      corruptDocumentOffline503: true,
      maintenanceAndStatusFallbacks: 9,
      cancelledRepairKeepsWork: true,
      verifiedRepairRestoresAllFiles: true,
    });
    console.log(`${name}: cold source read competes with install at shared 64,000 bytes/s`);
    const slow = await slowReviewServer("dist", 64000);
    try {
      const cold = await browser.newContext({
        viewport: { width: 375, height: 1000 },
        acceptDownloads: true,
      });
      const page = await cold.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(slow.base);
      await page.locator("#note").fill("A slow active transfer must keep this learner's work.");
      await wait(page, "source-status", "Page 107", 90000);
      await wait(page, "offline", "Complete edition available offline", 120000);
      const sourceReads = slow.observations.filter((r) => r.path.endsWith("rennie-p107.jpg"));
      assert.ok(
        sourceReads.some((r) => r.endedAt - r.startedAt > 15000),
        "The foreground source did not outlive the old hard deadline",
      );
      assert.ok(sourceReads.every((r) => !r.aborted && r.delivered === r.bytes));
      assert.ok(
        slow.observations.some((r) => r.endedAt - r.startedAt > 15000),
        "No active transfer exceeded the old hard deadline",
      );
      const started = Math.min(...slow.observations.map((r) => r.startedAt));
      const finished = Math.max(
        ...slow.observations.filter((r) => r.endedAt).map((r) => r.endedAt),
      );
      await page.evaluate(async () => {
        const key = (await caches.keys()).find((k) => k.startsWith("nautikon-"));
        await (await caches.open(key)).delete(new URL("sources/rennie-p111.jpg", location.href));
        window.dispatchEvent(new Event("focus"));
      });
      await wait(page, "offline", "not retained");
      const repairStarted = Date.now();
      await page.locator("#retry-offline").click();
      await page
        .locator("#note")
        .fill("A slow active transfer keeps this learner's work, including an edit during repair.");
      await page.locator("#page").selectOption("111");
      await wait(page, "source-status", "Page 111", 90000);
      await wait(page, "offline", "Complete edition available offline", 120000);
      const repairMilliseconds = Date.now() - repairStarted;
      assert.ok(repairMilliseconds > 15000);
      assert.ok(
        slow.observations
          .filter((r) => r.path.endsWith("rennie-p111.jpg"))
          .every((r) => !r.aborted && r.delivered === r.bytes),
      );
      const reading = await save(page, `${name}-slow-reading.html`);
      assert.ok((await readFile(reading, "utf8")).includes("A slow active transfer"));
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await cold.setOffline(true);
      await page.reload();
      await wait(page, "source-status", "Page 107");
      await wait(page, "offline", "Complete edition available offline");
      assert.deepEqual(errors, []);
      observations.push({
        browser: name,
        sharedBytesPerSecond: 64000,
        coldPage107ReadWithBackgroundInstall: true,
        activeTransfersLongerThanOldDeadline: true,
        verifiedOfflineReload: true,
        activeRepairWithForegroundPage111: true,
        repairMilliseconds,
        totalTransferMilliseconds: finished - started,
        transfers: slow.observations,
        pageErrors: errors,
      });
      await cold.close();
    } finally {
      await slow.stop();
    }
  } finally {
    await browser.close();
    await server.stop();
  }
}
await writeReceipt(resolve(out, "receipt.json"), build, observations);
console.log(
  JSON.stringify({ edition: build.edition, state: "passed", observations: observations.length }),
);
