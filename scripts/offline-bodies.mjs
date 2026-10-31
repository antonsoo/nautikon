import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, firefox } from "playwright";
import { buildIdentity, writeReceipt } from "./build-receipt.mjs";
import { reviewServer } from "./review-server.mjs";

const build = await buildIdentity();
const server = reviewServer("dist");
await server.start();
const out = "test-results/offline-bodies";
await mkdir(out, { recursive: true });
const receipts = [];
const wait = (p, text) =>
  p.locator("#offline").filter({ hasText: text }).waitFor({ timeout: 30000 });
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const b = await engine.launch();
    try {
      console.log(`${name}: bounded initial install with a response that never finishes`);
      server.fault("/nautikon/sources/rennie-p111.jpg", { stallBody: true });
      const context = await b.newContext(),
        p = await context.newPage();
      await p.goto(server.base);
      await wait(p, "not retained");
      // The initial install must settle rather than holding an installing worker forever.
      await p.waitForFunction(
        async () => {
          const r = await navigator.serviceWorker.getRegistration();
          return !r?.installing;
        },
        {},
        { timeout: 22000 },
      );
      assert.equal(await p.evaluate(() => !!navigator.serviceWorker.controller), false);
      server.clearFaults();
      await p.locator("#retry-offline").click();
      await wait(p, "Complete edition available offline");
      await p.evaluate(async () => {
        for (const k of await caches.keys())
          if (k.startsWith("nautikon-"))
            await (await caches.open(k)).delete(new URL("sources/rennie-p111.jpg", location.href));
      });
      server.fault("/nautikon/sources/rennie-p111.jpg", { stallBody: true });
      await p.locator("#retry-offline").click();
      await wait(p, "timed out");
      assert.equal(await p.locator("#retry-offline").isDisabled(), false);
      server.clearFaults();
      await p.locator("#retry-offline").click();
      await wait(p, "Complete edition available offline");
      await context.close();
      console.log(`${name}: compressed real HTTP navigation and offline re-navigation`);
      server.fault("/nautikon/", { gzip: true });
      server.fault("/nautikon/index.html", { gzip: true });
      server.fault("/nautikon/testimony.html", { gzip: true });
      const compressed = await b.newContext(),
        page = await compressed.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(server.base);
      await wait(page, "Complete edition available offline");
      for (let i = 0; i < 2; i++) {
        await page.reload();
        await page.locator("#ledger").filter({ hasText: "3,675" }).waitFor();
      }
      await page.goto(`${server.base}testimony.html`);
      await page.locator("#inference").filter({ hasText: "0–499" }).waitFor();
      await server.stop();
      await page.reload();
      await page.locator("#inference").filter({ hasText: "0–499" }).waitFor();
      await page.goto(server.base);
      await page.locator("#ledger").filter({ hasText: "3,675" }).waitFor();
      assert.deepEqual(errors, []);
      await server.start();
      server.clearFaults();
      await compressed.close();
      receipts.push({
        browser: name,
        incompleteInitialBodyBounded: true,
        stalledAssetRepairBounded: true,
        retryRestoresCompleteEdition: true,
        compressedOnlineAndOfflineNavigations: true,
        pageErrors: errors,
      });
    } finally {
      await b.close();
    }
  }
  await writeReceipt(`${out}/receipts.json`, build, receipts);
  console.log(receipts);
} finally {
  await server.stop();
}
