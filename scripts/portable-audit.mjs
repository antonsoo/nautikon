import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { buildIdentity, writeReceipt } from "./build-receipt.mjs";
import { reviewServer } from "./review-server.mjs";

const out = resolve("test-results/portable-audit");
await mkdir(out, { recursive: true });
const build = await buildIdentity(),
  server = reviewServer("dist");
await server.start();
const observations = [];
async function save(page, id, name) {
  const pending = page.waitForEvent("download");
  await page.locator(`#${id}`).click();
  const download = await pending;
  assert.equal(await download.failure(), null);
  const file = resolve(out, name);
  await download.saveAs(file);
  return file;
}
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      for (const room of ["voyage", "testimony"]) {
        console.log(`${name}: ${room} portable reading`);
        const context = await browser.newContext({
          viewport: { width: 1440, height: 1000 },
          acceptDownloads: true,
        });
        const source = await context.newPage();
        await source.goto(room === "voyage" ? server.base : `${server.base}testimony.html`);
        if (room === "voyage") {
          await source.locator("#pin").click();
          await source.locator("#withhold-departure").click();
          await source.locator("#claim-amount").fill("3800");
          await source.locator("#check-debt").click();
        } else {
          await source.locator("#candidate").fill("499");
          await source.locator("#claim").selectOption("upper");
          await source.locator("#check").click();
          await source.locator("#erasikles").check();
        }
        await source
          .locator("#note")
          .fill(
            `A deliberately long unbroken learner note: ${"α".repeat(5700)} <img src=x onerror=alert(1)>`,
          );
        const record = JSON.parse(
          await readFile(await save(source, "json", `${name}-${room}.json`), "utf8"),
        );
        const file = await save(source, "html", `${name}-${room}.html`);
        const html = await readFile(file, "utf8");
        assert.equal(html.includes("<script"), false);
        assert.ok(html.includes("&lt;img src=x"));
        const page = await context.newPage();
        const requests = [],
          errors = [];
        page.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(pathToFileURL(file).href);
        for (const width of [320, 375, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.evaluate(() => document.fonts.ready);
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            true,
            `${name}/${room}/${width} page overflow`,
          );
          assert.deepEqual(
            await page.evaluate(() =>
              [...document.querySelectorAll('a[href^="#"]')]
                .map((a) => a.getAttribute("href").slice(1))
                .filter((id) => id && !document.getElementById(id)),
            ),
            [],
          );
          const first = page.locator(".portable-diagram").first();
          if (width === 320) {
            await first.focus();
            await page.keyboard.press("ArrowRight");
            await page.waitForTimeout(150);
            assert.ok(await first.evaluate((e) => e.scrollLeft > 0));
            if (room === "voyage") {
              const table = page.locator(".table-scroll");
              await table.focus();
              await page.keyboard.press("ArrowRight");
              await page.waitForTimeout(150);
              assert.ok(await table.evaluate((e) => e.scrollLeft > 0));
            }
          }
          const axe = await new AxeBuilder({ page }).analyze();
          await writeFile(
            resolve(out, `${name}-${room}-${width}-axe.json`),
            JSON.stringify(axe.violations, null, 2),
          );
          assert.deepEqual(
            axe.violations.map((v) => v.id),
            [],
          );
          observations.push({
            browser: name,
            room,
            width,
            noPageOverflow: true,
            sameDocumentLinksResolve: true,
            axeViolations: 0,
            zeroNetworkRequests: true,
            keyboardPanningAt320: width === 320,
          });
        }
        const pending = page.waitForEvent("download");
        await page
          .getByRole("link", {
            name: room === "voyage" ? "Editable notebook JSON" : "Editable testimony notebook",
          })
          .click();
        assert.deepEqual(JSON.parse(await readFile(await (await pending).path(), "utf8")), record);
        assert.equal(await page.locator("main").count(), 1);
        assert.equal(await page.locator("img").count(), 7);
        assert.deepEqual(requests, []);
        assert.deepEqual(errors, []);
        if (name === "chromium")
          await page.pdf({
            path: resolve(out, `${room}.pdf`),
            format: "A4",
            printBackground: true,
            tagged: true,
          });
        await context.close();
      }
    } finally {
      await browser.close();
    }
  }
  await writeReceipt(resolve(out, "receipt.json"), build, observations);
  console.log(
    JSON.stringify({ edition: build.edition, state: "passed", cases: observations.length }),
  );
} finally {
  await server.stop();
}
