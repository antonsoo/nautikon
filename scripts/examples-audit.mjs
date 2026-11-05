import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const out = resolve("test-results/example-audit");
await mkdir(out, { recursive: true });
const observations = [];
const assets = JSON.parse(await readFile("src/asset-manifest.json", "utf8"));
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 320, height: 1000 },
      acceptDownloads: true,
    });
    for (const stem of ["default", "testimony", "departure"]) {
      const bytes = gunzipSync(await readFile(`examples/${stem}-reading.html.gz`));
      const file = resolve(out, `${stem}.html`);
      await writeFile(file, bytes);
      const page = await context.newPage(),
        requests = [];
      page.on("request", (r) => {
        if (/^https?:/.test(r.url())) requests.push(r.url());
      });
      await page.goto(pathToFileURL(file).href);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("main").count(), 1);
      assert.equal(await page.locator("script").count(), 0);
      assert.equal(await page.locator("img").count(), 7);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      const retainedText = await page.locator("pre").allTextContents();
      for (const asset of assets) {
        const raw = await readFile(`public/${asset.path}`);
        if (/\.(jpg|woff2|xml)$/.test(asset.path))
          assert.ok(bytes.toString().includes(raw.toString("base64")), asset.path);
        else assert.ok(retainedText.includes(raw.toString()), asset.path);
      }
      const axe = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(
        axe.violations.map((v) => v.id),
        [],
      );
      const pending = page.waitForEvent("download");
      await page.getByRole("link", { name: /Editable/ }).click();
      assert.deepEqual(
        JSON.parse(await readFile(await (await pending).path(), "utf8")),
        JSON.parse(await readFile(`examples/${stem}-notebook.json`, "utf8")),
      );
      assert.deepEqual(requests, []);
      observations.push({
        browser: name,
        example: stem,
        width: 320,
        sourceFontAndNoticeBytesVerified: assets.length,
        nativeJsonRoundtrip: true,
        networkRequests: requests,
        axeViolations: 0,
      });
      await page.close();
    }
    await context.close();
  } finally {
    await browser.close();
  }
}
await writeFile(
  resolve(out, "receipt.json"),
  `${JSON.stringify({ checkedAt: new Date().toISOString(), observations }, null, 2)}\n`,
);
console.log(JSON.stringify({ state: "passed", examples: observations.length }));
