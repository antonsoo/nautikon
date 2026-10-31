import { asData, bytes } from "./assets";
import type { Reading } from "./content/readings";
import { readingHtml } from "./views";
export function installSources(readings: Reading[]): void {
  const get = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const e = document.getElementById(id);
    if (!e) throw new Error(`Missing ${id}`);
    return e as T;
  };
  const dropdown = () => get<HTMLSelectElement>("page");
  let sourceController: AbortController | null = null,
    sourceRevision = 0;
  async function showSource(): Promise<void> {
    sourceController?.abort();
    const controller = new AbortController();
    sourceController = controller;
    const revision = ++sourceRevision,
      page = dropdown().value;
    get("source-status").textContent = "Checking the full page…";
    get("source-image").replaceChildren();
    try {
      const path = `sources/rennie-${/^[0-9]+$/.test(page) ? "p" : ""}${page}.jpg`;
      const raw = await bytes(path, controller.signal);
      if (revision !== sourceRevision) return;
      const img = new Image();
      img.src = asData(raw, "image/jpeg");
      img.alt = `Full Rennie source page ${page}, including the printed apparatus where present`;
      await img.decode();
      if (revision !== sourceRevision) return;
      get("source-image").replaceChildren(img);
      get("source-status").textContent =
        `Page ${page} · complete checked image. The scan is of a printed edition, not the original contract.`;
      get<HTMLAnchorElement>("archive").href =
        `https://archive.org/details/p2orationesrecog02demouoft/page/${/^[0-9]+$/.test(page) ? page : `n${page === "title" ? 6 : 7}`}/mode/1up`;
    } catch (e) {
      if (revision === sourceRevision)
        get("source-status").textContent =
          e instanceof Error ? e.message : "Page unavailable. Retry when connected.";
    }
  }
  function selectReading(id: string): void {
    const r = readings.find((r) => r.id === id);
    if (!r) return;
    get("reading-text").innerHTML = readingHtml(id, readings);
    for (const b of document.querySelectorAll<HTMLButtonElement>("[data-reading]"))
      b.setAttribute("aria-pressed", String(b.dataset.reading === id));
    dropdown().value = String(r.page);
    void showSource();
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-reading]"))
    b.addEventListener("click", () => selectReading(b.dataset.reading ?? ""));
  document.getElementById("app")?.addEventListener("click", (event) => {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href^="#read-"]')
        : null;
    const id = link?.getAttribute("href")?.slice(6);
    if (id) selectReading(id);
  });
  function fragment(): void {
    if (location.hash.startsWith("#read-")) selectReading(location.hash.slice(6));
  }
  window.addEventListener("hashchange", fragment);
  fragment();
  dropdown().addEventListener("change", () => void showSource());
  get("retry-source").addEventListener("click", () => void showSource());
  get("enlarge").addEventListener("click", () => {
    const expanded = get("enlarge").getAttribute("aria-pressed") !== "true";
    get("enlarge").setAttribute("aria-pressed", String(expanded));
    get("enlarge").textContent = expanded ? "Fit page to column" : "Enlarge page";
    document.querySelector(".source-viewport")?.classList.toggle("enlarged", expanded);
  });
  void showSource();
}
