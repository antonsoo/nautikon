import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright";
import { reviewServer } from "./review-server.mjs";

const server = reviewServer("dist");
await server.start();
await mkdir("examples", { recursive: true });
await mkdir("test-results", { recursive: true });
const b = await chromium.launch();
try {
  const p = await b.newPage({
    viewport: { width: 1440, height: 1400 },
    acceptDownloads: true,
    reducedMotion: "reduce",
  });
  await p.goto(server.base);
  await p.locator("#source-status").filter({ hasText: "complete checked image" }).waitFor();
  await p.locator("#pin").click();
  await p.locator('[data-preset="default"]').click();
  await p
    .locator("#note")
    .fill(
      "Departure five days before Arcturus selects 225 per thousand: 675 interest on 3,000. The late arrival does not raise that rate. The kept voyage is inside the twenty-day interval; the current voyage is at day 21, still unpaid. On assumed sale proceeds of 2,000, §12 leaves 1,675 claimable from the borrowers’ other property. The text does not guarantee collection.",
    );
  const download = async (id, name) => {
    const pending = p.waitForEvent("download");
    await p.locator(`#${id}`).click();
    const d = await pending;
    assert.equal(await d.failure(), null);
    const raw = await readFile(await d.path());
    await writeFile(name, raw);
    return raw;
  };
  await download("json", "examples/default-notebook.json");
  await download("csv", "examples/default-ledger.csv");
  await download("svg", "examples/default-timeline.svg");
  const pending = p.waitForEvent("download");
  await p.locator("#html").click();
  const d = await pending;
  const raw = await readFile(await d.path());
  await writeFile("examples/default-reading.html.gz", gzipSync(raw));
  const temp = resolve("test-results/default-reading.html");
  await writeFile(temp, raw);
  await p.evaluate(() => window.scrollTo(0, document.getElementById("bench").offsetTop));
  await p.screenshot({ path: "docs/assets/voyage-1440.png" });
  await p.setViewportSize({ width: 375, height: 1100 });
  await p.evaluate(() => window.scrollTo(0, document.querySelector(".work-grid").offsetTop));
  await p.screenshot({ path: "docs/assets/voyage-375.png" });
  await p.setViewportSize({ width: 1440, height: 1100 });
  await p.locator("#read-default").click();
  await p.locator("#source-status").filter({ hasText: "Page 108" }).waitFor();
  await p.locator("#reading-text").scrollIntoViewIfNeeded();
  await p.screenshot({ path: "docs/assets/greek-source-1440.png" });
  const file = await b.newPage();
  await file.goto(pathToFileURL(temp).href);
  await file.evaluate(() => document.fonts.ready);
  await file.pdf({
    path: "examples/default-reading.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  });
  await p.goto(`${server.base}testimony.html`);
  await p.locator("#source-status").filter({ hasText: "Page 110" }).waitFor();
  await p.locator("#check").click();
  await p.locator("#erasikles").check();
  await p
    .locator("#note")
    .fill(
      "The kept check chose exactly 450 from the speaker alone. But οὐδὲ πεντακόσια permits 499 as well: it only gives an upper bound. The current selection adds the deposition attributed to Erasikles, which reports 450 and no more. That makes 450 exact if the report is taken at face value; this exercise has not established its historical truth or the document’s authenticity. The 2,550-jar difference from the contract is not a deduction in drachmas.",
    );
  await download("json", "examples/testimony-notebook.json");
  await download("csv", "examples/testimony-inferences.csv");
  await download("svg", "examples/testimony-count.svg");
  const testimonyPending = p.waitForEvent("download");
  await p.locator("#html").click();
  const testimonyRaw = await readFile(await (await testimonyPending).path());
  await writeFile("examples/testimony-reading.html.gz", gzipSync(testimonyRaw));
  const testimonyFile = resolve("test-results/testimony-reading.html");
  await writeFile(testimonyFile, testimonyRaw);
  await p
    .locator(".report-choices")
    .evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 24));
  await p.screenshot({ path: "docs/assets/testimony-1440.png" });
  await p.setViewportSize({ width: 375, height: 1100 });
  await p
    .locator(".report-choices")
    .evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 24));
  await p.screenshot({ path: "docs/assets/testimony-375.png" });
  await p.setViewportSize({ width: 1440, height: 1100 });
  await p.locator("#read-hippias").click();
  await p.locator("#source-status").filter({ hasText: "Page 111" }).waitFor();
  await p
    .locator("#reading-text")
    .evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 24));
  await p.screenshot({ path: "docs/assets/testimony-source-1440.png" });
  await file.goto(pathToFileURL(testimonyFile).href);
  await file.evaluate(() => document.fonts.ready);
  await file.pdf({
    path: "examples/testimony-reading.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  });
  console.log(
    "Saved both lessons through native browser downloads, six screenshots and two printed example PDFs.",
  );
} finally {
  await b.close();
  await server.stop();
}
