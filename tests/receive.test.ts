import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { receive } from "../src/core/receive";

async function fixture(run: (base: string) => Promise<void>) {
  const server = createServer((req, res) => {
    if (req.url === "/headers") return;
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("a");
    if (req.url === "/stall") return;
    let count = 0;
    const timer = setInterval(() => {
      if (++count === 12) {
        clearInterval(timer);
        res.end("z");
      } else res.write("b");
    }, 20);
    res.on("close", () => clearInterval(timer));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  }
}
test("an active HTTP body can outlive its inactivity budget", async () => {
  await fixture(async (base) => {
    const start = performance.now();
    const response = await receive(`${base}/progress`, {}, 100, 100);
    assert.equal(await response.text(), `a${"b".repeat(11)}z`);
    assert.ok(performance.now() - start > 100);
  });
});
test("missing headers and stalled bodies settle as inactivity, not successful files", async () => {
  await fixture(async (base) => {
    for (const path of ["headers", "stall"])
      await assert.rejects(receive(`${base}/${path}`, {}, 100, 100), { name: "TimeoutError" });
  });
});
test("caller cancellation and a byte limit bound a progressing response", async () => {
  await fixture(async (base) => {
    const controller = new AbortController();
    const pending = receive(`${base}/progress`, { signal: controller.signal }, 100, 100);
    setTimeout(() => controller.abort(new DOMException("Chosen cancellation", "AbortError")), 45);
    await assert.rejects(pending, { name: "AbortError", message: "Chosen cancellation" });
    await assert.rejects(receive(`${base}/progress`, {}, 3, 100), /expected size/);
  });
});
