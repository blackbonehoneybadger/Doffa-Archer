import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "node_modules", "coverage", "dist"]);
const textExtensions = new Set([
  "",
  ".bash",
  ".cjs",
  ".conf",
  ".css",
  ".go",
  ".html",
  ".ini",
  ".java",
  ".js",
  ".jsx",
  ".json",
  ".kt",
  ".md",
  ".mjs",
  ".php",
  ".properties",
  ".ps1",
  ".py",
  ".rb",
  ".rs",
  ".sh",
  ".svg",
  ".swift",
  ".toml",
  ".txt",
  ".ts",
  ".tsx",
  ".webmanifest",
  ".xml",
  ".yml",
  ".yaml",
  ".zsh",
]);

const patterns = [
  {
    name: "private key material",
    expression: new RegExp(
      ["-----BEGIN", "(?:(?:OPENSSH|RSA|EC|DSA|PGP) )?PRIVATE KEY(?: BLOCK)?-----"].join(" "),
      "i",
    ),
  },
  {
    name: "GitHub token",
    expression: new RegExp(
      ["(?:gh", "[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})"].join(""),
    ),
  },
  {
    name: "OpenAI-style secret",
    expression: new RegExp(["s", "k-[A-Za-z0-9_-]{20,}"].join("")),
  },
  {
    name: "AWS access key",
    expression: new RegExp(["(?:AK", "IA|ASIA)[0-9A-Z]{16}"].join("")),
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
    name: "npm access token",
    expression: new RegExp(["npm", "_[0-9A-Za-z]{30,}"].join("")),
  },
  {
    name: "GitLab access token",
    expression: new RegExp(["gl", "pat-[0-9A-Za-z_-]{20,}"].join("")),
  },
  {
    name: "Hugging Face access token",
    expression: new RegExp(["h", "f_[0-9A-Za-z]{30,}"].join("")),
  },
  {
    name: "Slack access token",
    expression: new RegExp(["xo", "x[baprs]-[0-9A-Za-z-]{20,}"].join("")),
  },
  {
    name: "npm auth assignment",
    expression: new RegExp(["_auth", "Token\\s*=\\s*[^\\s$][^\\r\\n]{15,}"].join(""), "i"),
  },
  {
    name: "age private key",
    expression: new RegExp(["AGE-SECRET", "-KEY-1[0-9A-Z]{20,}"].join(""), "i"),
  },
  {
    name: "Solana keypair byte array",
    expression: new RegExp(["\\[(?:\\s*\\d{1,3}\\s*,){31,63}", "\\s*\\d{1,3}\\s*\\]"].join("")),
  },
  {
    name: "assigned high-entropy secret",
    expression: new RegExp(
      [
        "(?:PRIVATE_KEY|SECRET_KEY|SEED_PHRASE|MNEMONIC|API_KEY|ACCESS_TOKEN|AUTH_TOKEN|CLIENT_SECRET|SIGNING_KEY|WALLET_SECRET)",
        "\\s*[:=]\\s*['\\\"][^'\\\"]{16,}['\\\"]",
      ].join(""),
      "i",
    ),
  },
];

const dangerousFileNames = [
  /(^|\/)\.env(?:\.(?!(?:example|sample|template)$)[^/]+)?$/i,
  /(^|\/)(?:\.envrc|\.dev\.vars|\.netrc)$/i,
  /(^|\/)id_(?:rsa|dsa|ecdsa|ed25519)$/i,
  /(^|\/)id\.json$/i,
  /(^|\/)(?:[^/]*[-_.])?(?:wallet|reward-wallet|keypair)(?:[-_.][^/]*)?\.json$/i,
  /(^|\/)(?:secrets?|credentials?|service-account)(?:\.[^/]+)?$/i,
  /(^|\/)[^/]*firebase-adminsdk[^/]*\.json$/i,
  /\.(?:jks|key|keystore|pem|p12|pfx)$/i,
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
    } else {
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
  if (!textExtensions.has(extname(file).toLowerCase())) {
    continue;
  }
  const content = readFileSync(file, "utf8");
  for (const pattern of patterns) {
    if (pattern.expression.test(content)) {
      findings.push(`${fileName}: ${pattern.name}`);
    }
  }
}

const repositoryCheck = spawnSync(
  "git",
  ["rev-parse", "--is-inside-work-tree"],
  { cwd: root, encoding: "utf8" },
);
if (repositoryCheck.status === 0 && repositoryCheck.stdout.trim() === "true") {
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
  } else {
    findings.push("git history: scan could not be completed");
  }

  const historyNames = spawnSync(
    "git",
    ["log", "--all", "--format=", "--name-only"],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (historyNames.status === 0) {
    const historicalFiles = historyNames.stdout.split(/\r?\n/).filter(Boolean);
    if (historicalFiles.some((fileName) => dangerousFileNames.some((pattern) => pattern.test(fileName)))) {
      findings.push("git history: sensitive filename");
    }
  } else {
    findings.push("git history: filename scan could not be completed");
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
