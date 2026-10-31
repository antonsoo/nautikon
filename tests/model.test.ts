import assert from "node:assert/strict";
import test from "node:test";
import { account, fromSearch, initial, readNotebook, readVoyage, share } from "../src/core/model";
import { esc } from "../src/html";

test("arrival can cross Arcturus without changing a departure-selected rate", () => {
  for (const arrival of [1, 25, 80]) assert.equal(account({ ...initial, arrival }).interest, 675);
  assert.equal(account({ ...initial, departure: 1 }).interest, 900);
  assert.equal(account({ ...initial, departure: 0 }).interest, 675);
});
test("missing departure and exceptional branches do not invent an amount", () => {
  for (const patch of [
    { departure: null },
    { route: "hellespont" as const },
    { outcome: "salvage" as const },
    { outcome: "lost" as const },
  ]) {
    const a = account({ ...initial, ...patch });
    assert.equal(a.debt, null);
    assert.equal(a.deficiency, null);
    assert.equal(a.stage, "outside");
  }
  assert.match(account({ ...initial, outcome: "salvage" }).security, /joint property/);
});
test("shared decision is part of the jettison exception, and price loss is not a deduction", () => {
  assert.equal(account({ ...initial, loss: "ordinary" }).debt, 3675);
  assert.equal(account({ ...initial, loss: "jettison", consent: false }).debt, 3675);
  assert.equal(account({ ...initial, loss: "jettison", consent: true }).debt, 3375);
  assert.equal(account({ ...initial, loss: "enemies", consent: false }).debt, 3375);
});
test("a default sale leaves a claim for the shortfall; it does not erase it", () => {
  assert.equal(account({ ...initial, days: 20 }).deficiency, null);
  const a = account({ ...initial, days: 21 });
  assert.equal(a.fromSale, 2000);
  assert.equal(a.deficiency, 1675);
  for (const sale of [0, 100, 2000, 3675, 10000]) {
    const b = account({ ...initial, days: 21, sale });
    assert.equal((b.fromSale ?? 0) + (b.deficiency ?? 0), 3675);
  }
});
test("full repayment releases security and prevents a second collection", () => {
  const a = account({ ...initial, days: 30, paid: true });
  assert.equal(a.balance, 0);
  assert.equal(a.stage, "released");
  assert.equal(a.deficiency, null);
  assert.match(a.security, /released/);
});
test("contradicting cargo terms is flagged without inventing a penalty", () => {
  const a = account({ ...initial, otherPledge: true, sameVessel: false });
  assert.equal(a.conflicts.length, 2);
  assert.equal(a.debt, 3675);
});
test("notebooks keep the old facts and reject invalid input atomically", () => {
  const input = { version: 1 as const, voyage: initial, pinned: initial, note: "§10 before §11" };
  const result = readNotebook(input);
  result.voyage.departure = 10;
  assert.equal(result.pinned?.departure, -5);
  assert.equal(initial.departure, -5);
  for (const value of [
    { ...initial, departure: 25, arrival: 25 },
    { ...initial, days: 1.5 },
    { ...initial, paid: "false" },
    { ...initial, extra: true },
    { ...initial, sale: Infinity },
  ])
    assert.throws(() => readVoyage(value));
  assert.throws(() => readNotebook({ ...input, note: "x".repeat(6001) }));
});
test("share links roundtrip all current facts; HTML escaping preserves notes as text", () => {
  const v = { ...initial, departure: null, loss: "enemies" as const, otherPledge: true };
  assert.deepEqual(fromSearch(share(v).split("#")[0] ?? ""), v);
  assert.equal(esc("<script>\"&'"), "&lt;script&gt;&quot;&amp;&#39;");
});
