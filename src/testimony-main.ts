import "./style.css";
import { evidenceScope, testimonyReadings } from "./content/testimony";
import { parseJson } from "./core/json";
import {
  bounds,
  type Claim,
  claims,
  type EvidenceNotebook,
  fits,
  initialEvidence,
  labels,
  readEvidence,
  snapshot,
} from "./core/testimony";
import { download, esc, money } from "./html";
import { installOffline } from "./offline";
import { installSources } from "./source";
import {
  checkedView,
  countDiagram,
  evidenceContext,
  evidenceCsv,
  evidenceReading,
  inference,
} from "./testimony-views";
import { readingHtml } from "./views";

const root = document.getElementById("app");
if (!root) throw new Error("Missing app root");
let candidateInvalid = false;
let book: EvidenceNotebook = structuredClone(initialEvidence),
  revision = 0,
  importRevision = 0;
root.innerHTML = `<header><a class="wordmark" href="./" target="_blank" rel="noopener"><span lang="grc">ΝΑΥΤΙΚΟΝ</span><span>Words, witnesses and a cargo count</span></a><nav aria-label="Main"><a href="#evidence">Evidence bench</a><a href="#reading">Greek & pages</a><a href="#keep">Keep it</a><a href="./" target="_blank" rel="noopener">Voyage account ↗</a></nav></header>
<main><section class="opening"><p class="eyebrow">[Demosthenes] · Against Lacritus · 35.10, 18–22</p><div class="intro-grid"><h1>“Not even 500.”<br>How many jars?</h1><div class="intro-copy"><p>The contract names 3,000. The speaker alleges fewer than 500. Two attributed depositions report 450.</p><p>Decide which statements to take at face value, then test what follows. A requirement, an accusation and a numbered report do different work.</p><a class="text-link" href="#evidence">Test the inference ↓</a></div></div></section>
<section id="evidence" aria-labelledby="evidence-title"><div class="section-heading"><p class="section-number">01 / INFER</p><h2 id="evidence-title">What do the words force?</h2></div><p class="question">Can you infer exactly 450 from the speaker’s accusation alone? Try 499 as a counterexample.</p>
<div class="evidence-norm"><p class="eyebrow">Written requirement · §10</p><p><strong>3,000 jars</strong> of Mendaean wine as security. This describes the terms, rather than the cargo actually loaded. <a href="#read-required">Read the contract’s noun and number</a>.</p></div>
<div class="work-grid"><div class="controls"><fieldset class="report-choices"><legend>Take these count reports at face value</legend>${Object.entries(
  labels,
)
  .map(
    ([k, label]) =>
      `<label class="check"><input type="checkbox" id="${k}"><span><b>${esc(label)}</b><br>${k === "speaker" ? "Not even 500 jars" : k === "erasikles" ? "450 jars, and no more" : "450 jars; no other cargo attributed to Apollodoros"} · <a href="#read-${k}">Read the Greek</a></span></label>`,
  )
  .join(
    "",
  )}</fieldset><p class="hint">Selection changes the premises for a conditional reading. It does not rate reliability. Agreement between reports does not establish independent observation.</p><label for="candidate">Try a whole-jar count</label><input type="number" id="candidate" min="0" max="3500" step="1" aria-describedby="candidate-help"><input type="range" id="count-range" min="0" max="3500" step="1" aria-label="Proposed jar count"><p class="hint" id="candidate-help">0–3,500 is a modern drawing window. With no descriptive report selected, the model imposes no upper bound on possible counts.</p><div class="actions"><button type="button" data-count="450">Try 450</button><button type="button" data-count="499">Try 499</button><button type="button" data-count="500">Try 500</button><button type="button" data-count="3000">Try 3,000</button></div></div><div><div id="inference" aria-live="polite" aria-atomic="true"></div><p id="candidate-result" class="finding" aria-live="polite"></p><p class="hint">Only logical compatibility is checked. A compatible count is not thereby a verified cargo count.</p></div></div>
<div id="count-diagram" class="diagram-scroll" tabindex="0" role="region" aria-label="Count constraints diagram; arrow keys pan"></div><p class="hint">Shaded band: fitting counts in the drawing window. Red dashed line: contractual requirement. Dot: your proposed count. The text above gives the same count information.</p>
<label for="claim">Choose the strongest supported conclusion</label><select id="claim">${Object.entries(
  claims,
)
  .map(([k, v]) => `<option value="${k}">${esc(v)}</option>`)
  .join(
    "",
  )}</select><div class="actions"><button type="button" id="check" class="primary">Check & keep this inference</button><button type="button" id="clear-check">Clear kept check</button></div><div id="checked" class="kept-check" aria-live="polite"></div></section>
<section id="keep" aria-labelledby="keep-title"><div class="section-heading"><p class="section-number">02 / KEEP</p><h2 id="keep-title">Keep the reports behind your conclusion.</h2></div><label for="note">Which Greek expression supports your inference? What has this exercise left unproved?</label><textarea id="note" rows="4" maxlength="6000"></textarea><div class="actions"><button type="button" class="primary" id="html">Save illustrated testimony</button><button type="button" id="cancel-export" hidden>Cancel saving</button><button type="button" id="json">Testimony JSON</button><button type="button" id="csv">Inference CSV</button><button type="button" id="svg">Count diagram SVG</button><label class="file-button" for="import">Reopen testimony<input type="file" id="import" accept=".json,application/json"></label></div><p id="status" role="status">The page does not autosave. Downloads preserve the current controls, your kept check and note. A testimony notebook is separate from a voyage notebook.</p></section>
<section id="reading" aria-labelledby="reading-title"><div class="section-heading"><p class="section-number">03 / READ</p><h2 id="reading-title">Who says it, and where does it end?</h2></div><p>Hippias’s deposition crosses a page. Read p. 110 and its continuation before assigning words to a speaker. The full pages preserve the printed apparatus.</p><div class="reading-tabs" aria-label="Readings">${testimonyReadings.map((r) => `<button type="button" id="read-${r.id}" data-reading="${r.id}" aria-pressed="${r.id === "speaker"}">${esc(r.title)}</button>`).join("")}</div><div class="reading-grid"><article id="reading-text">${readingHtml("speaker", testimonyReadings)}</article><aside class="source-column"><label for="page">Full printed source page</label><select id="page"><option value="110">p. 110 · accusation & Erasikles</option><option value="111">p. 111 · Hippias continues</option><option value="107">p. 107 · agreement begins</option><option value="108">p. 108 · security & terms</option><option value="109">p. 109 · surrounding argument</option><option value="title">Edition title</option><option value="imprint">Edition imprint</option></select><div class="actions"><button type="button" id="enlarge" aria-pressed="false">Enlarge page</button><button type="button" id="retry-source">Reload page image</button></div><p class="hint">Enlarge, focus the image area and use arrow keys to pan. Source bytes are checked before display.</p><div class="source-viewport" tabindex="0" role="region" aria-label="Full source image; arrow keys pan when enlarged"><div id="source-image"></div></div><p id="source-status" role="status"></p><a id="archive" href="https://archive.org/details/p2orationesrecog02demouoft/page/110/mode/1up">Source copy at Internet Archive</a></aside></div><details><summary>Complete Greek context · 35.18–22</summary><div class="complete-greek">${evidenceContext()}</div></details><details open><summary>What this exercise establishes</summary><p>${esc(evidenceScope)}</p><p>The source is a partisan forensic speech with documents transmitted in its literary tradition, not a surviving physical loan agreement or a verified trial transcript. The attribution and authenticity of the inserted documents are not settled here. The 3,000 jars and 3,000 drachmas in §10 have different units; no monetary value is assigned to missing jars.</p><p>Greek from <a href="https://github.com/PerseusDL/canonical-greekLit/tree/70427323b61267cdcd0256b9b02009c23392de07/data/tlg0014/tlg035">Perseus’s pinned Rennie text</a>, CC BY-SA 4.0; new English and notes. Printed witness: Toronto’s 1939 reprint of the 1921 edition. <a href="sources/provenance.json">Provenance</a> · <a href="sources/NOTICE.txt">Reuse & attribution</a> · <a href="sources/perseus-eng2.xml">Murray’s English, retained for comparison</a>.</p></details></section></main><footer><p>Nautikon · Anthony Mercer / PRAVIEL · <a href="https://github.com/antonsoo/nautikon">Source repository</a> · <a href="LICENSE.txt">MIT</a></p><p id="offline" role="status">Checking offline edition…</p><button type="button" id="retry-offline">Retry offline saving</button></footer>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Missing ${id}`);
  return e as T;
};
const input = (id: string) => $<HTMLInputElement>(id);
const status = (s: string) => {
  $("status").textContent = s;
};
function update(): void {
  revision++;
  for (const k of ["speaker", "erasikles", "hippias"] as const) input(k).checked = book.selected[k];
  if (!candidateInvalid) input("candidate").value = String(book.candidate);
  input("candidate").setAttribute("aria-invalid", String(candidateInvalid));
  for (const id of ["check", "html", "json", "csv", "svg"])
    $<HTMLButtonElement>(id).disabled = candidateInvalid || (id === "html" && exporting !== null);
  input("count-range").value = String(book.candidate);
  $<HTMLSelectElement>("claim").value = book.claim;
  $("inference").innerHTML = inference(book);
  $("count-diagram").innerHTML = countDiagram(book);
  $("candidate-result").textContent = candidateInvalid
    ? "Enter a whole jar count from 0 to 3,500. Saving and checking wait for a valid count; the diagram retains your last valid count."
    : `${money(book.candidate)} jars ${fits(book.selected, book.candidate) ? "fits" : "does not fit"} the selected count reports.`;
  $("checked").innerHTML = checkedView(book.checked);
  $<HTMLButtonElement>("clear-check").disabled = book.checked === null;
  if (book.checked && JSON.stringify(snapshot(book)) !== JSON.stringify(book.checked))
    $("checked").insertAdjacentHTML(
      "afterbegin",
      '<p class="eyebrow">Kept check · current controls have since changed</p>',
    );
}
for (const k of ["speaker", "erasikles", "hippias"] as const)
  input(k).addEventListener("change", () => {
    book.selected[k] = input(k).checked;
    update();
  });
