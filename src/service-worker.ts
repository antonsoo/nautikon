/// <reference lib="webworker" />
import { hasDigest, receive } from "./core/receive";

declare const EDITION: string;
declare const BASE: string;
declare const CACHE: string;
declare const FILES: string[];
declare const INTEGRITY: Record<string, string>;
declare const SIZES: Record<string, number>;
declare const TYPES: Record<string, string>;
const worker = self as unknown as ServiceWorkerGlobalScope;

function normalized(url: string, response: Response): Response {
  const headers = new Headers(response.headers);
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  headers.set("Content-Type", TYPES[url] ?? "application/octet-stream");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
async function saved(url: string): Promise<Response | undefined> {
  const response = await caches.match(url, { cacheName: CACHE });
  return response && (await hasDigest(response, INTEGRITY[url] ?? "", SIZES[url] ?? -1))
    ? normalized(url, response)
    : undefined;
}
async function checked(url: string, signal?: AbortSignal): Promise<Response> {
  const response = await receive(
    url,
    { cache: "reload", ...(signal ? { signal } : {}) },
    SIZES[url],
  );
  if (!(await hasDigest(response, INTEGRITY[url] ?? "", SIZES[url] ?? -1)))
    throw new Error(`Edition file failed its check: ${url}`);
  return normalized(url, response);
}

worker.addEventListener("install", (event) => {
  const controller = new AbortController();
  event.waitUntil(
    (async () => {
      try {
        // Two background reads leave bandwidth for a foreground source page.
        const downloaded = new Map<string, Response>();
        let next = 0;
        await Promise.all(
          Array.from({ length: 2 }, async () => {
            for (;;) {
              const url = FILES[next++];
              if (!url) break;
              downloaded.set(url, (await saved(url)) ?? (await checked(url, controller.signal)));
            }
          }),
        );
        controller.signal.throwIfAborted();
        const cache = await caches.open(CACHE);
        await Promise.all([...downloaded].map(([url, response]) => cache.put(url, response)));
        await worker.skipWaiting();
      } finally {
        controller.abort();
      }
    })(),
  );
});
worker.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all(
        (await caches.keys())
          .filter((k) => k.startsWith("nautikon-") && k !== CACHE)
          .map((k) => caches.delete(k)),
      );
      await worker.clients.claim();
    })(),
  );
});
let inspection:
  | Promise<{ edition: string; complete: boolean; count: number; total: number }>
  | undefined;
worker.addEventListener("message", (event) => {
  if (event.data?.type !== "INSPECT" || !event.ports[0]) return;
  inspection ??= (async () => {
    const results = await Promise.all(FILES.map((url) => saved(url).then(Boolean, () => false)));
    return {
      edition: EDITION,
      complete: results.every(Boolean),
      count: results.filter(Boolean).length,
      total: FILES.length,
    };
  })().finally(() => {
    inspection = undefined;
  });
  const pending = inspection;
  event.waitUntil(pending.then((result) => event.ports[0]?.postMessage(result)));
});

async function navigation(request: Request, path: string): Promise<Response> {
  const controller = new AbortController();
  const network = receive(request, { signal: controller.signal }, 1024 * 1024)
    .then(async (response) => {
      if (!response.ok || !response.headers.get("Content-Type")?.includes("text/html"))
        return undefined;
      const text = await response.clone().text();
      const marker = /<meta name="nautikon-edition" content="([a-f0-9]{20})">/.exec(text)?.[1];
      if (!marker) return undefined;
      if (
        marker === EDITION &&
        !(await hasDigest(response, INTEGRITY[path] ?? "", SIZES[path] ?? -1))
      )
        return undefined;
      return response;
    })
    .catch(() => undefined);
  let timer: number | ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      network,
      new Promise<undefined>((resolve) => {
        timer = setTimeout(resolve, 2000);
      }),
    ]);
    if (result) return result;
    const retained = await saved(path);
    if (retained) {
      controller.abort();
      return retained;
    }
    const later = await network;
    return (
      later ??
      new Response(
        "This lesson could not be loaded and no verified saved page is available. Reconnect and reload.",
        { status: 503, headers: { "Content-Type": "text/plain" } },
      )
    );
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
worker.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const path = url.pathname === BASE ? `${BASE}index.html` : url.pathname;
  if (
    event.request.method !== "GET" ||
    url.origin !== worker.location.origin ||
    !FILES.includes(path)
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(navigation(event.request, path));
    return;
  }
  // Foreground source and repair readers verify their own bytes while observing
  // actual body progress. Buffering here would conceal that progress from them.
  if (["reload", "no-store"].includes(event.request.cache)) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    (async () => {
      const retained = await saved(path);
      if (retained) return retained;
      const response = await checked(path);
      if (await caches.has(CACHE)) await (await caches.open(CACHE)).put(path, response.clone());
      return response;
    })(),
  );
});
