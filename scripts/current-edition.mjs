/** An untouched new tab may have booted a cached older entry while its new
 * worker was installing. Identify the controller before reloading that tab.
 * Edited tabs must export their notebooks before any reload.
 */
export async function waitForEdition(page, edition, timeout = 90000) {
  await waitForValue(
    page,
    async (expected) => {
      const worker = navigator.serviceWorker.controller;
      if (!worker) return false;
      const result = await new Promise((resolve) => {
        const channel = new MessageChannel();
        const done = (data) => {
          clearTimeout(timer);
          channel.port1.close();
          resolve(data);
        };
        const timer = setTimeout(() => done(null), 1500);
        channel.port1.onmessage = (event) => done(event.data);
        try {
          worker.postMessage({ type: "INSPECT" }, [channel.port2]);
        } catch {
          done(null);
        }
      });
      return (
        worker === navigator.serviceWorker.controller &&
        result?.edition === expected &&
        result.complete === true &&
        Number.isInteger(result.count) &&
        result.count === result.total &&
        result.total > 0
      );
    },
    edition,
    timeout,
  );
}

export async function waitForValue(page, predicate, argument = null, timeout = 30000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if ((await page.evaluate(predicate, argument)) === true) return;
    if (Date.now() >= deadline)
      throw new Error("Timed out waiting for an explicitly true browser result");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
