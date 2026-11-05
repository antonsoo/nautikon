import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as buildRuntime, defineConfig } from "vite";
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
    "testimony.html",
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
    build: { rollupOptions: { input: { voyage: "index.html", testimony: "testimony.html" } } },
    plugins: [
      {
        name: "edition-marked-pages",
        transformIndexHtml(html: string) {
          return html.replace(
            "<head>",
            `<head><meta name="nautikon-edition" content="${edition}">`,
          );
        },
      },
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
          const sizes = Object.fromEntries(
            await Promise.all(paths.map(async (f, i) => [urls[i], (await readFile(f)).length])),
          );
          const mime: Record<string, string> = {
            ".html": "text/html; charset=utf-8",
            ".js": "application/javascript",
            ".css": "text/css",
            ".jpg": "image/jpeg",
            ".woff2": "font/woff2",
            ".xml": "application/xml",
            ".json": "application/json",
            ".txt": "text/plain; charset=utf-8",
          };
          const types = Object.fromEntries(
            paths.map((f, i) => [urls[i], mime[path.extname(f)] ?? "application/octet-stream"]),
          );
          const runtime = await buildRuntime({
            configFile: false,
            publicDir: false,
            logLevel: "error",
            build: {
              write: false,
              lib: {
                entry: path.resolve("src/service-worker.ts"),
                name: "NautikonWorker",
                formats: ["iife"],
              },
              minify: true,
            },
          });
          const result = Array.isArray(runtime) ? runtime[0] : runtime;
          if (!result || !("output" in result)) throw new Error("Worker runtime did not build");
          const chunk = result.output.find((item) => item.type === "chunk" && item.isEntry);
          if (chunk?.type !== "chunk") throw new Error("Worker runtime has no entry");
          await writeFile(
            "dist/sw.js",
            `const EDITION=${JSON.stringify(edition)}, CACHE="nautikon-"+EDITION, BASE=${JSON.stringify(base)}, FILES=${JSON.stringify(urls)}, INTEGRITY=${JSON.stringify(integrity)};
const SIZES=${JSON.stringify(sizes)}, TYPES=${JSON.stringify(types)};
${chunk.code}`,
          );
        },
      },
    ],
  };
});
