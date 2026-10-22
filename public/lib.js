// Pure helpers shared by the app, the Worker and the tests. No DOM, no fetch.

export const SECTIONS = ["reservations", "places", "packing", "documents", "notes", "expenses", "plans", "settings"];

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
export function fmtDate(iso, opts = { month: "short", day: "numeric" }) { return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", ...opts }); }
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
export const appleMapsUrl = (ll, name) => `https://maps.apple.com/?ll=${ll[0]},${ll[1]}&q=${encodeURIComponent(name)}`;

/** Moves legacy string lists to records. */
export const asRecords = (list, field = "title") => (Array.isArray(list) ? list : []).map((x, i) => (typeof x === "string" ? { id: "m" + i, [field]: x } : x));
export const uid = () => Math.random().toString(36).slice(2, 10);
