import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PORT = 4173;
const PUBLIC_ROOT_FILES = new Set([
  "/index.html",
  "/manifest.webmanifest",
  "/service-worker.js",
]);
const PUBLIC_PATH_PREFIXES = ["/assets/", "/src/", "/styles/"];
const SECURITY_HEADERS = Object.freeze({
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; worker-src 'self'; upgrade-insecure-requests",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
});
const CONTENT_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
});

function parsePort(value) {
  const port = Number(value ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new RangeError("PORT must be an integer between 0 and 65535");
  }
  return port;
}

function resolveRequestFile(root, requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  } catch {
    return { error: 400 };
  }
  if (pathname.includes("\0")) {
    return { error: 400 };
  }
  const publicPath = pathname === "/" ? "/index.html" : pathname;
  const publicPrefix = PUBLIC_PATH_PREFIXES.find((prefix) => publicPath.startsWith(prefix));
  if (!PUBLIC_ROOT_FILES.has(publicPath) && !publicPrefix) {
    return { error: 404 };
  }
  const relativePath = `.${publicPath}`;
  const filePath = resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return { error: 403 };
  }
  if (publicPrefix) {
    const publicDirectory = resolve(root, `.${publicPrefix}`);
    if (
      filePath !== publicDirectory
      && !filePath.startsWith(`${publicDirectory}${sep}`)
    ) {
      return { error: 403 };
    }
  }
  return { filePath, pathname: publicPath };
}

async function findStaticFile(root, requestUrl) {
  const resolved = resolveRequestFile(root, requestUrl);
  if (resolved.error) {
    return resolved;
  }
  let { filePath } = resolved;
  try {
    let fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      filePath = resolve(filePath, "index.html");
      fileStats = await stat(filePath);
    }
    if (!fileStats.isFile()) {
      return { error: 404 };
    }
    return { ...resolved, filePath, fileStats };
  } catch {
    return { error: 404 };
  }
}

export function createStaticServer({ root = PROJECT_ROOT } = {}) {
  const staticRoot = resolve(root);
  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, {
        ...SECURITY_HEADERS,
        Allow: "GET, HEAD",
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end("Method not allowed");
      return;
    }

    const result = await findStaticFile(staticRoot, request.url ?? "/");
    if (result.error) {
      response.writeHead(result.error, {
        ...SECURITY_HEADERS,
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end(result.error === 400 ? "Bad request" : "Not found");
      return;
    }

    const headers = {
      ...SECURITY_HEADERS,
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Length": result.fileStats.size,
      "Content-Type": CONTENT_TYPES[extname(result.filePath).toLowerCase()]
        ?? "application/octet-stream",
    };
    if (result.pathname === "/service-worker.js") {
      headers["Service-Worker-Allowed"] = "/";
    }
    response.writeHead(200, headers);
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(result.filePath)
      .on("error", () => response.destroy())
      .pipe(response);
  });
}

async function start() {
  const port = parsePort(process.env.PORT);
  const host = process.env.HOST || "0.0.0.0";
  const server = createStaticServer();
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, host, resolveListen);
  });
  const address = server.address();
  const boundPort = typeof address === "object" && address ? address.port : port;
  process.stdout.write(`DOFFA Heroes serving on http://${host}:${boundPort}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
