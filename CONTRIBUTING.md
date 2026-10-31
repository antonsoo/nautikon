# Contributing

Use Node 24 or later. Run `npm ci`, `npm run check`, `npm run verify:sources`
and `npm run verify:model`. Browser review runs against a separate local server
with cached Playwright browsers: `npm run test:browser`.

Changes to a clause require a source location and an explanation of how its
condition changes the model. Preserve unknown or disputed results. Check the
actual UI at 375 px, keyboard interaction and downloaded artifacts. Do not
regenerate the source inventory to bless an unexplained byte change.

Do not publish or deploy as part of a local contribution. The repository owner
reviews the source and its artifacts first.
