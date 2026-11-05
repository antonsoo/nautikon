# A missing departure still has constraints

This change makes an existing sea-loan investigation answer a question its earlier
account could not: **what can a known arrival establish when departure is missing?**
It adds an operable debt proposal and preserves its original evidence through
later edits, native downloads and offline reopening. This work is local; the
published site and remote branches have not been changed.

## Reproduce the earlier gap

Before this change, from the repository root:

```sh
node --import tsx -e 'import {account,initial} from "./src/core/model.ts"; console.log(account({...initial,departure:null,arrival:-5}))'
```

The earlier account returned `perThousand: null`, `debt: null` and a reason that
said arrival after Arcturus could not choose the rate. The selected arrival was
five days **before** Arcturus. Every permitted departure precedes that arrival;
none qualifies as after Arcturus. The current account returns 225 per thousand,
675 interest and 3,675 debt, while preserving `departure: null`. Its reason
explains the inference and does not claim an exact date was recovered.

## Read the premise before doing the arithmetic

The numerical contract is transmitted in [Demosthenes], _Against Lacritus_
35.10–13, inside a partisan speech. On the retained Rennie p. 107, lines 23–25,
§10 states 225 per thousand and then 300 per thousand conditional on sailing
out of Pontus towards Hieron after Arcturus. The verb is a departure verb.
Page 108, §11, lines 7–9, gives the jettison-with-common-vote and payment-to-enemies
exceptions. Section 12 keeps a shortfall claim after sale of the security.

For this review I inspected the actual complete local p. 107 and p. 108 images,
including the apparatus, and opened the independently hosted
[pinned Perseus XML](https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/70427323b61267cdcd0256b9b02009c23392de07/data/tlg0014/tlg035/tlg0014.tlg035.perseus-grc2.xml).
The photographed copy is the retained reprint described in the
[source concordance](source-and-model.md). No new historical text or source image
was added. `npm run verify:sources` checks the actual 18 retained-file identities
and the existing Greek excerpts against the full electronic sections. This byte
check does not replace reading the scans.

Chronological order, finite day bounds, the subtraction of an assumed allowable
loss, and the proposal test are modern instructional premises. The source does
not specify these input ranges, a minimum journey duration, or a probability
distribution for departure dates. This is neither a historical calendar nor a
finding that a voyage or a document is authentic.

## Why the alternatives are complete

Let `a` be arrival and `d` departure, in the workshop's whole days relative to
Arcturus. The input domain permits `-30 <= d <= 40`, with `d < a`. Therefore a
missing departure belongs to the integer interval:

```text
D = [-30, min(40, a - 1)]

D
+-- d <= 0: 225 per thousand -> 675 interest
+-- d >= 1: 300 per thousand -> 900 interest
```

Every integer belongs to exactly one side of this split. The higher-rate side
exists only if `a >= 2`. Within either side, all the selected non-departure
facts stay fixed, so the conditional account is constant. One representative
from each nonempty side suffices for the account arithmetic. The UI displays
the whole range, rather than pretending the representative is evidence of the
actual departure.

| Fixed facts, departure withheld             | Permitted debt before repayment | Proposal | Result                    |
| ------------------------------------------- | ------------------------------- | -------- | ------------------------- |
| Arrival +25, no deduction                   | 3,675 or 3,900                  | 3,675    | Possible, not established |
| Arrival +25, no deduction                   | 3,675 or 3,900                  | 3,800    | Excluded                  |
| Arrival -5, no deduction                    | 3,675                           | 3,675    | Follows in this model     |
| Arrival +1, no deduction                    | 3,675                           | 3,900    | Excluded under whole days |
| Arrival +2, no deduction                    | 3,675 or 3,900                  | 3,900    | Possible under whole days |
| Arrival +25, agreed jettison valued at 300  | 3,375 or 3,600                  | 3,675    | Excluded                  |
| Hellespont exception, total loss or salvage | Withheld                        | 0        | Outside this debt test    |

Possible amounts are a discrete set. No interpolation, expected value or
confidence level is supplied. A full payment makes the balance zero while the
debt before repayment keeps its amount. A sale price is also not the debt.
Cargo-term contradictions remain visible without invented penalties or priority.

## Operate the investigation

```sh
npm ci
npm run check
npm run dev
```

Open `http://127.0.0.1:4402/nautikon/#evidence`.
1. Use **Withhold departure**. Arrival stays +25. Check the proposed debt 3,675:
   it is possible, but not established. Try 3,800: it is excluded.
