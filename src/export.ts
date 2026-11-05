import { asData, assets, bytes } from "./assets";
import { readings } from "./content/readings";
import { checkDebt } from "./core/debt-claim";
import { type Notebook, readNotebook } from "./core/model";
import { debtClaimHtml, departureEvidence } from "./debt-views";
import { cargo, timeline } from "./drawing";
import { esc } from "./html";
import { collection, comparison, completeGreek, ledger, limits, readingHtml, rows } from "./views";
export function csv(record: Notebook): string {
  const line = (cells: string[]) => cells.map((s) => `"${s.replaceAll('"', '""')}"`).join(",");
  const output = [line(["account", "field", "value", "scope"])];
  for (const [name, voyage] of [
    ["current", record.voyage],
    ["pinned", record.pinned],
  ] as const) {
    if (voyage)
      for (const [key, value] of rows(voyage))
        output.push(
          line([
            name,
            key,
            value,
            "Modern selected-clause model; invented voyage facts; not a verdict",
          ]),
        );
  }
  if (record.claim) {
    const checked = checkDebt(record.claim);
    const scope =
      "Kept proposal; original facts; debt BEFORE repayment; modern selected-clause model";
    output.push(line(["checked proposal", "Proposed debt", String(record.claim.amount), scope]));
    output.push(line(["checked proposal", "Verdict", checked.verdict, scope]));
    for (const [key, value] of rows(record.claim.voyage))
      output.push(line(["checked proposal", key, value, scope]));
  }
  return `${output.join("\r\n")}\r\n`;
}
export async function illustrated(record: Notebook, signal: AbortSignal): Promise<string> {
  const saved = readNotebook(structuredClone(record));
  const loaded = new Map<string, Uint8Array>();
  // Keep the source checks at the artifact boundary; a previously displayed
  // image or a cache-status label is not evidence of the bytes used in a download.
  for (const item of assets) {
    signal.throwIfAborted();
    loaded.set(item.path, await bytes(item.path, signal));
  }
  signal.throwIfAborted();
  const data = (path: string) => {
    const item = assets.find((a) => a.path === path),
      raw = loaded.get(path);
    if (!item || !raw) throw new Error(`Missing export source ${path}`);
    return asData(raw, item.mime);
  };
  const utf8 = (s: string) => asData(new TextEncoder().encode(s), "application/json");
  const font = `@font-face{font-family:Gentium;src:url('${data("fonts/gentium-book-plus-400-latin.woff2")}')}@font-face{font-family:Gentium;src:url('${data("fonts/gentium-book-plus-400-latin-ext.woff2")}');unicode-range:U+0100-024F,U+1E00-1EFF}@font-face{font-family:Gentium;src:url('${data("fonts/gentium-book-plus-400-greek-ext.woff2")}');unicode-range:U+1F00-1FFF}@font-face{font-family:Gentium;src:url('${data("fonts/gentium-book-plus-400-greek.woff2")}');unicode-range:U+0370-03FF}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'"><title>Nautikon · illustrated voyage dossier</title><style>${font}
  *{box-sizing:border-box}body{margin:2rem auto;padding:0 1.2rem;max-width:60rem;color:#173b4b;background:#f8f3e7;font:20px/1.55 Gentium,Georgia,serif}h1{font-size:3rem;line-height:1.1}h2{margin-top:3rem}h3{font-size:1.6rem}a{color:#913322;overflow-wrap:anywhere}svg{width:100%;height:auto}table{width:100%;border-collapse:collapse;font-size:17px}th,td{padding:.6rem;text-align:left;border-bottom:1px solid #acb3ad;vertical-align:top}td:last-child{text-align:right}.total{font-size:25px}.ledger{break-inside:avoid}.ledger th{font-weight:400}.ledger small{display:block;font-size:.8em}.ledger a{margin-left:.3em}.ledger caption{text-align:left}.greek{font-size:1.5rem}.words div{break-inside:avoid;border-top:1px solid #b1b7b0;padding:.5rem}.words dd{margin:0}.source img{width:100%;height:auto}.changed{background:#e8e0ce}.collection-numbers{display:flex;gap:3rem}.collection-numbers dd{margin:0;font-size:2rem}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.5 monospace}.note{white-space:pre-wrap;overflow-wrap:anywhere}.departure-cases{display:flex;flex-wrap:wrap;gap:1.5rem}.departure-case{flex:1 1 17rem;border-top:1px solid #acb3ad}.departure-case h4,.debt-check h4{font-size:1.3rem}.case-debt{font-size:1.5rem}.case-days span,.case-debt span{display:block;font-size:.9rem}.debt-check{border-block:2px solid #173b4b;padding:1rem 0}.claim-facts dd{margin:0}.claim-facts div{break-inside:avoid}.source{break-before:page}.downloads{display:flex;flex-wrap:wrap;gap:1rem}@media print{body{margin:0;background:#fff;color:#173b4b;font-size:12pt}.downloads{display:none}.source img{max-height:240mm;object-fit:contain}h2,h3{break-after:avoid}.greek{font-size:15pt}table{font-size:10pt}svg{break-inside:avoid}a{color:inherit}}
  </style></head><body><p>NAUTIKON · VOYAGE DOSSIER · ${__EDITION__}</p><h1>A cargo is not a debt.</h1><p>A selected-clause reading of the agreement transmitted in [Demosthenes] 35.10–13. The changed voyage facts are invented. Keep departure, arrival, debt and security distinct as you compare the two accounts.</p>${cargo(saved.voyage)}${timeline(saved.voyage)}${ledger(saved.voyage)}<h2>What follows from the departure evidence?</h2>${departureEvidence(saved.voyage)}<h2>Kept debt proposal</h2>${debtClaimHtml(saved.claim, saved.voyage).replaceAll("<details>", "<details open>")}<h2>Security and collection</h2>${collection(saved.voyage)}<h2>Kept comparison</h2>${comparison(saved.voyage, saved.pinned)}<h2>Learner’s explanation</h2><p class="note">${esc(saved.note || "No note entered.")}</p><nav class="downloads" aria-label="Embedded files"><a download="nautikon-notebook.json" href="${utf8(JSON.stringify(saved, null, 2))}">Editable notebook JSON</a><a download="nautikon-ledger.csv" href="${asData(new TextEncoder().encode(csv(saved)), "text/csv")}">Ledger CSV</a></nav><h2>Readings and word notes</h2>${readings.map((r) => `<article id="read-${r.id}">${readingHtml(r.id)}</article>`).join("")}<h2>Complete Greek context · 35.9–14</h2>${completeGreek()}<p>Perseus Digital Library, Tufts University; Rennie’s Greek, CC BY-SA 4.0. Whitespace normalized. See embedded attribution and provenance.</p>${["rennie-title", "rennie-imprint", "rennie-p107", "rennie-p108", "rennie-p109", "rennie-p110", "rennie-p111"].map((name) => `<figure class="source"><figcaption>Full printed page · ${esc(name)} · Internet Archive, University of Toronto copy. The edition’s text and apparatus are retained.</figcaption><img src="${data(`sources/${name}.jpg`)}" alt="${esc(name)} full printed source page"></figure>`).join("")}<h2>Source and model boundaries</h2>${limits()}<h2>Provenance and reuse</h2>${["sources/NOTICE.txt", "sources/provenance.json", "sources/CC-BY-SA-4.0.txt", "fonts/OFL.txt", "LICENSE.txt"].map((path) => `<details><summary>${esc(path)}</summary><pre>${esc(new TextDecoder().decode(loaded.get(path)))}</pre></details>`).join("")}<p>Retained files below are the checked bytes used in this reading.</p><ul>${assets
    .filter((a) => a.path.endsWith(".xml"))
    .map(
      (a) =>
        `<li><a download="${esc(a.path.split("/").at(-1))}" href="${data(a.path)}">${esc(a.path)} · ${a.sha256}</a></li>`,
    )
    .join(
      "",
    )}</ul><details><summary>Actual embedded source and font inventory</summary><pre>${esc(JSON.stringify(assets, null, 2))}</pre></details></body></html>`;
}
