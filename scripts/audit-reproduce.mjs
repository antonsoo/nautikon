import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, firefox } from "playwright";
import { buildIdentity, writeReceipt } from "./build-receipt.mjs";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/audit-after");
await mkdir(out, { recursive: true });
const build = await buildIdentity();
const server = reviewServer("dist");
await server.start();
const book = JSON.parse(await readFile("examples/default-notebook.json", "utf8"));
const results = [];
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const b = await engine.launch();
    try {
      const context = await b.newContext({
        serviceWorkers: "block",
        acceptDownloads: true,
        viewport: { width: 1440, height: 1100 },
        reducedMotion: "reduce",
      });
      context.setDefaultTimeout(25000);
      await context.addInitScript(() => {
        const original = File.prototype.text;
        File.prototype.text = async function () {
          if (this.name.startsWith("slow")) await new Promise((r) => setTimeout(r, 700));
          return original.call(this);
        };
      });
      const p = await context.newPage();
      await p.goto(server.base);
      await p.locator("#source-status").filter({ hasText: "complete checked image" }).waitFor();
      const load = async (filename, note) =>
        p.locator("#import").setInputFiles({
          name: filename,
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify({ ...book, note })),
        });
      await load("slow-first.json", "OLDER FILE");
      await load("second.json", "NEWER FILE");
      await p.waitForTimeout(1000);
      const overlapping = await p.locator("#note").inputValue();
      await load("slow-third.json", "FILE CONTENT");
      await p.locator("#note").fill("NEWER TYPED WORK");
      await p.waitForTimeout(1000);
      const edits = await p.locator("#note").inputValue();
      await p.locator("#sameVessel").uncheck();
      const description = await p.locator("#cargo svg").getAttribute("aria-label");
      assert.equal(overlapping, "NEWER FILE");
      assert.equal(edits, "NEWER TYPED WORK");
      assert.match(description, /changes vessel|different vessel/i);
      await p.evaluate(() =>
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async () => {
              throw new Error("Clipboard denied");
            },
          },
        }),
      );
      await p.setViewportSize({ width: 375, height: 900 });
      await p.locator("#share").click();
      await p.locator("#share-fallback:not([hidden])").waitFor();
      assert.match(await p.locator("#share-url").inputValue(), /voyage=/);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth), 375);
      for (const raw of [
        JSON.stringify({ ...book, voyage: { ...book.voyage, route: ["pontus"] } }),
        JSON.stringify(book).replace('"departure":-5', '"departure":-5,"departure":10'),
      ]) {
        await p.locator("#import").setInputFiles({
          name: "bad.json",
          mimeType: "application/json",
          buffer: Buffer.from(raw),
        });
        await p.locator("#status").filter({ hasText: "Notebook not opened" }).waitFor();
        assert.equal(await p.locator("#note").inputValue(), "NEWER TYPED WORK");
      }
      await p.locator("#note").fill(`A long note: ${"R".repeat(2000)}`);
      const pending = p.waitForEvent("download");
      await p.locator("#html").click();
      const download = await pending;
      const file = resolve(out, `${name}-reading.html`);
      await download.saveAs(file);
      const reading = await context.newPage();
      await reading.setViewportSize({ width: 375, height: 900 });
      await reading.goto(pathToFileURL(file).href);
      await reading.evaluate(() => document.fonts.ready);
      const layout = await reading.evaluate(() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        comparison: document.querySelector(".comparison").getBoundingClientRect().width,
        note: document.querySelector(".note").getBoundingClientRect().width,
      }));
      assert.equal(layout.document, 375);
      await reading.screenshot({ path: resolve(out, `${name}-reading-375.png`) });
      results.push({
        browser: name,
        overlappingImportFinalNote: overlapping,
        pendingImportFinalNote: edits,
        vesselDescription: description,
        readingLayout: layout,
      });
      await context.close();
    } finally {
      await b.close();
    }
  }
  await writeReceipt(resolve(out, "observations.json"), build, results);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await server.stop();
}
