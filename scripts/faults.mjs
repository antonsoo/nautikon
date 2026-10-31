import assert from "node:assert/strict";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = "test-results/faults";
await mkdir(out, { recursive: true });
await cp("dist", `${out}/incomplete`, { recursive: true });
await rm(`${out}/incomplete/sources/rennie-p109.jpg`);
const server = reviewServer("dist");
await server.start();
const receipts = [];
const wait = (page, id, text) =>
  page.locator(`#${id}`).filter({ hasText: text }).waitFor({ timeout: 25000 });
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const b = await engine.launch();
    try {
      const context = await b.newContext({ serviceWorkers: "block" });
      const p = await context.newPage();
      const downloads = [];
      p.on("download", (d) => downloads.push(d));
      await p.goto(server.base);
      await wait(p, "source-status", "complete checked image");
      await context.route("**/sources/rennie-p108.jpg", async (route) => {
        await new Promise((r) => setTimeout(r, 700));
        try {
          await route.continue();
        } catch {}
      });
      await p.locator("#read-loss").click();
      await p.locator("#read-rate").click();
      await wait(p, "source-status", "Page 107");
      await p.waitForTimeout(900);
      assert.match(await p.locator("#source-status").textContent(), /Page 107/);
      await context.unroute("**/sources/rennie-p108.jpg");
      await p.locator("#note").fill("Preserve this work across a failed source export.");
      const bad = Buffer.from(await readFile("public/sources/rennie-p109.jpg"));
      bad[bad.length - 1] ^= 1;
      await context.route("**/sources/rennie-p109.jpg", (r) =>
        r.fulfill({ status: 200, contentType: "image/jpeg", body: bad }),
      );
      await p.locator("#html").click();
      await wait(p, "status", "Source check failed");
      assert.equal(downloads.length, 0);
      assert.match(await p.locator("#note").inputValue(), /Preserve/);
      await context.unroute("**/sources/rennie-p109.jpg");
      let reached;
      const pending = new Promise((r) => {
        reached = r;
      });
      await context.route("**/sources/rennie-p109.jpg", async (route) => {
        reached();
        await new Promise((r) => setTimeout(r, 1500));
        try {
          await route.continue();
        } catch {}
      });
      await p.locator("#html").click();
      await pending;
      await p.locator("#cancel-export").click();
      await wait(p, "status", "Saving cancelled");
      assert.equal(downloads.length, 0);
      await context.unroute("**/sources/rennie-p109.jpg");
      const ready = p.waitForEvent("download");
      await p.locator("#html").click();
      const saved = await ready;
      assert.equal(await saved.failure(), null);
      assert.equal(downloads.length, 1);
      await context.close();
      // Corrupt retained bytes: a successful HTTP response is insufficient evidence.
      const cacheContext = await b.newContext();
      const first = await cacheContext.newPage();
      await first.goto(server.base);
      await wait(first, "offline", "Complete edition available offline");
      const second = await cacheContext.newPage();
      await second.goto(server.base);
      await wait(second, "offline", "Complete edition available offline");
      await first.evaluate(async () => {
        for (const key of await caches.keys())
          if (key.startsWith("nautikon-")) {
            const c = await caches.open(key),
              url = new URL("sources/rennie-p108.jpg", location.href);
            const old = await c.match(url);
            const data = new Uint8Array(await old.arrayBuffer());
            data[data.length - 1] ^= 1;
            await c.put(url, new Response(data, { headers: { "Content-Type": "image/jpeg" } }));
          }
      });
      await first.locator("#read-loss").click();
      await wait(first, "source-status", "Source check failed");
      await wait(first, "offline", "not retained");
      await second.bringToFront();
      await wait(second, "offline", "not retained");
      await first.locator("#retry-offline").click();
      await wait(first, "offline", "Complete edition available offline");
      await first.locator("#retry-source").click();
      await wait(first, "source-status", "complete checked image");
      await cacheContext.close();
      server.use(`${out}/incomplete`);
      const failedContext = await b.newContext();
      const failed = await failedContext.newPage();
      await failed.goto(server.base);
      await wait(failed, "offline", "not retained");
      assert.doesNotMatch(await failed.locator("#offline").textContent(), /available offline/);
      server.use("dist");
      await failed.locator("#retry-offline").click();
      await wait(failed, "offline", "Complete edition available offline");
      await failedContext.close();
      receipts.push({
        browser: name,
        supersededSourceResponse: true,
        corruptExportRefused: true,
        exportCancelAndRetry: true,
        corruptCacheInvalidatedAcrossTabs: true,
        repairFetchesFreshBytes: true,
        failedInstallCannotClaimReady: true,
      });
    } finally {
      await b.close();
    }
  }
  await writeFile(`${out}/receipts.json`, JSON.stringify(receipts, null, 2));
  console.log(receipts);
} finally {
  await server.stop();
}
