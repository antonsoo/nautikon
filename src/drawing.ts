import { account, type Voyage } from "./core/model";
import { day, esc } from "./html";
export function cargo(v: Voyage): string {
  const a = account(v);
  const end =
    v.outcome === "salvage"
      ? "Surviving security → lenders jointly"
      : v.outcome === "lost"
        ? "No safe-return account"
        : a.stage === "released"
          ? "Security released after repayment"
          : "Return cargo held until repayment";
  const selected =
    v.route === "hellespont"
      ? "Hellespont branch selected; no Pontus entry. The ordinary Pontus account is withheld."
      : v.sameVessel
        ? "Selected return cargo uses the same vessel."
        : "Selected return cargo changes vessel, contrary to §11.";
  const caption =
    v.route === "hellespont"
      ? "Hellespont branch: ordinary Pontus account withheld. Route and cargo drawings are schematic."
      : `${v.sameVessel ? "Same vessel selected." : "Vessel changed: contradicts §11."} Jar count is not a price; route and cargo drawings are schematic.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 290" role="img" aria-label="Schematic voyage: 3,000 drachmas lent; 3,000 wine jars are outward security; ${esc(selected)} ${esc(end)}.">
  <rect width="900" height="290" fill="#173b4b"/>
  <g fill="none" stroke="#b9cbd0" stroke-width="1.4"><path d="M65 75H825M65 69v12m245-12v12m245-12v12m270-12v12"/><path d="m240 70 8 5-8 5m237-10 8 5-8 5m225-10 8 5-8 5"/>
  <path d="M0 228q50-10 100 0t100 0t100 0t100 0t100 0t100 0t100 0t100 0t100 0" stroke="#698895"/>
  <path d="M72 181h99l-17 25H92ZM118 101v80m5-74 44 63h-44Z" stroke="#f6efde" fill="none"/>
  <g stroke="#f6efde"><path d="M294 124h25v14c22 15 16 50-13 58-29-8-35-43-12-58Zm0 8c-23-6-19 19-2 19m27-19c23-6 19 19 2 19"/>
  <path d="M343 136h20v12c19 13 14 43-10 50-25-7-30-37-10-50Zm0 6c-19-5-16 16-2 16m22-16c19-5 16 16 2 16"/>
  <path d="M522 141h68v57h-68Zm0 0 18-18h68v57l-18 18m0-57 18-18m-52 18v57"/>
  <path d="M751 131h73v67h-73Zm0 22h73m-48-22v67m26-67v67"/>
  </g></g>
  <g fill="#f6efde" font-family="Gentium,Georgia,serif" font-size="22"><text x="65" y="45">Athens</text><text x="270" y="45">Mende / Scione</text><text x="525" y="45">${v.route === "pontus" ? "Pontus" : "Hellespont"}</text><text x="747" y="45">${v.outcome === "safe" ? "Athens" : "Loss branch"}</text></g>
  <g fill="#f6efde" font-family="Gentium,Georgia,serif" font-size="18"><text x="65" y="255">3,000 drachmas lent</text><text x="270" y="255">3,000 wine jars</text><text x="525" y="255">${v.route === "pontus" ? "All return cargo" : "No Pontus entry"}</text><text x="747" y="255">${a.stage === "outside" ? "Account withheld" : a.stage === "released" ? "Released" : "Under security"}</text></g>
  <text x="65" y="280" fill="#b9cbd0" font-family="Gentium,Georgia,serif" font-size="15">${esc(caption)}</text></svg>`;
}
export function timeline(v: Voyage): string {
  if (v.outcome !== "safe" || v.route !== "pontus") {
    const title =
      v.outcome === "salvage"
        ? "Ship irreparable; security survives"
        : v.outcome === "lost"
          ? "Ship and security lost"
          : "Hellespont exception";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 150" role="img" aria-label="${title}. The ordinary safe-return repayment interval is withheld."><rect width="900" height="150" fill="#f8f3e7"/><g fill="#173b4b" font-family="Gentium,Georgia,serif"><text x="35" y="40" font-size="24">${title}</text><text x="35" y="78" font-size="20">The ordinary Pontus safe-return interval is withheld.</text><text x="35" y="112" font-size="18">Entered arrival and day values remain hypothetical inputs. Read the separate branch in §13.</text></g></svg>`;
  }
  const x = (n: number) => 65 + ((n + 30) / 170) * 760;
  const d = v.departure;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 205" role="img" aria-label="Departure ${day(d)}; arrival ${day(v.arrival)}; twenty-day interval ends ${day(v.arrival + 20)}. Current point: ${v.days} days after arrival.">
  <rect width="900" height="205" fill="#f8f3e7"/><g stroke="#173b4b" fill="none"><path d="M65 98H825"/><path d="M${x(0)} 33V174" stroke="#a53523" stroke-dasharray="4 4"/>
  <path d="M${x(v.arrival)} 120H${x(v.arrival + 20)}" stroke="#173b4b" stroke-width="11"/>
  <path d="M${x(v.arrival + v.days)} 113v30" stroke="#a53523" stroke-width="3"/>
  ${d === null ? "" : `<circle cx="${x(d)}" cy="98" r="6" fill="#a53523"/><path d="M${x(d)} 61V90"/>`}
  <path d="M${x(v.arrival)} 91v14m${x(v.arrival + 20) - x(v.arrival)}-14v14" stroke-width="3"/>
  </g><g fill="#173b4b" font-family="Gentium,Georgia,serif" font-size="18">
  <text x="65" y="24">Illustrative days, relative to the rising of Arcturus</text><text x="${x(0) + 8}" y="51" fill="#a53523">Arcturus · 0</text>
  <text x="${d === null ? 65 : x(d)}" y="78" text-anchor="${d === null ? "start" : "middle"}">Departure ${d === null ? "?" : d}</text>
  <text x="${x(v.arrival)}" y="164" text-anchor="middle">Arrival ${v.arrival}</text>
  <text x="${x(v.arrival + 20)}" y="190" text-anchor="middle">Interval ends ${v.arrival + 20}</text>
  <text x="825" y="24" text-anchor="end">Now: arrival + ${v.days}</text></g></svg>`;
}
