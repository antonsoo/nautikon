import { asData } from "./assets";
import { retainedBundle } from "./bundle";
import { evidenceScope, testimonyReadings } from "./content/testimony";
import sections from "./content/testimony-sections.json";
import {
  type Attempt,
  bounds,
  claims,
  type EvidenceNotebook,
  fits,
  selectedNames,
} from "./core/testimony";
import { esc, money } from "./html";
import { readingHtml } from "./views";
export function inference(a: Attempt): string {
  const b = bounds(a.selected),
    exact = b.claim === "exact",
    upper = b.claim === "upper";
  return `<p class="result-number">${exact ? "450" : upper ? "0–499" : "No upper bound"}<span>${exact ? "jars, if the selected report is true" : upper ? "whole-jar counts fit the allegation" : "from the selected descriptive reports"}</span></p><p>${exact ? "The selected deposition gives an exact count. The speaker’s looser allegation, if also selected, agrees with it." : upper ? "450 and 499 both fit. The wording does not choose between them. At 500, the allegation no longer fits." : "No descriptive report is selected. The contract still specifies 3,000 jars as security, but that requirement does not establish how many were loaded."}</p><p>${exact ? "This is 2,550 jars fewer than the contractual 3,000." : upper ? "Every count fitting this allegation is at least 2,501 jars fewer than the contractual 3,000." : "3,000 is possible within this unconstrained reading, along with many other counts."} These are differences in jar counts, not drachma deductions or a court’s damages.</p>`;
}
export function countDiagram(a: Attempt): string {
  const b = bounds(a.selected),
    x = (n: number) => 100 + (n / 3500) * 1000;
  const desc = `Selected reports: ${selectedNames(a.selected)}. ${claims[b.claim]}. Proposed ${a.candidate} jars ${fits(a.selected, a.candidate) ? "fits" : "does not fit"}. The contract requires 3,000 jars; this is a requirement, not an observed count. The drawing window is 0 to 3,500, not an upper bound on unconstrained counts.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 330" role="img" aria-label="${esc(desc)}"><rect width="1200" height="330" fill="#f8f3e7"/><g font-family="Georgia,serif" fill="#173b4b" font-size="20"><text x="100" y="32">What counts fit the selected reports?</text><text x="100" y="67" font-size="17">Whole jars · drawing window 0–3,500 · no probability or credibility weighting</text><path d="M100 225H1100" stroke="#a6b0ab"/>${[0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map((n) => `<path d="M${x(n)} 220v10" stroke="#173b4b"/><text x="${x(n)}" y="255" text-anchor="middle" font-size="17">${money(n)}</text>`).join("")}<rect x="${x(b.min)}" y="105" width="${b.max === null ? 1000 : Math.max(4, x(b.max) - x(b.min))}" height="48" fill="#173b4b" opacity=".18"/>${b.max === null ? '<path d="M1095 105l25 24-25 24" fill="none" stroke="#173b4b"/>' : ""}<text x="100" y="95" font-size="17">${esc(claims[b.claim])}</text><path d="M${x(3000)} 110v105" stroke="#a53523" stroke-width="2" stroke-dasharray="5 4"/><text x="${x(3000)}" y="95" text-anchor="middle" font-size="17">3,000 required</text><circle cx="${x(a.candidate)}" cy="195" r="8" fill="${fits(a.selected, a.candidate) ? "#173b4b" : "#a53523"}"/><text x="100" y="300">Proposed ${money(a.candidate)} jars: ${fits(a.selected, a.candidate) ? "fits the selected reports" : "does not fit the selected reports"}.</text></g></svg>`;
}
export function checkedView(a: Attempt | null): string {
  if (!a) return "<p>No check kept yet. Choose your strongest conclusion, then check it.</p>";
  const right = a.claim === bounds(a.selected).claim;
  return `<h3>${right ? "Your strongest conclusion follows." : "Your strongest conclusion needs revision."}</h3><p><b>Reports used:</b> ${esc(selectedNames(a.selected))}.</p><p><b>You chose:</b> ${esc(claims[a.claim])}.</p><p><b>Strongest supported conclusion:</b> ${esc(claims[bounds(a.selected).claim])}.</p><p>${a.claim === "exact" && bounds(a.selected).claim === "upper" ? "Counterexample: 499 satisfies ‘not even 500,’ so that wording alone cannot force 450." : "This checks logical consequence under the selected count statements; it does not verify that those reports are true."}</p><p>Your proposed ${money(a.candidate)} jars ${fits(a.selected, a.candidate) ? "fits" : "does not fit"} those reports. This kept check retains its original reports and proposed count when the current controls change.</p>`;
}
export const evidenceContext = () =>
  sections
    .map((s) => `<p><b>35.${s.section}.</b> <span lang="grc">${esc(s.greek)}</span></p>`)
    .join("");
