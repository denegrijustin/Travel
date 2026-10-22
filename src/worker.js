// The Worker only answers /api/*: a small sync store and read-only share links, both in the SYNC KV namespace.
// Everything else is static files served from ./public.
import { mergeDb, emptyDb } from "../public/lib.js";

const MAX_DB = 400_000; // bytes of JSON per synced database
const MAX_SHARE = 200_000;
const KEY = /^[a-f0-9]{64}$/;
const SHARE = /^[a-z0-9]{10}$/;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

async function readJson(req, max) {
  const text = await req.text();
  if (text.length > max) return { error: json({ error: "too large" }, 413) };
  try { return { value: JSON.parse(text) }; } catch { return { error: json({ error: "not JSON" }, 400) }; }
}
const validDb = (db) => db && typeof db === "object" && db.v === 1 && db.trips && Array.isArray(db.trips.v) && db.data && typeof db.data === "object";

export async function handleApi(req, env, url) {
  const parts = url.pathname.split("/").filter(Boolean); // ["api", kind, id]
  const [, kind, id] = parts;
  if (kind === "sync" && KEY.test(id ?? "")) {
    const k = `sync:${id}`;
    if (req.method === "GET") {
      const got = await env.SYNC.get(k);
      return got ? new Response(got, { headers: { "content-type": "application/json", "cache-control": "no-store" } }) : json({ error: "none" }, 404);
    }
    if (req.method === "PUT") {
      const { value, error } = await readJson(req, MAX_DB);
      if (error) return error;
      if (!validDb(value)) return json({ error: "not a trip database" }, 400);
      // Merge with what is stored so two devices saving at once do not overwrite each other.
      const stored = await env.SYNC.get(k, "json");
      const merged = mergeDb(stored ?? emptyDb(), value);
      const text = JSON.stringify(merged);
      if (text.length > MAX_DB) return json({ error: "too large" }, 413);
      await env.SYNC.put(k, text);
      return json(merged);
    }
    return json({ error: "method" }, 405);
  }
  if (kind === "share") {
    if (req.method === "POST" && !id) {
      const { value, error } = await readJson(req, MAX_SHARE);
      if (error) return error;
      if (!value || typeof value !== "object" || !value.trip || !Array.isArray(value.trip.days)) return json({ error: "not a trip snapshot" }, 400);
      const bytes = crypto.getRandomValues(new Uint8Array(10));
      const sid = [...bytes].map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
      await env.SYNC.put(`share:${sid}`, JSON.stringify(value), { expirationTtl: 60 * 60 * 24 * 365 });
      return json({ id: sid });
    }
    if (req.method === "GET" && SHARE.test(id ?? "")) {
      const got = await env.SYNC.get(`share:${id}`);
      return got ? new Response(got, { headers: { "content-type": "application/json", "cache-control": "no-store" } }) : json({ error: "none" }, 404);
    }
    return json({ error: "not found" }, 404);
  }
  return json({ error: "not found" }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return handleApi(req, env, url);
    return env.ASSETS.fetch(req);
  },
};
