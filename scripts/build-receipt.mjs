import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
export async function buildIdentity(root = "dist") {
  const files = [];
  async function scan(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, e.name);
      if (e.isDirectory()) await scan(path);
      else if (e.isFile()) {
        const data = await readFile(path);
        files.push({
          path: relative(root, path),
          bytes: data.length,
          sha256: createHash("sha256").update(data).digest("hex"),
        });
      } else throw new Error("Review build must contain regular files only");
    }
  }
  await scan(root);
  files.sort((a, b) => a.path.localeCompare(b.path, "en"));
  const worker = await readFile(join(root, "sw.js"), "utf8"),
    edition = /EDITION="([a-f0-9]+)"/.exec(worker)?.[1];
  assert(edition, "Production worker has no edition identity");
  return { edition, files };
}
export async function writeReceipt(path, build, observations) {
  assert.deepEqual(
    await buildIdentity(),
    build,
    "Build changed during browser review; discard the mixed-edition observations and rerun",
  );
  await writeFile(
    path,
    JSON.stringify({ checkedAt: new Date().toISOString(), build, observations }, null, 2),
  );
}
