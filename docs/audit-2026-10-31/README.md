# Independent audit receipts

`import-export-before.json` and `offline-before.json` record the actual
reproductions against the pre-audit implementation at `6c3564b`. Their failures
were observed in Chromium and Firefox before editing the affected behavior.
The matching `after` files rerun those observations with assertions and include
the complete build identity. Browser receipts fail if the build changes during
a run, so a mixed-edition review cannot silently produce a successful receipt.

`source-refetch.json` is the initial seven-file upstream comparison.
`source-refetch-nine-files.json` also includes the two added testimony pages.
Both compare whole responses with retained bytes; they do not replace sources.
`scan-pagination.json` records the independently fetched Archive metadata used
to distinguish scan page labels from bracketed older text references.

The source and model concordance and the visually checked phrase placement are
in [source-and-model.md](../source-and-model.md). Hosting, public browser use,
remote ancestry and CI execution belong in [publication.md](../publication.md),
not in these local failure reproductions.

`rollout-before.json` records two edited tabs across two built editions and
the separately injected worker-messaging failure at its actual call site.
Current `verification/rollout.json` also reopens both notebook schemas and
checks thrown and malformed replies. Coexisting older caches are recorded,
not interpreted as a complete current edition. The real public upgrade is
recorded independently in `verification/public-upgrade.json`.
