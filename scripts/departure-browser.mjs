import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { buildIdentity, writeReceipt } from "./build-receipt.mjs";
import { reviewServer } from "./review-server.mjs";

const out = resolve("test-results/departure");
await mkdir(out, { recursive: true });
const build = await buildIdentity();
const server = reviewServer("dist");
await server.start();
const results = [];
const wait = (p, id, text) => p.locator(`#${id}`).filter({ hasText: text }).waitFor();
const slider = (p, id, value) =>
  p.locator(`#${id}`).evaluate((e, n) => {
    e.value = String(n);
    e.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
async function save(p, id, filename) {
  const pending = p.waitForEvent("download");
  await p.locator(`#${id}`).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  const path = resolve(out, filename);
  await d.saveAs(path);
  return path;
}
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      for (const width of [1440, 375]) {
        console.log(`${name}/${width}: departure evidence`);
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: "reduce",
          acceptDownloads: true,
        });
        context.setDefaultTimeout(25000);
        await context.addInitScript(() => {
          const original = File.prototype.text;
          File.prototype.text = async function () {
            const text = await original.call(this);
            if (this.name === "slow-claim.json")
              await new Promise((resolve) => {
                window.releaseClaimRead = resolve;
              });
            return text;
          };
        });
        const p = await context.newPage();
        const errors = [],
          external = [];
        p.on("pageerror", (e) => errors.push(e.message));
        p.on("request", (r) => {
          if (/^https?:/.test(r.url()) && !r.url().startsWith(new URL(server.base).origin))
            external.push(r.url());
        });
        await p.goto(server.base);
        await p.locator("#withhold-departure").click();
        await wait(p, "departure-evidence", "3,675");
        await wait(p, "departure-evidence", "3,900");
        await p.locator("#check-debt").focus();
        await p.keyboard.press("Enter");
        await wait(p, "debt-check", "Possible, but not established");
        const saved = JSON.parse(
          await readFile(await save(p, "json", `${name}-${width}-possible.json`), "utf8"),
        );
        assert.equal(saved.claim.voyage.departure, null);
        await p.locator("#import").setInputFiles({
          name: "slow-claim.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(saved)),
        });
        await p.waitForFunction(() => typeof window.releaseClaimRead === "function");
        await p.locator("#claim-amount").fill("3900");
        await p.evaluate(() => window.releaseClaimRead());
        await wait(p, "status", "your work changed while the file was being read");
        assert.equal(await p.locator("#claim-amount").inputValue(), "3900");
        await p.locator("#claim-amount").fill("3675");
        await slider(p, "arrival", -5);
        await wait(p, "ledger", "3,675");
        await wait(p, "ledger", "arrival rules out");
        await wait(p, "debt-check", "The voyage has changed");
        await wait(p, "debt-check", "Possible, but not established");
        await p.locator("#check-debt").click();
        await wait(p, "debt-check", "Follows from these model facts");
        await slider(p, "arrival", 1);
        await wait(p, "ledger", "3,675");
        assert.equal(await p.locator("[data-departure-witness]").count(), 1);
        await slider(p, "arrival", 2);
        assert.equal(await p.locator("[data-departure-witness]").count(), 2);
        await slider(p, "arrival", 25);
        await p.locator("#claim-amount").fill("3800");
        await p.locator("#check-debt").click();
        await wait(p, "debt-check", "No permitted departure gives this debt");
        for (const bad of ["", "3.5", "-1", "10001"]) {
          await p.locator("#claim-amount").fill(bad);
          assert.equal(await p.locator("#check-debt").isDisabled(), true);
          await wait(p, "claim-error", "whole debt");
          await wait(p, "debt-check", "3,800");
        }
        await p.locator("#claim-amount").fill("3675");
        await p.locator("#check-debt").click();
        await p.locator('[data-departure-witness="1"]').focus();
        await p.keyboard.press("Enter");
        assert.equal(await p.locator("#departure").inputValue(), "1");
        await wait(p, "comparison", "Undetermined");
        await wait(p, "comparison", "3,675 or 3,900");
        await wait(p, "status", "hypothetical example");
        await wait(p, "debt-check", "The voyage has changed");
        await p.locator("#unknown").check();
        await p.locator("#loss").selectOption("jettison");
        await wait(p, "departure-evidence", "3,375");
        await wait(p, "departure-evidence", "3,600");
        await slider(p, "days", 21);
        await wait(p, "departure-evidence", "1,375 still claimable");
        await p.locator("#consent").uncheck();
        await wait(p, "departure-evidence", "3,675");
        await p.locator("#route").selectOption("hellespont");
        await p.locator("#check-debt").click();
        await wait(p, "debt-check", "This model cannot test that amount");
        await wait(p, "departure-evidence", "no rate is supplied");
        for (const outcome of ["salvage", "lost"]) {
          await p.locator("#route").selectOption("pontus");
          await p.locator("#outcome").selectOption(outcome);
          await p.locator("#check-debt").click();
          await wait(p, "debt-check", "This model cannot test that amount");
        }
        const legacy = {
          version: 1,
          voyage: saved.voyage,
          pinned: null,
          note: "Old evidence, current model.",
        };
        await p.locator("#import").setInputFiles({
          name: "legacy.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(legacy)),
        });
        await wait(p, "status", "Version 1 upgraded");
        await wait(p, "debt-check", "No checked proposal yet");
        // Exported possible check is reopened exactly, including its fixed facts.
        await p.locator("#import").setInputFiles(resolve(out, `${name}-${width}-possible.json`));
        await wait(p, "status", "Notebook reopened");
        await wait(p, "debt-check", "Possible, but not established");
        await p.locator("#import").setInputFiles({
          name: "corrupt.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify({ ...saved, claim: { ...saved.claim, amount: 3.5 } })),
        });
        await wait(p, "status", "Notebook not opened");
        await wait(p, "debt-check", "Possible, but not established");
        await p.locator('#departure-evidence a[href="#read-rate"]').click();
        await wait(p, "reading-text", "Which event changes the rate?");
        await wait(p, "source-status", "Page 107");
        await p.locator("#claim-amount").fill("3800");
        await p.locator("#check-debt").click();
        await p
          .locator("#note")
          .fill(
            "Two possible debts are not an interval. Departure must precede arrival; neither side of Arcturus follows from a late arrival. <b>This is a note, not markup.</b>",
          );
        await p.locator("#evidence").scrollIntoViewIfNeeded();
        await p.locator("#evidence").screenshot({
          path: resolve(out, `${name}-${width}-evidence.png`),
        });
        assert.equal(
          await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        const json = await save(p, "json", `${name}-${width}-checked.json`);
        const record = JSON.parse(await readFile(json, "utf8"));
        assert.equal(record.version, 2);
        assert.equal(record.claim.amount, 3800);
        assert.equal(record.claim.voyage.departure, null);
        const csv = await readFile(await save(p, "csv", `${name}-${width}.csv`), "utf8");
        assert.match(csv, /"checked proposal","Verdict","excluded"/);
        assert.match(csv, /"Permitted debts before repayment","3,675 or 3,900"/);
        const htmlPath = await save(p, "html", `${name}-${width}-reading.html`);
        const html = await readFile(htmlPath, "utf8");
        assert.ok(!html.includes("<script"));
        assert.ok(html.includes("&lt;b&gt;This is a note"));
        const portable = await context.newPage();
        const requests = [];
        portable.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        await portable.goto(pathToFileURL(htmlPath).href);
        await portable.evaluate(() => document.fonts.ready);
        assert.equal(await portable.locator('[data-verdict="excluded"]').count(), 1);
        assert.equal(await portable.locator("img").count(), 7);
        assert.equal(
          await portable.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        const pending = portable.waitForEvent("download");
        await portable.getByRole("link", { name: "Editable notebook JSON" }).click();
        const d = await pending;
        assert.deepEqual(JSON.parse(await readFile(await d.path(), "utf8")), record);
        assert.deepEqual(requests, []);
        if (name === "chromium" && width === 1440)
          await portable.pdf({
            path: resolve(out, "reading.pdf"),
            format: "A4",
            printBackground: true,
            tagged: true,
          });
        await portable.close();
        const axe = await new AxeBuilder({ page: p }).analyze();
        await writeFile(
          resolve(out, `${name}-${width}-axe.json`),
          JSON.stringify(axe.violations, null, 2),
        );
        assert.deepEqual(axe.violations, []);
        await wait(p, "offline", "Complete edition available offline");
        await p.evaluate(() => navigator.serviceWorker.ready);
        await p.waitForFunction(() => !!navigator.serviceWorker.controller);
        await context.setOffline(true);
        await p.reload();
        await wait(p, "offline", "Complete edition available offline");
        await p.locator("#import").setInputFiles(json);
        await wait(p, "debt-check", "No permitted departure gives this debt");
        await slider(p, "arrival", -5);
        await wait(p, "ledger", "arrival rules out");
        await p.locator("#claim-amount").fill("3675");
        await p.locator("#check-debt").click();
        await wait(p, "debt-check", "Follows from these model facts");
        await save(p, "html", `${name}-${width}-offline.html`);
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        results.push({
          browser: name,
          width,
          checks: [
            "ambiguous",
            "forced",
            "excluded midpoint",
            "outside",
            "invalid draft",
            "fixed earlier facts",
            "witness and pin",
            "loss qualification",
            "day 1/2 boundary",
            "source navigation",
            "v1 migration",
            "atomic invalid import",
            "draft preserved across delayed import",
            "JSON/CSV/HTML",
            "portable native JSON",
            "zero portable network",
            "offline reload and export",
          ],
          axeViolations: axe.violations.length,
          pageErrors: errors,
          externalRequests: external,
        });
        await context.close();
      }
    } finally {
      await browser.close();
    }
  }
  await writeReceipt(resolve(out, "receipt.json"), build, results);
  console.log(
    JSON.stringify({ edition: build.edition, journeys: results.length, state: "passed" }),
  );
} finally {
  await server.stop();
}
