import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

/** A single shared byte budget, so foreground reads compete with installation.
 * This is real HTTP streaming rather than delayed Playwright fulfillment.
 */
export async function slowReviewServer(root, bytesPerSecond = 128000) {
  const directory = resolve(root);
  const transfers = [];
  const observations = [];
  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (!pathname.startsWith("/nautikon/")) return res.writeHead(404).end();
    const file = resolve(directory, decodeURIComponent(pathname.slice(10)) || "index.html");
    if (!file.startsWith(`${directory}${sep}`)) return res.writeHead(404).end();
    try {
      const body = await readFile(file);
      const type =
        {
          ".html": "text/html",
          ".js": "application/javascript",
          ".css": "text/css",
          ".jpg": "image/jpeg",
          ".woff2": "font/woff2",
          ".json": "application/json",
          ".xml": "application/xml",
        }[extname(file)] || "text/plain";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      const record = {
        path: pathname,
        bytes: body.length,
        delivered: 0,
        startedAt: Date.now(),
        endedAt: null,
        aborted: false,
      };
      observations.push(record);
      const transfer = { res, body, offset: 0, record };
      transfers.push(transfer);
      res.on("close", () => {
        record.endedAt = Date.now();
        record.aborted = transfer.offset < body.length;
        const i = transfers.indexOf(transfer);
        if (i >= 0) transfers.splice(i, 1);
      });
    } catch {
      res.writeHead(404).end();
    }
  });
  const tick = setInterval(() => {
    if (!transfers.length) return;
    const each = Math.max(1, Math.floor(bytesPerSecond / 20 / transfers.length));
    for (const t of [...transfers]) {
      const end = Math.min(t.body.length, t.offset + each);
      t.res.write(t.body.subarray(t.offset, end));
      t.offset = end;
      t.record.delivered = end;
      if (end === t.body.length) {
        transfers.splice(transfers.indexOf(t), 1);
        t.record.endedAt = Date.now();
        t.res.end();
      }
    }
  }, 50);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${server.address().port}/nautikon/`,
    observations,
    async stop() {
      clearInterval(tick);
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    },
  };
}
