import { readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const ignored = new Set([".git", "node_modules", "coverage", "dist"]);
const extensions = new Set([".js", ".mjs"]);

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) {
      continue;
    }
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (extensions.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

let failures = 0;
for (const file of walk(root)) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failures += 1;
    process.stderr.write(`${relative(root, file)}\n${result.stderr}`);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log("Source syntax check passed.");
}
