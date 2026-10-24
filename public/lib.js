// Pure helpers shared by the app, the Worker and the tests. No DOM, no fetch.

export const SECTIONS = ["reservations", "places", "packing", "documents", "notes", "expenses", "plans", "settings", "placenotes"];

export const emptyDb = () => ({ v: 1, trips: { ts: 0, v: [] }, data: {} });

/** Sets one section of one trip, stamped with `now`. */
export function setSection(db, tripId, section, value, now = Date.now()) {
  (db.data[tripId] ??= {})[section] = { ts: now, v: value };
  return db;
}
export const getSection = (db, tripId, section, fallback) => db.data?.[tripId]?.[section]?.v ?? fallback;

/** The custom trips list, stamped. */
export function setTrips(db, trips, now = Date.now()) { db.trips = { ts: now, v: trips }; return db; }

/**
 * Merges two databases: every section (and the trips list) keeps whichever copy was written last.
 * Two devices that edit the same section at the same time end up with the later edit.
 */
export function mergeDb(a, b) {
  const out = emptyDb();
  const A = a ?? emptyDb(), B = b ?? emptyDb();
  out.trips = (B.trips?.ts ?? 0) > (A.trips?.ts ?? 0) ? B.trips : A.trips ?? { ts: 0, v: [] };
  for (const id of new Set([...Object.keys(A.data ?? {}), ...Object.keys(B.data ?? {})])) {
    out.data[id] = {};
    for (const sec of new Set([...Object.keys(A.data?.[id] ?? {}), ...Object.keys(B.data?.[id] ?? {})])) {
      const x = A.data?.[id]?.[sec], y = B.data?.[id]?.[sec];
      out.data[id][sec] = !y || (x && x.ts >= y.ts) ? x : y;
    }
  }
  return out;
}
/** A stable string for a database: the same content always gives the same text, whatever the key order. */
export const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
/** The key a passphrase maps to; the passphrase itself never leaves the device. */
export const syncKey = (phrase) => sha256Hex("italy-trip-sync:" + phrase.trim());

// ---- Dates ----
export const isoDate = (d) => d.toISOString().slice(0, 10);
export function addDays(iso, n) { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return isoDate(d); }
export const daysBetween = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);
const dateFormats = new Map(); // building an Intl formatter is slow, and every card formats several dates
export function fmtDate(iso, opts = { month: "short", day: "numeric" }) {
  const key = JSON.stringify(opts);
  let f = dateFormats.get(key);
  if (!f) dateFormats.set(key, (f = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts })));
  return f.format(new Date(iso + "T12:00:00Z"));
}
export const fmtRange = (start, n) => (n < 2 ? fmtDate(start, { month: "short", day: "numeric", year: "numeric" }) : `${fmtDate(start)} – ${fmtDate(addDays(start, n - 1), { month: "short", day: "numeric", year: "numeric" })}`);
/** The most recent past occurrence of the month and day of `iso`, as of `today`: what "this day last year" means for a future date. */
export function lastOccurrence(iso, today) {
  const md = iso.slice(5);
  let y = Number(today.slice(0, 4));
  while (`${y}-${md}` >= today) y--;
  return `${y}-${md}`;
}

// ---- Distance and sailing time ----
const R_NM = 3440.065;
const rad = (d) => (d * Math.PI) / 180;
export function haversineNm(a, b) {
  const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}
