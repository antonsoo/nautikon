import assert from "node:assert/strict";
import test from "node:test";
import { checkDebt } from "../src/core/debt-claim";
import {
  account,
  departureCases,
  initial,
  readNotebook,
  sameVoyage,
  type Voyage,
} from "../src/core/model";

test("the departure partition equals exhaustive permitted-day enumeration for every arrival", () => {
  for (let arrival = -29; arrival <= 90; arrival++) {
    const v = { ...initial, departure: null, arrival };
    const expected = Array.from({ length: 71 }, (_, i) => i - 30).filter((d) => d < arrival);
    const cases = departureCases(v);
    const actual = cases.flatMap((c) =>
      Array.from({ length: c.last - c.first + 1 }, (_, i) => c.first + i),
    );
    assert.deepEqual(actual, expected);
    for (const c of cases) {
      assert.ok(c.witness >= c.first && c.witness <= c.last);
      for (let d = c.first; d <= c.last; d++) assert.equal(c.rate, d > 0 ? 300 : 225);
    }
    assert.equal(account(v).perThousand, arrival <= 1 ? 225 : null);
  }
});
test("a missing departure can leave two discrete debts, never their midpoint", () => {
  const voyage = { ...initial, departure: null };
  assert.equal(checkDebt({ voyage, amount: 3675 }).verdict, "possible");
  assert.equal(checkDebt({ voyage, amount: 3900 }).verdict, "possible");
  assert.equal(checkDebt({ voyage, amount: 3800 }).verdict, "excluded");
  assert.deepEqual(checkDebt({ voyage, amount: 3800 }).debts, [3675, 3900]);
  assert.equal(checkDebt({ voyage: { ...voyage, arrival: -5 }, amount: 3675 }).verdict, "forced");
  assert.equal(checkDebt({ voyage: { ...voyage, arrival: -5 }, amount: 3900 }).verdict, "excluded");
});
test("deductions, paid balances and default sales do not change the meaning of a debt proposal", () => {
  const voyage: Voyage = { ...initial, departure: null, loss: "jettison", days: 21 };
  assert.deepEqual(checkDebt({ voyage, amount: 3375 }).debts, [3375, 3600]);
  assert.equal(
    checkDebt({ voyage: { ...voyage, consent: false }, amount: 3375 }).verdict,
    "excluded",
  );
  assert.equal(checkDebt({ voyage: { ...initial, paid: true }, amount: 0 }).verdict, "excluded");
  assert.equal(
    checkDebt({ voyage: { ...initial, days: 21, sale: 0 }, amount: 3675 }).verdict,
    "forced",
  );
  for (const patch of [
    { route: "hellespont" },
    { outcome: "lost" },
    { outcome: "salvage" },
  ] as const)
    assert.equal(checkDebt({ voyage: { ...initial, ...patch }, amount: 0 }).verdict, "outside");
});
test("legacy notebooks migrate explicitly; checked facts stay independent and imports are strict", () => {
  const legacy = { version: 1, voyage: initial, pinned: initial, note: "§10" };
  assert.deepEqual(readNotebook(legacy), { ...legacy, version: 2, claim: null });
  const raw = {
    ...legacy,
    version: 2,
    claim: { amount: 3675, voyage: { ...initial, departure: null } },
  };
  const saved = readNotebook(raw);
  saved.voyage.departure = 10;
  assert.equal(saved.claim?.voyage.departure, null);
  assert.equal(raw.voyage.departure, -5);
  for (const claim of [
    undefined,
    [],
    {},
    { amount: null, voyage: initial },
    { amount: 3.5, voyage: initial },
    { amount: 10001, voyage: initial },
    { amount: 3675, voyage: initial, verdict: "forced" },
    { amount: 3675, voyage: { ...initial, arrival: -30 } },
  ])
    assert.throws(() => readNotebook({ ...raw, claim }));
  assert.throws(() => readNotebook({ ...raw, version: "2" }));
});

test("voyage equality follows field values rather than JSON property order", () => {
  const reordered = Object.fromEntries(Object.entries(initial).reverse()) as Voyage;
  assert.equal(sameVoyage(initial, reordered), true);
  assert.equal(sameVoyage(initial, { ...reordered, arrival: 55 }), false);
});
