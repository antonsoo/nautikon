# Nautikon audit and source review — 2026-10-31

Nautikon now has two operated readings: a sea-loan account, and a cargo-testimony
bench that separates a contractual requirement, an upper-bound allegation and
an attributed exact-count report. [Publication evidence](publication.md) records
remote source, clean-build, hosted-byte and public-browser boundaries separately.

## Try the actual work

With Node 24 or later:

```sh
npm ci
npm run check
npm run preview
```

Open `http://127.0.0.1:4401/nautikon/`.
1. **Keep this voyage.** Change arrival to 55 days after Arcturus: interest
   remains **675**. Move departure to one day after Arcturus: interest becomes
   **900**, debt **3,900**. The kept voyage still has **3,675**.
2. Select **A missing departure**. Arrival remains known; rate and debt become
   undetermined. Follow ἐκπλεύσωσιν back to §10 and the checked whole source page.
3. Select **The same 300 lost**. Spoilage gives no deduction. Jettison with a
   shared vote gives **300**; removing the vote removes that deduction.
4. Select **A cargo worth less**. Day 21 and assumed sale proceeds of **2,000**
   leave **1,675** claimable under §12. Day 20 is still inside the declared
   modern elapsed-day interval. Full repayment releases the security.
5. Try the Hellespont exception and surviving security after irreparable ship
   damage. Each withholds ordinary safe-return arithmetic and retains its own
   source explanation.
6. Open `testimony.html`. With only **Speaker · §19** selected, check the
   conclusion **Exactly 450 jars**. The counterexample is **499**, which also
   fits οὐδὲ πεντακόσια. Try 500: it does not fit.
7. Select **Erasikles · §20**. Current inference becomes exactly **450**, if
   that report is true. The earlier kept check retains the speaker alone.
   Select Hippias, then remove both depositions: observe which premise changed
   the conclusion. No report selected means no inferred upper bound.
8. Read Hippias’s deposition on pp. 110–111. Enlarge and keyboard-pan both
   checked scans. The requirement’s 3,000-jar phrase is on **p. 107, lines 25–26**.
   Complete §§18–22 preserve the surrounding argument.
9. Add an explanation; save JSON, CSV, SVG and an illustrated reading from
   either lesson. Reopen the scriptless reading offline, use its embedded JSON
   download, and restore the original current and kept inputs.

These are conditional readings. A report being selected does not establish its
historical truth, authenticity or credibility. Jars are not drachmas. No verdict,
damages, creditor priority or probability is supplied.

## What the audit actually repaired

| Reproduced before the change                                                                               | Result after the change                                                          | Evidence                                                     |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Enum arrays such as `["pontus"]` passed string-coerced validation while the account and dropdown disagreed | Enum fields require scalar strings; import is atomic                             | Core cases; actual invalid-file imports                      |
| An earlier slow file overwrote a newer file or a later typed note                                          | Only the latest import can replace unchanged work                                | Two browser engines, overlapping reads and intervening edits |
| Repeated JSON names silently chose the last departure                                                      | Repeated keys, including escaped spellings, are refused                          | JSON reader; native file imports                             |
| The ship SVG described the same vessel after the learner changed vessel                                    | Accessible description and visible caption follow the selected fact              | Actual operated checkbox and SVG text                        |
| A 2,000-character unbroken note widened a 375-px saved reading to over 23,000 px                           | Notes and long source-download links wrap; document stays 375 px                 | Before/after observations                                    |
| Denied clipboard access printed a long unbroken URL across the live page                                   | A bounded, selected, keyboard-copyable URL field appears                         | Actual rejected clipboard promise at 375 px                  |
| Failed registration reverted to an endless “saving” label on the next poll                                 | Failure remains visible and recoverable                                          | HTTP 503 registration and later polling                      |
| A worker or asset response with a body that never ended left retry disabled                                | Body reads and worker API waits are bounded; retry becomes available             | Real HTTP partial bodies, timeout, successful retry          |
| A proposed invalid count could otherwise save an earlier valid value                                       | Testimony checking and saving wait for correction; draft stays visible           | Blank and out-of-range fields in both engines                |
| A mistaken source-page assignment would have sent the jar phrase to p. 108                                 | Independently inspected p. 107 and corrected the reading link before publication | Whole scan, exact Greek, Archive pagination metadata         |

The later edition-upgrade audit kept two edited tabs open across a real local
worker handover. Both notes already survived; the deficiencies were the generic
reconnect/retry guidance and an unhandled rejection when `postMessage` was
fault-injected to throw `InvalidStateError` at the inspection call site. The
footer now gives the JSON/reload/reopen steps, and thrown or malformed inspection
replies settle as unavailable instead of leaving “checking” and a page error.
Both notebook schemas, the kept voyage and the kept inference were reopened
in the updated edition. An old export refused the fixture's changed notice.
The current edition still exported with its origin stopped.

The two fixtures are built from one committed source; the second deliberately
adds an HTML comment and a changed retained notice. They are never published.
The current controller and its complete inventory are checked directly. An
older cache may coexist while older tabs remain open; no single-cache claim
is made. Before and after receipts distinguish this observed inventory from
the page's edition-specific readiness.

The initial seven-file refetch and the later nine-file refetch independently
matched the upstream scans and pinned TEI files. No local source was replaced
by those audits. Selected Greek is checked against the electronic text; scan
interpretation and page placement were separately inspected.

## Review boundaries and receipts

| Boundary                      | What was operated or checked                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retained sources              | 18 byte identities; ten exact Greek excerpts; eleven complete Greek context sections                                                                                                            |
| Conditional loan arithmetic   | 576 accounts checked against an independent Python Fraction oracle                                                                                                                              |
| Count consequence             | All eight report selections and whole counts 0–3,500; an unconstrained larger count remains possible                                                                                            |
| Browser use                   | Chromium and Firefox at 1440 and 375 px; all clauses, report toggles, source links, keyboard panning and four native download types per lesson                                                  |
| Portable readings             | Actual embedded JPEG, WOFF2 and TEI bytes compared with retained originals; native embedded JSON restored; no scripts or HTTP requests on opening                                               |
| Accessibility                 | Zero axe violations in eight reviewed lesson/browser/width states; keyboard check and pan operated; no full screen-reader audit claimed                                                         |
| Offline                       | Both HTML entry pages, current controller and full inventory; navigation, source reading and export with the real local origin stopped                                                          |
| Failure and recovery          | Corrupt export refused in both renderers; cancel/retry; immutable export snapshot; two-tab cache invalidation; incomplete installs; stalled worker and asset bodies; compressed HTTP navigation |
| Build evidence                | Browser receipts capture the complete reviewed build inventory and refuse to complete if files change during review                                                                             |
| Printed examples              | Native Chromium prints of both actual downloaded readings; text, diagrams and whole source pages inspected                                                                                      |
| Public source, hosting and CI | Separate record in [publication.md](publication.md); workflow presence alone is not a successful run                                                                                            |

Reproduction commands are in [publication-handoff.md](publication-handoff.md).
Current receipts are under [`verification/`](verification/) and
[`audit-2026-10-31/`](audit-2026-10-31/). Screenshots show actual controls and source
readings; they are not design mockups. Saved examples are under [`examples/`](../examples/).

The new English and lexical explanations have not had independent philological
review. Document authenticity, historical cargo and the real lawsuit remain
outside the model. See [the source concordance](source-and-model.md).
