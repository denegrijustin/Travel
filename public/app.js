import { arcPoints, countdown, SECTIONS, canon, emptyDb, setSection, getSection, setTrips, mergeDb, syncKey, addDays, daysBetween, fmtDate, fmtRange, lastOccurrence, isoDate, haversineNm, pathNm, fmtHours, money, convert, expenseTotals, buildIcs, safeUrl, googleMapsUrl, appleMapsUrl, asRecords, uid } from "./lib.js";
import { ITALY_RAW, ITALY_GEO, ITALY_PHOTOS, ITALY_EXTRA } from "./data.js";
import { PLACES, slugify } from "./places.js";
import { initTripMap, initDayMap, destroyMap, flyToPin, replayDay, fitDay, dayColor } from "./map.js";

const app = document.getElementById("app"), navEl = document.getElementById("nav"), mobileNav = document.getElementById("mobileNav"), syncStat = document.getElementById("syncstat");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
const attr = esc;

// ---------------------------------------------------------------------------------------------------------------------
// Storage. One database in this browser, optionally kept in step with the Worker's KV store (see "Sync" below).
// ---------------------------------------------------------------------------------------------------------------------
const LS = "travel-db-v1", LS_SYNC = "travel-sync-key";
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const lsDel = (k) => { try { localStorage.removeItem(k); } catch {} };

function loadDb() {
  let db;
  try { db = JSON.parse(lsGet(LS)); } catch {}
  if (!db || db.v !== 1) db = emptyDb();
  // Earlier versions kept each list under its own key; bring those over once (stamped old, so any newer edit wins).
  for (const [oldName, sec] of [["reservations", "reservations"], ["places", "places"], ["packing", "packing"], ["documents", "documents"], ["notes", "notes"], ["expenses", "expenses"]]) {
    const raw = lsGet(`travel-italy-2027-${oldName}`);
    if (raw == null || db.data["italy-2027"]?.[sec]) continue;
    try { setSection(db, "italy-2027", sec, JSON.parse(raw), 1); } catch {}
  }
  return db;
}
let db = loadDb();
const persist = () => { lsSet(LS, JSON.stringify(db)); sync.dirty = true; sync.schedule(); };
const sec = (tripId, name, fallback) => getSection(db, tripId, name, fallback);
const put = (tripId, name, value) => { setSection(db, tripId, name, value); persist(); };

// ---------------------------------------------------------------------------------------------------------------------
// Trips. The built-in Italy trip and the trips you create share one shape.
// ---------------------------------------------------------------------------------------------------------------------
const ALIAS = { 1: { Salerno: "Marina d'Arechi" } }; // Italy: the first "Salerno" is the marina the boat leaves from
function italyTrip() {
  const raw = ITALY_RAW[0], X = ITALY_EXTRA;
  const days = [
    ...raw.itinerary.map(([, title, stops, desc], i) => ({ n: i + 1, title, desc, stops, photo: ITALY_PHOTOS[i + 1] ?? null, mode: i ? "sail" : "walk" })),
    ...X.days.map(([, title, stops, desc, mode], i) => ({ n: raw.itinerary.length + i + 1, title, desc, stops, photo: ITALY_PHOTOS[raw.itinerary.length + i + 1] ?? null, mode })),
  ];
  return {
    id: raw.id, name: raw.name, start: "2027-06-18", builtin: true, mode: "sail", places: 10, final: "Kansas City", // the ten towns, islands and cities; the chips list every stop
    days, legs: X.legs, airports: X.airports,
    geo: { ...ITALY_GEO, lines: X.lines, places: { ...ITALY_GEO.places, ...X.places }, route: { ...ITALY_GEO.route, ...X.route } },
  };
}
const customTrips = () => db.trips.v;
const allTrips = () => [italyTrip(), ...customTrips()];
const findTrip = (id) => allTrips().find((t) => t.id === id);
const dayDate = (trip, n) => addDays(trip.start, n - 1);
const dayLabel = (trip, n) => fmtDate(dayDate(trip, n), { weekday: "short", month: "short", day: "numeric" });
const tripDates = (trip) => fmtRange(trip.start, trip.days.length);
const uniqueStops = (trip) => trip.places ?? new Set(trip.days.flatMap((d) => d.stops.map((s) => (trip.builtin ? s : s.toLowerCase())))).size;

/** Where a day's stops and route are on the map. */
function dayGeo(trip, n) {
  const d = trip.days[n - 1], g = trip.geo ?? {};
  const places = g.places ?? {};
  const look = (name) => places[ALIAS[n]?.[name] && trip.builtin ? ALIAS[n][name] : name];
  const pins = d.stops.map((name) => ({ name, ll: look(name) })).filter((p) => p.ll);
  let path;
  if (trip.builtin) {
    path = [];
    for (const k of g.route?.[n] ?? []) { if (k === "@s") path.push(...g.s); else if (g.lines?.[k.slice(1)]) path.push(...g.lines[k.slice(1)]); else if (k === "@camp") path.push(g.camp); else if (places[k]) path.push(places[k]); }
  } else path = pins.map((p) => p.ll);
  return { pins, path };
}

// ---------------------------------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------------------------------
let toastTimer;
function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2600);
}
const download = (name, text, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
const today = () => isoDate(new Date());
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip";
async function getJson(url, opts) { const r = await fetch(url, opts); if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status }); return r.json(); }

// Place search (OpenStreetMap's Nominatim): used for the stops of trips you create and for saved places. One request at a time, cached.
const geoCache = new Map();
let geoQueue = Promise.resolve();
function geocode(q) {
  const key = q.trim().toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key);
  const p = (geoQueue = geoQueue.then(async () => {
    try {
      const r = await getJson("https://nominatim.openstreetmap.org/search?" + new URLSearchParams({ q, format: "json", limit: "1" }));
      await new Promise((res) => setTimeout(res, 1100));
      return r[0] ? [Math.round(r[0].lat * 1e4) / 1e4, Math.round(r[0].lon * 1e4) / 1e4] : null;
    } catch { return null; }
  }));
  geoCache.set(key, p);
  return p;
}

