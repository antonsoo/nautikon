# A sale that leaves a claim

These artifacts came from the actual browser controls and native downloads.
The kept voyage is at day 15 after safe arrival. The current voyage is at day 21,
unpaid. Both depart five illustrative days before Arcturus and arrive 25 days
after it. The principal plus voyage interest is 3,675 drachmas. Assumed security
sale proceeds of 2,000 leave a 1,675 claim under the selected default clause.

- `default-notebook.json`: reopen through **Reopen notebook**.
- `default-ledger.csv`: facts and accounts for both voyages.
- `default-timeline.svg`: the current voyage’s entered events and interval.
- `default-reading.html.gz`: decompress, then open the standalone HTML offline.
  It includes the complete source pages, fonts, notes and embedded editable JSON.
- `default-reading.pdf`: Chromium’s printed edition of that same reading.

From the repository root, `node scripts/example.mjs` regenerates these through
an isolated production server after `npm run build`. The script also captures
the README screenshots. It uses an installed Playwright browser; it does not
install one, publish, or contact third-party services.

## A numbered deposition changes the inference

The `testimony-*` artifacts preserve an initially overstrong conclusion: exactly
450, chosen from the speaker alone. The kept check supplies 499 as a
counterexample. The current controls add Erasikles's attributed deposition,
which gives 450 exactly if taken at face value. The explanation keeps the
conditional inference separate from historical truth and monetary damages.

- `testimony-notebook.json`: reopen through **Reopen testimony**.
- `testimony-inferences.csv`: current and kept inference with their premises.
- `testimony-count.svg`: selected constraint and proposed count.
- `testimony-reading.html.gz`: decompress and open the scriptless full reading.
- `testimony-reading.pdf`: the browser's actual print of that saved reading.

Both illustrated readings include seven whole scan images, four font subsets,
retained TEI downloads, attribution, licenses and embedded editable JSON.
