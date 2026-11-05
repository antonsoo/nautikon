# From transmitted wording to a conditional account

The workshop operates selected clauses of the agreement in _Against Lacritus_,
35.10–13. The brackets in **[Demosthenes]** avoid resolving attribution. The
agreement is transmitted inside a speech. A printed document embedded in that
transmission is not evidence that a surviving original contract has been found,
nor does the speaker’s account establish that the voyage happened as alleged.
The source and controls do not decide the lawsuit against Lacritus.

## Concordance

| Source                                              | Printed location    | Workshop consequence                   | Added assumption / limit                                                 |
| --------------------------------------------------- | ------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| 35.10, 3,000 silver drachmas                        | p. 107, lines 19–21 | Fixed principal                        | No modern currency conversion                                            |
| 35.10, 225 / 300 per thousand                       | p. 107, lines 23–25 | Interest 675 / 900                     | The rate is for this voyage, without compounding                         |
| 35.10, μετʼ Ἀρκτοῦρον ἐκπλεύσωσιν                   | p. 107, line 24     | Departure controls higher rate         | Illustrative star-relative whole days; day 0 is not “after”              |
| 35.10, wine jars                                    | pp. 107–108         | Outward security                       | A count is not a price; no jar volume is supplied                        |
| 35.11, no other loan, same vessel, all return cargo | p. 108, lines 1–4   | Cargo sequence and contradiction flags | No penalty, priority or finding of liability derived                     |
| 35.11, safe arrival, twenty days                    | p. 108, lines 4–7   | Separate repayment interval            | Elapsed-day teaching convention: day 20 inside, day 21 beyond            |
| 35.11, jettison voted jointly; enemies              | p. 108, lines 7–9   | Selected deduction categories          | Entered valuation assumed allowable; subtract from gross debt; one event |
| 35.11, security held until repayment                | p. 108, lines 9–11  | Retained / released security           | Full payment only                                                        |
| 35.12, sale and shortfall                           | p. 108, lines 11–18 | Conditional collection after default   | Invented proceeds; no assured recovery or rule for surplus               |
| 35.13, Hellespont and “last year”                   | p. 108, lines 18–22 | Ordinary rate withheld                 | Full conditions and cross-reference not resolved by this bench           |
| 35.13, ship irreparable, security survives          | p. 108, lines 22–24 | Survivors jointly to lenders           | Ordinary safe-return debt and shortfall withheld                         |

Line locations were visually checked against whole pages; the page images
retain their printed apparatus. The body of §10 starts on p. 107, concludes
with Hyblesius’s name on p. 108, and then §11 begins. The complete source context
extends through §14 on p. 109. Title and imprint visibly identify Rennie and
1921/1926/1939; the actual copy is the reprint. Page numbers follow the Archive scan’s `pageNumber` labels, separately checked
against its scan metadata. They are distinct from the bracketed older text
reference visible in the margin; see the retained pagination receipt.

## Wording and translation

Selected Greek excerpts are exact substrings of the retained Perseus Rennie
text after whitespace normalization. The generated six complete sections use
the same text. `verify:sources` checks both relationships, as well as every
retained byte identity. The apparatus records textual variants; this exercise
selects the electronic text’s reading without collapsing those variants into
a supposedly certain original document.

English and vocabulary notes are newly written. Murray’s English was consulted
and is retained unchanged, with its notes, as a distinct comparison source.
Its Hellespont note interprets “last year” using the legal year; that explanation
is not silently substituted for the Greek’s unresolved reference. The live
viewer, source notice and exported reading keep this distinction visible.

The loss amount is a modern input. The Greek sets the exceptions, not a
valuation algorithm. Subtracting the entered value from principal plus voyage
interest is this workshop’s numerical realization. It does not establish an
ancient method for valuing jettison or allocating all parties’ losses.

## Why no automatic shipwreck answer?

The safe-return repayment condition and the salvage provision are different
branches. In the salvage branch the transmitted text says what happens to
surviving security. The workshop does not carry the ordinary safe-return
collection equation into that branch or award an automatic zero judgment for
a claimed total loss. That would require assessing facts, other terms and
arguments outside this selected model.

## Why keep two accounts?

Arrival, departure, payment, cargo value and custody are separate facts. A kept
voyage is a deep copy of its inputs, with its own account recomputed from those
inputs. It remains visible when the current voyage changes branch or loses
departure evidence. JSON stores inputs, not a mutable precomputed answer. Imports
validate the entire notebook before replacing the current work. Notes are text,
never interpreted as HTML.

## Provenance

See the pinned electronic-text commit and scan URLs in
[`public/sources/provenance.json`](../public/sources/provenance.json), the
[`NOTICE`](../public/sources/NOTICE.txt), and the
[`asset inventory`](../src/asset-manifest.json). This record establishes which
sources the workshop uses. The reproduction scripts and checks do not resolve
contract authenticity, historical dating of the alleged voyage or philological
questions independently.

## Cargo testimony: requirement, upper bound, exact report

The second bench (`testimony.html`) holds three kinds of statement apart.
The contract's 3,000 jars is a normative specification, not a descriptive
measurement to conjoin with testimony as if it were another observation.

| Words retained                                        | Printed location                                  | Conditional count consequence             | What remains unproved                        |
| ----------------------------------------------------- | ------------------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| 35.10, ἐπὶ οἴνου κεραμίοις Μενδαίοις τρισχιλίοις      | p. 107, lines 25–26                               | Contractual outward security: 3,000 jars  | Actual loading and jar price                 |
| 35.19, οὐδὲ πεντακόσια κεράμια                        | p. 110, lines 15–16                               | Literal whole-count interpretation: 0–499 | An exact count of 450                        |
| 35.20, Erasikles: τετρακόσια πεντήκοντα, καὶ οὐ πλείω | p. 110, lines 24–27                               | If taken at face value: exactly 450       | Reliability and authenticity                 |
| 35.20, Hippias: τετρακόσια πεντήκοντα                 | p. 110, lines 29–30, continuing p. 111, lines 1–3 | If taken at face value: exactly 450       | Independent observation or added probability |

The two full-page JPEGs were fetched from their Archive leaf URLs and visually
read. The `Hippias` excerpt belongs to a sentence starting at the bottom of
p. 110; p. 111 alone omits its attribution. Complete electronic §§18–22
retain this surrounding argument and the deposition's continuation.

Nonnegative whole counts and the 0–3,500 drawing window are modern instructional
choices. No upper bound is inferred when no descriptive report is selected.
With the speaker alone, 499 is a counterexample to an exact-450 inference.
Selecting either attributed deposition reduces the fitting counts to 450. This
is consequence under premises, not evidence that the premises are historically
true. No credibility score or probability is invented. A 2,550-jar difference
from the requirement is not a monetary deduction from a 3,000-drachma loan.

A kept check stores its selected reports, proposed count and learner conclusion.
It is recomputed from those preserved inputs, rather than replaced by later
controls or an imported precomputed grade. Testimony and voyage JSON have
separate schemas; neither silently reinterprets the other's notebook.

## Withheld departure and complete alternatives

The [missing-evidence extension](departure-review.md) constrains an unknown
departure by the known arrival and the existing whole-day input domain. It
partitions all permitted departures at Arcturus, computes each conditional debt,
and tests a learner's proposed debt against the resulting discrete set. An early
arrival can force the lower rate without supplying an exact departure. An
exceptional route or unsafe-return branch withholds arithmetic rather than
refuting every proposal. The completeness claim concerns this modern finite
model, not historical voyage possibilities or a court's decision.
