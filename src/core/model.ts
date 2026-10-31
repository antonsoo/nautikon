export interface Voyage {
  departure: number | null;
  arrival: number;
  days: number;
  route: "pontus" | "hellespont";
  outcome: "safe" | "salvage" | "lost";
  loss: "none" | "jettison" | "enemies" | "ordinary";
  lossAmount: number;
  consent: boolean;
  sale: number;
  paid: boolean;
  otherPledge: boolean;
  sameVessel: boolean;
}
export const initial: Voyage = {
  departure: -5,
  arrival: 25,
  days: 15,
  route: "pontus",
  outcome: "safe",
  loss: "none",
  lossAmount: 300,
  consent: true,
  sale: 2000,
  paid: false,
  otherPledge: false,
  sameVessel: true,
};
export interface Account {
  perThousand: 225 | 300 | null;
  interest: number | null;
  deduction: number;
  debt: number | null;
  balance: number | null;
  deficiency: number | null;
  fromSale: number | null;
  stage: "waiting" | "default" | "released" | "outside";
  security: string;
  reason: string;
  conflicts: string[];
}

/** Conditional arithmetic for selected transmitted clauses, not a judicial decision. */
export function account(v: Voyage): Account {
  const conflicts: string[] = [];
  if (v.otherPledge)
    conflicts.push(
      "The same security carries another loan: §11 forbids an existing debt and further borrowing on these goods. No penalty or priority rule is invented here.",
    );
  if (!v.sameVessel)
    conflicts.push(
      "The return cargo changed vessel: §11 says ‘in the same ship’. The arithmetic does not decide the legal effect of this departure from the terms.",
    );
  const perThousand: Account["perThousand"] =
    v.departure === null || v.route !== "pontus" ? null : v.departure > 0 ? 300 : 225;
  const interest = perThousand === null ? null : 3 * perThousand;
  const deduction = v.loss === "enemies" || (v.loss === "jettison" && v.consent) ? v.lossAmount : 0;
  const base = { perThousand, interest, deduction, conflicts };
  if (v.outcome !== "safe" || v.route !== "pontus" || interest === null) {
    const reason =
      v.outcome === "salvage"
        ? "§13 assigns surviving security to the lenders jointly when the ship suffers irreparable harm. This is a different branch; the ordinary safe-return debt and shortfall are withheld."
        : v.outcome === "lost"
          ? "§11 makes safe arrival a condition of its repayment clause. No safe-return account is computed for total loss; the workshop does not decide disputed loss, breach, fraud or litigation."
          : v.route === "hellespont"
            ? "§13 has a separate Hellespont provision and refers to interest ‘written last year’. Its conditions and that reference are not resolved by this selected Pontus model. No rate is supplied."
            : "The departure evidence is missing. Arrival after Arcturus alone cannot choose between 225 and 300 per thousand in §10.";
    return {
      ...base,
      debt: null,
      balance: null,
      deficiency: null,
      fromSale: null,
      stage: "outside",
      reason,
      security:
        v.outcome === "salvage"
          ? "Surviving security: joint property of lenders (§13)"
          : "Ordinary safe-return security account withheld",
    };
  }
  const debt = 3000 + interest - deduction;
  const stage = v.paid ? "released" : v.days > 20 ? "default" : "waiting";
  return {
    ...base,
    debt,
    balance: v.paid ? 0 : debt,
    stage,
    deficiency: stage === "default" ? Math.max(0, debt - v.sale) : null,
    fromSale: stage === "default" ? Math.min(debt, v.sale) : null,
    security: v.paid
      ? "Security released after full repayment (§11)"
      : "Return cargo remains under the lenders’ control (§11)",
    reason: v.paid
      ? "Full repayment ends the selected security-holding condition. This control records payment of the entire modeled debt, not a partial payment."
      : v.days > 20
        ? "The twenty-day interval has elapsed without repayment. §12 permits pledge or sale of the security and collection of a shortfall from the borrowers and their other property. Collection is a right described by the clause, not guaranteed recovery."
        : "Within the selected twenty-day repayment interval. §11 gives control of the security until repayment; the §12 default sale is not yet activated.",
  };
}

