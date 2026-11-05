import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

// Keep the port across a real outage; do not fulfill missing files with HTML.
export function reviewServer(root) {
  let directory = resolve(root);
  let port = 0;
  let server;
  const faults = new Map();
  return {
    fault(path, value) {
      faults.set(path, value);
    },
    clearFaults() {
      faults.clear();
    },
    get base() {
      return `http://127.0.0.1:${port}/nautikon/`;
    },
    use(next) {
      directory = resolve(next);
    },
    async start() {
      if (server?.listening) return;
      server = createServer(async (req, res) => {
        try {
          const path = new URL(req.url, "http://localhost").pathname;
          if (!path.startsWith("/nautikon/")) {
            res.writeHead(404).end();
            return;
          }
          const file = resolve(directory, decodeURIComponent(path.slice(10)) || "index.html");
          if (!file.startsWith(`${directory}${sep}`)) {
            res.writeHead(404).end();
            return;
          }
          const bytes = await readFile(file);
          const fault = faults.get(path);
          if (fault?.stallHeaders) return;
          if (fault?.status) {
            res
              .writeHead(fault.status, { "Content-Type": fault.contentType || "text/html" })
              .end(fault.body || "Controlled HTTP failure");
            return;
          }
          if (fault?.stallBody) {
            fault.onBody?.();
            res.writeHead(200, {
              "Content-Type": types[extname(file)] || "application/octet-stream",
              "Cache-Control": "no-store",
            });
            res.write(bytes.subarray(0, Math.min(100, bytes.length)));
            return;
          }
          res.writeHead(200, {
            "Content-Type": types[extname(file)] || "application/octet-stream",
            "Cache-Control": "no-store",
            ...(fault?.gzip ? { "Content-Encoding": "gzip" } : {}),
          });
          res.end(fault?.gzip ? gzipSync(bytes) : bytes);
        } catch {
          res.writeHead(404).end("Not found");
        }
      });
      await new Promise((accept, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", accept);
      });
      port = server.address().port;
    },
    async stop() {
      if (!server?.listening) return;
      const previous = server;
      previous.closeAllConnections();
      await new Promise((r) => previous.close(r));
    },
  };
}
