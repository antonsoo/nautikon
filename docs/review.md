# Nautikon local review — 2026-10-31

This is a **local review of unpublished work**. It establishes source identity,
conditional model behavior, local production browser behavior and saved
artifacts. It does not establish a public repository, a hosted release, remote
synchronization or a successful GitHub Actions run.

## Try the actual work

With Node 24 or later, from this checkout:

```sh
npm ci
npm run check
npm run preview
```

Open `http://127.0.0.1:4401/nautikon/`. The preview uses the built `dist/`;
`npm run dev` uses port 4402 and does not install an offline worker.
1. **Keep this voyage.** Move arrival from 25 to 55 days after Arcturus.
   The known departure is still five days before: interest stays **675**.
2. Move departure to one day after Arcturus. Interest becomes **900**;
   debt becomes **3,900**. The kept voyage still has **3,675**.
3. Select **A missing departure**. The arrival survives but the rate and debt
   become **undetermined**. Follow the source link and inspect ἐκπλεύσωσιν.
4. Select **The same 300 lost**. Spoilage gives no deduction. Jettison with the
   shared decision gives **300**; removing that decision removes the deduction.
5. Select **A cargo worth less**. With no payment, day 21 and assumed sale
   proceeds of **2,000**, the shortfall is **1,675**. Move to day 20: this model
   has not yet activated the default sale. Record full repayment: security releases.
6. Try surviving security after irreparable damage to the ship, then the
   Hellespont exception. Each preserves its separate source explanation while
   withholding the ordinary safe-return debt calculation and interval.
7. Follow a clause link, select another reading with a button, then follow the
   same clause link again. The cited reading must be selected even when the
   fragment has not changed. Enlarge the scan; focus its viewport and pan with
   arrow keys. The page itself must keep its width.
8. Write a note; save and reopen a notebook; save the illustrated reading.
   Open it offline and use its embedded JSON download to restore both accounts.

These altered facts are **invented teaching inputs**. The source/model boundary
and the elapsed-day convention are part of the exercise, not hidden assumptions.

## Evidence retained

| Boundary                  | Result                                                                                                                                                                                                                       | Reproduce / inspect                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Source bytes              | 16 retained file identities checked at build, display and export boundaries                                                                                                                                                  | `npm run verify:sources`; `src/asset-manifest.json`            |
| Greek concordance         | Six exact excerpts and six complete context sections match the pinned electronic text                                                                                                                                        | `scripts/verify-sources.py`                                    |
| Printed witness           | Title, imprint, pp. 107–109 inspected; copy is the 1939 reprint of the 1921 edition                                                                                                                                          | `public/sources/`, `docs/source-and-model.md`                  |
| Conditional arithmetic    | 576 accounts agree with an independent Python Fraction oracle                                                                                                                                                                | `npm run verify:model`                                         |
| Core behavior             | Eight focused tests pass                                                                                                                                                                                                     | `npm test`                                                     |
| Clean local build         | Fresh `npm ci`, Biome, strict TypeScript, tests and production build pass                                                                                                                                                    | `npm run check`                                                |
| Browser operation         | Chromium and Firefox, each at 1440 and 375 px; controls, kept facts, native source links, panning and four download types                                                                                                    | `npm run test:browser`; `docs/verification/browser.json`       |
| Accessibility scan        | Zero axe violations in the four reviewed states; keyboard actions and panning also operated                                                                                                                                  | Browser script; this is not a full accessibility certification |
| No automatic external use | Zero unexpected external requests and zero page errors in the reviewed journeys; standalone reading makes no HTTP requests                                                                                                   | Browser receipts                                               |
| Offline edition           | Current worker control plus complete inventory; reload, source reading and illustrated export with actual server stopped; explicit browser offline also exercised                                                            | Browser receipts                                               |
| Two-tab damage/recovery   | Delete a source, observe loss of readiness in both controlled tabs, repair, then read it again                                                                                                                               | Browser receipts                                               |
| Fault behavior            | Superseded source response cannot replace latest page; source substitution refuses export; cancellation and retry retain work; corrupted cache invalidates readiness across tabs; failed complete install cannot claim ready | `npm run test:faults`; `docs/verification/faults.json`         |
| Portable artifact bytes   | Actual embedded image, four font subsets and TEI byte strings match retained originals; embedded JSON restores the exported notebook                                                                                         | Browser script                                                 |
| Printed example           | Actual Chromium print of the downloaded reading; text, diagram and whole source page visually inspected                                                                                                                      | `examples/default-reading.pdf`                                 |
| Public boundary           | No repository creation, push or deployment performed. Read-only repository API returned 404 during this session                                                                                                              | Local-only handoff; no CI or hosted-byte success claimed       |

The source-based UI review exposed and repaired a scan enlargement that widened
the CSS grid. Final review also repaired same-fragment source links and avoided
silently rounding valid imported whole-drachma amounts to a coarse slider step.

The final local build inventory and edition are recorded in
[`verification/build.json`](verification/build.json). It is a build receipt,
not a hosted-file receipt. The reviewed implementation commit is recorded there;
documentation and artifact commits may follow without changing the build inputs.

## Saved example

[Notebook](../examples/default-notebook.json) ·
[Ledger](../examples/default-ledger.csv) ·
[Timeline](../examples/default-timeline.svg) ·
[Illustrated HTML, gzip](../examples/default-reading.html.gz) ·
[Reading PDF](../examples/default-reading.pdf).

Decompress the HTML before opening it. These files were made through actual
browser controls by `node scripts/example.mjs`; the PDF prints that saved HTML.
The illustrated reading contains no script. The PDF is a reading copy; editable
state remains in the JSON and HTML. Automated checks do not substitute for an
independent philological review or a screen-reader audit.

## Source and release limits

No assertion about authenticity of the transmitted contract, authorship of the
speech, actual borrower conduct, a verdict, creditor priority or historical
recovery follows from the model. The source establishes the words used here;
new arithmetic depends on the declared assumptions. No public CI execution,
registry release or deployed-browser journey was attempted.

Officina’s entry stays `soon`, with no demo URL, so ordinary catalogue search
cannot present an unhosted lesson as published. Its local preview journey uses
an explicitly injected published fixture and local bytes. That is a reviewable
handoff, not public availability. See the adjacent Officina study.
