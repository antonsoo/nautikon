export interface Selection {
  speaker: boolean;
  erasikles: boolean;
  hippias: boolean;
}
export type Claim = "exact" | "upper" | "open";
export interface Attempt {
  selected: Selection;
  candidate: number;
  claim: Claim;
}
export interface EvidenceNotebook extends Attempt {
  kind: "nautikon-testimony";
  version: 1;
  checked: Attempt | null;
  note: string;
}
export const initialEvidence: EvidenceNotebook = {
  kind: "nautikon-testimony",
  version: 1,
  selected: { speaker: true, erasikles: false, hippias: false },
  candidate: 450,
  claim: "exact",
  checked: null,
  note: "",
};
export const claims: Record<Claim, string> = {
  exact: "Exactly 450 jars",
  upper: "Fewer than 500; exact count not fixed",
  open: "No count constraint from the selected reports",
};
export function bounds(selected: Selection): { min: number; max: number | null; claim: Claim } {
  if (selected.erasikles || selected.hippias) return { min: 450, max: 450, claim: "exact" };
  if (selected.speaker) return { min: 0, max: 499, claim: "upper" };
  return { min: 0, max: null, claim: "open" };
}
export function fits(selected: Selection, count: number): boolean {
  const b = bounds(selected);
  return Number.isSafeInteger(count) && count >= b.min && (b.max === null || count <= b.max);
}
export function snapshot(record: Attempt): Attempt {
  return structuredClone({
    selected: record.selected,
    candidate: record.candidate,
    claim: record.claim,
  });
}
export const labels: Record<keyof Selection, string> = {
  speaker: "Speaker · §19",
  erasikles: "Erasikles · §20",
  hippias: "Hippias · §20",
};
export const selectedNames = (s: Selection): string =>
  (Object.keys(labels) as (keyof Selection)[])
    .filter((k) => s[k])
    .map((k) => labels[k])
    .join("; ") || "No descriptive report selected";
export function readEvidence(value: unknown): EvidenceNotebook {
  function object(v: unknown, keys: string[]): Record<string, unknown> {
    if (
      !v ||
      typeof v !== "object" ||
      Array.isArray(v) ||
      Object.keys(v).length !== keys.length ||
      !keys.every((k) => Object.hasOwn(v, k))
    )
      throw new Error("Unexpected or missing notebook fields.");
    return v as Record<string, unknown>;
  }
  function attempt(v: unknown): Attempt {
    const a = object(v, ["selected", "candidate", "claim"]),
      s = object(a.selected, ["speaker", "erasikles", "hippias"]);
    if (!Object.values(s).every((v) => typeof v === "boolean"))
      throw new Error("Report selections must be true or false.");
    if (
      typeof a.candidate !== "number" ||
      !Number.isSafeInteger(a.candidate) ||
      a.candidate < 0 ||
      a.candidate > 3500
    )
      throw new Error("Proposed count must be a whole number from 0 to 3,500.");
    if (typeof a.claim !== "string" || !Object.hasOwn(claims, a.claim))
      throw new Error("Unknown conclusion.");
    return {
      selected: {
        speaker: s.speaker as boolean,
        erasikles: s.erasikles as boolean,
        hippias: s.hippias as boolean,
      },
      candidate: a.candidate,
      claim: a.claim as Claim,
    };
  }
  const n = object(value, ["kind", "version", "selected", "candidate", "claim", "checked", "note"]);
  if (n.kind !== "nautikon-testimony" || n.version !== 1)
    throw new Error("Use a Nautikon testimony notebook, version 1.");
  if (typeof n.note !== "string" || n.note.length > 6000)
    throw new Error("Notes must be text, at most 6,000 characters.");
  const current = attempt({ selected: n.selected, candidate: n.candidate, claim: n.claim });
  return {
    kind: "nautikon-testimony",
    version: 1,
    ...current,
    checked: n.checked === null ? null : attempt(n.checked),
    note: n.note,
  };
}
