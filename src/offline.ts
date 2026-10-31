function bounded<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let abort: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
  });
  return Promise.race([task, cancelled]).finally(() => signal.removeEventListener("abort", abort));
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
    const result = await new Promise<{
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
      channel.port1.onmessage = (e) => done(e.data);
      worker.postMessage({ type: "INSPECT" }, [channel.port2]);
    });
    if (request !== revision || worker !== navigator.serviceWorker.controller || saving) return;
    label.textContent =
      result.edition === __EDITION__ && result.complete
        ? `Complete edition available offline: ${result.count}/${result.total} files. Notebook edits stay in this tab until downloaded.`
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
    const signal = parent ?? own.signal;
    const timer = parent
      ? undefined
      : setTimeout(() => own.abort(new Error("Offline installation timed out")), 15000);
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
      await bounded(registration.update(), signal);
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
    const timer = setTimeout(() => controller.abort(new Error("Offline saving timed out")), 15000);
    retry.disabled = true;
    saving = true;
    repairFailure = null;
    invalidate();
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sw.js`, {
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
      // Buffer verified complete bodies before replacing any retained file.
      // Explicit fetch signals bound both response headers and body reads.
      const downloaded = await Promise.all(
        files.map(async (url) => {
          const file = await fetch(url, {
            cache: "reload",
            integrity: integrity[url] ?? "",
            signal: controller.signal,
          });
          if (!file.ok) throw new Error("Edition file unavailable");
          const body = await file.arrayBuffer();
          const headers = new Headers(file.headers);
          headers.delete("Content-Encoding");
          headers.delete("Content-Length");
          return [
            url,
            new Response(body, { status: file.status, statusText: file.statusText, headers }),
          ] as const;
        }),
      );
      controller.signal.throwIfAborted();
      const cache = await caches.open(`nautikon-${__EDITION__}`);
      await Promise.all(downloaded.map(([url, file]) => cache.put(url, file)));
      await install(controller.signal);
      controller.signal.throwIfAborted();
    } catch {
      const timedOut = controller.signal.aborted;
      controller.abort();
      repairFailure = timedOut
        ? "The complete edition is not retained. Offline saving timed out; reconnect and retry."
        : "The complete edition could not be saved. Reconnect or reload the current edition, then retry.";
    } finally {
      clearTimeout(timer);
      saving = false;
      retry.disabled = false;
      invalidate();
      await inspect();
    }
  });
  void install();
}
