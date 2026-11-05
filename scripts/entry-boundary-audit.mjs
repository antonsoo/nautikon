import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { buildIdentity } from "./build-receipt.mjs";
import { reviewServer } from "./review-server.mjs";

const root = resolve(process.argv[2] || "dist");
const older = resolve(process.argv[3] || "test-results/older-build");
const requireMatch = process.argv.includes("--require-match");
const out = process.env.ENTRY_AUDIT_OUT || "test-results/entry-boundary";
await mkdir(out, { recursive: true });
const build = await buildIdentity(root),
  oldBuild = await buildIdentity(older);
const currentHtml = await readFile(resolve(root, "index.html"), "utf8");
const oldHtml = await readFile(resolve(older, "index.html"), "utf8");
assert.notEqual(oldHtml, currentHtml);
const observations = [];
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const server = reviewServer(root);
  await server.start();
  const browser = await engine.launch();
  try {
    const context = await browser.newContext();
    const original = await context.newPage();
    await original.goto(server.base);
    await original
      .locator("#offline")
      .filter({ hasText: "Complete edition available offline" })
      .waitFor();
    server.fault("/nautikon/", { status: 200, contentType: "text/html", body: oldHtml });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(server.base);
    const matchesCurrent = (await response.text()) === currentHtml;
    if (requireMatch) {
      assert.equal(matchesCurrent, true);
      await page.locator("#ledger").filter({ hasText: "3,675" }).waitFor();
    }
    observations.push({
      browser: name,
      suppliedHtmlEdition: oldBuild.edition,
      controllingEdition: build.edition,
      matchesCurrent,
      appHasContent: await page.locator("#app").evaluate((e) => !!e.children.length),
      pageErrors: errors,
    });
  } finally {
    await browser.close();
    await server.stop();
  }
}
assert.deepEqual(await buildIdentity(root), build);
await writeFile(
  `${out}/receipt.json`,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), requireMatch, build, olderEdition: oldBuild.edition, observations }, null, 2)}\n`,
);
console.log(observations);
