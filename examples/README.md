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

All three illustrated readings include seven whole scan images, four font subsets,
retained TEI downloads, attribution, licenses and embedded editable JSON.

## A missing departure and a kept debt proposal

The `departure-*` files preserve an excluded proposal of 3,800 drachmas under
the earlier missing-departure facts. Arrival +25 allows debts 3,675 or 3,900;
the values between them do not follow. The current arrival is -5, which rules
out departure after Arcturus without establishing the exact date. The earlier
check keeps its original facts while the current account changes.

- `departure-notebook.json`: the current/kept voyages, original checked proposal
  and a learner explanation; reopen it through **Reopen notebook**.
- `departure-ledger.csv`: both accounts and the proposal with its original facts.
- `departure-timeline.svg`: the current arrival and remaining departure window.
- `departure-reading.html.gz`: the complete scriptless illustrated reading.
- `departure-reading.pdf`: a tagged browser print of that same reading.

Current voyage files use version 2, while testimony retains its separate version
1 schema. Legacy voyage version 1 files still open through explicit migration.
These are modern selected-clause learning examples, not historical voyage data.
All current PDFs were printed from the actual downloaded HTML with tagging
requested. This is not a full assistive-technology audit of the PDF structure.
