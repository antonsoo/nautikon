import assert from "node:assert/strict";
import test from "node:test";
import { parseJson } from "../src/core/json";

test("repeated JSON keys are refused before a notebook can choose a value", () => {
  for (const text of [
    '{"departure":-5,"departure":10}',
    '{"voyage":{"departure":-5,"\\u0064eparture":10}}',
    '[{"count":450,"count":499}]',
    '{"note":"same","note":"same"}',
  ])
    assert.throws(() => parseJson(text), /Repeated JSON field/);
});
test("a key in another object and punctuation inside note text remain valid", () => {
  const text = JSON.stringify({
    voyage: { departure: -5 },
    pinned: { departure: 10 },
    note: 'A quote: " and a brace } are text',
  });
  assert.deepEqual(parseJson(text), JSON.parse(text));
  const note = { note: '"departure": -5, { "departure":10 }\\' };
  assert.deepEqual(parseJson(JSON.stringify(note)), note);
});
test("invalid JSON still fails its syntax check", () => {
  for (const text of ['{"a":', "{a:1}", '{"a":1,}', "", '"unterminated'])
    assert.throws(() => parseJson(text));
});
