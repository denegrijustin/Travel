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

import { bearing, sameLl, easeInOut, buildTour, pointAt } from "../public/lib.js";
test("bearing: north, east, south, west", () => {
  assert.ok(Math.abs(bearing([0, 0], [1, 0]) - 0) < 1e-6);
  assert.ok(Math.abs(bearing([0, 0], [0, 1]) - 90) < 1e-6);
  assert.ok(Math.abs(bearing([1, 0], [0, 0]) - 180) < 1e-6);
  assert.ok(Math.abs(bearing([0, 1], [0, 0]) - 270) < 1e-6);
});
test("easing runs from 0 to 1 and is symmetric", () => {
  assert.equal(easeInOut(0), 0); assert.equal(easeInOut(1), 1); assert.equal(easeInOut(0.5), 0.5);
  assert.ok(Math.abs(easeInOut(0.25) + easeInOut(0.75) - 1) < 1e-9);
});
const A = [40, 14], B = [40.1, 14], C = [40.1, 14.1], D = [40.3, 14.3];
test("tour: days that meet are joined without a link, days that do not get one", () => {
  const t = buildTour([{ n: 1, path: [A, B], pins: [{ name: "A", ll: A }, { name: "B", ll: B }] }, { n: 2, path: [B, C], pins: [{ name: "C", ll: C }] }, { n: 3, path: [D], pins: [{ name: "D", ll: D }] }]);
  assert.equal(t.verts.length, 4 + 0); // A, B, C, then D as a link
  assert.deepEqual(t.verts.map((v) => v.kind), ["day", "day", "day", "link"]);
  assert.ok(Math.abs(t.total - (haversineNm(A, B) + haversineNm(B, C) + haversineNm(C, D))) < 1e-9);
  assert.deepEqual(t.stops.map((s) => s.name), ["A", "B", "C", "D"]);
  assert.ok(t.stops.every((s) => !s.spur));
  assert.equal(t.days[2].start, t.stops[1].at); // day 2 starts where day 1 ended
  assert.equal(t.days[3].start, t.days[2].end); // the link belongs to day 3
});
test("tour: a pin off the path is a side trip placed at the end of its day", () => {
  const off = [41, 15];
  const t = buildTour([{ n: 1, path: [A, B], pins: [{ name: "A", ll: A }, { name: "Side", ll: off }] }]);
  const side = t.stops.find((s) => s.name === "Side");
  assert.ok(side.spur); assert.equal(side.at, t.total);
});
test("tour: a day with no path uses its pins; empty days are skipped", () => {
  const t = buildTour([{ n: 1, path: [], pins: [{ name: "A", ll: A }] }, { n: 2, path: [], pins: [] }, { n: 3, path: [], pins: [{ name: "B", ll: B }] }]);
  assert.equal(t.verts.length, 2); assert.equal(t.days[2], undefined);
  assert.equal(buildTour([]).total, 0);
});
test("pointAt walks along the path with a heading", () => {
  const t = buildTour([{ n: 1, path: [A, B, C], pins: [] }]);
  const start = pointAt(t, 0), end = pointAt(t, t.total + 5), mid = pointAt(t, haversineNm(A, B) / 2);
  assert.ok(sameLl(start.ll, A) && sameLl(end.ll, C));
  assert.ok(Math.abs(mid.ll[0] - 40.05) < 1e-3 && Math.abs(mid.heading - 0) < 1e-6);
  assert.ok(Math.abs(pointAt(t, haversineNm(A, B) + 0.5).heading - 90) < 1);
  assert.equal(pointAt({ verts: [], cum: [], total: 0 }, 1), null);
});

import { arcPoints } from "../public/lib.js";
test("arcPoints runs from a to b along a great circle", () => {
  const a = [39.2976, -94.7139], b = [43.6777, -79.6248], pts = arcPoints(a, b, 10);
  assert.equal(pts.length, 11);
  assert.ok(Math.abs(pts[0][0] - a[0]) < 1e-6 && Math.abs(pts[10][1] - b[1]) < 1e-6);
  const mid = arcPoints([40, -75], [50, 5], 2)[1];
  assert.ok(mid[0] > 45, "a transatlantic arc bows north of the straight line");
});
