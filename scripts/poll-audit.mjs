import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, firefox } from "playwright";
import { waitForValue } from "./current-edition.mjs";

const observations = [];
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    const context = await browser.newContext(),
      page = await context.newPage();
    await assert.rejects(
      waitForValue(page, async () => false, null, 300),
      /explicitly true/,
    );
    await page.evaluate(() => {
      window.pollAuditCount = 0;
    });
    await waitForValue(
      page,
      async () => {
        await new Promise((r) => setTimeout(r, 20));
        return ++window.pollAuditCount >= 3;
      },
      null,
      3000,
    );
    assert.equal(await page.evaluate(() => window.pollAuditCount), 3);
    // Record the installed SDK behavior independently from the corrected helper.
    const handle = await page.waitForFunction(async () => false, null, { timeout: 300 });
    assert.equal(await handle.jsonValue(), false);
    console.log(
      `${name}: awaited false is refused; delayed true requires three evaluations; installed SDK returned a false async handle`,
    );
    observations.push({
      browser: name,
      version: browser.version(),
      asyncFalseRejected: true,
      delayedTrueEvaluations: 3,
      installedSdkReturnedFalseHandle: true,
    });
    await context.close();
  } finally {
    await browser.close();
  }
}

await mkdir("test-results/poll-audit", { recursive: true });
await writeFile(
  "test-results/poll-audit/receipt.json",
  `${JSON.stringify({ checkedAt: new Date().toISOString(), sdk: JSON.parse(await readFile("node_modules/playwright/package.json", "utf8")).version, observations }, null, 2)}\n`,
);