const keys = Object.keys(initial);
const integer = (x: unknown, min: number, max: number): x is number =>
  typeof x === "number" && Number.isInteger(x) && x >= min && x <= max;
export function readVoyage(value: unknown): Voyage {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a voyage object.");
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== keys.length || Object.keys(v).some((k) => !keys.includes(k)))
    throw new Error("The voyage has missing or unknown fields.");
  if (
    !(v.departure === null || integer(v.departure, -30, 40)) ||
    !integer(v.arrival, -29, 90) ||
    !integer(v.days, 0, 45) ||
    !integer(v.lossAmount, 0, 1000) ||
    !integer(v.sale, 0, 10000)
  )
    throw new Error("Days and drachmas must be whole numbers within the workshop’s ranges.");
  if (typeof v.departure === "number" && v.arrival <= v.departure)
    throw new Error("Arrival must follow departure.");
  if (
    !["pontus", "hellespont"].includes(String(v.route)) ||
    !["safe", "salvage", "lost"].includes(String(v.outcome)) ||
    !["none", "jettison", "enemies", "ordinary"].includes(String(v.loss))
  )
    throw new Error("Unknown route, outcome or loss kind.");
  for (const key of ["consent", "paid", "otherPledge", "sameVessel"])
    if (typeof v[key] !== "boolean") throw new Error(`${key} must be true or false.`);
  return structuredClone(value) as Voyage;
}
export interface Notebook {
  version: 1;
  voyage: Voyage;
  pinned: Voyage | null;
  note: string;
}
export function readNotebook(value: unknown): Notebook {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a Nautikon notebook.");
  const r = value as Record<string, unknown>;
  if (
    r.version !== 1 ||
    Object.keys(r).sort().join(",") !== "note,pinned,version,voyage" ||
    typeof r.note !== "string" ||
    r.note.length > 6000
  )
    throw new Error("Use a version 1 notebook with a note of at most 6,000 characters.");
  return {
    version: 1,
    voyage: readVoyage(r.voyage),
    pinned: r.pinned === null ? null : readVoyage(r.pinned),
    note: r.note,
  };
}
export function share(v: Voyage): string {
  return `?voyage=${encodeURIComponent(JSON.stringify(v))}#bench`;
}
export function fromSearch(search: string): Voyage {
  const raw = new URLSearchParams(search).get("voyage");
  return raw ? readVoyage(JSON.parse(raw)) : structuredClone(initial);
}
export const presets: { id: string; title: string; question: string; patch: Partial<Voyage> }[] = [
  {
    id: "arrival",
    title: "A late arrival",
    question: "Athens is reached after Arcturus. Which departure fact would raise the rate?",
    patch: {},
  },
  {
    id: "unknown",
    title: "A missing departure",
    question: "The arrival is known, the departure is not. Can the rate be recovered?",
    patch: { departure: null },
  },
  {
    id: "loss",
    title: "The same 300 lost",
    question: "Keep the amount. Change spoilage into an agreed jettison. What can be deducted?",
    patch: { loss: "ordinary" },
  },
  {
    id: "default",
    title: "A cargo worth less",
    question: "The debt is 3,675; the sale realizes 2,000. Does the difference disappear?",
    patch: { days: 21 },
  },
  {
    id: "salvage",
    title: "The ship is lost; goods survive",
    question: "Which property clause replaces the ordinary safe-return account?",
    patch: { outcome: "salvage" },
  },
  {
    id: "exception",
    title: "They never enter Pontus",
    question: "The Hellespont exception refers to another rate. What can this model establish?",
    patch: { route: "hellespont" },
  },
];
