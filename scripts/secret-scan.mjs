import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

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
    name: "Google API key",
    expression: new RegExp(["AI", "za[0-9A-Za-z_-]{30,}"].join("")),
  },
  {
    name: "Stripe secret key",
    expression: new RegExp(["s", "k_(?:live|test)_[0-9A-Za-z]{16,}"].join("")),
  },
  {
    name: "Vercel access token",
    expression: new RegExp(["ver", "cel_[0-9A-Za-z]{20,}"].join(""), "i"),
  },
  {
    name: "Solana keypair byte array",
    expression: new RegExp(["\\[(?:\\s*\\d{1,3}\\s*,){31,63}", "\\s*\\d{1,3}\\s*\\]"].join("")),
  },
  {
    name: "assigned high-entropy secret",
    expression: new RegExp(
      ["(?:PRIVATE_KEY|SECRET_KEY|SEED_PHRASE|MNEMONIC|API_KEY|ACCESS_TOKEN)", "\\s*[:=]\\s*['\\\"][^'\\\"]{16,}['\\\"]"].join(""),
      "i",
    ),
  },
];

const dangerousFileNames = [
  /(^|\/)\.env$/i,
  /(^|\/)(?:id|wallet|reward-wallet|keypair)\.json$/i,
  /(^|\/)(?:secrets?|credentials?)\.json$/i,
  /\.(?:key|pem|p12|pfx)$/i,
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
  const fileName = relative(root, file).replaceAll("\\", "/");
  if (dangerousFileNames.some((pattern) => pattern.test(fileName))) {
    findings.push(`${fileName}: sensitive filename`);
  }
  const content = readFileSync(file, "utf8");
  for (const pattern of patterns) {
    if (pattern.expression.test(content)) {
      findings.push(`${fileName}: ${pattern.name}`);
    }
  }
}

const history = spawnSync(
  "git",
  ["log", "--all", "--format=", "--patch", "--no-ext-diff"],
  { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
if (history.status === 0) {
  for (const pattern of patterns) {
    if (pattern.expression.test(history.stdout)) {
      findings.push(`git history: ${pattern.name}`);
    }
  }
} else if (history.error?.code !== "ENOENT") {
  findings.push("git history: scan could not be completed");
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
