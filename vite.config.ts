import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import assets from "./src/asset-manifest.json" with { type: "json" };

async function files(dir: string): Promise<string[]> {
  const items = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      items.map((e) =>
        e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)],
      ),
    )
  ).flat();
}
const base = "/nautikon/";
export default defineConfig(async ({ command }) => {
  for (const a of assets) {
    const data = await readFile(`public/${a.path}`);
    if (data.length !== a.bytes || createHash("sha256").update(data).digest("hex") !== a.sha256)
      throw new Error(`Source identity changed: ${a.path}. Review before rebuilding the manifest.`);
  }
  const hash = createHash("sha256");
  for (const f of [
    ...(await files("src")),
    ...(await files("public")),
    "index.html",
    "vite.config.ts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
  ].sort()) {
    hash.update(f);
    hash.update(await readFile(f));
  }
  const edition = command === "build" ? hash.digest("hex").slice(0, 20) : "development";
  return {
    base,
    define: { __EDITION__: JSON.stringify(edition) },
    plugins: [
      {
        name: "complete-offline-voyage",
        apply: "build",
        async closeBundle() {
          const paths = (await files("dist")).filter((f) => !f.endsWith("sw.js")).sort();
          const urls = paths.map((f) => base + path.relative("dist", f).split(path.sep).join("/"));
          const integrity = Object.fromEntries(
            await Promise.all(
              paths.map(async (f, i) => [
                urls[i],
                `sha256-${createHash("sha256")
                  .update(await readFile(f))
                  .digest("base64")}`,
              ]),
            ),
          );
          await writeFile(
            "dist/sw.js",
            `const EDITION=${JSON.stringify(edition)}, CACHE="nautikon-"+EDITION, BASE=${JSON.stringify(base)}, FILES=${JSON.stringify(urls)}, INTEGRITY=${JSON.stringify(integrity)};
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u,{cache:'reload',integrity:INTEGRITY[u]})))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('nautikon-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('message', e => {
 if(e.data?.type !== 'INSPECT' || !e.ports[0]) return;
 e.waitUntil(Promise.all(FILES.map(u=>caches.match(u,{cacheName:CACHE}))).then(r=>e.ports[0].postMessage({edition:EDITION,complete:r.every(Boolean),count:r.filter(Boolean).length,total:FILES.length})).catch(()=>e.ports[0].postMessage({edition:EDITION,complete:false})));
});
self.addEventListener('fetch', e => {
 const url=new URL(e.request.url), p=url.pathname===BASE ? BASE+'index.html' : url.pathname;
 if(e.request.method!=='GET'||url.origin!==self.location.origin||!FILES.includes(p)) return;
 if(e.request.mode!=='navigate' && e.request.cache==='reload') { e.respondWith(fetch(e.request)); return; }
 if(e.request.mode!=='navigate') { e.respondWith(caches.match(p,{cacheName:CACHE}).then(r=>r||fetch(e.request))); return; }
 e.respondWith((async()=>{
  let timer;
  const network=fetch(e.request).then(async r=>new Response(await r.arrayBuffer(),{status:r.status,statusText:r.statusText,headers:r.headers}));
  const outcome=await Promise.race([network.then(r=>({r}),()=>({})),new Promise(resolve=>{timer=setTimeout(()=>resolve({}),2000)})]);
  clearTimeout(timer);
  if(outcome.r && outcome.r.status<500) return outcome.r;
  const saved=await caches.match(p,{cacheName:CACHE});
  return saved||outcome.r||network.catch(()=>Response.error());
 })());
});`,
          );
        },
      },
    ],
  };
});
