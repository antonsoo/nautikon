# Publication and reproduction

The user authorized pushing and publication on 2026-10-31. Current remote,
hosted-file and public browser receipts belong in [publication.md](publication.md).
The earlier local-only handoff remains in Git history; it is not the present
publication policy.

```sh
npm ci
npm run check
npm run verify:sources
npm run verify:model
npm run test:browser
npm run test:testimony
npm run test:faults
npm run test:audit
npm run test:offline-bodies
npm run test:rollout
```

Production output is `dist/`, base `/nautikon/`. `npm run preview` uses port
4401; `npm run dev` uses port 4402 without an offline worker. The complete
edition includes both HTML entry pages and all retained sources and fonts.
The worker's inventory is generated from actual output files.

A Pages deployment must be compared with every file of a clean build, using
canonical URLs without cache-busting. Public source links must identify a
reachable immutable source commit. Catalogue discovery and public browser
operation require separate journeys; local route fixtures do not establish
public availability. A successful local check does not establish a CI run.

`test:rollout` requires committed build inputs and creates two isolated local
fixtures. The second changes a retained notice and an HTML comment; neither
fixture is a public release. Publication preserves old hashed modules for
cached entry pages, while each worker inventories only its own current build.
