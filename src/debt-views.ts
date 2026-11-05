import { checkDebt, possibleAccounts } from "./core/debt-claim";
import { type DebtClaim, sameVoyage, type Voyage } from "./core/model";
import { day, esc, money } from "./html";

export function departureEvidence(v: Voyage, interactive = false, heading: 3 | 4 | 5 = 4): string {
  if (v.route !== "pontus" || v.outcome !== "safe") {
    const a = possibleAccounts(v)[0]?.account;
    return `<div class="departure-evidence"><p class="eyebrow">Outside the ordinary safe-return account</p><p>${esc(a?.reason)}</p><p>No ordinary debt alternatives are inferred for this branch. A missing amount is not zero.</p><a href="#read-exception">Read the separate provision · §13</a></div>`;
  }
  const cases = possibleAccounts(v);
  if (v.departure !== null) {
    const a = cases[0]?.account;
    return `<div class="departure-evidence"><p>Departure supplied: <b>${esc(day(v.departure))}</b>. This fixes the ${money(a?.perThousand ?? null)}-per-thousand rate in §10. Withhold it to test what arrival alone can establish.</p><p><a href="#read-rate">Read the departure condition · §10</a></p></div>`;
  }
  return `<div class="departure-evidence"><p class="eyebrow">${v.departure === null ? "Missing departure / complete alternatives" : "Departure supplied / one account"}</p>
  <p>${v.departure === null ? `Arrival is ${esc(day(v.arrival))}. Departure must be earlier. ${cases.length === 1 ? "That excludes every after-Arcturus departure; the exact sailing date is still unknown." : "Both sides of Arcturus remain possible. A later arrival does not establish a late departure."}` : `Departure is ${esc(day(v.departure))}; no other departure is substituted.`}</p>
  <div class="departure-cases">${cases.map(({ departure: d, account: a }) => `<article class="departure-case"><h${heading}>${d.rate === 225 ? "On or before Arcturus" : "After Arcturus"}</h${heading}><p class="case-days">${d.first === d.last ? `Day ${d.first}` : `Days ${d.first} to ${d.last}`} <span>relative to Arcturus</span></p><p class="case-debt">${money(a.debt)} <span>${a.debt === null ? "ordinary debt withheld" : "drachmas before repayment"}</span></p><p>${d.rate} per thousand; ${money(a.interest)} interest.${a.debt !== null ? ` Deduction ${money(a.deduction)}.` : ` ${esc(a.reason)}`}</p>${a.deficiency !== null ? `<p>After an assumed sale of ${money(v.sale)}: ${money(a.deficiency)} still claimable (§12).</p>` : ""}${interactive && v.departure === null ? `<button type="button" data-departure-witness="${d.witness}">Keep evidence & try day ${d.witness}</button>` : ""}</article>`).join("")}</div>
  <p class="hint">Whole-day teaching model: departures −30 to +40; arrival strictly later; day 0 is not “after”. These ranges partition every permitted departure. They supply neither a travel-time estimate nor probabilities. ${cases.length > 1 ? "The two debt amounts are alternatives; amounts between them do not follow." : ""} </p><p><a href="#read-rate">Read “if they sail out after Arcturus” · §10</a> · <a href="#read-loss">Read allowed deductions · §11</a></p></div>`;
}

const verdicts = {
  forced: [
    "Follows from these model facts",
    "Every permitted departure gives this debt before repayment. This does not authenticate the facts or decide a lawsuit.",
  ],
  possible: [
    "Possible, but not established",
    "One permitted departure gives this debt; another gives a different debt. Evidence of which side of Arcturus the departure falls on would settle this rate difference.",
  ],
  excluded: [
    "No permitted departure gives this debt",
    "The proposed amount is absent from the complete set of modeled debts. An amount between two possible debts is not another possible debt.",
  ],
  outside: [
    "This model cannot test that amount",
    "This branch withholds ordinary safe-return debt arithmetic. A withheld amount is neither zero nor a refutation of the proposal. Read the separate loss or Hellespont provision.",
  ],
} as const;

export function debtClaimHtml(
  claim: DebtClaim | null,
  current?: Voyage,
  heading: 3 | 4 = 4,
): string {
  if (!claim)
    return "<p>No checked proposal yet. Enter a debt before repayment, then keep your check with the current voyage facts.</p>";
  const result = checkDebt(claim);
  const [title, reason] = verdicts[result.verdict];
  const changed = current && !sameVoyage(current, claim.voyage);
  return `<article class="debt-check" data-verdict="${result.verdict}"><p class="eyebrow">Kept check${changed ? " / earlier facts" : ""}</p><h${heading}>${esc(title)}</h${heading}><p>Proposed debt: <b>${money(claim.amount)} drachmas</b>. ${result.debts.length ? `Permitted debts: <b>${result.debts.map(money).join(" or ")}</b>.` : "Ordinary debt withheld."}</p><p>${esc(reason)}</p>${changed ? "<p><b>The voyage has changed.</b> This check keeps its earlier facts. Check again to replace it.</p>" : ""}<details><summary>Facts and alternatives kept with this check</summary><dl class="claim-facts"><div><dt>Departure / arrival</dt><dd>${esc(day(claim.voyage.departure))} / ${esc(day(claim.voyage.arrival))}</dd></div><div><dt>Loss / assumed value / common vote</dt><dd>${esc(claim.voyage.loss)} / ${money(claim.voyage.lossAmount)} / ${claim.voyage.consent ? "yes" : "no"}</dd></div><div><dt>Route / outcome</dt><dd>${esc(claim.voyage.route)} / ${esc(claim.voyage.outcome)}</dd></div></dl>${departureEvidence(claim.voyage, false, heading === 3 ? 4 : 5)}</details>${result.cases[0]?.account.conflicts.length ? `<p class="conflict">${result.cases[0].account.conflicts.map(esc).join(" ")}</p>` : ""}</article>`;
}
