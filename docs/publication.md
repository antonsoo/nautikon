# Public edition — 2026-10-31

Both lessons are public at [the voyage account](https://antonsoo.github.io/nautikon/)
and [the testimony bench](https://antonsoo.github.io/nautikon/testimony.html).
The user explicitly authorized pushing and publication. These observations keep
source, builds, hosted files, browsers and CI as separate boundaries.

## Source and build

- Audited implementation: `ca0ea57cb61469477d9c708c6cf8e5ace5d32095`.
- Receipt formatting correction and clean-build source:
  `035c2ea2fdfe4779b10a4f4d4ad3a863ee65f924`.
- Initial published source head: `33ee317f2a276cc9459800ebdccba172ae6a8b5d`,
  a documentation-only descendant of that clean-build source.
- Static branch: `62ca94370009a3d150a9c5a46e7298fca33977aa`, publishing those
  reviewed bytes. Pages serves `gh-pages`, `/`, with legacy branch publishing.
- Edition: `ba018c9538c51599510d`; **25 production files**.

A new directory made from `git archive` received a fresh `npm ci`, then passed
lint, strict TypeScript, 15 focused cases, the production build, 18 source byte
identities, Greek concordance and the 576-account independent Fraction oracle.
Every resulting production file matched the working build byte for byte.
[Clean-build receipt](verification/clean-checkout.json).

The first clean-archive attempt caught missing final newlines in generated review
JSON. The generator and retained files were corrected before the successful
repeat and before pushing. This was a packaging failure; it is not counted as
a successful clean check.

## Canonical hosted files

All **25/25** canonical file responses matched the captured clean build,
including both lesson entry pages, all scripts/styles, fonts, source scans,
TEI, licenses and the worker. Root and explicit index were checked; the root
was checked again after the file pass. No cache-busting URL was used.
[Initial public byte receipt](verification/public-before.json).

## Actual public browser operation

Fresh Chromium 153 and Firefox 155 contexts at 375 px operated both public
lessons: kept/current voyage rates, the speaker-only counterexample, adding
Erasikles, and Hippias's continuation on p. 111. After the matching complete
worker took control, explicit browser-offline reload still loaded the source
and saved the scriptless illustrated reading through a native download.
Zero page errors occurred in those journeys.
[Public direct receipts](verification/public-direct.json).

The larger local matrices also exercised 1440 px, all report selections,
imports, all four export types, corrupt sources, cancellation, actual stopped
origins, two-tab cache damage, partial HTTP bodies and compressed navigation.
Those are local observations, recorded separately in [the audit](review.md).
Catalogue discovery and its four public browser journeys are being recorded
separately by Officina; direct public operation does not itself prove discovery.

## GitHub execution boundary

The initial source push triggered `Check` run **41234251010** and source
`Pages` run **41234251003**. Both ended in failure with **empty job step lists**;
their checks did not execute. They are not counted as CI passes. No code or
build failure is inferred from those empty lists.

The separate branch-serving **pages build and deployment** run
**41234258012** completed its actual checkout/upload/report/deploy steps
successfully for static branch commit `62ca943`. That publication job did not
run the source checks. Public byte comparison and browser operation above
establish the separately observed site behavior.

No registry package, scholarly certification, full screen-reader audit or
historical verdict is claimed. Remote source and public site observations are
snapshots at the receipt timestamps; later documentation commits may record
additional evidence without changing the edition's build inputs.
