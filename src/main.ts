import "./style.css";
import { readings } from "./content/readings";
import { parseJson } from "./core/json";
import {
  account,
  fromSearch,
  initial,
  type Notebook,
  presets,
  readNotebook,
  share,
} from "./core/model";
import { cargo, timeline } from "./drawing";
import { csv, illustrated } from "./export";
import { day, download, esc, money } from "./html";
import { installOffline } from "./offline";
import { installSources } from "./source";
import { collection, comparison, completeGreek, ledger, limits, readingHtml } from "./views";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing app root");
let warning = "";
let voyage = structuredClone(initial);
try {
  voyage = fromSearch(location.search);
} catch {
  warning =
    "This share link has invalid voyage facts. The starting voyage is shown; no partial link settings were applied.";
}
let notebook: Notebook = { version: 1, voyage, pinned: null, note: "" };
let notebookRevision = 0;
let importRevision = 0;
const select = (id: string, title: string, options: [string, string][]) =>
  `<label for="${id}">${title}</label><select id="${id}">${options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select>`;
const range = (id: string, title: string, min: number, max: number, step = 1) =>
  `<div class="range-field"><label for="${id}">${title} <output id="${id}-value" for="${id}"></output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}"></div>`;
root.innerHTML = `<header><a class="wordmark" href="./"><span lang="grc">ΝΑΥΤΙΚΟΝ</span><span>A voyage under written terms</span></a><nav aria-label="Main"><a href="#bench">Voyage</a><a href="#losses">Loss</a><a href="#default">Default</a><a href="#reading">Greek & sources</a><a href="#keep">Keep it</a><a href="testimony.html" target="_blank" rel="noopener">Cargo testimony ↗</a></nav></header>
<main><section class="opening"><p class="eyebrow">The agreement transmitted in [Demosthenes] 35.10–13</p><div class="intro-grid"><h1>The cargo came home.<br>Does the debt change?</h1><div class="intro-copy"><p>Move a departure. Keep an arrival. Read the clause that makes the difference.</p><p>An Athenian sea-loan agreement separates the voyage’s interest, losses allowed in deduction, and the goods a lender can hold. Follow those distinctions through one altered voyage.</p><a href="#bench" class="text-link">Open the account <span aria-hidden="true">↓</span></a></div></div></section>
<p id="warning" class="warning" ${warning ? "" : "hidden"}>${esc(warning)}</p>
<section id="bench" aria-labelledby="bench-title"><div class="section-heading"><p class="section-number">01 / WHEN</p><h2 id="bench-title">Which event changes the rate?</h2></div>
<div class="preset-row" aria-label="Investigations">${presets.map((p) => `<button type="button" data-preset="${p.id}">${esc(p.title)}</button>`).join("")}</div><p id="question" class="question">${esc(presets[0]?.question)}</p>
<div id="cargo" class="diagram-scroll" tabindex="0" role="region" aria-label="Voyage sequence diagram"></div>
<div class="work-grid"><div class="controls"><p class="eyebrow">Change the voyage facts</p>
${range("departure", "Sail from Pontus towards Hieron", -30, 40)}<label class="check"><input id="unknown" type="checkbox"> Departure evidence is missing</label>
${range("arrival", "Reach Athens", -29, 90)}<p class="hint">Days relative to Arcturus are invented. Arrival must follow departure; moving departure past arrival moves arrival one day later.</p>
${select("route", "Voyage branch", [
  ["pontus", "Enter Pontus and return"],
  ["hellespont", "Hellespont exception (§13)"],
])}
${select("outcome", "Ship and cargo outcome", [
  ["safe", "Return goods arrive safely"],
  ["salvage", "Ship irreparable; security survives"],
  ["lost", "Ship and security lost"],
])}
</div><div id="ledger" aria-live="polite" aria-atomic="true"></div></div>
<div id="timeline" class="diagram-scroll" tabindex="0" role="region" aria-label="Relative voyage and repayment timeline"></div><p class="hint">Departure selects the §10 rate. Safe arrival begins the §11 interval. In the ordinary safe-return branch, the blue bar is twenty elapsed days and the red tick is the selected day after arrival. A missing departure leaves the rate undetermined.</p>
<div class="clause-strip"><span lang="grc">ἐκπλεύσωσιν</span><p>“If they <b>sail out</b>…”<br><a href="#read-rate">Read the verb and the rate · §10</a></p></div></section>
<section id="losses" aria-labelledby="loss-title"><div class="section-heading"><p class="section-number">02 / LOSS</p><h2 id="loss-title">The same amount. A different cause.</h2></div><div class="work-grid"><div class="controls">
${select("loss", "One selected loss event", [
  ["none", "No deduction claimed"],
  ["ordinary", "Spoilage or another ordinary loss"],
  ["jettison", "Goods thrown overboard"],
  ["enemies", "Money paid to enemies"],
])}
${range("lossAmount", "Assumed deduction value (drachmas)", 0, 1000)}<label class="check"><input type="checkbox" id="consent"> Those sailing together voted in common to jettison</label><p class="hint">The number is your assumed allowable value. The source does not supply a valuation rule. This bench models one loss event.</p>
</div><div><div id="loss-result" class="finding" aria-live="polite"></div><a href="#read-loss">Read the exception and its condition · §11</a></div></div></section>
<section id="default" aria-labelledby="default-title"><div class="section-heading"><p class="section-number">03 / DEFAULT</p><h2 id="default-title">Who bears the shortfall?</h2></div><div class="work-grid"><div class="controls">
${range("days", "Elapsed days after arrival", 0, 45)}${range("sale", "Assumed proceeds if the security is sold", 0, 10000)}
<label class="check"><input type="checkbox" id="paid"> Record full repayment of the modeled debt</label><label class="check"><input type="checkbox" id="otherPledge"> Another loan is secured on the same goods</label><label class="check"><input type="checkbox" id="sameVessel"> All return cargo comes back in the same vessel</label><p class="hint">The default account assumes no payment unless full repayment is selected. Day 20 is inside this teaching interval; day 21 is beyond it. Other contractual breaches are flagged without invented remedies.</p>
</div><div><div id="collection" aria-live="polite"></div><a href="#read-default">Read security, sale and collection · §§11–12</a></div></div></section>
<section id="keep" aria-labelledby="keep-title"><div class="section-heading"><p class="section-number">04 / COMPARE</p><h2 id="keep-title">Keep the facts before changing them.</h2></div><div class="actions"><button id="pin" type="button" class="primary">Keep this voyage</button><button id="unpin" type="button">Clear kept voyage</button><button id="share" type="button">Copy voyage link</button></div><p class="hint">The link contains current voyage facts. Notes and the kept comparison travel only in notebook downloads. This page does not autosave edits.</p><div id="share-fallback" hidden><label for="share-url">Voyage link to copy</label><input id="share-url" type="url" readonly aria-describedby="share-help"><p id="share-help" class="hint">The link is selected. Copy it with your keyboard or the browser’s text menu; it contains the facts captured when you chose Copy voyage link.</p></div><div id="comparison"></div>
<label for="note">Explain which clause changes the account, and which fact you still need.</label><textarea id="note" rows="4" maxlength="6000" placeholder="Keep an explanation with the two accounts…"></textarea><div class="actions"><button id="html" type="button" class="primary">Save illustrated reading</button><button id="cancel-export" type="button" hidden>Cancel saving</button><button id="json" type="button">Notebook JSON</button><button id="csv" type="button">Ledger CSV</button><button id="svg" type="button">Timeline SVG</button><label class="file-button" for="import">Reopen notebook<input id="import" type="file" accept="application/json,.json"></label></div><p id="status" role="status">The illustrated reading includes both accounts, Greek, word notes, complete printed pages and editable JSON. It opens offline and prints from your browser.</p></section>
<section id="reading" aria-labelledby="reading-title"><div class="section-heading"><p class="section-number">05 / READ</p><h2 id="reading-title">Follow the account back to the words.</h2></div><p>Short Greek readings with new English. The complete printed pages retain the surrounding text and editorial apparatus.</p><div class="reading-tabs" aria-label="Readings">${readings.map((r) => `<button type="button" data-reading="${r.id}" id="read-${r.id}" aria-pressed="${r.id === "rate"}">${esc(r.title)}</button>`).join("")}</div><div class="reading-grid"><article id="reading-text">${readingHtml("rate")}</article><aside class="source-column"><label for="page">Full printed source page</label><select id="page"><option value="107">p. 107 · §§7–10, agreement begins</option><option value="108">p. 108 · §§10–14, agreement continues</option><option value="109">p. 109 · testimony context</option><option value="110">p. 110 · cargo accusation & Erasikles</option><option value="111">p. 111 · Hippias continues</option><option value="title">Edition title</option><option value="imprint">Edition imprint & reprint dates</option></select><div class="actions"><button type="button" id="enlarge" aria-pressed="false">Enlarge page</button><button type="button" id="retry-source">Reload page image</button></div><p class="hint">Enlarge for actual pixels; focus the image area and use arrow keys to pan. Source files are checked before display.</p><div class="source-viewport" tabindex="0" role="region" aria-label="Full source image; arrow keys pan when enlarged"><div id="source-image"></div></div><p id="source-status" role="status"></p><a id="archive" href="https://archive.org/details/p2orationesrecog02demouoft/page/107/mode/1up">Source copy at Internet Archive</a></aside></div>
<details><summary>Complete Greek context · 35.9–14</summary><div class="complete-greek">${completeGreek()}</div></details><details><summary>What the source and this model establish</summary>${limits()}<p>Greek electronic text: <a href="https://github.com/PerseusDL/canonical-greekLit/tree/70427323b61267cdcd0256b9b02009c23392de07/data/tlg0014/tlg035">Perseus Digital Library, pinned Rennie text</a>, CC BY-SA 4.0. The photographed copy is a 1939 reprint of the 1921 edition. The local <a href="sources/provenance.json">provenance</a> records the source identity. <a href="sources/perseus-eng2.xml">Murray’s English and notes</a> are retained for comparison; the new translations above do not reproduce his English. The source apparatus records variants; the controls operate the selected reading, not a reconstruction of the lost document.</p></details>
</section></main><footer><p>Nautikon · Anthony Mercer / PRAVIEL · <a href="https://github.com/antonsoo/nautikon">Source repository</a> · <a href="LICENSE.txt">PolyForm Noncommercial</a> · <a href="sources/NOTICE.txt">Sources & reuse</a></p><p id="offline" role="status">Checking offline edition…</p><button type="button" id="retry-offline">Retry offline saving</button></footer>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Missing ${id}`);
  return e as T;
};
const input = (id: string) => $<HTMLInputElement>(id);
const dropdown = (id: string) => $<HTMLSelectElement>(id);
const status = (message: string) => {
  $("status").textContent = message;
};
function update(): void {
  notebookRevision++;
  const v = notebook.voyage,
    a = account(v);
  for (const key of ["departure", "arrival", "days", "lossAmount", "sale"] as const)
    input(key).value = String(v[key] ?? 0);
  input("departure").disabled = v.departure === null;
  input("arrival").min = String((v.departure ?? -30) + 1);
  input("unknown").checked = v.departure === null;
  for (const key of ["consent", "paid", "otherPledge", "sameVessel"] as const)
    input(key).checked = v[key];
  for (const key of ["route", "outcome", "loss"] as const) dropdown(key).value = v[key];
  $("departure-value").textContent = day(v.departure);
  $("arrival-value").textContent = day(v.arrival);
  for (const key of ["days", "lossAmount", "sale"] as const)
    $(`${key}-value`).textContent = money(v[key]);
  $("cargo").innerHTML = cargo(v);
  $("timeline").innerHTML = timeline(v);
  $("ledger").innerHTML = ledger(v);
  $("collection").innerHTML = collection(v);
  $("loss-result").innerHTML =
    a.debt === null
      ? `<p>The ordinary deduction account is withheld for this voyage. ${esc(a.reason)}</p>`
      : `<p class="result-number">${money(a.deduction)} <span>drachmas deducted</span></p><p>${v.loss === "jettison" ? (v.consent ? "Shared decision present: the selected jettison meets this clause’s condition." : "Shared decision absent: this jettison does not meet the selected exception.") : v.loss === "enemies" ? "The selected payment to enemies is in the exception." : v.loss === "ordinary" ? "An ordinary loss changes the cargo’s value; it does not receive this deduction." : "No deduction is claimed."}</p>`;
  $("comparison").innerHTML = comparison(v, notebook.pinned);
  $<HTMLButtonElement>("unpin").disabled = notebook.pinned === null;
}
for (const key of ["departure", "arrival", "days", "lossAmount", "sale"] as const)
  input(key).addEventListener("input", () => {
    notebook.voyage[key] = Number(input(key).value);
    if (notebook.voyage.departure !== null && notebook.voyage.arrival <= notebook.voyage.departure)
      notebook.voyage.arrival = notebook.voyage.departure + 1;
    update();
  });
