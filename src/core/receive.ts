/** Read a bounded body with an INACTIVITY deadline. An actively arriving page
 * may take longer than the deadline. Callers verify its digest before use.
 * Do not pass fetch integrity here: native SRI can withhold headers until the
 * entire body is buffered, hiding progress from this reader.
 */
export async function receive(
  input: RequestInfo | URL,
  init: RequestInit = {},
  maxBytes = 8 * 1024 * 1024,
  idleMs = 15000,
): Promise<Response> {
  if (init.integrity) throw new Error("Verify the received bytes after reading progress.");
  const controller = new AbortController();
  const cancel = () => controller.abort(init.signal?.reason);
  init.signal?.addEventListener("abort", cancel, { once: true });
  if (init.signal?.aborted) cancel();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(
      () =>
        controller.abort(
          new DOMException(
            "Download timed out without progress. Reconnect and retry; your work is kept.",
            "TimeoutError",
          ),
        ),
      idleMs,
    );
  };
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    controller.signal.throwIfAborted();
    arm();
    const response = await fetch(input, { ...init, signal: controller.signal });
    reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    if (reader) {
      for (;;) {
        arm();
        const { done, value } = await reader.read();
        controller.signal.throwIfAborted();
        if (done) break;
        if (!value.length) continue;
        length += value.length;
        if (length > maxBytes)
          throw new Error("Downloaded file exceeds its expected size; it was not used.");
        chunks.push(value);
      }
    }
    clearTimeout(timer);
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
    const headers = new Headers(response.headers);
    // The Fetch body is already decoded. Do not claim it is still compressed.
    headers.delete("Content-Encoding");
    headers.delete("Content-Length");
    return new Response([204, 205, 304].includes(response.status) ? null : body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    controller.signal.throwIfAborted();
    throw error;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", cancel);
    controller.abort();
    if (reader) void reader.cancel().catch(() => {});
  }
}

export async function hasDigest(
  response: Response,
  expected: string,
  size: number,
): Promise<boolean> {
  if (!response.ok) return false;
  const body = await response.clone().arrayBuffer();
  if (body.byteLength !== size) return false;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", body));
  return `sha256-${btoa(String.fromCharCode(...digest))}` === expected;
}
