// Start before publishing a different reviewed build. This audit never pushes,
// intercepts routes or serves fixtures. It holds edited public tabs through the
// real deployment, then downloads and reopens their work in the new edition.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { waitForEdition } from "./current-edition.mjs";

const base = "https://antonsoo.github.io/nautikon/",
  out = "test-results/public-upgrade";
await mkdir(out, { recursive: true });
const read = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
  assert.equal(r.status, 200, url);
  return Buffer.from(await r.arrayBuffer());
};
const id = (text) => /EDITION="([a-f0-9]+)"/.exec(text)[1];
const expected = id(await readFile("dist/sw.js", "utf8")),
  before = id((await read(`${base}sw.js`)).toString());
assert.notEqual(before, expected, "Start this audit while the previous edition is still public");
const oldModules = new Map();
for (const page of [base, `${base}testimony.html`]) {
  const html = (await read(page)).toString();
  for (const match of html.matchAll(/(?:src|href)="([^"]+\.js)"/g)) {
    const url = new URL(match[1], base).href;
    oldModules.set(url, await read(url));
  }
}
const wait = (p, id, text) =>
  p.locator(`#${id}`).filter({ hasText: text }).waitFor({ timeout: 45000 });
const save = async (p, id, name) => {
  const pending = p.waitForEvent("download");
  await p.locator(`#${id}`).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  const path = resolve(out, name);
  await d.saveAs(path);
  return path;
};
const held = [],
  receipts = [];
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch(),
      context = await browser.newContext({
        viewport: { width: 375, height: 1100 },
        acceptDownloads: true,
        reducedMotion: "reduce",
      });
    const voyage = await context.newPage(),
      testimony = await context.newPage(),
      errors = [];
    for (const p of [voyage, testimony]) p.on("pageerror", (e) => errors.push(e.message));
    await voyage.goto(base);
    await waitForEdition(voyage, before);
    await voyage.reload();
    await wait(voyage, "offline", "Complete edition available offline");
    await voyage.locator("#note").fill(`${name}: keep the public voyage through this deployment`);
    await voyage.locator("#pin").click();
    await voyage.locator("#departure").evaluate((e) => {
      e.value = "1";
      e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await wait(voyage, "ledger", "3,900");
    await testimony.goto(`${base}testimony.html`);
    await wait(testimony, "offline", "Complete edition available offline");
    await testimony
      .locator("#note")
      .fill(`${name}: keep the public testimony and the original premises`);
    await testimony.locator("#check").click();
    await testimony.locator("#erasikles").check();
    await wait(testimony, "checked", "current controls have since changed");
    held.push({ name, browser, context, voyage, testimony, errors });
  }
  await writeFile(
    resolve(out, "ready.json"),
    `${JSON.stringify({ before, expected, engines: held.map((h) => h.name), readyAt: new Date().toISOString() }, null, 2)}\n`,
  );
  console.log(`Both engines hold edited ${before} tabs; waiting for canonical ${expected}.`);
  const deadline = Date.now() + 240000;
  for (;;) {
    if (Date.now() > deadline)
      throw new Error("The different canonical edition was not published within four minutes");
    try {
      if (id((await read(`${base}sw.js`)).toString()) === expected) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  for (const h of held) {
    const { name, context, voyage, testimony, errors, browser } = h;
    console.log(`${name}: public worker handover`);
    const current = await context.newPage();
    current.on("pageerror", (e) => errors.push(e.message));
    await current.goto(base);
    await waitForEdition(current, expected);
    await current.reload();
    await wait(current, "offline", "Complete edition available offline");
    const active = await current.evaluate(
      () =>
        new Promise((resolve) => {
          const c = new MessageChannel();
          c.port1.onmessage = (e) => {
            c.port1.close();
            resolve(e.data);
          };
          navigator.serviceWorker.controller.postMessage({ type: "INSPECT" }, [c.port2]);
        }),
    );
    assert.equal(active.edition, expected);
    assert.equal(active.complete, true);
    await voyage.bringToFront();
    await wait(voyage, "offline", "not retained");
    await testimony.bringToFront();
    await wait(testimony, "offline", "not retained");
    assert.equal(
      await voyage.locator("#note").inputValue(),
      `${name}: keep the public voyage through this deployment`,
    );
    assert.equal(
      await testimony.locator("#note").inputValue(),
      `${name}: keep the public testimony and the original premises`,
    );
    await wait(voyage, "ledger", "3,900");
    await wait(testimony, "checked", "Counterexample: 499");
    const voyagePath = await save(voyage, "json", `${name}-voyage.json`),
      testimonyPath = await save(testimony, "json", `${name}-testimony.json`),
      v = JSON.parse(await readFile(voyagePath, "utf8")),
      t = JSON.parse(await readFile(testimonyPath, "utf8"));
    assert.equal(v.pinned.departure, -5);
    assert.equal(t.checked.selected.erasikles, false);
    assert.equal(t.selected.erasikles, true);
    await current.locator("#import").setInputFiles(voyagePath);
    await wait(current, "status", "Notebook reopened");
    assert.equal(await current.locator("#note").inputValue(), v.note);
    await wait(current, "comparison", "3,675");
    const currentTestimony = await context.newPage();
    await currentTestimony.goto(`${base}testimony.html`);
    await currentTestimony.reload();
    await wait(currentTestimony, "offline", "Complete edition available offline");
    await context.setOffline(true);
    await current.reload();
    await wait(current, "offline", "Complete edition available offline");
    await current.locator("#import").setInputFiles(voyagePath);
    await wait(current, "status", "Notebook reopened");
    assert.equal(await current.locator("#note").inputValue(), v.note);
    await save(current, "html", `${name}-restored-voyage.html`);
    await currentTestimony.reload();
    await wait(currentTestimony, "offline", "Complete edition available offline");
    await currentTestimony.locator("#import").setInputFiles(testimonyPath);
    await wait(currentTestimony, "status", "Testimony reopened");
    assert.equal(await currentTestimony.locator("#note").inputValue(), t.note);
    await wait(currentTestimony, "checked", "Counterexample: 499");
    await currentTestimony.locator("#read-hippias").click();
    await wait(currentTestimony, "source-status", "Page 111");
    await save(currentTestimony, "html", `${name}-restored-testimony.html`);
    assert.deepEqual(errors, []);
    receipts.push({
      browser: name,
      version: browser.version(),
      width: 375,
      before,
      after: expected,
      realEditedTabsAcrossPublication: true,
      bothNotesAndKeptWorkPreserved: true,
      nativeJsonBothSchemas: true,
      newEditionImportsAfterOfflineReload: true,
      restoredReadingsDownloaded: true,
      currentWorker: active,
      pageErrors: errors,
      routeInterceptionUsed: false,
    });
    await context.close();
    await browser.close();
    h.closed = true;
  }
  const modules = [];
  for (const [url, bytes] of oldModules) {
    const current = await read(url);
    assert.deepEqual(current, bytes);
    modules.push({
      url,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      unchangedAfterPublication: true,
    });
  }
  await writeFile(
    "docs/delivery-audit/public-upgrade.json",
    `${JSON.stringify({ checkedAt: new Date().toISOString(), base, before, after: expected, observations: receipts, previousHashedModules: modules }, null, 2)}\n`,
  );
  console.log(receipts);
} finally {
  for (const h of held) if (!h.closed) await h.browser.close();
}
