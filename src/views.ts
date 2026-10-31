import { readings, scope } from "./content/readings";
import sections from "./content/sections.json";
import { account, type Voyage } from "./core/model";
import { day, esc, money } from "./html";
export function ledger(v: Voyage): string {
  const a = account(v);
  return `<table class="ledger"><caption>Conditional account · drachmas of silver</caption><tbody>
  <tr><th scope="row">Principal <a href="#read-rate">§10</a></th><td>3,000</td></tr>
  <tr><th scope="row">Voyage interest <a href="#read-rate">§10</a><small>${a.perThousand === null ? "Rate needs more evidence" : `${a.perThousand} per thousand × 3`}</small></th><td>${money(a.interest)}</td></tr>
  <tr><th scope="row">Allowed deduction <a href="#read-loss">§11</a><small>${v.loss === "none" ? "No loss selected" : v.loss === "ordinary" ? "Other losses are not deducted" : v.loss === "jettison" && !v.consent ? "No shared decision: exception not met" : "Entered valuation assumed allowable"}</small></th><td>${a.debt === null ? "Withheld" : `− ${money(a.deduction)}`}</td></tr>
  <tr class="total"><th scope="row">${a.stage === "released" ? "Amount repaid in full" : "Debt before repayment"}</th><td>${money(a.debt)}</td></tr>
  ${a.stage === "released" ? `<tr><th scope="row">Balance after full repayment</th><td>0</td></tr>` : ""}
  </tbody></table><p class="account-reason">${esc(a.reason)}</p>
  ${a.conflicts.length ? `<div class="conflict"><strong>Terms contradicted</strong>${a.conflicts.map((c) => `<p>${esc(c)}</p>`).join("")}<p>The numbers remain a conditional reading. They are not a verdict on this altered voyage.</p></div>` : ""}`;
}
export function collection(v: Voyage): string {
  const a = account(v);
  if (a.stage !== "default")
    return `<p>${esc(a.security)}</p><p>${a.stage === "outside" ? "Ordinary default sale and shortfall are not calculated for this branch." : a.stage === "released" ? "The full modeled debt has been paid. No default sale is applied." : `Day ${v.days} after arrival: the selected twenty-day interval has not elapsed. Try day 21.`}</p>`;
  const width = (100 * (a.fromSale ?? 0)) / (a.debt ?? 1);
  return `<p>${esc(a.security)}</p><div class="collection-bar" role="img" aria-label="${money(a.fromSale)} from the sale, ${money(a.deficiency)} still claimable"><span style="width:${width}%"></span></div>
  <dl class="collection-numbers"><div><dt>Applied from sale</dt><dd>${money(a.fromSale)}</dd></div><div><dt>Shortfall still claimable</dt><dd>${money(a.deficiency)}</dd></div></dl>
  <p>Assumed sale proceeds: ${money(v.sale)}. ${v.sale > (a.debt ?? 0) ? "The sale covers the modeled debt. This selected clause does not allocate the excess." : "§12 extends collection of the shortfall to other property on land and sea. Actual recovery is unknown."}</p>`;
}
export const rows = (v: Voyage): [string, string][] => {
  const a = account(v);
  return [
    ["Departure from Pontus", day(v.departure)],
    ["Arrival at Athens", day(v.arrival)],
    ["Days after arrival", String(v.days)],
    ["Branch", `${v.route}; ${v.outcome}`],
    ["Loss", `${v.loss}; assumed ${v.lossAmount}; shared decision ${v.consent}`],
    ["Rate per thousand", money(a.perThousand)],
    ["Voyage interest", money(a.interest)],
    [
      "Allowed deduction (safe-return branch only)",
      a.debt === null ? "Withheld" : money(a.deduction),
    ],
    ["Debt before repayment", money(a.debt)],
    ["Repaid in full", String(v.paid)],
    ["Balance", money(a.balance)],
    ["Security", a.security],
    ["Assumed default sale proceeds", money(v.sale)],
    ["Shortfall after default sale", money(a.deficiency)],
    ["Other loan on security", String(v.otherPledge)],
    ["Same return vessel", String(v.sameVessel)],
    ["Terms contradicted", a.conflicts.join(" ") || "None of the selected terms flagged"],
  ];
};
export function comparison(current: Voyage, pinned: Voyage | null): string {
  if (!pinned)
    return "<p>Keep this voyage, then change one fact. The earlier account keeps its own facts.</p>";
  const then = rows(pinned),
    now = rows(current);
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="Pinned and current voyage comparison"><table class="comparison"><caption>Earlier facts stay fixed when the current voyage changes.</caption><thead><tr><th scope="col">Fact / consequence</th><th scope="col">Kept voyage</th><th scope="col">Current voyage</th></tr></thead><tbody>${then.map(([label, val], i) => `<tr class="${val !== now[i]?.[1] ? "changed" : ""}"><th scope="row">${esc(label)}</th><td>${esc(val)}</td><td>${esc(now[i]?.[1])}</td></tr>`).join("")}</tbody></table></div>`;
}
export function readingHtml(id: string): string {
  const r = readings.find((r) => r.id === id) ?? readings[0];
  if (!r) return "";
  return `<p class="eyebrow">[Demosthenes] · ${r.section} · Rennie p. ${r.page}</p><h3>${esc(r.title)}</h3><p class="greek" lang="grc">${esc(r.greek)}</p><p class="translation">${esc(r.english)}</p><p>${esc(r.note)}</p><dl class="words">${r.words.map(([form, meaning, work]) => `<div><dt lang="grc">${esc(form)}</dt><dd><strong>${esc(meaning)}</strong> ${esc(work)}</dd></div>`).join("")}</dl>`;
}
export function completeGreek(): string {
  return sections
    .map((s) => `<p><b>35.${s.section}.</b> <span lang="grc">${esc(s.greek)}</span></p>`)
    .join("");
}
export function limits(): string {
  return `<p>${esc(scope)}</p><p>The numerical realization subtracts the assumed allowed loss from 3,000 plus 675 or 900; it does not value historical goods. All days, sale prices and changed voyage facts are modern inputs. No annualization, compounding, partial payment, procedural judgment, creditor priority or guaranteed collection is modeled. Unfulfilled cargo terms are flagged without invented penalties.</p>`;
}
