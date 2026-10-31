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
