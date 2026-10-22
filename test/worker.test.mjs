import test from "node:test";
import assert from "node:assert/strict";
import { handleApi } from "../src/worker.js";
import { emptyDb, setSection, getSection } from "../public/lib.js";

class KV { constructor() { this.m = new Map(); } async get(k, type) { const v = this.m.get(k); return v === undefined ? null : type === "json" ? JSON.parse(v) : v; } async put(k, v, opts) { this.m.set(k, v); this.last = opts; } }
const env = () => ({ SYNC: new KV() });
const call = (e, method, path, body) => handleApi(new Request("https://x.test" + path, { method, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) }), e, new URL("https://x.test" + path));
const KEY = "a".repeat(64);

test("sync: nothing yet is a 404, a PUT stores, a GET returns it", async () => {
  const e = env();
  assert.equal((await call(e, "GET", `/api/sync/${KEY}`)).status, 404);
  const db = setSection(emptyDb(), "t", "notes", "hi", 5);
  assert.equal((await call(e, "PUT", `/api/sync/${KEY}`, db)).status, 200);
  const got = await (await call(e, "GET", `/api/sync/${KEY}`)).json();
  assert.equal(getSection(got, "t", "notes"), "hi");
});
test("sync: a PUT merges with what is stored, so concurrent devices lose nothing", async () => {
  const e = env();
  await call(e, "PUT", `/api/sync/${KEY}`, setSection(emptyDb(), "t", "notes", "from A", 5));
  const r = await call(e, "PUT", `/api/sync/${KEY}`, setSection(emptyDb(), "t", "packing", ["b"], 6));
  const merged = await r.json();
  assert.equal(getSection(merged, "t", "notes"), "from A");
  assert.deepEqual(getSection(merged, "t", "packing"), ["b"]);
});
test("sync: bad keys, bad bodies and oversized bodies are refused", async () => {
  const e = env();
  assert.equal((await call(e, "GET", "/api/sync/short")).status, 404);
  assert.equal((await call(e, "PUT", `/api/sync/${KEY}`, "not json")).status, 400);
  assert.equal((await call(e, "PUT", `/api/sync/${KEY}`, { v: 2 })).status, 400);
  assert.equal((await call(e, "PUT", `/api/sync/${KEY}`, { v: 1, trips: { ts: 0, v: [] }, data: {}, pad: "x".repeat(500_000) })).status, 413);
  assert.equal((await call(e, "DELETE", `/api/sync/${KEY}`)).status, 405);
});
test("share: a snapshot gets an id and reads back; unknown ids and junk are refused", async () => {
  const e = env();
  const snap = { trip: { name: "T", days: [] } };
  const { id } = await (await call(e, "POST", "/api/share", snap)).json();
  assert.match(id, /^[a-z0-9]{10}$/);
  assert.ok(e.SYNC.last.expirationTtl > 0);
  assert.deepEqual(await (await call(e, "GET", `/api/share/${id}`)).json(), snap);
  assert.equal((await call(e, "GET", "/api/share/zzzzzzzzzz")).status, 404);
  assert.equal((await call(e, "POST", "/api/share", { nope: 1 })).status, 400);
  assert.equal((await call(e, "GET", "/api/share/..%2F..")).status, 404);
  assert.equal((await call(e, "GET", "/api/other")).status, 404);
});
