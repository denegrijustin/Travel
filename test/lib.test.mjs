import test from "node:test";
import assert from "node:assert/strict";
import { emptyDb, canon, setSection, getSection, mergeDb, setTrips, haversineNm, pathNm, fmtHours, addDays, daysBetween, lastOccurrence, expenseTotals, convert, buildIcs, safeUrl, syncKey, asRecords } from "../public/lib.js";

test("merge keeps the later write of every section and loses nothing", () => {
  const a = emptyDb(), b = emptyDb();
  setSection(a, "t", "notes", "old", 1); setSection(b, "t", "notes", "new", 2);
  setSection(a, "t", "packing", [1], 5); setSection(b, "u", "notes", "other trip", 1);
  const m = mergeDb(a, b);
  assert.equal(getSection(m, "t", "notes"), "new");
  assert.deepEqual(getSection(m, "t", "packing"), [1]);
  assert.equal(getSection(m, "u", "notes"), "other trip");
  assert.deepEqual(mergeDb(a, b), mergeDb(b, a));
  assert.deepEqual(mergeDb(m, m), m);
});
test("merge: a later trips list wins", () => {
  const a = setTrips(emptyDb(), [{ id: "x" }], 1), b = setTrips(emptyDb(), [{ id: "x" }, { id: "y" }], 2);
  assert.equal(mergeDb(a, b).trips.v.length, 2);
  assert.equal(mergeDb(b, a).trips.v.length, 2);
});
test("merge tolerates an empty side", () => {
  const a = setSection(emptyDb(), "t", "notes", "n", 3);
  assert.deepEqual(mergeDb(a, null), a);
  assert.deepEqual(mergeDb(undefined, a), a);
});
test("distance: Naples to Capri is about 18 nautical miles, and a path adds its legs", () => {
  const nm = haversineNm([40.8359, 14.2488], [40.5488, 14.2284]);
  assert.ok(nm > 16 && nm < 20, String(nm));
  assert.equal(pathNm([[0, 0]]), 0);
  assert.ok(Math.abs(pathNm([[40, 14], [40.5, 14], [41, 14]]) - 60) < 0.5);
  assert.equal(fmtHours(0.5), "30 min"); assert.equal(fmtHours(2.25), "2 h 15 min"); assert.equal(fmtHours(3), "3 h");
});
test("dates", () => {
  assert.equal(addDays("2027-06-30", 1), "2027-07-01");
  assert.equal(daysBetween("2027-06-18", "2027-06-25"), 7);
  assert.equal(lastOccurrence("2027-06-18", "2026-10-22"), "2026-06-18");
  assert.equal(lastOccurrence("2027-12-25", "2026-10-22"), "2025-12-25");
});
test("expenses convert with the rate and add up", () => {
  assert.equal(convert(100, "EUR", "USD", 1.1), 110.00000000000001);
  assert.ok(Math.abs(convert(110, "USD", "EUR", 1.1) - 100) < 1e-9);
  const t = expenseTotals([{ a: "100", cur: "EUR", cat: "Food", day: 1 }, { a: "110", cur: "USD", cat: "Food" }, { a: "bad", cur: "EUR" }], 1.1);
  assert.ok(Math.abs(t.eur - 200) < 1e-9);
  assert.ok(Math.abs(t.usd - 220) < 1e-9);
  assert.ok(Math.abs(t.byCategory.Food - 200) < 1e-9);
  assert.ok(t.byDay["Day 1"] && t.byDay["Not tied to a day"]);
});
test("calendar file: days, timed and all-day reservations, escaping and line folding", () => {
  const ics = buildIcs({ id: "t", name: "Trip, one", days: [{ date: "2027-06-18", title: "Arrive; Naples", desc: "x".repeat(200) }], reservations: [{ id: "r1", title: "Hotel", date: "2027-06-18", time: "15:00", conf: "AB1" }, { id: "r2", title: "Tour", date: "2027-06-19" }, { id: "r3", title: "No date" }], stamp: new Date("2026-01-01T00:00:00Z") });
  assert.ok(ics.startsWith("BEGIN:VCALENDAR") && ics.trimEnd().endsWith("END:VCALENDAR"));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 3);
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20270618") && ics.includes("DTSTART:20270618T150000") && ics.includes("DTEND:20270618T160000"));
  assert.ok(ics.includes("SUMMARY:Arrive\; Naples") && ics.includes("X-WR-CALNAME:Trip\\, one"));
  assert.ok(ics.split("\r\n").every((l) => l.length <= 75));
});
test("links: only http and https are links", () => {
  assert.equal(safeUrl("https://example.com/a"), "https://example.com/a");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("data:text/html,x"), "");
  assert.equal(safeUrl("/relative"), "");
  assert.equal(safeUrl(""), "");
});
test("the sync key is a stable 64-hex hash and differs by passphrase", async () => {
  const a = await syncKey("correct horse"), b = await syncKey(" correct horse "), c = await syncKey("other");
  assert.match(a, /^[a-f0-9]{64}$/); assert.equal(a, b); assert.notEqual(a, c);
});
test("legacy string lists become records", () => {
  assert.deepEqual(asRecords(["a", { id: "x", title: "b" }]), [{ id: "m0", title: "a" }, { id: "x", title: "b" }]);
  assert.deepEqual(asRecords(null), []);
});
test("canon gives the same text whatever the key order", () => {
  assert.equal(canon({ b: 1, a: { d: 2, c: [{ y: 1, x: 2 }] } }), canon({ a: { c: [{ x: 2, y: 1 }], d: 2 }, b: 1 }));
  assert.notEqual(canon({ a: 1 }), canon({ a: 2 }));
});
