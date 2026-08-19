import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "node_modules", "coverage", "dist"]);
const textExtensions = new Set([
  "",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".txt",
  ".webmanifest",
  ".yml",
  ".yaml",
]);

const patterns = [
  {
    name: "private key material",
    expression: new RegExp(["-----BEGIN", "PRIVATE KEY-----"].join(" "), "i"),
  },
  {
    name: "GitHub token",
    expression: new RegExp(["gh", "p_[A-Za-z0-9]{30,}"].join("")),
  },
  {
    name: "OpenAI-style secret",
    expression: new RegExp(["s", "k-[A-Za-z0-9_-]{20,}"].join("")),
  },
  {
    name: "AWS access key",
    expression: new RegExp(["AK", "IA[0-9A-Z]{16}"].join("")),
  },
  {
    name: "assigned high-entropy secret",
    expression: new RegExp(
      ["(?:PRIVATE_KEY|SECRET_KEY|SEED_PHRASE|MNEMONIC|API_KEY|ACCESS_TOKEN)", "\\s*[:=]\\s*['\\\"][^'\\\"]{16,}['\\\"]"].join(""),
      "i",
    ),
  },
];

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (textExtensions.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const findings = [];
for (const file of walk(root)) {
  const content = readFileSync(file, "utf8");
  for (const pattern of patterns) {
    if (pattern.expression.test(content)) {
      findings.push(`${relative(root, file)}: ${pattern.name}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Potential secrets detected:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exitCode = 1;
} else {
  console.log("Secret scan passed.");
}
