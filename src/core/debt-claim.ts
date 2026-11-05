import { account, type DebtClaim, departureCases, type Voyage } from "./model";

export function possibleAccounts(v: Voyage) {
  return departureCases(v).map((departure) => ({
    departure,
    account: account({ ...v, departure: departure.witness }),
  }));
}

/** Test equality with a debt BEFORE repayment, never with a sale price or balance.
 * Two discrete possible amounts are not an interval of permitted amounts.
 */
export function checkDebt(claim: DebtClaim) {
  const cases = possibleAccounts(claim.voyage);
  const debts = [
    ...new Set(cases.flatMap((c) => (c.account.debt === null ? [] : [c.account.debt]))),
  ].sort((a, b) => a - b);
  const verdict = cases.some((c) => c.account.debt === null)
    ? "outside"
    : !debts.includes(claim.amount)
      ? "excluded"
      : debts.length === 1
        ? "forced"
        : "possible";
  return { cases, debts, verdict } as const;
}
