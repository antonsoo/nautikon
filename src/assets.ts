import assets from "./asset-manifest.json";
import { receive } from "./core/receive";

export { assets };
export async function bytes(path: string, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  const item = assets.find((a) => a.path === path);
  if (!item) throw new Error(`Unknown source file: ${path}`);
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) cancel();

  try {
    const url = new URL(import.meta.env.BASE_URL + path, location.href);
    let response: Response | undefined;
    const cached = async () =>
      "caches" in window ? caches.match(url, { cacheName: `nautikon-${__EDITION__}` }) : undefined;
    response = await cached();
    if (!response) {
      try {
        response = await receive(url, { cache: "no-store", signal: controller.signal }, item.bytes);
      } catch (error) {
        controller.signal.throwIfAborted();
        response = await cached();
        if (
          !response &&
          (error instanceof RangeError ||
            (error instanceof DOMException && error.name === "TimeoutError"))
        )
          throw error;
      }
    }
    controller.signal.throwIfAborted();
    if (!response?.ok) throw new Error(`Could not load ${path}. Reconnect and try again.`);
    const data = new Uint8Array(await response.arrayBuffer());
    controller.signal.throwIfAborted();
    const sha = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
    if (data.length !== item.bytes || sha !== item.sha256) {
      throw new Error(
        `Source check failed for ${path}. The file was not used. Reload this edition or restore the source.`,
      );
    }
    return data;
  } catch (e) {
    window.dispatchEvent(new Event("nautikon:asset-failure"));
    if (e instanceof RangeError)
      throw new Error(
        `Source check failed for ${path}. The file was not used because it exceeds the retained size.`,
        { cause: e },
      );
    throw e;
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
}
export function asData(data: Uint8Array, mime: string): string {
  let s = "";
  for (let i = 0; i < data.length; i += 16384)
    s += String.fromCharCode(...data.subarray(i, i + 16384));
  return `data:${mime};base64,${btoa(s)}`;
}
