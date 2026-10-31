import { asData, assets, bytes } from "./assets";
import { esc } from "./html";
export async function retainedBundle(signal: AbortSignal) {
  const loaded = new Map<string, Uint8Array>();
  for (const a of assets) {
    signal.throwIfAborted();
    loaded.set(a.path, await bytes(a.path, signal));
  }
  signal.throwIfAborted();
  const text = (path: string) => new TextDecoder().decode(loaded.get(path));
  const data = (path: string) => {
    const item = assets.find((a) => a.path === path),
      raw = loaded.get(path);
    if (!item || !raw) throw new Error(`Missing export source ${path}`);
    return asData(raw, item.mime);
  };
  const font = `@font-face{font-family:Gentium;src:url('${data("fonts/gentium-book-plus-400-latin.woff2")}')}@font-face{font-family:Gentium;src:url('${data("fonts/gentium-book-plus-400-latin-ext.woff2")}');unicode-range:U+0100-024F,U+1E00-1EFF}@font-face{font-family:Gentium;src:url('${data("fonts/gentium-book-plus-400-greek-ext.woff2")}');unicode-range:U+1F00-1FFF}@font-face{font-family:Gentium;src:url('${data("fonts/gentium-book-plus-400-greek.woff2")}');unicode-range:U+0370-03FF}`;
  const appendix = `<h2>Complete printed source pages</h2>${assets
    .filter((a) => a.mime === "image/jpeg")
    .map(
      (a) =>
        `<figure class="source"><figcaption>${esc(a.path)} · Full page of the Toronto copy, Internet Archive. The 1939 reprint of Rennie’s 1921 edition; apparatus retained.</figcaption><img src="${data(a.path)}" alt="${esc(a.path)} full printed page"></figure>`,
    )
    .join(
      "",
    )}<h2>Attribution, retained files and reuse</h2><p>Greek: Perseus Digital Library, Tufts University, Rennie text, CC BY-SA 4.0. Whitespace normalized in excerpts and full-section transcripts. New English, notes, diagrams and software: Anthony Mercer, MIT. Fonts: SIL Open Font License. The electronic documents are retained unchanged.</p>${["sources/NOTICE.txt", "sources/provenance.json", "sources/CC-BY-SA-4.0.txt", "fonts/OFL.txt", "LICENSE.txt"].map((p) => `<details><summary>${esc(p)}</summary><pre>${esc(text(p))}</pre></details>`).join("")}<ul>${assets
    .filter((a) => a.path.endsWith(".xml"))
    .map(
      (a) =>
        `<li><a href="${data(a.path)}" download="${esc(a.path.split("/").at(-1))}">${esc(a.path)} · ${a.sha256}</a></li>`,
    )
    .join(
      "",
    )}</ul><details><summary>Actual embedded source and font inventory</summary><pre>${esc(JSON.stringify(assets, null, 2))}</pre></details>`;
  return { font, appendix };
}
