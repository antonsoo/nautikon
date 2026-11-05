import { createServer } from "node:http";
import { connect } from "node:net";

/** Pass HTTPS through an unchanged CONNECT tunnel; closing the gate destroys
 * existing tunnels and refuses new connections, including worker traffic.
 * No TLS interception, response substitution, browser route or fixture is used.
 */
export async function networkGate() {
  let allowed = true;
  const sockets = new Set();
  const events = [];
  const server = createServer((_req, res) => res.writeHead(503).end("HTTPS CONNECT required"));
  server.on("connect", (request, downstream, head) => {
    const event = { at: new Date().toISOString(), destination: request.url, allowed };
    events.push(event);
    if (!allowed) {
      downstream.end("HTTP/1.1 503 Network gate closed\r\nConnection: close\r\n\r\n");
      return;
    }
    let target;
    try {
      target = new URL(`http://${request.url}`);
    } catch {
      downstream.destroy();
      return;
    }
    const upstream = connect(Number(target.port) || 443, target.hostname);
    sockets.add(downstream);
    sockets.add(upstream);
    const close = () => {
      sockets.delete(downstream);
      sockets.delete(upstream);
      downstream.destroy();
      upstream.destroy();
    };
    upstream.on("connect", () => {
      if (!allowed) {
        close();
        return;
      }
      downstream.write("HTTP/1.1 200 Connection established\r\n\r\n");
      if (head.length) upstream.write(head);
      downstream.pipe(upstream);
      upstream.pipe(downstream);
    });
    downstream.on("error", close);
    upstream.on("error", close);
    downstream.on("close", close);
    upstream.on("close", close);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    events,
    block() {
      allowed = false;
      const closedSockets = sockets.size;
      for (const socket of [...sockets]) socket.destroy();
      events.push({ at: new Date().toISOString(), action: "block", closedSockets });
    },
    open() {
      allowed = true;
      events.push({ at: new Date().toISOString(), action: "open" });
    },
    async close() {
      allowed = false;
      for (const socket of [...sockets]) socket.destroy();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
