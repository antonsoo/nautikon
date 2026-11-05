# Audit: a saved lesson must keep its promises

The earlier missing-departure work improved the calculation, but its browser
matrix did not establish that every claimed offline file had valid bytes, or
that saved readings worked with pinned comparisons at 320 px. This audit
reproduces those gaps and repairs their actual learner-facing consequences.
It does not add new historical evidence or change the selected-clause arithmetic.

## Failures reproduced before repair

The [before receipt](delivery-audit/before.json) identifies the complete older
build (`041e2e1706e18593fd4f`, source `9180503`) and records both browser runs.
It records failures, not successful validation.

| Operation against the earlier build                               | Actual result                                                                                    | Learner consequence                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Replace the cached p. 111 scan with invalid bytes                 | Chromium and Firefox still report a complete 24/24 edition after polling                         | The footer promises a source file that cannot be used                      |
| Return a small HTTP 200 maintenance document                      | Both browsers replace the saved lesson with that document                                        | A usable retained lesson disappears during a temporary site failure        |
| Read a cold source page while installation shares 128,000 bytes/s | Both installations fail while bodies are progressing; Firefox also aborts the foreground reading | A slower connection is treated as a stalled one                            |
| Open an illustrated voyage with a kept comparison at 320 px       | The table expands the whole page beyond the viewport                                             | Reading and comparing require unintended page panning                      |
| Audit the saved voyage's landmarks                                | No main landmark; document content is outside a landmark                                         | App accessibility results do not establish portable-document accessibility |
| Follow the saved missing-evidence link                            | No `#evidence` target exists                                                                     | A working live link becomes a dead link in the artifact                    |

The cold-transfer server streams actual HTTP bodies against one shared byte
budget. Foreground reads compete with background installation. It neither
fulfills Playwright routes with warmed bytes nor merely delays a fast response.
The before receipt retains delivery counts, cancellations and timestamps.
The unchanged older build can be supplied to `node scripts/audit-before.mjs
/path/to/older/dist` to reproduce the observations.

## What changed

`src/core/receive.ts` reads response chunks with a fifteen-second **inactivity**
deadline. New arriving data restarts that deadline; elapsed transfer time alone
does not fail a download. Caller cancellation and a byte limit remain effective
through headers and body reads. A file's SHA-256 is checked after reception,
before it is displayed, exported or admitted to the saved edition.

