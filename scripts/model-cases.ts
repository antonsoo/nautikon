import { account, initial } from "../src/core/model";

for (const departure of [-5, 0, 1, null])
  for (const outcome of ["safe", "salvage", "lost"] as const)
    for (const loss of ["none", "ordinary", "jettison", "enemies"] as const)
      for (const consent of [false, true])
        for (const days of [20, 21])
          for (const sale of [0, 2000, 10000]) {
            const v = { ...initial, departure, outcome, loss, consent, days, sale };
            console.log(JSON.stringify({ voyage: v, account: account(v) }));
          }
