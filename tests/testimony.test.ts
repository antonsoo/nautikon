import assert from "node:assert/strict";
import test from "node:test";
import { bounds, fits, initialEvidence, readEvidence, snapshot } from "../src/core/testimony";

test("the accusation bounds a whole count; a selected deposition fixes it", () => {
  for (let mask = 0; mask < 8; mask++) {
    const s = { speaker: !!(mask & 1), erasikles: !!(mask & 2), hippias: !!(mask & 4) };
    const actual = [];
    for (let n = 0; n <= 3500; n++) if (fits(s, n)) actual.push(n);
    const expected = Array.from({ length: 3501 }, (_, i) => i).filter(
      (n) => (!s.speaker || n < 500) && (!s.erasikles || n === 450) && (!s.hippias || n === 450),
    );
    assert.deepEqual(actual, expected);
    assert.equal(bounds(s).max, s.erasikles || s.hippias ? 450 : s.speaker ? 499 : null);
  }
  assert.equal(fits({ speaker: false, erasikles: false, hippias: false }, 100000), true);
  assert.equal(fits(initialEvidence.selected, 499), true);
  assert.equal(fits(initialEvidence.selected, 500), false);
});
test("a checked inference keeps the evidence used, and imports validate every snapshot", () => {
  const n = structuredClone(initialEvidence);
  n.checked = snapshot(n);
  n.selected.erasikles = true;
  assert.equal(n.checked.selected.erasikles, false);
  assert.deepEqual(readEvidence(n), n);
  for (const patch of [
    { candidate: 450.5 },
    { candidate: 3501 },
    { claim: ["exact"] },
    { kind: "nautikon-voyage" },
    { checked: { ...n.checked, selected: { speaker: true, erasikles: [], hippias: false } } },
    { extra: true },
  ])
    assert.throws(() => readEvidence({ ...n, ...patch }));
});