Native fetch integrity can require consuming the full body before delivering
the response to its caller. Using it while timing only the fetch promise hides
body progress. The shared reader therefore observes the stream and its callers
perform the explicit digest check. This follows the response-body/integrity
processing described in the [Fetch standard](https://fetch.spec.whatwg.org/#main-fetch).
No source is used merely because bytes arrived.

`src/service-worker.ts` is now a directly reviewable TypeScript module, bundled
as a self-contained worker. The build supplies the exact URL, size, MIME type
and SHA-256 inventories. Two background downloads leave bandwidth for the
foreground reader. Initial installation and manual repair check all bodies
before writing their complete set. Repair has an explicit cancellation control.

Every readiness inspection validates cached bodies against the inventory.
Missing or corrupt images, styles, scripts and documents cannot count as ready.
A corrupt cached response is not served as the expected file. Reconstructed
responses use the file's expected MIME type and do not retain compressed-body
headers after decoding. Repeated readiness requests share a current inspection;
page-side revisions and controller identity discard superseded replies.

A controlled navigation first tries the network for up to two seconds, then
uses a verified saved page. HTTP errors and maintenance HTML cannot displace
that page. The build marks genuine entry documents with their edition. A
current-edition response must match its expected digest. A verified saved page
takes precedence over a differently marked network document: an edition marker
alone proves neither chronology nor compatibility. When no valid saved page
exists, a marked network candidate can bootstrap; readiness still requires the
matching worker and its complete verified inventory. With no valid network
page and no valid retained page, the worker returns an explicit unavailable
response instead of serving a corrupt document.

Foreground source readers prefer their own verified edition's cached file.
Uncached reads stream directly so the worker cannot conceal progress behind a
buffered response. Other runtime resources are verified by the worker before
use. An older tab retains its state when a newer worker takes control; the
existing migration flow continues to offer JSON before reload. Native service-worker
registration waits are bounded separately. A repair that already has a matching,
validated controller does not queue an unnecessary register/update operation
behind a stalled browser job. The audit explicitly holds such a job open while
repair completes within ten seconds on the local fast server.

## Portable readings and fixed evidence

Both saved reading formats have a main landmark. Voyage heading levels now
follow their document context. The missing-evidence link has a real target.
Wide comparisons and diagrams occupy keyboard-accessible scrolling regions,
while the document itself fits 320 px. Long unbroken notes wrap and remain
escaped text. Print rules restore full-width diagrams and tables.

Testimony imports reconstruct independent report maps in canonical field order.
Two equal maps no longer appear different because JSON keys were reordered,
and mutating the current selection cannot rewrite the imported kept selection.
This preserves the distinction between changing a premise and changing its
serialization.

## Verify the repairs

```sh
npm ci
npm run check
npm run verify:sources
npm run verify:model
npm run test:delivery
npm run test:portable
```

`test:delivery` exercises corrupt source/CSS/document caches, both open rooms,
404/503/maintenance responses at all three canonical entry paths, refusal of a
corrupt offline document, cancellation during a stalled body, repair during a
held native update job, and subsequent
repair with notes intact. Its cold phase uses a shared **64,000 bytes/s** budget,
half the before test's rate. It reads p. 107 during initial installation, then
reads a missing p. 111 while a full manual repair is progressing. Both transfers
and the repair exceed the former hard deadline and must still complete. It
then exports the reading and reloads offline under the controlling worker.
The corrupt-document and runtime-resource checks stop the origin, rather than
relying only on an automation offline setting that did not suppress every
Firefox worker request in this audit.

`test:portable` operates both rooms, retains different earlier/current facts,
enters a long unbroken note and literal markup, and takes native JSON and HTML
downloads. Chromium and Firefox reopen the actual local files at 320, 375 and
1440 px: twelve document/width/browser cases. Each checks page width, all local
fragment targets, keyboard panning, axe results, all seven embedded images,
zero HTTP requests and an exact embedded JSON roundtrip. Its Chromium PDFs are
tagged, scriptless prints, not accessibility certification.

The finite account and source concordance checks remain separate. No browser
or delivery repair authenticates a document, proves the reports true, or supplies
a historical voyage duration, valuation method or court decision. The model's
whole-day boundary and discrete debt alternatives remain as documented in the
[missing-departure review](departure-review.md).

## Upgrade boundary

An old tab may export an authentic retained older source if all its declared
bytes still validate. That is a valid older reading. The two-edition fixture
removes the older fallback to test the harder boundary: changed source bytes
must then be refused, while JSON carries the edits and kept comparisons into
the new edition. Oversized substitutions are rejected before buffering the
entire body, and are reported as a source identity failure. Ordinary unavailable
files retain a source-path/reconnection message.

The regeneration script also refreshes the actual public example files. Updating
an exporter does not repair previously downloaded HTML. The native example
packets now contain the revised landmarks, tables, diagrams, source links and
versioned notebook data, with educational explanations instead of fault-injection
notes. The test-only long/malicious notes remain confined to audit artifacts.

## Reviewed edition and receipts

The reviewed production edition is **`e7d01a374f11d57b1166`**: 25 built files,
with 24 files in its worker inventory. All of the following receipts identify
that same complete build, apart from the explicitly labeled older failure
receipt and the deliberately different second upgrade fixture.

| Evidence boundary                                      | Receipt                                           |
| ------------------------------------------------------ | ------------------------------------------------- |
| Corrupt caches, outages, slow cold reads and repairs   | [Delivery](delivery-audit/after.json)             |
| Twelve portable document/browser/width combinations    | [Portable readings](delivery-audit/portable.json) |
| Original voyage journeys                               | [Voyage](delivery-audit/voyage.json)              |
| All testimony report selections and kept premises      | [Testimony](delivery-audit/testimony.json)        |
| Debt proposals and missing-departure alternatives      | [Departure](delivery-audit/departure.json)        |
| Corrupt source, cancellation and failure recovery      | [Faults](delivery-audit/faults.json)              |
| Stalled bodies and compressed HTTP                     | [Bodies](delivery-audit/bodies.json)              |
| Failed registration and stalled repair recovery        | [Retry](delivery-audit/retry.json)                |
| Concurrent imports and narrow illustrated comparison   | [Imports](delivery-audit/imports.json)            |
| Edited tabs across two different built editions        | [Upgrade](delivery-audit/upgrade.json)            |
| Actual regenerated educational files, both browsers    | [Examples](delivery-audit/examples.json)          |
| SHA-256 inventory of retained examples and screenshots | [Artifacts](delivery-audit/artifacts.json)        |

At the controlled shared 64,000-byte/s limit, the first p. 107 transfer took
more than fifteen seconds in both browsers. Full repairs took
49.316 and 49.417 seconds respectively. The receipts retain the underlying
transfer timings and byte counts. These are controlled workload observations,
not estimates of ancient travel, representative user networks or Internet speed.

Fresh isolated installs passed on both **Node 24.22.1** (the documented major)
and **Node 26.7.0** (the interactive shell). Each ran install, lint, typecheck,
24 tests, production build, source concordance and the 4,416-account / 39,744-proposal
independent oracle. Both clean builds were byte-for-byte identical to the reviewed
25-file output. Source/build inputs are committed in `465061c`.

All eight refreshed screenshots were inspected. Desktop controls and Greek
remain beside their consequences and source scan; phone layouts stack the work
without losing actions. The new [alternatives plate](assets/alternatives-audit.png)
shows the two discrete amounts. Screenshots and HTTP success alone are not the
basis of the delivery claims above.

Regenerate and audit the actual educational packets with:

```sh
node scripts/example.mjs
node scripts/examples-audit.mjs
```

Public source, hosted-file identity, actual public upgrade and catalogue discovery
are verified separately in the [publication record](publication.md). No remote CI
result is inferred from these local checks.

## Additional entry and audit-runner regression

A real older marked HTML document displaced a valid current saved entry in both
browsers and produced an empty application. The [before](delivery-audit/entry-before.json)
and [after](delivery-audit/entry-after.json) receipts retain that exact operation.
The repaired worker serves its verified saved entry in both engines. Worker
installation still proceeds through normal registration; edited tabs are never
automatically reloaded.

The installed Playwright version also accepted a Promise returned by an async
`waitForFunction` predicate before its resolved value was true. The
[polling regression](delivery-audit/poll.json) demonstrates the false acceptance
and checks the replacement: explicitly await `page.evaluate`, accept only literal
`true`, and bound the wait. Upgrade audits use that helper to identify the new
controller before reloading an untouched bootstrap tab. The complete current
local matrices above were rerun after this correction.

The first real public handover attempt from `582e41255fddd59639dd` to
`7ed04c19ca9d5ba62a59` timed out and is
[retained as incomplete](delivery-audit/first-public-upgrade.json). It is not a
successful handover receipt. The intermediate edition's
[hosted bytes](delivery-audit/first-hosted.json) and
[actual TCP-outage journeys](delivery-audit/first-public-delivery.json) passed
separately. Current public verification belongs to the publication record.