input("candidate").addEventListener("input", () => {
  const n = input("candidate").valueAsNumber;
  if (!Number.isSafeInteger(n) || n < 0 || n > 3500) {
    input("candidate").setCustomValidity("Enter a whole jar count from 0 to 3,500.");
    candidateInvalid = true;
    update();
    return;
  }
  candidateInvalid = false;
  input("candidate").setCustomValidity("");
  book.candidate = n;
  update();
});
input("count-range").addEventListener("input", () => {
  book.candidate = Number(input("count-range").value);
  candidateInvalid = false;
  input("candidate").setCustomValidity("");
  update();
});
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-count]"))
  b.addEventListener("click", () => {
    book.candidate = Number(b.dataset.count);
    candidateInvalid = false;
    input("candidate").setCustomValidity("");
    update();
  });
$("claim").addEventListener("change", () => {
  book.claim = $<HTMLSelectElement>("claim").value as Claim;
  update();
});
$("check").addEventListener("click", () => {
  if (!input("candidate").reportValidity()) return;
  book.checked = snapshot(book);
  update();
  status(
    book.claim === bounds(book.selected).claim
      ? "Check kept. Your strongest conclusion follows under the selected reports."
      : "Check kept. Read the counterexample or the stronger conclusion below.",
  );
});
$("clear-check").addEventListener("click", () => {
  book.checked = null;
  update();
  status("Kept check cleared.");
});
$("note").addEventListener("input", () => {
  book.note = $<HTMLTextAreaElement>("note").value;
  revision++;
});
$("json").addEventListener("click", () =>
  download("nautikon-testimony.json", JSON.stringify(book, null, 2), "application/json"),
);
$("csv").addEventListener("click", () =>
  download("nautikon-testimony.csv", evidenceCsv(book), "text/csv"),
);
$("svg").addEventListener("click", () =>
  download("nautikon-count.svg", countDiagram(book), "image/svg+xml"),
);
let exporting: AbortController | null = null;
$("html").addEventListener("click", async () => {
  const controller = new AbortController();
  exporting = controller;
  $<HTMLButtonElement>("html").disabled = true;
  $("cancel-export").hidden = false;
  const saved = readEvidence(structuredClone(book));
  status("Checking retained pages, text and fonts before saving…");
  try {
    const html = await evidenceReading(saved, controller.signal);
    controller.signal.throwIfAborted();
    download("nautikon-testimony.html", html, "text/html");
    status(
      "Testimony reading saved with the facts captured when saving began. Open it offline or print from your browser.",
    );
  } catch (e) {
    status(
      controller.signal.aborted
        ? "Saving cancelled. Your work stays in this tab."
        : e instanceof Error
          ? e.message
          : "Could not save. Your work stays in this tab.",
    );
  } finally {
    exporting = null;
    $<HTMLButtonElement>("html").disabled = candidateInvalid;
    $("cancel-export").hidden = true;
  }
});
$("cancel-export").addEventListener("click", () => exporting?.abort());
input("import").addEventListener("change", async () => {
  const file = input("import").files?.[0];
  if (!file) return;
  input("import").value = "";
  const request = ++importRevision,
    then = revision;
  try {
    if (file.size > 100000) throw new Error("Notebook files must be smaller than 100 KB.");
    const candidate = readEvidence(parseJson(await file.text()));
    if (request !== importRevision) return;
    if (then !== revision) {
      status(
        "Notebook not replaced: your work changed while the file was being read. Reopen the file to try again.",
      );
      return;
    }
    book = candidate;
    candidateInvalid = false;
    $<HTMLTextAreaElement>("note").value = book.note;
    candidateInvalid = false;
    input("candidate").setCustomValidity("");
    update();
    status("Testimony reopened, including its kept check and note.");
  } catch (e) {
    if (request === importRevision)
      status(
        `Notebook not opened: ${e instanceof Error ? e.message : "Invalid JSON"} Your current work is kept.`,
      );
  }
});
update();
installSources(testimonyReadings);
installOffline();