// ---------------------------------------------------------------------------------------------------------------------
// Sync. A passphrase becomes a key (its hash); everything under that key lives in the Worker's KV store, merged section by section.
// ---------------------------------------------------------------------------------------------------------------------
const sync = {
  key: lsGet(LS_SYNC), state: "off", last: null, dirty: false, timer: null, poll: null,
  schedule() { if (!this.key) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.run(), 1800); },
  async run() {
    if (!this.key || this.state === "busy") return;
    this.state = "busy"; paintSync();
    try {
      let remote = null;
      try { remote = await getJson(`/api/sync/${this.key}`); } catch (e) { if (e.status !== 404) throw e; }
      const merged = mergeDb(db, remote);
      const changedLocal = canon(merged) !== canon(db);
      const remoteBehind = !remote || canon(merged) !== canon(mergeDb(remote, remote));
      if (changedLocal) { db = merged; lsSet(LS, JSON.stringify(db)); }
      if (remoteBehind || this.dirty) {
        const saved = await getJson(`/api/sync/${this.key}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(db) });
        const again = mergeDb(db, saved);
        if (canon(again) !== canon(db)) { db = again; lsSet(LS, JSON.stringify(db)); }
      }
      this.dirty = false; this.last = new Date(); this.state = "ok";
      if (changedLocal && !ui.busy && !isEditing()) render();
    } catch { this.state = navigator.onLine ? "err" : "offline"; }
    paintSync();
  },
  async enable(phrase) { this.key = await syncKey(phrase); lsSet(LS_SYNC, this.key); this.dirty = true; this.state = "idle"; await this.run(); this.startPoll(); },
  disable() { this.key = null; lsDel(LS_SYNC); this.state = "off"; clearInterval(this.poll); paintSync(); },
  startPoll() { clearInterval(this.poll); if (this.key) this.poll = setInterval(() => { if (!document.hidden) this.run(); }, 90_000); },
};
function syncText() {
  if (!sync.key) return ["", "Sync is off"];
  const when = sync.last ? sync.last.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  return { ok: ["ok", `Synced ${when}`], busy: ["busy", "Syncing…"], err: ["err", "Sync problem. Will retry."], offline: ["err", "Offline. Saved on this device."], idle: ["", "Sync on"] }[sync.state] ?? ["", ""];
}
function paintSync() { const [c, t] = syncText(); const html = `<span class="status ${c}">${esc(t)}</span>`; syncStat.innerHTML = html; const el = document.getElementById("syncline"); if (el) el.innerHTML = html; }
addEventListener("online", () => sync.run());
document.addEventListener("visibilitychange", () => { if (!document.hidden) sync.run(); });

// ---------------------------------------------------------------------------------------------------------------------
// Weather (Open-Meteo, no key): the forecast when the day is within two weeks, otherwise what that date was like last year.
// ---------------------------------------------------------------------------------------------------------------------
async function weather(ll, date) {
  const t = today(), ahead = daysBetween(t, date);
  const live = ahead >= -1 && ahead <= 14;
  const day = live ? date : lastOccurrence(date, t);
  const ck = `travel-wx-${ll[0]},${ll[1]},${day}`;
  try { const c = JSON.parse(lsGet(ck)); if (c && Date.now() - c.at < 6 * 36e5 * (live ? 1 : 28)) return c.v; } catch {}
  const base = live ? "https://api.open-meteo.com/v1/forecast" : "https://archive-api.open-meteo.com/v1/archive";
  const daily = live ? "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max" : "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max";
  const j = await getJson(`${base}?` + new URLSearchParams({ latitude: ll[0], longitude: ll[1], daily, wind_speed_unit: "kn", timezone: "auto", start_date: day, end_date: day }));
  const d = j.daily; if (!d?.time?.length) throw new Error("no data");
  const v = { live, day, hi: d.temperature_2m_max[0], lo: d.temperature_2m_min[0], wind: d.wind_speed_10m_max[0], rain: live ? d.precipitation_probability_max[0] : d.precipitation_sum[0] };
  lsSet(ck, JSON.stringify({ at: Date.now(), v }));
  return v;
}
const f = (c) => Math.round((c * 9) / 5 + 32);
function wxHtml(v) {
  const rain = v.live ? `${Math.round(v.rain ?? 0)}% chance of rain` : `${(v.rain ?? 0).toFixed(1)} mm rain`;
  return `<span title="${v.live ? "Forecast" : "What that date was like last year"}">${v.live ? "Forecast" : `Last year (${fmtDate(v.day, { month: "short", day: "numeric", year: "numeric" })})`}: ${f(v.hi)}°/${f(v.lo)}°F (${Math.round(v.hi)}°/${Math.round(v.lo)}°C)</span><span>Wind up to ${Math.round(v.wind)} kn</span><span>${rain}</span>`;
}
async function fillWeather(trip) {
  const els = [...document.querySelectorAll("[data-wx]")];
  const one = async (el) => {
    const n = +el.dataset.wx, g = dayGeo(trip, n), ll = g.pins[0]?.ll ?? g.path[0];
    if (!ll) { el.remove(); return; }
    try { const w = await weather(ll, dayDate(trip, n)); if (el.isConnected) el.innerHTML = wxHtml(w); } catch { el.remove(); }
  };
  for (let i = 0; i < els.length; i += 4) await Promise.all(els.slice(i, i + 4).map(one)); // a few at a time, not one after another
}

// ---------------------------------------------------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------------------------------------------------
const ui = { newTrip: false, editDay: null, planDay: null, editRes: null, busy: false, shareUrl: "", msg: "" };
const shares = new Map(); // share id -> snapshot (or "missing")
let installEvent = null;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvent = e; if (route().kind === "home") render(); });

const NAV = [["", "Overview"], ["map", "Map"], ["guide", "Place guides"], ["reservations", "Reservations"], ["saved-places", "Saved places"], ["packing", "Packing"], ["expenses", "Expenses"], ["documents", "Documents"], ["notes", "Notes"], ["share", "Share & export"]];
const SHARE_NAV = [["", "Overview"], ["map", "Map"], ["guide", "Place guides"], ["reservations", "Reservations"]];
const RES_TYPES = ["Hotel", "Boat", "Flight", "Train", "Car", "Tour", "Restaurant", "Other"];
const CATS = ["Food", "Lodging", "Transport", "Fuel & marina", "Activities", "Shopping", "Other"];
const STARTER = ["Passport", "Tickets and boarding passes", "Travel insurance details", "Phone charger and plug adapter (Italy: types C, F, L)", "Sunscreen", "Sunglasses and hat", "Swimwear", "Water shoes", "Light jacket for evenings", "Medications", "Cash and cards", "Dry bag", "Motion-sickness remedy", "Refillable water bottle"];

function route() {
  const p = location.pathname.split("/").filter(Boolean);
  if (p[0] === "s" && p[1]) { const s = p[2] ?? ""; return { kind: "share", id: p[1], sec: s === "day" || SHARE_NAV.some((x) => x[0] === s) ? s : "", place: s === "guide" || s === "day" ? p[3] : undefined }; }
  if (p[0] === "trips") {
    const trip = findTrip(p[1]);
    if (trip) { const s = p[2] ?? ""; return { kind: "trip", trip, sec: s === "day" || NAV.some((x) => x[0] === s) ? s : "", place: s === "guide" || s === "day" ? p[3] : undefined }; }
  }
  return { kind: "home" };
}
function go(path) { history.pushState({}, "", path); render(); scrollTo(0, 0); }

/** Everything a trip view reads: your data, or a shared snapshot. */
function context(r) {
  if (r.kind === "trip") return { trip: r.trip, readonly: false, base: `/trips/${r.trip.id}`, place: r.place, get: (n, f) => sec(r.trip.id, n, f) };
  const snap = shares.get(r.id);
  return { trip: snap.trip, readonly: true, base: `/s/${r.id}`, snap, place: r.place, get: (n, f) => (n === "reservations" ? snap.reservations : n === "plans" ? snap.plans : n === "places" ? snap.places : n === "settings" ? snap.settings : undefined) ?? f };
}
const resList = (ctx) => asRecords(ctx.get("reservations", []));
const settings = (ctx) => ({ rate: 1.08, speed: 7, ...(ctx.get("settings", {}) || {}) });

function paintNav(r, ctx) {
  let links;
  if (r.kind === "home") links = `<a class="active" href="/" data-link>Trips</a>`;
  else {
    const items = r.kind === "share" ? SHARE_NAV : NAV;
    links = (r.kind === "trip" ? `<a href="/" data-link>← All trips</a>` : "") + items.map(([u, t]) => `<a class="${(r.sec === "day" ? "" : r.sec) === u ? "active" : ""}" ${(r.sec === "day" ? "" : r.sec) === u ? 'aria-current="page"' : ""} href="${ctx.base}${u ? "/" + u : ""}" data-link>${t}</a>`).join("");
  }
  navEl.innerHTML = (ctx ? `<div class="tname">${esc(ctx.trip.name)}${ctx.readonly ? " · shared" : ""}</div>` : "") + links;
  mobileNav.innerHTML = links;
  mobileNav.querySelector(".active")?.scrollIntoView({ inline: "center", block: "nearest" });
}

// ---- Countdown to departure ----
const departure = (trip) => trip.legs?.[0]?.date ?? trip.start;
function countdownHtml(trip) {
  const dep = departure(trip);
  return dep ? `<div class="countdown" data-cd="${attr(dep)}" role="timer" aria-live="off"></div>` : "";
}
function tickCountdowns() {
  document.querySelectorAll("[data-cd]").forEach((el) => {
    const c = countdown(el.dataset.cd), pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const when = fmtDate(el.dataset.cd, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    el.innerHTML = c.state === "before"
      ? `<span class="cdn"><b>${c.days}</b> days <b>${c.hours}</b> h <b>${c.minutes}</b> min</span><span class="cdl">until departure · ${esc(when)}</span>`
      : c.state === "now" ? `<span class="cdn"><b>Departure day</b></span><span class="cdl">${esc(when)}</span>` : `<span class="cdl">Departed ${esc(when)}</span>`;
    el.setAttribute("aria-label", c.state === "before" ? `${pl(c.days, "day")}, ${pl(c.hours, "hour")} and ${pl(c.minutes, "minute")} until departure` : "");
  });
}
setInterval(tickCountdowns, 30000);

// ---- Home ----
function tripCard(t) {
  const last = t.days.at(-1)?.stops.at(-1) ?? "—";
  return `<a class="tcard" href="/trips/${attr(t.id)}" data-link><div class="cover"><h3>${esc(t.name)}</h3><span>${esc(tripDates(t))}</span></div><div class="meta"><div>Duration<b>${t.days.length} day${t.days.length === 1 ? "" : "s"}</b></div><div>Destinations<b>${uniqueStops(t)} place${uniqueStops(t) === 1 ? "" : "s"}</b></div><div>Ends in<b>${esc(last)}</b></div></div></a>`;
}
function newTripForm() {
  const d = new Date(); d.setMonth(d.getMonth() + 1);
  return `<form class="tool" data-form="new-trip" style="grid-column:1/-1"><h3 style="margin:0 0 10px">New trip</h3><div class="grid2"><div><label for="nt-name">Name</label><input id="nt-name" name="name" required maxlength="60" placeholder="Lisbon long weekend"></div><div><label for="nt-start">First day</label><input id="nt-start" name="start" type="date" required value="${isoDate(d)}"></div><div><label for="nt-days">Number of days</label><input id="nt-days" name="days" type="number" min="1" max="45" required value="4"></div></div><div class="actions"><button class="btn" type="submit">Create trip</button><button class="btn ghost" type="button" data-act="new-trip-cancel">Cancel</button></div></form>`;
}
function syncBox() {
  const on = !!sync.key;
  return `<section class="panel syncbox" aria-labelledby="synch"><h3 id="synch">Sync across devices</h3><p class="note" style="margin:0 0 10px">${on ? "Your trips, reservations, packing list, expenses and notes are kept in step on every device that uses the same passphrase." : "Choose a passphrase and use the same one on each device. Your data is stored under a key made from it, so anyone who knows the passphrase can read the data. Keep passport numbers and card details out of the app."}</p>${on ? `<div class="actions" style="margin-top:0"><span id="syncline"></span><button class="btn small ghost" data-act="sync-now">Sync now</button><button class="btn small danger" data-act="sync-off">Turn off on this device</button></div>` : `<form data-form="sync-on" class="linkbox"><label class="sr" for="sp">Passphrase</label><input id="sp" name="phrase" type="password" minlength="8" required autocomplete="off" placeholder="Passphrase (8+ characters)"><button class="btn" type="submit">Turn on sync</button></form>`}</section>`;
}
function home() {
  const iosHint = /iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone;
  return `<div class="eyebrow">MY TRIPS</div><section class="section"><h2>Trips</h2><div class="trips">${allTrips().map(tripCard).join("")}${ui.newTrip ? newTripForm() : `<button class="newcard" data-act="new-trip">+ New trip</button>`}</div></section>${syncBox()}${installEvent ? `<p class="note" style="margin-top:14px"><button class="btn small ghost" data-act="install">Install this app</button> It then opens on its own and keeps working offline.</p>` : iosHint ? `<p class="note" style="margin-top:14px">To install on iPhone: tap Share, then Add to Home Screen.</p>` : ""}`;
}

// ---- Overview and day cards ----
function photoOf(d) { const p = d.photo; if (!p) return null; if (typeof p === "string") { const u = safeUrl(p); return u ? { src: u, credit: "" } : null; } return p; }
const legsOn = (trip, n) => (trip.legs ?? []).filter((l) => l.day === n);
const legHtml = (l) => `<div class="leg"><span class="badge">${esc(l.kind)}</span><div><b>${esc(l.title)}</b><small>${esc(l.note)}</small></div></div>`;
function dayCard(ctx, d) {
  const { trip } = ctx, n = d.n, date = dayDate(trip, n), g = dayGeo(trip, n), ph = photoOf(d);
  const speed = settings(ctx).speed;
  const nm = g.path.length > 1 ? pathNm(g.path) : 0, mode = d.mode ?? trip.mode;
  const dist = nm < 0.5 ? "" : mode === "sail" ? `<span>About ${Math.round(nm)} nm · ${fmtHours(nm / speed)} at ${speed} kn</span>` : `<span>About ${Math.round(nm * 1.15078)} mi ${mode === "rail" ? "by rail, as the crow flies" : "in a straight line"}</span>`;
  const resv = resList(ctx).filter((r) => r.date === date).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const plans = ((ctx.get("plans", {}) || {})[n] ?? []).slice().sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const editing = !ctx.readonly && ui.editDay === n;
  const body = `<div class="date">Day ${n} · ${esc(dayLabel(trip, n))}</div><h3><a class="dlink" href="${attr(ctx.base)}/day/${n}" data-link>${esc(d.title)}</a></h3>${d.desc ? `<div class="desc">${esc(d.desc)}</div>` : ""}<div class="chips">${d.stops.map((p) => `<a class="chip" href="${attr(ctx.base)}/guide/${slugify(p)}" data-link>${esc(p)}</a>`).join("")}</div>
  ${dist ? `<div class="meta-line">${dist}</div>` : ""}${g.path.length || g.pins.length ? `<div class="meta-line" data-wx="${n}"><span>Loading weather…</span></div>` : ""}
  ${legsOn(trip, n).map(legHtml).join("")}
  ${resv.length ? `<div class="resv">${resv.map((r) => `<div><span class="badge">${esc(r.type || "Booking")}</span>${r.time ? `<b>${esc(r.time)}</b>` : ""}<span>${esc(r.title)}</span>${r.conf ? `<small>· ${esc(r.conf)}</small>` : ""}</div>`).join("")}</div>` : ""}
  ${plans.length ? `<div class="plan">${plans.map((p) => `<div>${p.time ? `<time>${esc(p.time)}</time>` : `<time></time>`}<span>${esc(p.text)}</span>${ctx.readonly ? "" : `<button type="button" aria-label="Remove plan item" data-act="plan-del" data-day="${n}" data-id="${attr(p.id)}">Remove</button>`}</div>`).join("")}</div>` : ""}
  ${!ctx.readonly && ui.planDay === n ? `<form class="dayedit" data-form="plan-add" data-day="${n}"><div class="row"><input name="time" type="time" aria-label="Time" style="max-width:130px"><input name="text" required maxlength="140" placeholder="What are you doing?" aria-label="Plan item" autofocus></div><div class="actions" style="margin:0"><button class="btn small" type="submit">Add</button><button class="btn small ghost" type="button" data-act="plan-toggle" data-day="${n}">Cancel</button></div></form>` : ""}
  ${editing ? dayEditForm(ctx, d) : ""}
  <div class="dayacts"><a class="btn small" href="${attr(ctx.base)}/day/${n}" data-link>Day details →</a>${g.pins.length ? `<a class="maplink" href="${ctx.base}/map?day=${n}" data-link>View on map →</a>` : ""}${ctx.readonly ? "" : `<button class="btn small" data-act="plan-toggle" data-day="${n}">Add to this day</button>${trip.builtin ? "" : `<button class="btn small" data-act="day-edit" data-day="${n}">Edit day</button><button class="btn small danger" data-act="day-del" data-day="${n}">Delete day</button>`}`}</div>`;
  return ph
    ? `<article class="day hasimg" id="day-${n}" data-open="${attr(ctx.base)}/day/${n}"><img class="bg" src="${attr(ph.src)}" alt="" loading="${n <= 2 ? "eager" : "lazy"}" decoding="async"><div class="shade"></div>${ph.credit ? `<a class="credit" href="${attr(ph.url || "#")}" target="_blank" rel="noopener" title="${attr(ph.credit)}">Photo: ${esc(ph.credit)}</a>` : ""}<div class="in">${body}</div></article>`
    : `<article class="day" id="day-${n}" data-open="${attr(ctx.base)}/day/${n}">${body}</article>`;
}
function dayEditForm(ctx, d) {
  return `<form class="dayedit" data-form="day-edit" data-day="${d.n}"><label>Title<input name="title" required maxlength="80" value="${attr(d.title)}"></label><label>What's planned<textarea name="desc" rows="3" maxlength="600">${esc(d.desc)}</textarea></label><label>Places, one per line (add the city so they land in the right spot, like "Belém Tower, Lisbon")<textarea name="stops" rows="3" maxlength="400">${esc(d.stops.join("\n"))}</textarea></label><label>Photo link (optional)<input name="photo" type="url" value="${attr(typeof d.photo === "string" ? d.photo : "")}" placeholder="https://…"></label><div class="actions" style="margin:0"><button class="btn small" type="submit">Save day</button><button class="btn small ghost" type="button" data-act="day-cancel">Cancel</button></div></form>`;
}
function overview(ctx) {
  const { trip } = ctx, n = trip.days.length, last = trip.final ?? trip.days.at(-1)?.stops.at(-1) ?? "—";
  const s = settings(ctx);
  return `${ctx.readonly ? `<div class="banner">This is a shared, read-only copy of the plan${ctx.snap?.createdAt ? ` made ${esc(new Date(ctx.snap.createdAt).toLocaleDateString())}` : ""}. Changes made after that are not shown.</div>` : `<a class="back" href="/" data-link>← All trips</a>`}<div class="eyebrow">TRIP OVERVIEW</div><section class="hero"><h1>${esc(trip.name)}</h1><p>${esc(tripDates(trip))}</p><div class="stats"><div class="stat">Duration<b>${n} day${n === 1 ? "" : "s"}</b></div><div class="stat">Destinations<b>${uniqueStops(trip)} place${uniqueStops(trip) === 1 ? "" : "s"}</b></div><div class="stat">Final destination<b>${esc(last)}</b></div></div></section>
  ${trip.legs?.length ? `<section class="section"><h2>Getting there and back</h2><div class="legs">${trip.legs.map((l) => `<div class="leg"><span class="badge">${esc(l.kind)}</span><div><b>${esc(l.title)}</b><small>${esc(fmtDate(l.date, { weekday: "short", month: "short", day: "numeric" }))} · ${esc(l.note)}</small></div></div>`).join("")}</div></section>` : ""}
  <section class="section"><h2>Itinerary</h2>${ctx.readonly ? "" : `<div class="note" style="margin-bottom:12px">Saved on this device${sync.key ? " and synced to your other devices." : ". Turn on sync from the home page to use it on other devices."}</div>`}
  ${!ctx.readonly && trip.mode === "sail" ? `<form class="no-print" data-form="speed" style="display:flex;gap:8px;align-items:center;margin-bottom:12px;font-size:13px;color:var(--muted)"><label for="spd">Cruising speed</label><input id="spd" name="speed" type="number" min="2" max="30" step="0.5" value="${s.speed}" style="width:80px;border:1px solid var(--line);border-radius:10px;padding:6px 8px"> kn <button class="btn small ghost" type="submit">Update</button></form>` : ""}
  <div class="days">${trip.days.map((d) => dayCard(ctx, d)).join("")}</div>${!ctx.readonly && !trip.builtin ? `<p><button class="btn ghost" style="margin-top:14px" data-act="day-add">+ Add a day</button></p>` : ""}</section>`;
}

// ---- Day detail ----
const MODE_NAME = { sail: "Sailing day", rail: "Train day", air: "Flying day", walk: "On foot" };
const brief = (t, n = 230) => { if (t.length <= n) return t; const cut = t.slice(0, n), i = cut.lastIndexOf(". "); return i > 80 ? cut.slice(0, i + 1) : cut.replace(/\s+\S*$/, "") + "…"; };
function dayLegs(ctx, n) {
  const { trip } = ctx;
  return (trip.legs ?? []).filter((l) => l.day === n && l.tour).map((l) => {
    const pts = (l.route ?? []).map((c) => trip.airports?.[c]?.ll).filter(Boolean);
    return { title: l.title, mode: l.route ? "air" : "rail", path: l.route ? pts.slice(1).flatMap((b, i) => arcPoints(pts[i], b).slice(i ? 1 : 0)) : trip.geo?.lines?.[l.line] ?? [] };
  });
}
function dayMapEnv(ctx) {
  const n = +ctx.place, d = ctx.trip.days[n - 1] ?? {}, g = d.n ? dayGeo(ctx.trip, n) : { pins: [], path: [] };
  return { n, mode: d.mode ?? ctx.trip.mode, path: g.path, pins: g.pins, legs: dayLegs(ctx, n), esc };
}
function dayView(ctx) {
  const { trip } = ctx, n = +ctx.place, d = trip.days[n - 1];
  if (!d) return `<a class="back" href="${attr(ctx.base)}" data-link>← Itinerary</a><div class="banner">That day is not on this trip.</div>`;
  const g = dayGeo(trip, n), ph = photoOf(d), mode = d.mode ?? trip.mode, nm = g.path.length > 1 ? pathNm(g.path) : 0;
  const dist = nm < 0.5 ? "" : mode === "sail" ? `About ${Math.round(nm)} nm · ${fmtHours(nm / settings(ctx).speed)} at ${settings(ctx).speed} kn` : `About ${Math.round(nm * 1.15078)} mi in a straight line`;
  const guided = trip.builtin;
  const stops = d.stops.map((name, i) => {
    const c = guided ? PLACES[name] : null, ll = stopLl(trip, name), col = dayColor(n);
    const hist = c?.history?.[0] ? brief(c.history[0]) : "", loc = (c?.locals ?? c?.tips?.slice(0, 1) ?? []);
    return `<li class="stop" style="--i:${i}"><div class="bub" style="background:${col}">${i + 1}</div><div class="sbody"><h3>${esc(name)}</h3>${c ? `<p class="stag">${esc(c.tagline)}</p>` : ""}
      ${hist ? `<div class="sblk"><b>History</b><p>${esc(hist)}</p></div>` : ""}
      ${loc.length ? `<div class="sblk locals"><b>Locals know</b><ul>${loc.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${c?.see?.[0] ? `<div class="sblk"><b>Don't miss</b><p>${esc(c.see[0])}</p></div>` : ""}
      <div class="sacts">${ll ? `<button type="button" class="btn small ghost" data-fly="${attr(name)}">Zoom to it on the map</button>` : ""}<a class="btn small ghost" href="${attr(ctx.base)}/guide/${slugify(name)}" data-link>Full guide →</a></div></div></li>`;
  }).join("");
  const prev = trip.days[n - 2], next = trip.days[n];
  return `<a class="back" href="${attr(ctx.base)}#day-${n}" data-link>← Itinerary</a>
  <section class="dayhero${ph ? " hasimg" : ""}">${ph ? `<img class="bg" src="${attr(ph.src)}" alt="" decoding="async"><div class="shade"></div>` : ""}<div class="in"><div class="eyebrow">DAY ${n} · ${esc(dayLabel(trip, n).toUpperCase())}</div><h1>${esc(d.title)}</h1>
    <div class="dchips"><span class="dchip">${esc(MODE_NAME[mode] ?? "On the move")}</span>${dist ? `<span class="dchip">${esc(dist)}</span>` : ""}${g.pins.length || g.path.length ? `<span class="dchip" data-wx="${n}">Loading weather…</span>` : ""}</div>${ph?.credit ? `<a class="credit" href="${attr(ph.url || "#")}" target="_blank" rel="noopener">Photo: ${esc(ph.credit)}</a>` : ""}</div></section>
  ${d.desc ? `<p class="dayintro">${esc(d.desc)}</p>` : ""}
  ${legsOn(trip, n).length ? `<div class="legs" style="margin-bottom:14px">${legsOn(trip, n).map(legHtml).join("")}</div>` : ""}
  <section class="daymapwrap"><div id="daymap" role="application" aria-label="Map of day ${n}"></div><div class="daymapbar"><button type="button" class="btn small" data-replay>Replay route</button><button type="button" class="btn small ghost" data-fit>Reset view</button>${g.pins.length ? `<a class="btn small ghost" href="${attr(ctx.base)}/map?day=${n}" data-link>Open the full map →</a>` : ""}</div></section>
  ${stops ? `<section class="section"><h2>${d.stops.length > 1 ? "Stops today" : "Today's stop"}</h2><ol class="tl">${stops}</ol></section>` : ""}
  <nav class="gnav" aria-label="Neighbouring days">${prev ? `<a href="${attr(ctx.base)}/day/${n - 1}" data-link>← Day ${n - 1} · ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a href="${attr(ctx.base)}/day/${n + 1}" data-link>Day ${n + 1} · ${esc(next.title)} →</a>` : "<span></span>"}</nav>`;
}

// ---- Map ----
function mapView(ctx) {
  return `<a class="back" href="${ctx.base}" data-link>← Trip overview</a><div class="eyebrow">${esc(ctx.trip.name.toUpperCase())}</div><section class="section"><h2>Map</h2><div class="note" style="margin-bottom:12px">Pick a day, click a stop, or press Play trip to follow the whole route. Routes are approximate and positions are for planning, not navigation.</div><div class="mapbar" id="mapbar"></div><div id="tripmap" role="application" aria-label="Map of the itinerary"></div><div class="mapctl"><button class="btn small" id="mplay" type="button" aria-pressed="false">Play trip</button><input id="mscrub" type="range" min="0" max="1000" value="0" aria-label="Trip progress"><span id="mpos" aria-live="polite"></span><label class="speed">Speed <select id="mspeed"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label><button class="btn small ghost" id="mfit" type="button">Whole journey</button>${ctx.trip.legs?.some((l) => l.route) ? `<button class="btn small ghost" id="mflights" type="button">Italy</button>` : ""}</div><div class="mapinfo" id="mapinfo" aria-live="polite"></div><div class="mapcap" id="mapcap"></div></section>`;
}
function mapEnv(ctx) {
  return {
    ctx, dayGeo, esc, attr, savedPlaces: asRecords(ctx.get("places", []), "text"),
    placeFor: (name) => (ctx.trip.builtin ? PLACES[name] ?? null : null),
    wikiFor: (name) => wikiForPlace(ctx.trip, name),
    guideHref: (name) => `${ctx.base}/guide/${slugify(name)}`, slugOf: slugify,
    dayCardHtml: (d) => dayCard({ ...ctx, readonly: true }, d).replace(/<div class="dayacts">.*?<\/div>(?=<\/div>|<\/article>)/s, ""),
  };
}

// ---- Lists ----
const note = (t) => `<div class="note" style="margin-bottom:12px">${t}</div>`;
const head = (ctx, title) => `<div class="eyebrow">${esc(ctx.trip.name.toUpperCase())}</div><section class="section"><h2>${title}</h2>`;
const fld = (label, html) => `<div><label>${label}</label>${html}</div>`;

function reservationsView(ctx) {
  const list = resList(ctx).slice().sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999") || (a.time || "").localeCompare(b.time || "") || (a.title || "").localeCompare(b.title || ""));
  const ed = ui.editRes ? list.find((r) => r.id === ui.editRes) : null;
  const form = ctx.readonly ? "" : `<form class="tool" data-form="res-save" style="margin-bottom:14px"><input type="hidden" name="id" value="${attr(ed?.id ?? "")}"><div class="grid2">${fld("Type", `<select name="type">${RES_TYPES.map((t) => `<option ${ed?.type === t ? "selected" : ""}>${t}</option>`).join("")}</select>`)}${fld("What", `<input name="title" required maxlength="100" value="${attr(ed?.title ?? "")}" placeholder="Hotel Naples, 2 nights">`)}${fld("Date", `<input name="date" type="date" value="${attr(ed?.date ?? "")}" min="${ctx.trip.start}">`)}${fld("Time", `<input name="time" type="time" value="${attr(ed?.time ?? "")}">`)}${fld("Confirmation number", `<input name="conf" maxlength="60" value="${attr(ed?.conf ?? "")}">`)}${fld("Link", `<input name="url" type="url" value="${attr(ed?.url ?? "")}" placeholder="https://…">`)}</div>${fld("Notes", `<input name="note" maxlength="200" value="${attr(ed?.note ?? "")}">`)}<div class="actions"><button class="btn" type="submit">${ed ? "Save changes" : "Add reservation"}</button>${ed ? `<button class="btn ghost" type="button" data-act="res-cancel">Cancel</button>` : ""}</div></form>`;
  const item = (r) => `<div class="item"><div class="main"><div><span class="badge">${esc(r.type || "Booking")}</span><b>${esc(r.title)}</b></div><span class="sub">${[r.date && fmtDate(r.date, { weekday: "short", month: "short", day: "numeric" }), r.time, r.conf && `Confirmation ${esc(r.conf)}`].filter(Boolean).map((x) => (typeof x === "string" && x.startsWith("Confirmation") ? x : esc(x))).join(" · ")}</span>${r.note ? `<span class="sub">${esc(r.note)}</span>` : ""}${safeUrl(r.url) ? `<a href="${attr(safeUrl(r.url))}" target="_blank" rel="noopener">Open link</a>` : ""}</div>${ctx.readonly ? "" : `<div class="acts"><button class="btn small ghost" data-act="res-edit" data-id="${attr(r.id)}">Edit</button><button class="btn small danger" data-act="res-del" data-id="${attr(r.id)}" aria-label="Delete ${attr(r.title)}">Delete</button></div>`}</div>`;
  return `${head(ctx, "Reservations")}${ctx.readonly ? "" : note("Reservations with a date also appear on that day's card and in the calendar file.")}${form}<div class="list">${list.length ? list.map(item).join("") : '<div class="empty">Nothing added yet.</div>'}</div></section>`;
}
function placesView(ctx) {
  const list = asRecords(ctx.get("places", []), "text");
  return `${head(ctx, "Saved places")}${note("Places you want to see or eat at. Ones that are found on the map show there as stars.")}<form class="tool" data-form="place-add" style="margin-bottom:14px"><div class="grid2">${fld("Place", `<input name="text" required maxlength="120" placeholder="Pizzeria da Michele, Naples">`)}${fld("Note", `<input name="note" maxlength="160" placeholder="Go early">`)}</div><div class="actions"><button class="btn" type="submit">Add place</button></div></form><div class="list">${list.length ? list.map((p) => `<div class="item"><div class="main"><div><b>${esc(p.text)}</b>${p.ll ? ' <span class="badge">On map</span>' : ""}</div>${p.note ? `<span class="sub">${esc(p.note)}</span>` : ""}${p.ll ? `<a href="${attr(googleMapsUrl(p.ll, p.text))}" target="_blank" rel="noopener">Open in Google Maps</a>` : ""}</div><div class="acts"><button class="btn small danger" data-act="place-del" data-id="${attr(p.id)}" aria-label="Remove ${attr(p.text)}">Remove</button></div></div>`).join("") : '<div class="empty">Nothing added yet.</div>'}</div></section>`;
}
function packingView(ctx) {
  const list = asRecords(ctx.get("packing", []), "text"), done = list.filter((x) => x.done).length;
  return `${head(ctx, "Packing list")}<div class="tool"><div class="row"><div style="flex:3"><form data-form="pack-add" class="row"><input name="text" required maxlength="100" placeholder="Add a packing item" aria-label="Packing item"><button class="btn" type="submit" style="flex:0 0 auto">Add</button></form></div></div>${list.length ? `<div style="margin-top:12px;font-size:13px;color:var(--muted)">${done} of ${list.length} packed</div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${done}"><i style="width:${Math.round((done / list.length) * 100)}%"></i></div>` : ""}<div class="list">${list.length ? list.map((p) => `<div class="item"><label class="check ${p.done ? "done" : ""}"><input type="checkbox" data-act="pack-toggle" data-id="${attr(p.id)}" ${p.done ? "checked" : ""}><span>${esc(p.text)}</span></label><div class="acts"><button class="btn small danger" data-act="pack-del" data-id="${attr(p.id)}" aria-label="Remove ${attr(p.text)}">Remove</button></div></div>`).join("") : '<div class="empty">Nothing added yet.</div>'}</div><div class="actions"><button class="btn small ghost" data-act="pack-starter">Add a starter list</button>${done ? `<button class="btn small ghost" data-act="pack-clear">Untick everything</button>` : ""}</div></div></section>`;
}
function documentsView(ctx) {
  const list = asRecords(ctx.get("documents", []), "title");
  return `${head(ctx, "Documents")}${note("Links to tickets, confirmations and maps. Files are not uploaded here: keep them in a drive or email and link to them.")}<form class="tool" data-form="doc-add" style="margin-bottom:14px"><div class="grid2">${fld("Title", `<input name="title" required maxlength="100" placeholder="Ferry tickets">`)}${fld("Link", `<input name="url" type="url" placeholder="https://…">`)}</div><div class="actions"><button class="btn" type="submit">Add document</button></div></form><div class="list">${list.length ? list.map((d) => `<div class="item"><div class="main"><b>${esc(d.title)}</b>${safeUrl(d.url) ? `<a href="${attr(safeUrl(d.url))}" target="_blank" rel="noopener">Open</a>` : ""}</div><div class="acts"><button class="btn small danger" data-act="doc-del" data-id="${attr(d.id)}" aria-label="Remove ${attr(d.title)}">Remove</button></div></div>`).join("") : '<div class="empty">Nothing added yet.</div>'}</div></section>`;
}
function notesView(ctx) {
  return `<div class="eyebrow">${esc(ctx.trip.name.toUpperCase())}</div><section class="section"><h2>Notes</h2><div class="tool"><textarea id="notes" rows="14" placeholder="Trip notes…" aria-label="Trip notes">${esc(ctx.get("notes", "") || "")}</textarea></div></section>`;
}
function expensesView(ctx) {
  const list = asRecords(ctx.get("expenses", []), "d").map((e) => (e.d === undefined && e.title ? { ...e, d: e.title } : e)), s = settings(ctx);
  const t = expenseTotals(list, s.rate);
  const bars = (obj) => { const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]), max = Math.max(...rows.map((r) => r[1]), 1); return `<div class="bars">${rows.map(([k, v]) => `<div><span>${esc(k)}</span><i style="width:${Math.max(3, (v / max) * 100)}%"></i><b>${money(v, "EUR")}</b></div>`).join("")}</div>`; };
  return `${head(ctx, "Expenses")}<form class="tool" data-form="exp-add" style="margin-bottom:14px"><div class="grid2">${fld("What", `<input name="d" required maxlength="100" placeholder="Dinner in Positano">`)}${fld("Amount", `<input name="a" required inputmode="decimal" placeholder="48.50">`)}${fld("Currency", `<select name="cur"><option>EUR</option><option>USD</option></select>`)}${fld("Category", `<select name="cat">${CATS.map((c) => `<option>${c}</option>`).join("")}</select>`)}${fld("Day", `<select name="day"><option value="">Not tied to a day</option>${ctx.trip.days.map((d) => `<option value="${d.n}">Day ${d.n} · ${esc(fmtDate(dayDate(ctx.trip, d.n)))}</option>`).join("")}</select>`)}</div><div class="actions"><button class="btn" type="submit">Add expense</button></div></form>
  <div class="panel" style="margin:0 0 14px"><h3>Totals</h3><div class="kv"><div><small>In euros</small><b>${money(t.eur, "EUR")}</b></div><div><small>In dollars</small><b>${money(t.usd, "USD")}</b></div><div><small>Entries</small><b>${list.length}</b></div></div><form data-form="rate" class="row" style="margin-top:12px;align-items:end;gap:8px"><div style="flex:0 0 auto"><label for="rt" style="font-size:12px;color:var(--muted);font-weight:700;display:block">Dollars per euro</label><input id="rt" name="rate" inputmode="decimal" value="${s.rate}" style="width:110px;border:1px solid var(--line);border-radius:10px;padding:8px"></div><button class="btn small ghost" type="submit" style="flex:0 0 auto">Set</button><button class="btn small ghost" type="button" data-act="rate-fetch" style="flex:0 0 auto">Get today's rate</button>${s.rateAt ? `<span class="note" style="flex:1">Rate from ${esc(s.rateAt)}</span>` : ""}</form>${list.length ? `<h3 style="margin-top:16px">By category</h3>${bars(t.byCategory)}<h3 style="margin-top:16px">By day</h3>${bars(t.byDay)}` : ""}</div>
  <div class="list">${list.length ? list.map((e) => `<div class="item"><div class="main"><b>${esc(e.d)}</b><span class="sub">${esc(e.cat || "Other")}${e.day ? ` · Day ${esc(e.day)}` : ""}</span></div><b>${money(e.a, e.cur || "EUR")}</b><div class="acts"><button class="btn small danger" data-act="exp-del" data-id="${attr(e.id)}" aria-label="Delete ${attr(e.d)}">Delete</button></div></div>`).join("") : '<div class="empty">Nothing added yet.</div>'}</div></section>`;
}


// ---- Place guides ----
// Each stop has a guide: written history, what to see and tips for the Italy stops, and a live summary and photo from Wikipedia for any
// place (including the stops of trips you create).
async function wikiInfo(title) {
  const key = `travel-wiki-v1:${title}`;
  try { const c = JSON.parse(lsGet(key)); if (c && Date.now() - c.at < 30 * 864e5) return c.v; } catch {}
  let j;
  for (let a = 0; ; a++) {
    try { j = await getJson("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_"))); break; }
    catch (e) { if (a >= 2 || e.status === 404) throw e; await new Promise((r) => setTimeout(r, 1500 * (a + 1))); } // Wikipedia asks busy clients to slow down; try again shortly
  }
  if (j.type === "disambiguation") return null;
  const v = { title: j.title, extract: j.extract ?? "", thumb: j.thumbnail?.source ?? "", url: j.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` };
  lsSet(key, JSON.stringify({ at: Date.now(), v }));
  return v;
}
async function wikiSearch(q) {
  try { const r = await getJson("https://en.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "opensearch", search: q, limit: "1", format: "json", origin: "*" })); return r[1]?.[0] ?? null; } catch { return null; }
}
async function wikiForPlace(trip, name) {
  const curated = trip.builtin ? PLACES[name] : null;
  try {
    if (curated?.wiki) return await wikiInfo(curated.wiki);
    const t = (await wikiSearch(name)) ?? (name.includes(",") ? await wikiSearch(name.split(",")[0].trim()) : null);
    return t ? await wikiInfo(t) : null;
  } catch { return null; }
}
/** The trip's places in the order they are visited, each with the days it appears on. */
function tripStops(trip) {
  const by = new Map();
  trip.days.forEach((d) => d.stops.forEach((name) => { const e = by.get(name) ?? { name, slug: slugify(name), days: [] }; if (!e.days.includes(d.n)) e.days.push(d.n); by.set(name, e); }));
  return [...by.values()];
}
const stopLl = (trip, name) => (trip.geo?.places ?? {})[name] ?? null;

function guideView(ctx) {
  const { trip } = ctx, stops = tripStops(trip);
  if (!ctx.place) {
    return `<div class="eyebrow">${esc(trip.name.toUpperCase())}</div><section class="section"><h2>Place guides</h2>${note("The story of each stop: history, what to see, and tips. Tap a place for its guide.")}<div class="guides">${stops.map((s) => { const c = trip.builtin ? PLACES[s.name] : null; return `<a class="gcard" href="${attr(ctx.base)}/guide/${s.slug}" data-link><div class="gthumb" data-wiki="${attr(s.name)}" aria-hidden="true"></div><div class="gbody"><b>${esc(s.name)}</b><span>${s.days.length > 1 ? "Days" : "Day"} ${s.days.join(", ")}${c?.area ? ` · ${esc(c.area)}` : ""}</span>${c ? `<p>${esc(c.tagline)}</p>` : ""}</div></a>`; }).join("") || '<div class="empty">No places yet. Add places to a day and they get a guide.</div>'}</div></section>`;
  }
  const i = stops.findIndex((s) => s.slug === ctx.place);
  if (i < 0) return `<a class="back" href="${ctx.base}/guide" data-link>← All place guides</a><div class="banner">That place is not on this trip.</div>`;
  const stop = stops[i], c = trip.builtin ? PLACES[stop.name] : null, ll = stopLl(trip, stop.name), prev = stops[i - 1], next = stops[i + 1];
  const list = (items, cls = "") => `<ul class="glist ${cls}">${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const notes = (ctx.get("placenotes", {}) || {})[stop.slug] ?? "";
  return `<a class="back" href="${ctx.base}/guide" data-link>← All place guides</a>
  <div class="eyebrow">${esc(c?.area ?? "PLACE GUIDE")}</div><h1 class="gh">${esc(stop.name)}</h1>${c ? `<p class="gtag">${esc(c.tagline)}</p>` : ""}
  <div class="gactions">${ll ? `<a class="btn" href="${attr(ctx.base)}/map?place=${stop.slug}" data-link>Show on the map</a><a class="btn ghost" href="${attr(googleMapsUrl(ll, stop.name))}" target="_blank" rel="noopener">Google Maps</a><a class="btn ghost" href="${attr(appleMapsUrl(ll, stop.name))}" target="_blank" rel="noopener">Apple Maps</a>` : ""}</div>
  <div class="gphoto" id="gphoto" hidden></div>
  <section class="panel"><h3>About</h3><div id="gabout" class="gabout"><span class="note">Loading from Wikipedia…</span></div></section>
  ${c ? `<section class="panel"><h3>History</h3>${c.history.map((t) => `<p>${esc(t)}</p>`).join("")}</section><section class="panel"><h3>What to see and do</h3>${list(c.see)}</section><section class="panel"><h3>Good to know</h3>${list(c.tips)}<p class="note">Opening times, prices, rules and sea conditions change. Check them close to the day.</p></section>${c.fact ? `<section class="panel gfact"><h3>Did you know</h3><p>${esc(c.fact)}</p></section>` : ""}` : `<section class="panel"><p class="note">There is no written guide for this place yet. The summary above comes from Wikipedia, and your own notes go below.</p></section>`}
  <section class="panel"><h3>On your trip</h3><div class="gdays">${stop.days.map((n) => `<a class="chip" href="${attr(ctx.base)}#day-${n}" data-link>Day ${n} · ${esc(dayLabel(trip, n))} · ${esc(trip.days[n - 1].title)}</a>`).join("")}</div></section>
  ${ctx.readonly ? "" : `<section class="panel"><h3>Your notes</h3><textarea id="pnotes" rows="4" placeholder="Reservations to make, things to remember…" aria-label="Your notes about ${attr(stop.name)}" style="width:100%;border:1px solid var(--line);border-radius:12px;padding:11px;background:#fbfcfb">${esc(notes)}</textarea></section>`}
  <nav class="gnav" aria-label="Neighbouring places">${prev ? `<a href="${attr(ctx.base)}/guide/${prev.slug}" data-link>← ${esc(prev.name)}</a>` : "<span></span>"}${next ? `<a href="${attr(ctx.base)}/guide/${next.slug}" data-link>${esc(next.name)} →</a>` : ""}</nav>`;
}
async function fillGuide(ctx) {
  const { trip } = ctx;
  if (!ctx.place) {
    const els = [...document.querySelectorAll("[data-wiki]")];
    for (let i = 0; i < els.length; i += 3) await Promise.all(els.slice(i, i + 3).map(async (el) => { const w = await wikiForPlace(trip, el.dataset.wiki); if (w?.thumb && el.isConnected) el.style.backgroundImage = `url("${w.thumb.replace(/"/g, "%22")}")`; }));
    return;
  }
  const stop = tripStops(trip).find((s) => s.slug === ctx.place);
  if (!stop) return;
  const w = await wikiForPlace(trip, stop.name), about = document.getElementById("gabout");
  if (!about?.isConnected) return;
  if (!w) { about.innerHTML = '<span class="note">No Wikipedia summary found for this place.</span>'; return; }
  about.innerHTML = `${esc(w.extract)}<div class="note" style="margin-top:8px">From <a href="${attr(w.url)}" target="_blank" rel="noopener">Wikipedia</a> (CC BY-SA 4.0). Photo: Wikimedia Commons.</div>`;
  const ph = document.getElementById("gphoto");
  if (ph && w.thumb) { ph.hidden = false; ph.innerHTML = `<img src="${attr(w.thumb)}" alt="${attr(stop.name)}" loading="lazy">`; }
}

// ---- Share and export ----
function snapshot(ctx, opts) {
  const res = resList(ctx).map((r) => ({ id: r.id, type: r.type, title: r.title, date: r.date, time: r.time, ...(opts.conf ? { conf: r.conf, note: r.note, url: r.url } : {}) }));
  return { v: 1, createdAt: Date.now(), trip: ctx.trip, reservations: res, plans: ctx.get("plans", {}) || {}, settings: { speed: settings(ctx).speed }, ...(opts.places ? { places: asRecords(ctx.get("places", []), "text").map((p) => ({ id: p.id, text: p.text, ll: p.ll, note: p.note })) } : {}) };
}
function shareView(ctx) {
  return `${head(ctx, "Share & export")}
  <div class="panel" style="margin-top:0"><h3>Print or save as PDF</h3><p class="note" style="margin:0 0 10px">A clean printout of the itinerary with your day plans and reservations.</p><button class="btn" data-act="print">Print itinerary</button></div>
  <div class="panel"><h3>Calendar</h3><p class="note" style="margin:0 0 10px">One all-day event per trip day, plus an event for each reservation that has a date. Opens in Apple Calendar, Google Calendar and Outlook.</p><button class="btn" data-act="ics">Download calendar file (.ics)</button></div>
  <div class="panel"><h3>Share a read-only link</h3><p class="note" style="margin:0 0 10px">Anyone with the link can see the itinerary, map, day plans and reservations. It is a copy made now: make a new link to share later changes. Links last a year.</p><form data-form="share"><label class="check" style="margin-bottom:8px"><input type="checkbox" name="conf"><span>Include confirmation numbers, links and notes on reservations</span></label><label class="check" style="margin-bottom:12px"><input type="checkbox" name="places"><span>Include saved places</span></label><button class="btn" type="submit">${ui.busy ? "Creating…" : "Create link"}</button></form>${ui.shareUrl ? `<div class="linkbox"><input id="shareurl" readonly value="${attr(ui.shareUrl)}" aria-label="Share link"><button class="btn" data-act="copy-link">Copy</button>${navigator.share ? `<button class="btn ghost" data-act="native-share">Share…</button>` : ""}</div>` : ""}${ui.msg ? `<p class="note" style="margin-top:8px">${esc(ui.msg)}</p>` : ""}</div>
  <div class="panel"><h3>Back up your data</h3><p class="note" style="margin:0 0 10px">A copy of everything in this app, as one file.</p><button class="btn ghost" data-act="export-json">Download backup (.json)</button></div>
  ${ctx.trip.builtin ? "" : `<div class="panel"><h3>Delete this trip</h3><p class="note" style="margin:0 0 10px">Removes the trip and everything saved under it, here and on synced devices.</p><button class="btn danger" data-act="trip-del">Delete trip</button></div>`}</section>`;
}

// ---------------------------------------------------------------------------------------------------------------------
// Render and events
// ---------------------------------------------------------------------------------------------------------------------
const isEditing = () => { const a = document.activeElement; return !!a && app.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== "checkbox"; };
const VIEWS = { "": overview, map: mapView, guide: guideView, day: dayView, reservations: reservationsView, "saved-places": placesView, packing: packingView, expenses: expensesView, documents: documentsView, notes: notesView, share: shareView };

async function loadShare(id) {
  try { shares.set(id, await getJson(`/api/share/${id}`)); } catch { shares.set(id, "missing"); }
  render();
}
function render() {
  const r = route();
  if (r.sec !== "map") destroyMap();
  let ctx = null, html;
  if (r.kind === "home") { document.title = "Travel"; html = home(); }
  else if (r.kind === "share") {
    const snap = shares.get(r.id);
    if (!snap) { loadShare(r.id); paintNav(r, { trip: { name: "Shared trip" }, readonly: true, base: `/s/${r.id}` }); app.innerHTML = '<div class="empty" role="status">Loading the shared trip…</div>'; return; }
    if (snap === "missing") { paintNav({ kind: "home" }, null); app.innerHTML = '<div class="banner">That shared link was not found. It may have expired or been mistyped.</div><a class="back" href="/" data-link>Go to my trips</a>'; return; }
    ctx = context(r); document.title = `${ctx.trip.name} · Travel`; html = (VIEWS[r.sec] ?? overview)(ctx);
  } else { ctx = context(r); document.title = `${ctx.trip.name} · Travel`; html = (VIEWS[r.sec] ?? overview)(ctx); }
  paintNav(r, ctx);
  app.innerHTML = (ctx?.trip ? countdownHtml(ctx.trip) : "") + html;
  tickCountdowns();
  paintSync();
  if (!ctx) return;
  if (r.sec === "map") initTripMap(mapEnv(ctx));
  else if (r.sec === "") fillWeather(ctx.trip);
  else if (r.sec === "day") { fillWeather(ctx.trip); initDayMap(dayMapEnv(ctx)); }
  else if (r.sec === "guide") fillGuide(ctx);
  const pn = document.getElementById("pnotes");
  if (pn && !ctx.readonly) { let t; pn.oninput = () => { clearTimeout(t); t = setTimeout(() => edit("placenotes", {}, (o) => { o[ctx.place] = pn.value; }, false), 400); }; }
  const n = document.getElementById("notes");
  if (n && !ctx.readonly) { let t; n.oninput = () => { clearTimeout(t); t = setTimeout(() => put(ctx.trip.id, "notes", n.value), 400); }; }
}

const cur = () => { const r = route(); return r.kind === "trip" ? context(r) : null; };
const updateTrip = (trip) => { setTrips(db, customTrips().map((t) => (t.id === trip.id ? trip : t))); persist(); };
const num = (v) => { const x = Number(String(v).replace(",", ".")); return Number.isFinite(x) ? x : NaN; };
const edit = (name, fallback, fn, rerender = true) => { const c = cur(); const v = structuredClone(c.get(name, fallback)); const out = fn(v) ?? v; put(c.trip.id, name, out); if (rerender) render(); };
const rec = (name, field) => asRecords(cur().get(name, []), field);

async function findOnMap(names, trip) {
  const missing = names.filter((n) => !trip.geo.places[n]);
  if (!missing.length) return [];
  ui.busy = true; toast("Finding places on the map…");
  const failed = [];
  for (const n of missing) { const ll = await geocode(n); if (ll) trip.geo.places[n] = ll; else failed.push(n); }
  ui.busy = false;
  return failed;
}

const acts = {
  "new-trip": () => { ui.newTrip = true; render(); document.getElementById("nt-name")?.focus(); },
  "new-trip-cancel": () => { ui.newTrip = false; render(); },
  install: async () => { if (installEvent) { installEvent.prompt(); installEvent = null; render(); } },
  "sync-now": () => sync.run().then(() => toast(sync.state === "ok" ? "Synced" : "Could not sync right now")),
  "sync-off": () => { if (confirm("Stop syncing on this device? Your data stays here and on the other devices.")) { sync.disable(); render(); } },
  "plan-toggle": (el) => { const n = +el.dataset.day; ui.planDay = ui.planDay === n ? null : n; render(); },
  "plan-del": (el) => edit("plans", {}, (p) => { p[el.dataset.day] = (p[el.dataset.day] ?? []).filter((x) => x.id !== el.dataset.id); }),
  "day-edit": (el) => { ui.editDay = +el.dataset.day; render(); },
  "day-cancel": () => { ui.editDay = null; render(); },
  "day-add": () => { const t = structuredClone(cur().trip); t.days.push({ n: t.days.length + 1, title: `Day ${t.days.length + 1}`, desc: "", stops: [], photo: "" }); updateTrip(t); ui.editDay = t.days.length; render(); },
  "day-del": (el) => {
    if (!confirm("Delete this day?")) return;
    const t = structuredClone(cur().trip); t.days.splice(+el.dataset.day - 1, 1); t.days.forEach((d, i) => (d.n = i + 1)); updateTrip(t); ui.editDay = null; render();
  },
  "trip-del": () => { const c = cur(); if (confirm(`Delete "${c.trip.name}" and everything saved under it?`)) { setTrips(db, customTrips().filter((t) => t.id !== c.trip.id)); persist(); go("/"); } },
  "res-edit": (el) => { ui.editRes = el.dataset.id; render(); document.querySelector('[data-form="res-save"]')?.scrollIntoView({ block: "center" }); },
  "res-cancel": () => { ui.editRes = null; render(); },
  "res-del": (el) => { if (confirm("Delete this reservation?")) { ui.editRes = null; edit("reservations", [], (l) => asRecords(l).filter((r) => r.id !== el.dataset.id)); } },
  "place-del": (el) => edit("places", [], (l) => asRecords(l, "text").filter((p) => p.id !== el.dataset.id)),
  "pack-del": (el) => edit("packing", [], (l) => asRecords(l, "text").filter((p) => p.id !== el.dataset.id)),
  "pack-starter": () => edit("packing", [], (l) => { const have = new Set(asRecords(l, "text").map((p) => p.text.toLowerCase())); return [...asRecords(l, "text"), ...STARTER.filter((t) => !have.has(t.toLowerCase())).map((text) => ({ id: uid(), text, done: false }))]; }),
  "pack-clear": () => edit("packing", [], (l) => asRecords(l, "text").map((p) => ({ ...p, done: false }))),
  "doc-del": (el) => edit("documents", [], (l) => asRecords(l).filter((d) => d.id !== el.dataset.id)),
  "exp-del": (el) => { if (confirm("Delete this expense?")) edit("expenses", [], (l) => asRecords(l, "d").filter((e) => e.id !== el.dataset.id)); },
  "rate-fetch": async () => {
    try { const j = await getJson("https://api.frankfurter.app/latest?from=EUR&to=USD"); edit("settings", {}, (s) => ({ ...s, rate: j.rates.USD, rateAt: j.date })); toast(`1 € = $${j.rates.USD}`); }
    catch { toast("Could not get today's rate. Type one in."); }
  },
  print: () => window.print(),
  ics: () => {
    const c = cur(), t = c.trip;
    const days = t.days.map((d) => ({ date: dayDate(t, d.n), title: `${t.name}: ${d.title}`, desc: [d.desc, d.stops.length ? `Stops: ${d.stops.join(", ")}` : "", ...(((c.get("plans", {}) || {})[d.n]) ?? []).map((p) => `${p.time ? p.time + " " : ""}${p.text}`)].filter(Boolean).join("\n") }));
    download(`${slug(t.name)}.ics`, buildIcs({ id: t.id, name: t.name, days, reservations: resList(c) }), "text/calendar");
    toast("Calendar file downloaded");
  },
  "export-json": () => { download(`travel-backup-${today()}.json`, JSON.stringify(db, null, 1), "application/json"); toast("Backup downloaded"); },
  "copy-link": async () => { try { await navigator.clipboard.writeText(ui.shareUrl); toast("Link copied"); } catch { document.getElementById("shareurl")?.select(); toast("Press Copy on your keyboard to copy the link"); } },
  "native-share": () => navigator.share?.({ title: cur().trip.name, url: ui.shareUrl }).catch(() => {}),
};

const forms = {
  "new-trip": (f, d) => {
    const n = Math.max(1, Math.min(45, Math.round(num(d.get("days"))) || 1));
    const t = { id: `${slug(d.get("name"))}-${uid().slice(0, 4)}`, name: String(d.get("name")).trim(), start: d.get("start"), mode: "travel", days: Array.from({ length: n }, (_, i) => ({ n: i + 1, title: `Day ${i + 1}`, desc: "", stops: [], photo: "" })), geo: { places: {} } };
    setTrips(db, [...customTrips(), t]); persist(); ui.newTrip = false; go(`/trips/${t.id}`);
  },
  "sync-on": async (f, d) => { try { await sync.enable(String(d.get("phrase"))); toast(sync.state === "ok" ? "Sync is on" : "Sync could not reach the server yet. It will keep trying."); } catch { toast("Could not turn on sync"); } render(); },
  speed: (f, d) => { const v = num(d.get("speed")); if (v >= 2 && v <= 30) edit("settings", {}, (s) => ({ ...s, speed: v })); },
  "plan-add": (f, d) => { const n = f.dataset.day; ui.planDay = null; edit("plans", {}, (p) => { (p[n] ??= []).push({ id: uid(), time: d.get("time") || "", text: String(d.get("text")).trim() }); }); },
  "res-save": (f, d) => {
    const id = d.get("id") || uid(), r = { id, type: d.get("type"), title: String(d.get("title")).trim(), date: d.get("date") || "", time: d.get("time") || "", conf: String(d.get("conf") || "").trim(), url: String(d.get("url") || "").trim(), note: String(d.get("note") || "").trim() };
    ui.editRes = null;
    edit("reservations", [], (l) => { l = asRecords(l); const i = l.findIndex((x) => x.id === id); if (i >= 0) l[i] = r; else l.push(r); return l; });
  },
  "place-add": async (f, d) => {
    const c = cur(), text = String(d.get("text")).trim(); ui.busy = true; toast("Finding it on the map…");
    const ll = await geocode(text); ui.busy = false;
    edit("places", [], (l) => [...asRecords(l, "text"), { id: uid(), text, note: String(d.get("note") || "").trim(), ...(ll ? { ll } : {}) }]);
    toast(ll ? "Added, and found on the map" : "Added (not found on the map)");
  },
  "pack-add": (f, d) => edit("packing", [], (l) => [...asRecords(l, "text"), { id: uid(), text: String(d.get("text")).trim(), done: false }]),
  "doc-add": (f, d) => edit("documents", [], (l) => [...asRecords(l), { id: uid(), title: String(d.get("title")).trim(), url: String(d.get("url") || "").trim() }]),
  "exp-add": (f, d) => { const a = num(d.get("a")); if (!Number.isFinite(a)) return toast("Enter the amount as a number"); edit("expenses", [], (l) => [...asRecords(l, "d"), { id: uid(), d: String(d.get("d")).trim(), a, cur: d.get("cur"), cat: d.get("cat"), day: d.get("day") || "" }]); },
  rate: (f, d) => { const v = num(d.get("rate")); if (v > 0.2 && v < 5) edit("settings", {}, (s) => ({ ...s, rate: v, rateAt: "" })); else toast("Enter dollars per euro, like 1.08"); },
  "day-edit": async (f, d) => {
    const c = cur(), t = structuredClone(c.trip), n = +f.dataset.day, day = t.days[n - 1];
    day.title = String(d.get("title")).trim() || `Day ${n}`; day.desc = String(d.get("desc") || "").trim(); day.photo = safeUrl(d.get("photo")) || "";
    day.stops = [...new Set(String(d.get("stops") || "").split(/\n|;/).map((x) => x.trim()).filter(Boolean))].slice(0, 8);
    const failed = await findOnMap(day.stops, t);
    updateTrip(t); ui.editDay = null; render();
    if (failed.length) toast(`Could not place on the map: ${failed.join("; ")}`);
  },
  share: async (f, d) => {
    const c = cur(); ui.busy = true; ui.msg = ""; render();
    try {
      const r = await getJson("/api/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(snapshot(c, { conf: d.get("conf") === "on", places: d.get("places") === "on" })) });
      ui.shareUrl = `${location.origin}/s/${r.id}`;
    } catch (e) { ui.msg = e.status === 413 ? "That trip is too large to share." : "Could not create the link. Check your connection and try again."; }
    ui.busy = false; render();
  },
};

document.addEventListener("click", (e) => {
  const fly = e.target.closest("[data-fly]");
  if (fly) { flyToPin(fly.dataset.fly); document.getElementById("daymap")?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); return; }
  if (e.target.closest("[data-replay]")) { replayDay(); return; }
  if (e.target.closest("[data-fit]")) { fitDay(); return; }
  const a = e.target.closest("a[data-link]");
  if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.button) { e.preventDefault(); go(a.getAttribute("href")); return; }
  const card = e.target.closest("article[data-open]");
  if (card && !e.target.closest("a,button,input,textarea,select,label,form") && !getSelection()?.toString() && !e.metaKey && !e.ctrlKey) { go(card.dataset.open); return; }
  const el = e.target.closest("[data-act]");
  if (!el || el.tagName === "INPUT") return;
  acts[el.dataset.act]?.(el, e);
});
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-act]");
  if (el?.dataset.act === "pack-toggle") edit("packing", [], (l) => asRecords(l, "text").map((p) => (p.id === el.dataset.id ? { ...p, done: el.checked } : p)));
});
document.addEventListener("submit", (e) => {
  const f = e.target.closest("[data-form]");
  if (!f) return;
  e.preventDefault();
  forms[f.dataset.form]?.(f, new FormData(f));
});
addEventListener("popstate", render);

// Offline support, and a request that the browser keep this data.
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
navigator.storage?.persist?.().catch(() => {});
if (sync.key) { sync.state = "idle"; sync.startPoll(); sync.run(); }
render();
