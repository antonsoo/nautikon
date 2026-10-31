export const esc = (value: unknown): string =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
export const money = (n: number | null): string =>
  n === null ? "Undetermined" : n.toLocaleString("en-US");
export const day = (n: number | null): string =>
  n === null
    ? "unknown"
    : n === 0
      ? "at Arcturus"
      : `${Math.abs(n)} days ${n < 0 ? "before" : "after"} Arcturus`;
export function download(name: string, value: BlobPart, mime: string): void {
  const url = URL.createObjectURL(new Blob([value], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
