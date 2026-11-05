import { checkDebt } from "../src/core/debt-claim";
import { account, initial, type Voyage } from "../src/core/model";

function emit(v: Voyage) {
  console.log(
    JSON.stringify({
      voyage: v,
      account: account(v),
      claims: [0, 2675, 3000, 3375, 3600, 3675, 3800, 3900, 10000].map((amount) => ({
        amount,
        ...checkDebt({ voyage: v, amount }),
      })),
    }),
  );
}
for (const departure of [-5, 0, 1, null])
  for (const outcome of ["safe", "salvage", "lost"] as const)
    for (const loss of ["none", "ordinary", "jettison", "enemies"] as const)
      for (const consent of [false, true])
        for (const days of [20, 21])
          for (const sale of [0, 2000, 10000])
            emit({ ...initial, departure, outcome, loss, consent, days, sale });

for (let arrival = -29; arrival <= 90; arrival++)
  for (const loss of ["none", "ordinary", "jettison", "enemies"] as const)
    for (const consent of [false, true])
      for (const branch of ["pontus", "hellespont", "salvage", "lost"]) {
        emit({
          ...initial,
          departure: null,
          arrival,
          loss,
          consent,
          route: branch === "hellespont" ? "hellespont" : "pontus",
          outcome: branch === "salvage" ? "salvage" : branch === "lost" ? "lost" : "safe",
          days: arrival % 2 === 0 ? 20 : 21,
          paid: arrival % 3 === 0,
          lossAmount: arrival % 2 === 0 ? 301 : 1000,
          sale: arrival % 2 === 0 ? 2001 : 10000,
        });
      }
