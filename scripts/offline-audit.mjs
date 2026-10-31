import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { buildIdentity, writeReceipt } from "./build-receipt.mjs";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/offline-audit-after");
await mkdir(out, { recursive: true });
const build = await buildIdentity();
const server = reviewServer("dist");
await server.start();
const observations = [];
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      server.fault("/nautikon/sw.js", { status: 503 });
      const failed = await browser.newContext();
      const p = await failed.newPage();
      await p.goto(server.base);
      await p.waitForTimeout(1000);
      const first = await p.locator("#offline").textContent();
      await p.waitForTimeout(5500);
      const afterPoll = await p.locator("#offline").textContent();
      assert.match(first, /not retained/);
      assert.match(afterPoll, /not retained/);
      await failed.close();
      server.clearFaults();
      console.log(
        `${name}: registration failure observed; holding the repair response body for 21 seconds`,
      );
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(server.base);
      await page
        .locator("#offline")
        .filter({ hasText: "Complete edition available offline" })
        .waitFor({ timeout: 25000 });
      await page.evaluate(async () => {
        for (const name of await caches.keys())
          if (name.startsWith("nautikon-")) {
            const c = await caches.open(name);
            await c.delete(new URL("sources/rennie-p109.jpg", location.href));
          }
      });
      server.fault("/nautikon/sw.js", { stallBody: true });
      await page.locator("#retry-offline").click();
      await page.waitForTimeout(21000);
      const repairDisabled = await page.locator("#retry-offline").isDisabled();
      const repairMessage = await page.locator("#offline").textContent();
      observations.push({
        browser: name,
        initialRegistrationFailure: first,
        registrationFailureAfterPolling: afterPoll,
        repairStillDisabledAfter21Seconds: repairDisabled,
        repairMessage,
      });
      assert.equal(repairDisabled, false);
      assert.match(repairMessage, /timed out/);
      server.clearFaults();
      await page.locator("#retry-offline").click();
      await page
        .locator("#offline")
        .filter({ hasText: "Complete edition available offline" })
        .waitFor({ timeout: 25000 });
      await context.close();
    } finally {
      await browser.close();
    }
  }
  await writeReceipt(resolve(out, "observations.json"), build, observations);
  console.log(JSON.stringify(observations, null, 2));
} finally {
  await server.stop();
}