input("unknown").addEventListener("change", () => {
  notebook.voyage.departure = input("unknown").checked
    ? null
    : Math.min(-5, notebook.voyage.arrival - 1);
  update();
});
for (const key of ["consent", "paid", "otherPledge", "sameVessel"] as const)
  input(key).addEventListener("change", () => {
    notebook.voyage[key] = input(key).checked;
    update();
  });
for (const key of ["route", "outcome", "loss"] as const)
  dropdown(key).addEventListener("change", () => {
    notebook.voyage = { ...notebook.voyage, [key]: dropdown(key).value };
    update();
  });
$("note").addEventListener("input", () => {
  notebookRevision++;
  notebook.note = $<HTMLTextAreaElement>("note").value;
});
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-preset]"))
  b.addEventListener("click", () => {
    const p = presets.find((p) => p.id === b.dataset.preset);
    if (!p) return;
    notebook.voyage = { ...structuredClone(initial), ...p.patch };
    $("question").textContent = p.question;
    for (const button of document.querySelectorAll<HTMLButtonElement>("[data-preset]"))
      button.setAttribute("aria-pressed", String(button === b));
    update();
  });
$("pin").addEventListener("click", () => {
  notebook.pinned = structuredClone(notebook.voyage);
  update();
  status("Voyage kept. Changing the current facts will not rewrite it.");
});
$("unpin").addEventListener("click", () => {
  notebook.pinned = null;
  update();
  status("Kept voyage cleared.");
});
let shareRevision = 0;
$("share").addEventListener("click", async () => {
  const request = ++shareRevision;
  const url = new URL(share(notebook.voyage), new URL(import.meta.env.BASE_URL, location.href))
    .href;
  try {
    await navigator.clipboard.writeText(url);
    if (request !== shareRevision) return;
    $("share-fallback").hidden = true;
    status("Voyage link copied. It does not contain your note or kept voyage.");
  } catch {
    if (request !== shareRevision) return;
    const field = input("share-url");
    field.value = url;
    $("share-fallback").hidden = false;
    field.focus();
    field.select();
    status("Clipboard access is unavailable. Copy the selected voyage link below.");
  }
});
$("json").addEventListener("click", () =>
  download("nautikon-notebook.json", JSON.stringify(notebook, null, 2), "application/json"),
);
$("csv").addEventListener("click", () =>
  download("nautikon-ledger.csv", csv(notebook), "text/csv"),
);
$("svg").addEventListener("click", () =>
  download("nautikon-timeline.svg", timeline(notebook.voyage), "image/svg+xml"),
);
let exportController: AbortController | null = null;
$("html").addEventListener("click", async () => {
  const controller = new AbortController();
  exportController = controller;
  $<HTMLButtonElement>("html").disabled = true;
  $("cancel-export").hidden = false;
  const snapshot = structuredClone(notebook);
  status("Checking source pages and fonts, then saving the illustrated reading…");
  try {
    const html = await illustrated(snapshot, controller.signal);
    controller.signal.throwIfAborted();
    download("nautikon-reading.html", html, "text/html");
    status(
      "Illustrated reading saved with the facts captured when saving began. Open it offline, or use your browser’s Print command for a PDF.",
    );
  } catch (e) {
    status(
      controller.signal.aborted
        ? "Saving cancelled. Your notebook is kept in this tab."
        : e instanceof Error
          ? e.message
          : "Could not save. Try again; your notebook is kept.",
    );
  } finally {
    exportController = null;
    $<HTMLButtonElement>("html").disabled = false;
    $("cancel-export").hidden = true;
  }
});
$("cancel-export").addEventListener("click", () => exportController?.abort());
input("import").addEventListener("change", async () => {
  const file = input("import").files?.[0];
  if (!file) return;
  input("import").value = "";
  const request = ++importRevision;
  const revision = notebookRevision;
  try {
    if (file.size > 100000) throw new Error("Notebook files must be smaller than 100 KB.");
    const candidate = readNotebook(parseJson(await file.text()));
    if (request !== importRevision) return;
    if (revision !== notebookRevision) {
      status(
        "Notebook not replaced: your work changed while the file was being read. Reopen the file to try again.",
      );
      return;
    }
    notebook = candidate;
    $<HTMLTextAreaElement>("note").value = notebook.note;
    update();
    status("Notebook reopened, including the kept voyage and note.");
  } catch (e) {
    if (request === importRevision)
      status(
        `Notebook not opened: ${e instanceof Error ? e.message : "Invalid JSON"} The current notebook is kept.`,
      );
  }
});
installSources(readings);
update();
installOffline();