export function evidenceCsv(n: EvidenceNotebook): string {
  const rows: string[][] = [
    [
      "record",
      "reports selected",
      "proposed jars",
      "fits reports",
      "chosen conclusion",
      "strongest supported conclusion",
      "scope",
    ],
  ];
  for (const [label, a] of [
    ["current", n],
    ["kept check", n.checked],
  ] as const)
    if (a)
      rows.push([
        label,
        selectedNames(a.selected),
        String(a.candidate),
        String(fits(a.selected, a.candidate)),
        claims[a.claim],
        claims[bounds(a.selected).claim],
        "Conditional count inference; not historical verification, money or a verdict",
      ]);
  return `${rows.map((row) => row.map((s) => `"${s.replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}
export async function evidenceReading(n: EvidenceNotebook, signal: AbortSignal): Promise<string> {
  const bundle = await retainedBundle(signal);
  const data = (s: string, mime: string) => asData(new TextEncoder().encode(s), mime);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'"><title>Nautikon · testimony reading</title><style>${bundle.font}*{box-sizing:border-box}body{max-width:60rem;margin:2rem auto;padding:0 1.2rem;background:#f8f3e7;color:#173b4b;font:20px/1.55 Gentium,Georgia,serif}h1{font-size:3rem;line-height:1.1}h2{margin-top:3rem}a{color:#913322;overflow-wrap:anywhere}.greek{font-size:1.5rem}.note,pre{white-space:pre-wrap;overflow-wrap:anywhere}pre{font:15px/1.5 monospace}svg{width:100%;height:auto}.source img{width:100%;height:auto}.words div{break-inside:avoid;padding:.6rem;border-top:1px solid #acb3ad}.words dd{margin:0}.result-number{font-size:2rem}.result-number span{display:block;font-size:1rem}nav{display:flex;flex-wrap:wrap;gap:1rem}@media print{body{background:white;font-size:12pt}.downloads{display:none}.source{break-before:page}.source img{max-height:240mm;object-fit:contain}h2,h3{break-after:avoid}.greek{font-size:15pt}}</style></head><body><p>NAUTIKON · TESTIMONY READING · ${__EDITION__}</p><h1>“Not even 500” is not an exact count.</h1><p>${esc(evidenceScope)}</p><h2>Current inference</h2><p>Selected: ${esc(selectedNames(n.selected))}.</p>${countDiagram(n)}${inference(n)}<p>Proposed ${money(n.candidate)} jars ${fits(n.selected, n.candidate) ? "fits" : "does not fit"} the selected reports. Your current conclusion: ${esc(claims[n.claim])}.</p><h2>Kept check</h2>${checkedView(n.checked)}<h2>Learner’s explanation</h2><p class="note">${esc(n.note || "No note entered.")}</p><nav class="downloads"><a download="nautikon-testimony.json" href="${data(JSON.stringify(n, null, 2), "application/json")}">Editable testimony notebook</a><a download="nautikon-testimony.csv" href="${data(evidenceCsv(n), "text/csv")}">Inference CSV</a></nav><h2>Greek readings and word notes</h2>${testimonyReadings.map((r) => `<article>${readingHtml(r.id, testimonyReadings)}</article>`).join("")}<h2>Complete Greek context · 35.18–22</h2>${evidenceContext()}${bundle.appendix}</body></html>`;
}