export const pathNm = (pts) => pts.reduce((s, p, i) => (i ? s + haversineNm(pts[i - 1], p) : 0), 0);
export const fmtHours = (h) => { const m = Math.round(h * 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`; };

// ---- Money ----
export const money = (n, cur) => (cur === "USD" ? "$" : "€") + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Converts an amount between EUR and USD with `rate` = dollars per euro. */
export const convert = (amt, from, to, rate) => (from === to ? amt : from === "EUR" ? amt * rate : amt / rate);
export function expenseTotals(list, rate) {
  const eur = list.reduce((s, e) => s + convert(Number(e.a) || 0, e.cur || "EUR", "EUR", rate), 0);
  const by = (key) => { const m = {}; for (const e of list) { const k = key(e); m[k] = (m[k] ?? 0) + convert(Number(e.a) || 0, e.cur || "EUR", "EUR", rate); } return m; };
  return { eur, usd: eur * rate, byCategory: by((e) => e.cat || "Other"), byDay: by((e) => (e.day ? `Day ${e.day}` : "Not tied to a day")) };
}

// ---- Calendar (.ics) ----
const icsEsc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
const fold = (line) => { const out = []; let l = line; while (l.length > 74) { out.push(l.slice(0, 74)); l = " " + l.slice(74); } out.push(l); return out.join("\r\n"); };
const ymd = (iso) => iso.replace(/-/g, "");
/**
 * An iCalendar file: one all-day event per trip day, and one timed (or all-day) event per reservation that has a date.
 * `days` = [{date, title, desc}], `reservations` = [{id,title,date,time,type,conf,note}].
 */
export function buildIcs({ id, name, days, reservations = [], stamp = new Date() }) {
  const dt = stamp.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Travel//Trip planner//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${icsEsc(name)}`];
  for (const d of days) {
    lines.push("BEGIN:VEVENT", `UID:${id}-day-${d.date}@travel`, `DTSTAMP:${dt}`, `DTSTART;VALUE=DATE:${ymd(d.date)}`, `DTEND;VALUE=DATE:${ymd(addDays(d.date, 1))}`, fold(`SUMMARY:${icsEsc(d.title)}`), fold(`DESCRIPTION:${icsEsc(d.desc)}`), "END:VEVENT");
  }
  for (const r of reservations) {
    if (!r.date) continue;
    const desc = [r.type, r.conf && `Confirmation: ${r.conf}`, r.note].filter(Boolean).join("\n");
    lines.push("BEGIN:VEVENT", `UID:${id}-res-${r.id ?? r.title}@travel`, `DTSTAMP:${dt}`);
    if (r.time) lines.push(`DTSTART:${ymd(r.date)}T${r.time.replace(":", "")}00`, `DTEND:${ymd(r.date)}T${String(Math.min(23, Number(r.time.slice(0, 2)) + 1)).padStart(2, "0")}${r.time.slice(3, 5)}00`);
    else lines.push(`DTSTART;VALUE=DATE:${ymd(r.date)}`, `DTEND;VALUE=DATE:${ymd(addDays(r.date, 1))}`);
    lines.push(fold(`SUMMARY:${icsEsc(r.title)}`), fold(`DESCRIPTION:${icsEsc(desc)}`), "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// ---- Links ----
/** Only http(s) links are ever rendered as links. */
export const safeUrl = (u) => { try { const x = new URL(String(u).trim(), "https://x.invalid"); return /^https?:$/.test(x.protocol) && x.hostname !== "x.invalid" ? x.href : ""; } catch { return ""; } };
export const googleMapsUrl = (ll, name) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ll[0]},${ll[1]}`)}`;
/** Street view of a point: opens Google Maps in its street-level view (no key needed). */
export const streetViewUrl = (ll) => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(`${ll[0]},${ll[1]}`)}`;
/** The embeddable street view (Google Maps Embed API, needs a key). Empty when there is no key. */
export const streetViewEmbedUrl = (ll, key) => (key ? `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(key)}&location=${encodeURIComponent(`${ll[0]},${ll[1]}`)}&fov=90` : "");
export const appleMapsUrl = (ll, name) => `https://maps.apple.com/?ll=${ll[0]},${ll[1]}&q=${encodeURIComponent(name)}`;

/** Moves legacy string lists to records. */
export const asRecords = (list, field = "title") => (Array.isArray(list) ? list : []).map((x, i) => (typeof x === "string" ? { id: "m" + i, [field]: x } : x));
export const uid = () => Math.random().toString(36).slice(2, 10);