2. Set arrival to -5. The ledger now gives 3,675 without filling in departure.
   The kept check keeps its earlier facts. Check 3,675 again to replace it.
3. Try arrivals +1 and +2. The high-rate branch appears only at +2 in the stated
   whole-day model. This boundary is a teaching convention, not travel evidence.
4. Return arrival to +25. **Keep evidence & try day 1** pins the unknown-departure
   facts and substitutes a hypothetical departure in the current voyage. The
   comparison retains the two earlier possible amounts. Withhold departure again.
5. Change the selected loss to jettison, keep the assumed value at 300, then
   remove the common vote. Inspect the changed alternatives and read §11.
6. Save JSON, CSV and the illustrated reading. Change the voyage, then reopen
   JSON. Open the HTML directly as a local file. It carries the checked proposal,
   all readings, all seven printed pages, fonts, attribution and editable JSON.

Only the **checked** proposal travels in downloads. An unchecked amount is
explicitly labeled as a draft. Amount input refuses blank, fractional, negative
and oversized values without replacing the earlier check. Notes are escaped.
There is no autosave.

## Notebook compatibility

Version 2 adds `claim: null | {amount, voyage}` to the existing voyage notebook.
The claim contains a complete independent copy of its original facts; it never
references the mutable current voyage. The import boundary checks every field
and rejects an injected verdict, unknown fields, non-integer amounts and invalid
claim voyages before replacing current work. Verdicts are derived from facts.

Version 1 is accepted and explicitly migrated to version 2 with `claim: null`.
Old facts are recalculated under the corrected model, and the migration message
says so. The older published app cannot open version 2 until this local change
is deployed. Downloaded illustrated readings remain independent of that site.
Editing a proposal during a delayed import prevents the import from replacing
the draft or notebook. Voyage comparisons ignore JSON field insertion order.

## Verification receipts

The [browser receipt](departure-review.json) pins the exact production edition
and every built file's SHA-256. It records four full journeys: Chromium and
Firefox at 1440 and 375 pixels. Screenshots are actual operated output:
[desktop](assets/departure-desktop.png) and [phone](assets/departure-phone.png).
The layout retains the marine-ink dossier, ruled alternatives and readable
Greek; phone alternatives stack vertically with every action retained.

The new browser journey checks all four verdicts, amount validation, a fixed
check surviving later edits, keyboard activation of a departure example, loss
qualification and shortfall, the +1/+2 boundary, Greek-source navigation,
version-1 migration, invalid imports, delayed-import draft preservation, native
JSON/CSV/HTML downloads, embedded JSON reopening, a scriptless local reading
with zero network requests, and reload/export while browser networking is off.
Its accessibility scan reports no axe violations in those operated states.

The independent Python checker enumerates raw permitted days without importing
the TypeScript partition. It uses exact fractions for the accounts and checks
4,416 accounts and 39,744 debt proposals. The unit suite has 20 cases, including
complete agreement of the partition with raw day enumeration at all 120 arrival
settings. These support the finite calculation, not a claim about historical
sailing, document authenticity or litigation.

```sh
npm run verify:sources
npm run verify:model
npm run test:departure
npm run test:browser
npm run test:testimony
```

A fresh source snapshot was copied to an isolated temporary directory without
`node_modules` or build output. `npm ci`, `npm run check`, `npm run verify:sources`
and `npm run verify:model` passed there. `diff -qr` found no byte differences
between that clean build and the reviewed production output. The current receipt
also includes the original voyage and testimony suites' four journeys each,
verified against the same complete build identity: twelve journeys altogether.
The printed sample was inspected, including the kept facts and alternatives;
its sixteen-page browser PDF is tagged and contains no JavaScript.

The existing voyage browser suite separately checks the original workshop,
source images and actual export bytes, an unavailable origin, browser-offline
reloads, and two-tab cache damage/repair. The testimony room retains its separate
notebook schema and source-inference workflow. No public deployment or remote
CI result is claimed. Production build: **`npm run build`**, output **`dist/`**,
base **`/nautikon/`**.

Suggested repository description: **Read an Athenian sea-loan contract; test
which debts follow from incomplete voyage evidence.** Topics: `ancient-greek`,
`legal-history`, `demosthenes`, `interactive-learning`, `economic-history`,
`offline-first`.
