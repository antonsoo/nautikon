// Two real built editions, never route-fulfilled responses. A changed notice in
// the second fixture tests that an old page cannot export mixed source bytes.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const fixture = (await readFile("test-results/rollout-fixture-path.txt", "utf8")).trim(),
  out = "test-results/rollout";
await mkdir(out, { recursive: true });
const a = resolve(fixture, "edition-a"),
  b = resolve(fixture, "edition-b");
const edition = async (path) =>
  /EDITION="([a-f0-9]+)"/.exec(await readFile(resolve(path, "sw.js"), "utf8"))[1];
const before = await edition(a),
  after = await edition(b);
assert.notEqual(before, after);
const server = reviewServer(a);
await server.start();
const observations = [];
const wait = (p, id, text) =>
  p.locator(`#${id}`).filter({ hasText: text }).waitFor({ timeout: 30000 });
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      server.use(a);
      const c = await browser.newContext({ acceptDownloads: true }),
        p = await c.newPage(),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(server.base);
      await wait(p, "offline", "Complete edition available offline");
      await p.locator("#note").fill("KEEP MY OLD EDITION WORK");
      await p.locator("#pin").click();
      await p.locator("#departure").evaluate((e) => {
        e.value = "1";
        e.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const second = await c.newPage();
      await second.goto(`${server.base}testimony.html`);
      await wait(second, "offline", "Complete edition available offline");
      await second.locator("#note").fill("KEEP MY TESTIMONY WORK");
      await second.locator("#check").click();
      server.use(b);
      const next = await c.newPage();
      await next.goto(server.base);
      await wait(next, "offline", "Complete edition available offline");
      const active = await next.evaluate(async () => {
        const channel = new MessageChannel();
        return new Promise((resolve) => {
          channel.port1.onmessage = (e) => resolve(e.data.edition);
          navigator.serviceWorker.controller.postMessage({ type: "INSPECT" }, [channel.port2]);
        });
      });
      assert.equal(active, after);
      await p.bringToFront();
      await wait(p, "offline", "not retained");
      await second.bringToFront();
      await wait(second, "offline", "not retained");
      assert.equal(await p.locator("#note").inputValue(), "KEEP MY OLD EDITION WORK");
      assert.equal(await second.locator("#note").inputValue(), "KEEP MY TESTIMONY WORK");
      const oldLabel = await p.locator("#offline").textContent();
      assert.match(oldLabel, /different edition/);
      assert.match(oldLabel, /Download your notebook JSON before reloading/);
      const pending = p.waitForEvent("download");
      await p.locator("#json").click();
      const notebook = await pending;
      const path = resolve(out, `${name}-old-notebook.json`);
      await notebook.saveAs(path);
      const saved = JSON.parse(await readFile(path, "utf8"));
      assert.equal(saved.note, "KEEP MY OLD EDITION WORK");
      assert.equal(saved.voyage.departure, 1);
      assert.equal(saved.pinned.departure, -5);
      const downloads = [];
      p.on("download", (d) => downloads.push(d));
      await p.locator("#html").click();
      await wait(p, "status", "Source check failed");
      assert.equal(downloads.length, 0);
      assert.equal(await p.locator("#note").inputValue(), saved.note);
      await next.locator("#import").setInputFiles(path);
      await wait(next, "status", "Notebook reopened");
      assert.equal(await next.locator("#note").inputValue(), saved.note);
      await wait(next, "ledger", "3,900");
      await wait(next, "comparison", "3,675");
      const cachesNow = await next.evaluate(() => caches.keys());
      const cacheInventory = await next.evaluate(async () => {
        const out = [];
        for (const name of await caches.keys()) {
          const cache = await caches.open(name);
          out.push({ name, files: (await cache.keys()).length });
        }
        return out;
      });
      await server.stop();
      await next.reload();
      await wait(next, "offline", "Complete edition available offline");
      await wait(next, "source-status", "complete checked image");
      const offlineDownload = next.waitForEvent("download");
      await next.locator("#html").click();
      assert.equal(await (await offlineDownload).failure(), null);
      await server.start();
      // Worker messaging can throw while a controller becomes redundant. Exercise
      // the actual API call site's failure, preserving a settled recovery label.
      const faultErrors = [];
      next.on("pageerror", (e) => faultErrors.push(e.message));
      await next.evaluate(() => {
        const worker = navigator.serviceWorker.controller;
        Object.defineProperty(worker, "postMessage", {
          configurable: true,
          value() {
            throw new DOMException("The worker became redundant", "InvalidStateError");
          },
        });
        window.dispatchEvent(new Event("focus"));
      });
      await next.waitForTimeout(800);
      const messagingLabel = await next.locator("#offline").textContent();
      assert.deepEqual(faultErrors, []);
      assert.match(messagingLabel, /not retained/);
      await next.evaluate(() => {
        const worker = navigator.serviceWorker.controller;
        Object.defineProperty(worker, "postMessage", {
          configurable: true,
          value(_message, ports) {
            ports[0].postMessage(null);
          },
        });
        window.dispatchEvent(new Event("focus"));
      });
      await next.waitForTimeout(200);
      assert.deepEqual(faultErrors, []);
      assert.match(await next.locator("#offline").textContent(), /not retained/);
      observations.push({
        browser: name,
        before,
        after,
        oldPageLabel: oldLabel,
        oldWorkPreserved: true,
        mixedEditionExportRefused: true,
        notebookMigrated: true,
        currentCachePresent: cachesNow.includes(`nautikon-${after}`),
        currentOnlyCache: cachesNow.length === 1 && cachesNow[0] === `nautikon-${after}`,
        cacheInventory,
        currentOfflineExport: true,
        workerMessagingErrors: faultErrors,
        workerMessagingLabel: messagingLabel,
        otherPageErrors: errors,
      });
      await c.close();
    } finally {
      await browser.close();
    }
  }
  await writeFile(
    `${out}/observations.json`,
    `${JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        fixture:
          "Two builds of one committed source; second adds an HTML comment and a changed retained notice; never published",
        observations,
      },
      null,
      2,
    )}\n`,
  );
  console.log(observations);
} finally {
  await server.stop();
}
