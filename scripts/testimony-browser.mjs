import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { buildIdentity, writeReceipt } from "./build-receipt.mjs";
import { reviewServer } from "./review-server.mjs";

const out = resolve("test-results/testimony");
await mkdir(out, { recursive: true });
const build = await buildIdentity();
const server = reviewServer("dist");
await server.start();
const receipts = [],
  assets = JSON.parse(await readFile("src/asset-manifest.json", "utf8"));
const wait = (p, id, text) =>
  p.locator(`#${id}`).filter({ hasText: text }).waitFor({ timeout: 25000 });
const save = async (p, id, name) => {
  const pending = p.waitForEvent("download");
  await p.locator(`#${id}`).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  const file = resolve(out, name);
  await d.saveAs(file);
  return file;
};
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const b = await engine.launch();
    try {
      for (const width of [1440, 375]) {
        console.log(`${name}/${width}: testimony`);
        const context = await b.newContext({
          viewport: { width, height: 1100 },
          acceptDownloads: true,
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
        const p = await context.newPage(),
          errors = [],
          external = [];
        p.on("pageerror", (e) => errors.push(e.message));
        p.on("request", (r) => {
          if (/^https?:/.test(r.url()) && !r.url().startsWith(new URL(server.base).origin))
            external.push(r.url());
        });
        await p.goto(`${server.base}testimony.html`);
        await wait(p, "source-status", "Page 110");
        await wait(p, "offline", "Complete edition available offline");
        for (let mask = 0; mask < 8; mask++) {
          await p.locator("#speaker").setChecked(!!(mask & 1));
          await p.locator("#erasikles").setChecked(!!(mask & 2));
          await p.locator("#hippias").setChecked(!!(mask & 4));
          const expected = mask & 6 ? "450" : mask & 1 ? "0–499" : "No upper bound";
          assert.ok(
            (await p.locator("#inference .result-number").textContent()).startsWith(expected),
          );
        }
        await p.locator("#erasikles").uncheck();
        await p.locator("#hippias").uncheck();
        await wait(p, "inference", "0–499");
        await p.locator("#check").focus();
        await p.keyboard.press("Enter");
        await wait(p, "checked", "Counterexample: 499");
        await p.locator('[data-count="499"]').click();
        await wait(p, "candidate-result", "499 jars fits");
        await p.locator('[data-count="500"]').click();
        await wait(p, "candidate-result", "500 jars does not fit");
        await p.locator("#erasikles").check();
        await wait(p, "inference", "2,550 jars fewer");
        await wait(p, "checked", "current controls have since changed");
        await p.locator('[data-count="450"]').click();
        await wait(p, "candidate-result", "450 jars fits");
        // No invented strengthening from two agreeing reports.
        await p.locator("#hippias").check();
        await wait(p, "inference", "450");
        await p.locator("#speaker").uncheck();
        await p.locator("#erasikles").uncheck();
        await wait(p, "inference", "450");
        await p.locator("#hippias").uncheck();
        await p.locator('[data-count="3000"]').click();
        await wait(p, "inference", "No upper bound");
        await wait(p, "candidate-result", "3,000 jars fits");
        await p.locator("#candidate").fill("3501");
        assert.equal(await p.locator("#json").isDisabled(), true);
        assert.equal(await p.locator("#check").isDisabled(), true);
        await wait(p, "candidate-result", "last valid count");
        await p.locator("#speaker").check();
        assert.equal(await p.locator("#candidate").inputValue(), "3501");
        await p.locator("#candidate").fill("");
        assert.equal(await p.locator("#html").isDisabled(), true);
        await p.locator('[data-count="499"]').click();
        assert.equal(await p.locator("#json").isEnabled(), true);
        // All exact Greek readings and both halves of the page-spanning deposition.
        for (const [id, page] of [
          ["required", 107],
          ["speaker", 110],
          ["erasikles", 110],
          ["hippias", 111],
        ]) {
          await p.locator(`#read-${id}`).click();
          await wait(p, "source-status", `Page ${page}`);
          const actual = await p.locator("#source-image img").getAttribute("src");
          assert.equal(
            actual.split(",")[1],
            (await readFile(`public/sources/rennie-p${page}.jpg`)).toString("base64"),
          );
        }
        await p.locator('a[href="#read-speaker"]').click();
        await wait(p, "reading-text", "An upper bound");
        await p.locator("#read-hippias").click();
        await p.locator('a[href="#read-speaker"]').click();
        await wait(p, "reading-text", "An upper bound");
        await p.locator("#enlarge").click();
        assert.equal(await p.evaluate(() => document.documentElement.scrollWidth), width);
        await p.locator(".source-viewport").focus();
        await p.keyboard.press("ArrowRight");
        await p.waitForTimeout(150);
        assert.ok(await p.locator(".source-viewport").evaluate((e) => e.scrollLeft > 0));
        await p.locator("#enlarge").click();
        const note = `The speaker’s οὐδὲ πεντακόσια leaves 499 possible. The earlier check used that report alone. <img src=x onerror="alert(1)"> ${"R".repeat(2000)}`;
        await p.locator("#note").fill(note);
        const json = await save(p, "json", `${name}-${width}.json`),
          record = JSON.parse(await readFile(json, "utf8"));
        assert.equal(record.checked.selected.erasikles, false);
        assert.equal(record.checked.candidate, 450);
        assert.equal(record.candidate, 499);
        const file = async (name, n) =>
          p.locator("#import").setInputFiles({
            name,
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(n)),
          });
        await file("slow-old.json", { ...record, note: "OLD FILE" });
        await file("new.json", { ...record, note: "NEW FILE" });
        await p.waitForTimeout(1000);
        assert.equal(await p.locator("#note").inputValue(), "NEW FILE");
        await file("slow-typing.json", record);
        await p.locator("#note").fill("NEW TYPED WORK");
        await p.waitForTimeout(1000);
        assert.equal(await p.locator("#note").inputValue(), "NEW TYPED WORK");
        await p.locator("#import").setInputFiles(json);
        await wait(p, "status", "Testimony reopened");
        for (const n of [
          { ...record, selected: { ...record.selected, hippias: [true] } },
          JSON.parse(await readFile("examples/default-notebook.json", "utf8")),
        ]) {
          await file("bad.json", n);
          await wait(p, "status", "Notebook not opened");
          assert.equal(await p.locator("#note").inputValue(), note);
        }
        await p.locator("#import").setInputFiles({
          name: "duplicate.json",
          mimeType: "application/json",
          buffer: Buffer.from(
            JSON.stringify(record).replace('"candidate":499', '"candidate":499,"candidate":450'),
          ),
        });
        await wait(p, "status", "Repeated JSON field");
        const reading = await save(p, "html", `${name}-${width}.html`),
          html = await readFile(reading, "utf8");
        assert.ok(!html.includes("<script"));
        assert.ok(html.includes("&lt;img src=x"));
        for (const a of assets)
          if (/\.(jpg|woff2|xml)$/.test(a.path))
            assert.ok(
              html.includes((await readFile(`public/${a.path}`)).toString("base64")),
              a.path,
            );
        const csv = await save(p, "csv", `${name}-${width}.csv`);
        assert.match(await readFile(csv, "utf8"), /kept check/);
        const svg = await save(p, "svg", `${name}-${width}.svg`);
        assert.match(await readFile(svg, "utf8"), /Proposed 499 jars/);
        const filePage = await context.newPage(),
          requests = [];
        filePage.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        await filePage.setViewportSize({ width: 375, height: 1100 });
        await filePage.goto(pathToFileURL(reading).href);
        await filePage.evaluate(() => document.fonts.ready);
        assert.equal(await filePage.evaluate(() => document.documentElement.scrollWidth), 375);
        assert.deepEqual(requests, []);
        assert.equal(await filePage.locator("img").count(), 7);
        const pending = filePage.waitForEvent("download");
        await filePage.getByRole("link", { name: "Editable testimony notebook" }).click();
        assert.deepEqual(JSON.parse(await readFile(await (await pending).path(), "utf8")), record);
        await filePage.close();
        const axe = await new AxeBuilder({ page: p }).analyze();
        await writeFile(
          resolve(out, `${name}-${width}-axe.json`),
          JSON.stringify(axe.violations, null, 2),
        );
        assert.deepEqual(
          axe.violations.map((v) => v.id),
          [],
        );
        await p
          .locator(".report-choices")
          .evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 24));
        await p.screenshot({ path: resolve(out, `${name}-${width}-bench.png`) });
        // Navigate between both retained pages with the origin actually stopped.
        const voyage = await context.newPage();
        await voyage.goto(server.base);
        await wait(voyage, "offline", "Complete edition available offline");
        await server.stop();
        await p.reload();
        await wait(p, "source-status", "Page 110");
        await wait(p, "offline", "Complete edition available offline");
        await p.locator("#read-hippias").click();
        await wait(p, "source-status", "Page 111");
        await save(p, "html", `${name}-${width}-offline.html`);
        await voyage.goto(`${server.base}testimony.html`);
        await wait(voyage, "source-status", "Page 110");
        await voyage.goto(server.base);
        await wait(voyage, "ledger", "3,675");
        await server.start();
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        receipts.push({
          browser: name,
          width,
          allReportCombinations: true,
          keptCheckImmutable: true,
          sourceBytes: true,
          importsAndInvalidDrafts: true,
          nativeDownloads: 4,
          embeddedImages: 7,
          standalone375: true,
          axeViolations: 0,
          actualOriginStoppedBothPages: true,
          pageErrors: errors,
          externalRequests: external,
        });
        await context.close();
      }
    } finally {
      await b.close();
    }
  }
  await writeReceipt(resolve(out, "receipts.json"), build, receipts);
  console.log(receipts);
} finally {
  await server.stop();
}
