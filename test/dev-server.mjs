// Local preview: serves ./public like the Worker does, with /api/* answered from an in-memory KV store.
//   node test/dev-server.mjs [port]
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { handleApi } from "../src/worker.js";

const PUBLIC = new URL("../public/", import.meta.url).pathname;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const kv = new Map();
const env = { SYNC: { async get(k, t) { const v = kv.get(k); return v === undefined ? null : t === "json" ? JSON.parse(v) : v; }, async put(k, v) { kv.set(k, v); } } };

export function start(port = 4196) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      const body = ["GET", "HEAD"].includes(req.method) ? undefined : await new Promise((r) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => r(s)); });
      const out = await handleApi(new Request(url, { method: req.method, body }), env, url);
      res.writeHead(out.status, Object.fromEntries(out.headers)); res.end(await out.text()); return;
    }
    let file = normalize(join(PUBLIC, url.pathname));
    if (!file.startsWith(PUBLIC)) { res.writeHead(403); res.end(); return; }
    try { const data = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }); res.end(data); }
    catch { if (extname(file)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "content-type": "text/html" }); res.end(await readFile(join(PUBLIC, "index.html"))); }
  });
  return new Promise((r) => server.listen(port, "127.0.0.1", () => r(server)));
}
if (import.meta.url === `file://${process.argv[1]}`) { const p = Number(process.argv[2]) || 4196; await start(p); console.log(`http://127.0.0.1:${p}`); }
