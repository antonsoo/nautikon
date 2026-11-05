// Reproduce known failures against an unchanged older build. This records
// failures as observations; it never treats them as successful validation.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { buildIdentity } from "./build-receipt.mjs";
import { reviewServer } from "./review-server.mjs";
import { slowReviewServer } from "./slow-review-server.mjs";

const root = resolve(process.argv[2] || "test-results/before-build");
const build = await buildIdentity(root),
  observations = [];
const out = "test-results/audit-before";
await mkdir(out, { recursive: true });
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  const server = reviewServer(root);
  await server.start();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(server.base);
    await page
      .locator("#offline")
      .filter({ hasText: "Complete edition available offline" })
      .waitFor();
    await page.evaluate(async () => {
      const key = (await caches.keys()).find((k) => k.startsWith("nautikon-"));
      await (await caches.open(key)).put(
        new URL("sources/rennie-p111.jpg", location.href),
        new Response("CORRUPT SCAN", { headers: { "Content-Type": "image/jpeg" } }),
      );
    });
    await page.waitForTimeout(6500);
    const corruptCacheLabel = await page.locator("#offline").textContent();
    server.fault("/nautikon/", {
      status: 200,
      body: "<!doctype html><title>Maintenance</title><p>Please return later.</p>",
    });
    await page.reload();
    const maintenanceReplacedLesson = (await page.locator("#app").count()) === 0;
    observations.push({
      browser: name,
      corruptCacheLabel,
      falselyReportsComplete: corruptCacheLabel.includes("Complete edition available offline"),
      maintenanceReplacedLesson,
    });
    await context.close();
    const slow = await slowReviewServer(root, 128000);
    try {
      const cold = await browser.newContext();
      const p = await cold.newPage();
      await p.goto(slow.base);
      await p.waitForTimeout(26000);
      observations.push({
        browser: name,
        sharedBytesPerSecond: 128000,
        offlineLabel: await p.locator("#offline").textContent(),
        sourceLabel: await p.locator("#source-status").textContent(),
        transfers: slow.observations.map((r) => ({ ...r })),
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
assert.deepEqual(await buildIdentity(root), build);
await writeFile(
  `${out}/receipt.json`,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), kind: "reproduced failures before repair", build, observations }, null, 2)}\n`,
);
console.log(JSON.stringify(observations, null, 2));
