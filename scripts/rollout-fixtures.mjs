import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const inputs = [
  "src",
  "public",
  "index.html",
  "testimony.html",
  "vite.config.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
];
assert.equal(
  execFileSync("git", ["status", "--porcelain", "--", ...inputs], { encoding: "utf8" }),
  "",
  "Commit build inputs before testing an edition upgrade",
);
const root = await mkdtemp(join(tmpdir(), "nautikon-rollout-")),
  sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
execFileSync("tar", ["-x", "-C", root], {
  input: execFileSync("git", ["archive", "HEAD"], { maxBuffer: 64 * 1024 * 1024 }),
});
const run = (program, args) => execFileSync(program, args, { cwd: root, stdio: "inherit" });
run("npm", ["ci"]);
run("npm", ["run", "build"]);
await cp(join(root, "dist"), join(root, "edition-a"), { recursive: true });
const index = join(root, "index.html"),
  notice = join(root, "public/sources/NOTICE.txt");
await writeFile(
  index,
  (await readFile(index, "utf8")).replace(
    "<head>",
    "<head><!-- Controlled local edition-upgrade fixture; never published. -->",
  ),
);
await writeFile(
  notice,
  `${await readFile(notice, "utf8")}\nControlled local upgrade fixture: a changed retained notice, not new historical evidence. Never published.\n`,
);
run("python3", ["scripts/retain-sources.py"]);
run("npm", ["run", "build"]);
await cp(join(root, "dist"), join(root, "edition-b"), { recursive: true });
await mkdir("test-results", { recursive: true });
await writeFile("test-results/rollout-fixture-path.txt", `${root}\n`);
await writeFile(
  "test-results/rollout-fixture-source.json",
  `${JSON.stringify({ sourceCommit, root, changes: "Second fixture adds an HTML comment and a changed retained notice; neither fixture is published" }, null, 2)}\n`,
);
console.log("Two committed-source rollout fixtures ready.");
