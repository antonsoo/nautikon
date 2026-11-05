import { hasDigest, receive } from "./core/receive";

function bounded<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let abort: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
  });
  return Promise.race([task, cancelled]).finally(() => signal.removeEventListener("abort", abort));
}

async function probe(
  worker: ServiceWorker,
): Promise<{ edition?: string; complete?: boolean; count?: number; total?: number }> {
  return new Promise<{
    edition?: string;
    complete?: boolean;
    count?: number;
    total?: number;
  }>((resolve) => {
    const channel = new MessageChannel();
    const done = (data: object) => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(data);
    };
    const timer = setTimeout(() => done({}), 3000);
    channel.port1.onmessage = (e) => done(e.data && typeof e.data === "object" ? e.data : {});
    try {
      worker.postMessage({ type: "INSPECT" }, [channel.port2]);
    } catch {
      // A controller can become redundant between reading it and messaging
      // it. Settle this inspection rather than leaving an unhandled promise.
      done({});
    }
  });
}

export function installOffline(): void {
  const labelNode = document.querySelector<HTMLElement>("#offline");
  const retry = document.querySelector<HTMLButtonElement>("#retry-offline");
  if (!labelNode || !retry) return;
  const label = labelNode;
  if (import.meta.env.DEV) {
    label.textContent =
      "Development edition. Offline installation is available in the production preview.";
    return;
  }
  if (!("serviceWorker" in navigator)) {
    label.textContent =
      "Offline installation is unavailable in this browser. The illustrated reading can still be saved.";
    return;
  }
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.id = "cancel-offline";
  cancel.textContent = "Cancel offline saving";
  cancel.hidden = true;
  retry.after(cancel);
  let repairController: AbortController | null = null;
  cancel.addEventListener("click", () =>
    repairController?.abort(new DOMException("Offline saving cancelled", "AbortError")),
  );
  let revision = 0;
  let installationFailed = false;
  let saving = false;
  let repairFailure: string | null = null;
  let registration: ServiceWorkerRegistration | undefined;
  const observed = new WeakSet<ServiceWorker>();
  const registrations = new WeakSet<ServiceWorkerRegistration>();
  const invalidate = () => {
    revision++;
    label.textContent = "Offline completeness needs checking.";
  };
  async function inspect(): Promise<void> {
    const request = ++revision;
    if (saving) {
      label.textContent = "Saving the complete offline edition…";
      return;
    }
    const worker = navigator.serviceWorker.controller;
    if (!worker) {
      label.textContent = installationFailed
        ? "The complete edition is not retained. Offline installation failed; reconnect and retry offline saving."
        : "Saving the complete offline edition…";
      return;
    }
    const result = await probe(worker);
    if (request !== revision || worker !== navigator.serviceWorker.controller || saving) return;
    label.textContent =
      result.edition === __EDITION__ &&
      result.complete === true &&
      Number.isInteger(result.count) &&
      result.count === result.total &&
      (result.total ?? 0) > 0
        ? `Complete edition available offline: ${result.count}/${result.total} files. Notebook edits stay in this tab until downloaded.`
        : result.edition && result.edition !== __EDITION__
          ? "This page’s complete edition is not retained. A different edition is controlling this tab. Download your notebook JSON before reloading, then reopen it in the updated page. Your edits remain in this tab until then."
          : (repairFailure ??
            "The complete edition is not retained. Keep a notebook download; reconnect and retry offline saving.");
  }
  const watch = () => {
    const worker = registration?.installing;
    if (!worker || observed.has(worker)) return;
    observed.add(worker);
    const changed = () => {
      if (worker.state === "redundant") installationFailed = true;
      if (worker.state === "activated" || worker.state === "redundant") void inspect();
    };
    worker.addEventListener("statechange", changed);
    changed();
  };
  async function install(parent?: AbortSignal): Promise<void> {
    const own = new AbortController();
    const signal = parent ? AbortSignal.any([parent, own.signal]) : own.signal;
    const timer = setTimeout(() => own.abort(new Error("Offline registration timed out")), 15000);
    installationFailed = false;
    invalidate();
    try {
      registration = await bounded(
        navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
          updateViaCache: "none",
        }),
        signal,
      );
      if (!registrations.has(registration)) {
        registration.addEventListener("updatefound", watch);
        registrations.add(registration);
      }
      watch();
      await inspect();
    } catch {
      installationFailed = true;
      await inspect();
    } finally {
      clearTimeout(timer);
    }
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    invalidate();
    void inspect();
  });
  window.addEventListener("nautikon:asset-failure", () => {
    invalidate();
    void inspect();
  });
  for (const event of ["online", "offline", "focus", "pageshow"])
    window.addEventListener(event, () => {
      invalidate();
      void inspect();
    });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      invalidate();
      void inspect();
    }
  });
  setInterval(() => {
    if (!document.hidden) void inspect();
  }, 5000);
  retry.addEventListener("click", async () => {
    const controller = new AbortController();
    repairController = controller;
    retry.disabled = true;
    cancel.hidden = false;
    saving = true;
    repairFailure = null;
    invalidate();
    try {
      const response = await receive(`${import.meta.env.BASE_URL}sw.js`, {
        cache: "reload",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Worker unavailable");
      const text = await response.text();
      const match = text.match(/FILES=(\[[\s\S]*?\]), INTEGRITY=(\{[\s\S]*?\});/);
      if (!text.includes(`EDITION="${__EDITION__}"`) || !match?.[1] || !match[2])
        throw new Error("Edition changed; reload");
      const files = JSON.parse(match[1]) as string[];
      const integrity = JSON.parse(match[2]) as Record<string, string>;
      const sizeMatch = text.match(/const SIZES=(\{[^\n]*?\}), TYPES=/);
      if (!sizeMatch?.[1]) throw new Error("Edition size inventory unavailable");
      const sizes = JSON.parse(sizeMatch[1]) as Record<string, number>;
      if (
        !Array.isArray(files) ||
        !files.length ||
        files.some(
          (url) =>
            typeof url !== "string" ||
            !url.startsWith(import.meta.env.BASE_URL) ||
            !Number.isSafeInteger(sizes[url]) ||
            (sizes[url] ?? -1) < 0 ||
            !/^sha256-[A-Za-z0-9+/]{43}=$/.test(integrity[url] ?? ""),
        )
      )
        throw new Error("Invalid edition inventory");
      // Buffer verified complete bodies before replacing any retained file.
      // Explicit fetch signals bound both response headers and body reads.
      const downloaded: (readonly [string, Response])[] = [];
      let next = 0;
      await Promise.all(
        Array.from({ length: 2 }, async () => {
          for (;;) {
            const url = files[next++];
            if (!url) break;
            const file = await receive(
              url,
              { cache: "reload", signal: controller.signal },
              sizes[url],
            );
            if (!(await hasDigest(file, integrity[url] ?? "", sizes[url] ?? -1)))
              throw new Error("Edition file failed its check");
            downloaded.push([url, file]);
          }
        }),
      );
      controller.signal.throwIfAborted();
      const cache = await caches.open(`nautikon-${__EDITION__}`);
      await Promise.all(downloaded.map(([url, file]) => cache.put(url, file)));
      const worker = navigator.serviceWorker.controller;
      const inspected = worker ? await probe(worker) : null;
      // A validated current controller already knows how to serve these files.
      // Do not queue registration/update behind an unrelated stalled native job.
      if (
        !worker ||
        worker !== navigator.serviceWorker.controller ||
        inspected?.edition !== __EDITION__ ||
        inspected.complete !== true
      )
        await install(controller.signal);
      controller.signal.throwIfAborted();
    } catch (error) {
      const cancelled = controller.signal.aborted;
      controller.abort();
      repairFailure = cancelled
        ? "Offline saving cancelled. Existing verified files and your notebook are kept; retry when ready."
        : error instanceof DOMException && error.name === "TimeoutError"
          ? "The complete edition is not retained. Offline saving timed out without progress; reconnect and retry."
          : "The complete edition could not be saved. Reconnect or reload the current edition, then retry.";
    } finally {
      repairController = null;
      cancel.hidden = true;
      saving = false;
      retry.disabled = false;
      invalidate();
      await inspect();
    }
  });
  void install();
}