// ---- Map tour: the whole trip as one connected path ----
const deg = (r) => (r * 180) / Math.PI;
/** Compass bearing in degrees from `a` to `b` (0 = north, 90 = east). */
export function bearing(a, b) {
  const p1 = rad(a[0]), p2 = rad(b[0]), dl = rad(b[1] - a[1]);
  const y = Math.sin(dl) * Math.cos(p2), x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
export const sameLl = (a, b) => !!a && !!b && Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Typical average speeds, in knots, used to animate the tour in proportion to real travel time. The tour distance is measured in "sail
 * nautical miles", so a leg's distance is scaled by BASE_KN / the mode's speed: a train covers the same ground in a tenth of the tour time
 * a boat takes, a plane in about a sixtieth. Trains are an average including stops (about 80 mph); planes are cruise plus taxi and climb.
 */
export const BASE_KN = 7;
export const MODE_KN = { walk: 2.6, sail: BASE_KN, rail: 70, air: 450 };
export const modeScale = (mode) => BASE_KN / (MODE_KN[mode] ?? BASE_KN);
/** Real travel time, in hours, of a tour or leg length measured in sail nautical miles. */
export const tourHours = (units) => units / BASE_KN;

/**
 * Joins each day's path into one continuous path, in order. Where a day starts somewhere other than where the last one ended, a "link"
 * leg joins them. `days` = [{ n, path: [[lat,lon],...], pins: [{ name, ll }] }]. Returns the vertices, the distance (nautical miles, times a day's optional `scale`, scaled by mode so each vehicle travels at its real relative speed) along
 * the path at each vertex, the total, where each stop falls, and where each day starts and ends. A pin that is not on its day's path is a
 * side trip ("spur") and is placed at the end of that day.
 */
export function buildTour(days) {
  const verts = [], dayAt = {};
  let prevEnd = null;
  for (const d of days) {
    const pts = d.path?.length ? d.path : (d.pins ?? []).map((p) => p.ll);
    if (!pts.length) continue;
    const firstIdx = verts.length;
    let link = false, rest = pts;
    if (prevEnd) {
      if (haversineNm(prevEnd, pts[0]) > 0.2) { verts.push({ ll: pts[0], day: d.n, kind: "link", mode: d.mode, scale: d.scale }); link = true; }
      rest = pts.slice(1);
    } else { verts.push({ ll: pts[0], day: d.n, kind: "day", mode: d.mode, scale: d.scale }); rest = pts.slice(1); }
    for (const ll of rest) verts.push({ ll, day: d.n, kind: "day", mode: d.mode, scale: d.scale });
    dayAt[d.n] = { firstIdx: prevEnd && !link ? Math.max(0, firstIdx - 1) : link ? firstIdx - 1 : firstIdx, lastIdx: verts.length - 1 };
    if (dayAt[d.n].firstIdx < 0) dayAt[d.n].firstIdx = 0;
    prevEnd = pts.at(-1);
  }
  const cum = [0];
  for (let i = 1; i < verts.length; i++) cum[i] = cum[i - 1] + haversineNm(verts[i - 1].ll, verts[i].ll) * (verts[i].scale ?? 1);
  const stops = [];
  for (const d of days) {
    if (!dayAt[d.n]) continue;
    const { firstIdx, lastIdx } = dayAt[d.n];
    (d.pins ?? []).forEach((p, order) => {
      let idx = -1;
      for (let i = firstIdx; i <= lastIdx; i++) if (sameLl(verts[i].ll, p.ll)) { idx = i; break; }
      stops.push({ name: p.name, ll: p.ll, day: d.n, order, spur: idx < 0, idx: idx < 0 ? lastIdx : idx, at: cum[idx < 0 ? lastIdx : idx] });
    });
  }
  stops.sort((a, b) => a.at - b.at || a.day - b.day || a.order - b.order);
  const dayRange = Object.fromEntries(Object.entries(dayAt).map(([n, v]) => [n, { start: cum[v.firstIdx], end: cum[v.lastIdx], firstIdx: v.firstIdx, lastIdx: v.lastIdx }]));
  return { verts, cum, total: cum.at(-1) ?? 0, stops, days: dayRange };
}

/** The position `dist` nautical miles along the tour, with the heading and the leg's day and kind. */
export function pointAt(tour, dist) {
  const { verts, cum } = tour;
  if (!verts.length) return null;
  const d = Math.max(0, Math.min(dist, tour.total));
  let lo = 1, hi = verts.length - 1;
  if (verts.length === 1) return { ll: verts[0].ll, seg: 0, heading: 0, day: verts[0].day, kind: verts[0].kind };
  while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < d) lo = mid + 1; else hi = mid; }
  const a = verts[lo - 1], b = verts[lo], len = cum[lo] - cum[lo - 1], t = len > 0 ? (d - cum[lo - 1]) / len : 1;
  return { ll: [a.ll[0] + (b.ll[0] - a.ll[0]) * t, a.ll[1] + (b.ll[1] - a.ll[1]) * t], seg: lo, heading: bearing(a.ll, b.ll), day: b.day, kind: b.kind, mode: b.mode };
}

/** Points along the great circle from `a` to `b` (both [lat, lon]), `n` segments, for drawing a flight. */
export function arcPoints(a, b, n = 48) {
  const [p1, l1, p2, l2] = [rad(a[0]), rad(a[1]), rad(b[0]), rad(b[1])];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2));
  if (!d) return [a, b];
  const out = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n, A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2), y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2), z = A * Math.sin(p1) + B * Math.sin(p2);
    out.push([deg(Math.atan2(z, Math.hypot(x, y))), deg(Math.atan2(y, x))]);
  }
  return out;
}

/** Time until local midnight at the start of `iso` (a date). `state` is "before", "now" (the date itself) or "past" (the date is over). */
export function countdown(iso, now = new Date()) {
  const [y, m, d] = iso.split("-").map(Number), start = new Date(y, m - 1, d), end = new Date(y, m - 1, d + 1);
  if (now >= end) return { state: "past", days: 0, hours: 0, minutes: 0 };
  if (now >= start) return { state: "now", days: 0, hours: 0, minutes: 0 };
  const mins = Math.floor((start - now) / 60000);
  return { state: "before", days: Math.floor(mins / 1440), hours: Math.floor((mins % 1440) / 60), minutes: mins % 60 };
}
