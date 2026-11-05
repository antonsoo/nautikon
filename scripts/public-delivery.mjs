import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { buildIdentity, writeReceipt } from "./build-receipt.mjs";
import { waitForEdition } from "./current-edition.mjs";
import { networkGate } from "./network-gate.mjs";

const base = "https://antonsoo.github.io/nautikon/";
const out = resolve("test-results/public-delivery");
await mkdir(out, { recursive: true });
const build = await buildIdentity();
assert.equal(await (await fetch(`${base}sw.js`)).text(), await readFile("dist/sw.js", "utf8"));
const observations = [];
const wait = (p, id, text) =>
  p.locator(`#${id}`).filter({ hasText: text }).waitFor({ timeout: 45000 });
async function save(p, id, name) {
  const pending = p.waitForEvent("download");
  await p.locator(`#${id}`).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  const path = resolve(out, name);
  await d.saveAs(path);
  return path;
}
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const gate = await networkGate();
  const browser = await engine.launch({ proxy: { server: gate.url } });
  try {
    for (const width of [1440, 375]) {
      console.log(`${name}/${width}: canonical HTTPS through a controllable TCP tunnel`);
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
        reducedMotion: "reduce",
      });
      const voyage = await context.newPage(),
        testimony = await context.newPage(),
        errors = [];
      for (const p of [voyage, testimony]) p.on("pageerror", (e) => errors.push(e.message));
      await voyage.goto(base);
      await waitForEdition(voyage, build.edition);
      await voyage.reload();
      await wait(voyage, "offline", "Complete edition available offline");
      await voyage.waitForFunction(() => !!navigator.serviceWorker.controller);
      await voyage.locator("#withhold-departure").click();
      await voyage.locator("#claim-amount").fill("3800");
      await voyage.locator("#check-debt").click();
      await wait(voyage, "debt-check", "No permitted departure gives this debt");
      await voyage.locator("#pin").click();
      await voyage
        .locator("#note")
        .fill(`${name}/${width}: keep this proposal through an actual browser transport outage.`);
      const json = await save(voyage, "json", `${name}-${width}-voyage.json`);
      const record = JSON.parse(await readFile(json, "utf8"));
      await testimony.goto(`${base}testimony.html`);
      await wait(testimony, "offline", "Complete edition available offline");
      await testimony.locator("#check").click();
      await testimony.locator("#erasikles").check();
      await testimony
        .locator("#note")
        .fill(`${name}/${width}: preserve the original testimony premises.`);
      const testimonyJson = await save(testimony, "json", `${name}-${width}-testimony.json`);
      const start = gate.events.length;
      gate.block();
      assert.equal(
        await voyage.evaluate(() => navigator.onLine),
        true,
        "This audit must exercise transport failure while the browser online flag remains true",
      );
      await voyage.reload();
      await wait(voyage, "offline", "Complete edition available offline");
      await voyage.locator("#import").setInputFiles(json);
      await wait(voyage, "debt-check", "No permitted departure gives this debt");
      assert.equal(await voyage.locator("#note").inputValue(), record.note);
      await voyage.locator("#read-loss").click();
      await wait(voyage, "source-status", "Page 108");
      await save(voyage, "html", `${name}-${width}-offline-voyage.html`);
      await testimony.reload();
      await wait(testimony, "offline", "Complete edition available offline");
      await testimony.locator("#import").setInputFiles(testimonyJson);
      await wait(testimony, "checked", "Counterexample: 499");
      await testimony.locator("#read-hippias").click();
      await wait(testimony, "source-status", "Page 111");
      await save(testimony, "html", `${name}-${width}-offline-testimony.html`);
      await testimony.evaluate(async (edition) => {
        await (await caches.open(`nautikon-${edition}`)).delete(
          new URL("sources/rennie-p111.jpg", location.href),
        );
        window.dispatchEvent(new Event("focus"));
      }, build.edition);
      await wait(testimony, "offline", "not retained");
      await voyage.bringToFront();
      await wait(voyage, "offline", "not retained");
      await testimony.locator("#retry-source").click();
      await wait(testimony, "source-status", "Could not load");
      const missingDownloads = [];
      const onDownload = (d) => missingDownloads.push(d);
      testimony.on("download", onDownload);
      await testimony.locator("#html").click();
      await wait(testimony, "status", "Could not load");
      assert.equal(missingDownloads.length, 0);
      testimony.off("download", onDownload);
      const outageEvents = gate.events.slice(start);
      assert.ok(outageEvents.some((e) => e.action === "block"));
      assert.ok(outageEvents.some((e) => e.allowed === false));
      gate.open();
      await testimony.locator("#retry-offline").click();
      await wait(testimony, "offline", "Complete edition available offline");
      await testimony.locator("#retry-source").click();
      await wait(testimony, "source-status", "Page 111");
      await voyage.bringToFront();
      await wait(voyage, "offline", "Complete edition available offline");
      assert.equal(await voyage.locator("#note").inputValue(), record.note);
      assert.deepEqual(errors, []);
      observations.push({
        browser: name,
        version: browser.version(),
        width,
        canonicalUrl: base,
        controllingEdition: build.edition,
        routeInterceptionUsed: false,
        tlsInterceptionUsed: false,
        navigatorRemainedOnline: true,
        reloadSourcesAndBothReadingsWithTransportBlocked: true,
        incompleteEditionWithdrawnBothTabs: true,
        missingSourceExportRefused: true,
        realNetworkRepairKeptWork: true,
        outageEvents,
        pageErrors: errors,
      });
      await context.close();
    }
  } finally {
    await browser.close();
    await gate.close();
  }
}
assert.equal(await (await fetch(base)).text(), await readFile("dist/index.html", "utf8"));
assert.equal(await (await fetch(`${base}sw.js`)).text(), await readFile("dist/sw.js", "utf8"));
await writeReceipt(resolve(out, "receipt.json"), build, observations);
console.log(
  JSON.stringify({ state: "passed", journeys: observations.length, edition: build.edition }),
);
