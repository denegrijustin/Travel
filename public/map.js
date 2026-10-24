// The trip map: animated zoom, the whole trip drawn as one connected route with direction arrows, a "play the trip" tour with a boat
// that sails the route and stops at each place, a progress scrubber, a satellite layer, and a card for the place you pick.
import { addDays as addDaysIso, modeScale, tourHours, buildTour, pointAt, arcPoints, haversineNm, googleMapsUrl, streetViewUrl, appleMapsUrl, bearing } from "./lib.js";

const DAYCOL = ["#d94f3d", "#e08a1e", "#c9a400", "#3a9d5d", "#1f9bb5", "#3a6fd1", "#7a52c9", "#c0408f"];
export const dayColor = (n) => DAYCOL[(n - 1) % DAYCOL.length];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const TRAIN = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect x="7" y="4" width="18" height="20" rx="5" fill="#fff" stroke="#17201d" stroke-width="1.5"/><rect x="10" y="8" width="12" height="7" rx="2" fill="#215b50"/><circle cx="12" cy="20" r="1.6" fill="#17201d"/><circle cx="20" cy="20" r="1.6" fill="#17201d"/><path d="M10 28l3-4M22 28l-3-4" stroke="#17201d" stroke-width="2" stroke-linecap="round"/></svg>';
const PLANE = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#fff" stroke="#17201d" stroke-width="1.5"/><path d="M16 5l2 9 8 4v2l-8-2v5l3 2v1.5l-5-1-5 1V25l3-2v-5l-8 2v-2l8-4z" fill="#8a5a00"/></svg>';
const BOAT = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M16 3v19H6z" fill="#fff" stroke="#17201d" stroke-width="1.5" stroke-linejoin="round"/><path d="M18 8v14h8z" fill="#fff" stroke="#17201d" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 24h24l-4 5H8z" fill="#215b50" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';

let current = null; // the running map, so it can be torn down
export function destroyMap() {
  if (!current) return;
  current.stop();
  current.map.remove();
  current = null;
}

/**
 * `env`: { ctx, dayGeo, dayLabel, esc, attr, savedPlaces, placeFor(name) -> {slug, tagline, ...}|null, wikiFor(name) -> Promise<{extract,thumb,url}|null>, guideHref(name) }
 */
export function initTripMap(env) {
  destroyMap();
  const { ctx, esc, attr } = env, { trip } = ctx, days = trip.days;
  const el = document.getElementById("tripmap");
  if (!el) return;
  if (typeof L === "undefined") { el.innerHTML = '<div class="empty" style="padding:30px">The map library could not load. Check your connection and reload.</div>'; return; }
  const dayData = days.map((d, i) => { const g = env.dayGeo(trip, i + 1); const mode = d.mode ?? trip.mode; return { n: i + 1, path: g.path, pins: g.pins, mode, scale: modeScale(mode) }; });
  // Flights and the opening train ride are legs of their own, tucked in before the first day on or after their date. Flights are drawn as
  // great-circle arcs and the train follows the rail corridor. Every mode is scaled by its real speed (see modeScale in lib.js).
  const legSegs = (trip.legs ?? []).filter((l) => l.tour).map((l) => {
    const ll = l.route ? l.route.map((c) => trip.airports?.[c]?.ll).filter(Boolean) : [];
    const path = l.route ? ll.slice(1).flatMap((b, i) => arcPoints(ll[i], b).slice(i ? 1 : 0)) : trip.geo?.lines?.[l.line] ?? [];
    return { n: "leg-" + l.id, leg: l, path, pins: [], mode: l.route ? "air" : "rail", scale: modeScale(l.route ? "air" : "rail") };
  }).filter((x) => x.path.length > 1);
  const segs = [...dayData];
  for (const sg of legSegs) {
    const at = trip.start ? days.findIndex((_, i) => addDaysIso(trip.start, i) >= sg.leg.date) : -1, idx = at < 0 ? -1 : segs.findIndex((x) => x.n === at + 1);
    segs.splice(idx < 0 ? segs.length : idx, 0, sg);
  }
  const tour = buildTour(segs);
  const allPts = [...tour.verts.filter((v) => v.mode !== "air").map((v) => v.ll), ...dayData.flatMap((d) => d.pins.map((p) => p.ll)), ...env.savedPlaces.filter((p) => p.ll).map((p) => p.ll)];
  if (!allPts.length) { el.innerHTML = '<div class="empty" style="padding:30px">No places on the map yet. Add places to a day and they appear here.</div>'; return; }
  const bounds = L.latLngBounds(allPts); // the places you visit
  const journey = L.latLngBounds([...allPts, ...Object.values(trip.airports ?? {}).map((a) => a.ll)]); // and the flights from home
  const R = reduced();

  const map = L.map(el, { scrollWheelZoom: false, wheelPxPerZoomLevel: 100, zoomAnimation: true, markerZoomAnimation: true, fadeAnimation: true });
  const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18, attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics" });
  osm.addTo(map);
  L.control.layers({ Map: osm, Satellite: sat }, null, { position: "topright", collapsed: true }).addTo(map);
  // The scroll wheel only zooms the map after you click it, so scrolling the page never gets stuck on it.
  map.on("click", () => map.scrollWheelZoom.enable());
  el.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
  map.fitBounds(journey.pad(0.12), { animate: false });

  // ---- The connected route ----
  const railOverlays = [], lines = {}, casings = {}, arrows = L.layerGroup().addTo(map), linkLines = [];
  for (const d of dayData) {
    const r = tour.days[d.n];
    if (!r) continue;
    let from = r.firstIdx;
    if (tour.verts[from + 1]?.kind === "link" && tour.verts[from + 1].day === d.n) {
      const link = L.polyline([tour.verts[from].ll, tour.verts[from + 1].ll], { color: "#67706c", weight: 3, opacity: 0.8, dashArray: "2 8", lineCap: "round" }).addTo(map);
      link.bindTooltip(`Between days · about ${Math.round(haversineNm(tour.verts[from].ll, tour.verts[from + 1].ll))} nm`, { sticky: true });
      linkLines.push(link);
      from += 1;
    }
    const pts = tour.verts.slice(from, r.lastIdx + 1).map((v) => v.ll);
    if (pts.length < 2) continue;
    const col = dayColor(d.n);
    casings[d.n] = L.polyline(pts, { color: "#fff", weight: 9, opacity: 0.75, lineCap: "round", lineJoin: "round", interactive: false }).addTo(map);
    lines[d.n] = L.polyline(pts, { color: col, weight: 5, opacity: 0.95, lineCap: "round", lineJoin: "round", className: `route route-${d.n}` }).addTo(map);
    const nm = pts.reduce((s, p, i) => (i ? s + haversineNm(pts[i - 1], p) : 0), 0);
    lines[d.n].bindTooltip(`Day ${d.n} · ${esc(days[d.n - 1].title)}<br>about ${d.mode === "sail" ? `${Math.round(nm)} nm` : `${Math.round(nm * 1.15078)} mi`}`, { sticky: true });
    if (d.mode === "rail") railOverlays.push(L.polyline(pts, { color: "#fff", weight: 2, opacity: 0.95, dashArray: "6 8", interactive: false, lineCap: "butt" }).addTo(map)); // sleepers: white dashes on the colour make a rail line
    lines[d.n].on("click", () => showDay(d.n));
    // a direction arrow in the middle of every long enough leg
    for (let i = 1; i < pts.length; i++) {
      if (haversineNm(pts[i - 1], pts[i]) < 2.5) continue;
      const mid = [(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2];
      L.marker(mid, { interactive: false, keyboard: false, icon: L.divIcon({ className: "", html: `<div class="arrow" style="--c:${col};transform:rotate(${bearing(pts[i - 1], pts[i]).toFixed(0)}deg)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] }) }).addTo(arrows);
    }
  }

  // The flights and the opening train ride: amber dashed arcs for flights, a rail-style line for the train.
  const legLines = [];
  for (const sg of legSegs) {
    const air = sg.mode === "air", pts = sg.path;
    if (air) legLines.push(L.polyline(pts, { color: "#8a5a00", weight: 3, opacity: 0.9, dashArray: "8 8", lineCap: "round" }).bindTooltip(esc(sg.leg.title), { sticky: true }).addTo(map));
    else {
      legLines.push(L.polyline(pts, { color: "#fff", weight: 8, opacity: 0.7, interactive: false }).addTo(map));
      legLines.push(L.polyline(pts, { color: "#3b4a45", weight: 4, opacity: 0.95 }).bindTooltip(esc(sg.leg.title), { sticky: true }).addTo(map));
      legLines.push(L.polyline(pts, { color: "#fff", weight: 2, dashArray: "6 8", interactive: false }).addTo(map));
    }
  }
  const homeCode = trip.legs?.find((l) => l.route)?.route[0];
  if (trip.airports) for (const [code, a] of Object.entries(trip.airports)) L.marker(a.ll, { icon: L.divIcon({ className: "", html: '<div class="pin air">✈</div>', iconSize: [26, 26], iconAnchor: [13, 13] }), title: a.name }).bindTooltip(code === homeCode ? `Start: ${esc(a.name)}` : esc(a.name), { direction: "top", offset: [0, -12], permanent: code === homeCode }).addTo(map);

  // ---- Places ----
  const markers = {};
  const pinFor = new Map();
  for (const d of dayData) d.pins.forEach((p, j) => { if (!pinFor.has(p.name)) pinFor.set(p.name, { ...p, day: d.n, first: j === 0 }); });
  for (const d of dayData) {
    d.pins.forEach((p, j) => {
      const col = dayColor(d.n);
      const m = L.marker(p.ll, { icon: L.divIcon({ className: "", html: `<div class="pin" style="background:${col}" data-day="${d.n}">${j === 0 ? d.n : ""}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] }), title: p.name, keyboard: true, riseOnHover: true }).addTo(map);
      m.bindTooltip(esc(p.name), { direction: "top", offset: [0, -12] });
      m.on("click", () => selectPlace(p.name, p.ll, d.n, true));
      (markers[d.n] ??= []).push(m);
      (markers[p.name] ??= []).push(m);
    });
  }
  for (const pl of env.savedPlaces) {
    if (!pl.ll) continue;
    const m = L.marker(pl.ll, { icon: L.divIcon({ className: "", html: '<div class="pin saved">★</div>', iconSize: [26, 26], iconAnchor: [13, 13] }), title: pl.text }).addTo(map);
    m.bindTooltip(esc(pl.text), { direction: "top", offset: [0, -12] });
    m.on("click", () => selectPlace(pl.text, pl.ll, 0, true, { saved: pl }));
  }

  // ---- Camera ----
  const fly = (ll, zoom, dur = 1.2) => (R ? map.setView(ll, zoom, { animate: false }) : map.flyTo(ll, zoom, { duration: dur, easeLinearity: 0.3 }));
  const flyBounds = (b, opts = {}) => (R ? map.fitBounds(b, { animate: false, ...opts }) : map.flyToBounds(b, { duration: 1.3, easeLinearity: 0.3, ...opts }));

  // ---- Info card ----
  const info = document.getElementById("mapinfo");
  let infoToken = 0;
  function selectPlace(name, ll, day, flyTo, extra = {}) {
    markers[name]?.forEach((m) => m.getElement()?.firstChild.classList.add("sel"));
    Object.values(markers).flat().forEach((m) => { if (!markers[name]?.includes(m)) m.getElement()?.firstChild.classList.remove("sel"); });
    if (flyTo) fly(ll, Math.max(map.getZoom(), 12.5), 1.1);
    const token = ++infoToken, curated = env.placeFor(name), href = env.guideHref(name);
    const daysHere = days.filter((d, i) => dayData[i].pins.some((p) => p.name === name)).map((d) => d.n);
    const render = (wiki) => {
      if (token !== infoToken) return;
      info.innerHTML = `<div class="pinfo">${wiki?.thumb ? `<img src="${attr(wiki.thumb)}" alt="" loading="lazy">` : ""}<div class="pbody"><div class="eyebrow">${extra.saved ? "SAVED PLACE" : daysHere.length ? `DAY${daysHere.length > 1 ? "S" : ""} ${daysHere.join(", ")}` : "PLACE"}</div><h3>${esc(name)}</h3><p>${esc(curated?.tagline || (wiki?.extract ? wiki.extract.split(". ")[0] + "." : extra.saved?.note || ""))}</p><div class="pacts">${extra.saved ? "" : `<a class="btn small" href="${attr(href)}" data-link>Read the guide</a>`}<a class="btn small ghost" href="${attr(googleMapsUrl(ll, name))}" target="_blank" rel="noopener">Google Maps</a><a class="btn small ghost" href="${attr(streetViewUrl(ll))}" target="_blank" rel="noopener">Street view</a><a class="btn small ghost" href="${attr(appleMapsUrl(ll, name))}" target="_blank" rel="noopener">Apple Maps</a></div></div></div>`;
    };
    render(null);
    if (!extra.saved) env.wikiFor(name).then(render).catch(() => {});
  }

  // ---- Days ----
  const bar = document.getElementById("mapbar"), cap = document.getElementById("mapcap");
  let selectedDay = 0;
  function highlight(n) {
    selectedDay = n;
    for (const d of days) {
      const on = !n || n === d.n;
      lines[d.n]?.setStyle({ opacity: on ? 0.95 : 0.18, weight: on && n ? 6 : 5 });
      casings[d.n]?.setStyle({ opacity: on ? 0.75 : 0.1 });
      (markers[d.n] ?? []).forEach((m) => { m.getElement()?.firstChild.classList.toggle("dim", !on); m.setZIndexOffset(on ? 500 : 0); });
    }
    bar.innerHTML = [`<button type="button" aria-pressed="${n === 0}" data-d="0">All days</button>`, ...days.map((x) => `<button type="button" aria-pressed="${n === x.n}" data-d="${x.n}" style="--c:${dayColor(x.n)}">Day ${x.n}</button>`)].join("");
    bar.querySelectorAll("button").forEach((b) => (b.onclick = () => (+b.dataset.d ? showDay(+b.dataset.d) : showAll())));
    bar.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: R ? "auto" : "smooth" });
  }
  function showAll(animate = true) {
    stopPlay();
    highlight(0); cap.innerHTML = "";
    history.replaceState({}, "", location.pathname);
    if (animate) flyBounds(journey.pad(0.12)); else map.fitBounds(journey.pad(0.12), { animate: false });
    resetBoat();
  }
  function showDay(n) {
    stopPlay();
    highlight(n);
    history.replaceState({}, "", `${location.pathname}?day=${n}`);
    const g = dayData[n - 1], r = tour.days[n];
    const pts = [...(r ? tour.verts.slice(r.firstIdx, r.lastIdx + 1).map((v) => v.ll) : []), ...g.pins.map((p) => p.ll)];
    if (pts.length) flyBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 12.5 });
    cap.innerHTML = env.dayCardHtml(days[n - 1]);
    if (r) { setDist(r.start); pos.textContent = `Day ${n} · start`; }
    const first = g.pins[0];
    if (first) selectPlace(first.name, first.ll, n, false);
  }

  // ---- The boat and the tour ----
  const iconFor = (m) => (m === "sail" ? BOAT : m === "rail" ? TRAIN : m === "air" ? PLANE : '<div class="dotpulse"></div>');
  const modeOf = (v) => v?.mode ?? trip.mode;
  let curMode = modeOf(tour.verts[0]);
  const boat = L.marker(tour.verts[0].ll, { icon: L.divIcon({ className: "boat", html: `<div class="boaticon">${iconFor(curMode)}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }), interactive: false, keyboard: false, zIndexOffset: 1000, opacity: 0 }).addTo(map);
  const trail = L.polyline([], { color: "#17201d", weight: 7, opacity: 0.9, lineCap: "round", lineJoin: "round", interactive: false }).addTo(map);
  const scrub = document.getElementById("mscrub"), pos = document.getElementById("mpos"), playBtn = document.getElementById("mplay"), speedSel = document.getElementById("mspeed");
  let camAir = false, dist = 0, playing = false, raf = 0, lastT = 0, pauseUntil = 0, nextStop = 0, follow = true;
  const SECONDS = 50; // the whole trip at 1x, not counting the stops
  const VERB = { sail: "sailing", rail: "by train", air: "flying", walk: "on foot" };
  const label = () => { const p = pointAt(tour, dist); return p ? `${typeof p.day === "number" ? `Day ${p.day}` : segs.find((x) => x.n === p.day)?.leg.title} · ${VERB[modeOf(p)] ?? ""}` : ""; };
  function setDist(d, { move = true } = {}) {
    dist = Math.max(0, Math.min(d, tour.total));
    nextStop = tour.stops.findIndex((s) => s.at > dist + 1e-9); if (nextStop < 0) nextStop = tour.stops.length;
    if (move) place();
    scrub.value = tour.total ? Math.round((dist / tour.total) * 1000) : 0;
    pos.textContent = label();
  }
  function place() {
    const p = pointAt(tour, dist);
    if (!p) return;
    boat.setOpacity(1);
    boat.setLatLng(p.ll);
    const icon = boat.getElement()?.firstChild, m = modeOf(p);
    if (icon && m !== curMode) { curMode = m; icon.innerHTML = iconFor(m); icon.style.transform = ""; }
    if (icon && m === "air") icon.style.transform = `rotate(${p.heading.toFixed(0)}deg)`; // the plane points the way it flies
    else if (icon && m !== "walk") icon.style.transform = `scaleX(${p.heading > 180 ? -1 : 1})`; // the boat and train face east or west
    trail.setStyle({ color: typeof p.day === "number" ? dayColor(p.day) : "#8a5a00" });
    trail.setLatLngs([...tour.verts.slice(0, p.seg).map((v) => v.ll), p.ll]);
  }
  function resetBoat() { dist = 0; nextStop = 0; boat.setOpacity(0); trail.setLatLngs([]); scrub.value = 0; pos.textContent = ""; playBtn.textContent = "Play trip"; }
  function arrive(st) {
    selectPlace(st.name, st.ll, st.day, false);
    markers[st.name]?.[0]?.getElement()?.firstChild.classList.add("sel");
    if (st.spur) { boat.setLatLng(st.ll); }
    if (!R) map.flyTo(st.ll, Math.max(map.getZoom(), 12.5), { duration: 0.9, easeLinearity: 0.3 });
    else map.setView(st.ll, Math.max(map.getZoom(), 12.5), { animate: false });
    if (selectedDay !== st.day) { highlight(st.day); cap.innerHTML = env.dayCardHtml(days[st.day - 1]); }
  }
  function frame(t) {
    if (!playing) return;
    const dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
    if (t < pauseUntil) { raf = requestAnimationFrame(frame); return; }
    const speed = +speedSel.value, v = (tour.total / SECONDS) * speed;
    let nd = dist + v * dt;
    const st = tour.stops[nextStop];
    if (st && nd >= st.at) {
      setDist(st.at); nextStop += 1; arrive(st); pauseUntil = t + 1700 / speed;
      raf = requestAnimationFrame(frame); return;
    }
    setDist(nd);
    const air = modeOf(pointAt(tour, dist)) === "air";
    if (air !== camAir) { // zoom out to follow a flight, back in when it lands
      camAir = air; pauseUntil = t + 1300 / speed; follow = true;
      map.flyTo(boat.getLatLng(), air ? 4 : 10.5, { duration: 1.2, easeLinearity: 0.3 });
    } else if (follow) map.setView(boat.getLatLng(), map.getZoom(), { animate: false });
    if (dist >= tour.total) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }
  function startPlay() {
    if (dist >= tour.total - 0.01) setDist(0);
    playing = true; playBtn.textContent = "Pause"; playBtn.setAttribute("aria-pressed", "true");
    const start = pointAt(tour, dist);
    if (selectedDay) highlight(0);
    cap.innerHTML = "";
    place();
    if (R) { stepReduced(); return; }
    let started = false;
    const go = () => { if (started || !playing) return; started = true; lastT = performance.now(); pauseUntil = 0; raf = requestAnimationFrame(frame); };
    map.once("moveend", go);
    setTimeout(go, 1700); // in case the camera was already there and no move happens
    camAir = modeOf(start) === "air";
    map.flyTo(start.ll, camAir ? 4 : 11.5, { duration: 1.4, easeLinearity: 0.3 });
  }
  // With reduced motion the boat jumps from place to place instead of sailing.
  function stepReduced() {
    if (!playing) return;
    const st = tour.stops[nextStop];
    if (!st) { finish(); return; }
    setDist(st.at); nextStop += 1; arrive(st);
    raf = setTimeout(stepReduced, 1800 / +speedSel.value);
  }
  function stopPlay() { playing = false; cancelAnimationFrame(raf); clearTimeout(raf); playBtn.textContent = dist > 0 && dist < tour.total ? "Resume" : "Play trip"; playBtn.setAttribute("aria-pressed", "false"); }
  function finish() { stopPlay(); playBtn.textContent = "Play again"; toast("That's the whole trip."); }
  const toast = (t) => { pos.textContent = t; };
  playBtn.onclick = () => (playing ? stopPlay() : startPlay());
  scrub.oninput = () => { stopPlay(); setDist((+scrub.value / 1000) * tour.total); if (!R) map.panTo(boat.getLatLng(), { animate: true, duration: 0.25 }); else map.setView(boat.getLatLng(), map.getZoom(), { animate: false }); };
  document.getElementById("mfit").onclick = () => showAll();
  // "Italy" zooms in from the whole journey to the places you visit.
  document.getElementById("mflights")?.addEventListener("click", () => { stopPlay(); highlight(0); cap.innerHTML = ""; resetBoat(); flyBounds(bounds.pad(0.12)); });
  // dragging the map takes the camera back from the boat
  map.on("dragstart", () => { follow = false; });
  playBtn.addEventListener("click", () => { follow = true; });

  // ---- Draw the route in, once, when the map opens ----
  function drawIn() {
    const els = Object.entries(lines).map(([n, l]) => [+n, l.getElement(), casings[n]?.getElement()]).filter((x) => x[1]);
    if (R || !els.length) return;
    const lens = els.map(([, e]) => { try { return e.getTotalLength(); } catch { return 0; } });
    const total = lens.reduce((s, x) => s + x, 0) || 1, dur = 2800;
    let acc = 0;
    els.forEach(([n, e, c], i) => {
      const L0 = lens[i], delay = (acc / total) * dur, d = Math.max(250, (L0 / total) * dur);
      acc += L0;
      e.style.strokeDasharray = `${L0}`; e.style.strokeDashoffset = `${L0}`; e.style.transition = "none";
      if (c) { c.style.opacity = "0"; }
      void e.getBoundingClientRect();
      e.style.transition = `stroke-dashoffset ${d}ms ease-in-out ${delay}ms`;
      e.style.strokeDashoffset = "0";
      if (c) { c.style.transition = `opacity ${d}ms ease ${delay}ms`; c.style.opacity = ""; }
      setTimeout(() => { e.style.strokeDasharray = ""; e.style.strokeDashoffset = ""; e.style.transition = ""; if (c) c.style.transition = ""; }, delay + d + 80);
    });
    arrows.eachLayer((m) => { const a = m.getElement(); if (a) { a.style.opacity = "0"; a.style.transition = "opacity .6s ease 2.4s"; requestAnimationFrame(() => (a.style.opacity = "")); } });
  }

  // ---- Start ----
  const params = new URLSearchParams(location.search), wantDay = +params.get("day"), wantPlace = params.get("place");
  highlight(0);
  setDist(0, { move: false }); pos.textContent = "";
  if (wantDay >= 1 && wantDay <= days.length) showDay(wantDay);
  else {
    setTimeout(drawIn, 60);
    const pl = wantPlace && [...pinFor.values()].find((p) => env.slugOf(p.name) === wantPlace);
    if (pl) setTimeout(() => selectPlace(pl.name, pl.ll, pl.day, true), 400);
    else info.innerHTML = '<div class="pinfo"><div class="pbody"><h3>Explore the route</h3><p>Pick a day, click a stop for its guide, or press Play trip to sail the whole route.</p></div></div>';
  }
  setTimeout(() => map.invalidateSize(), 50);
  el._tripMap = map; el._boat = boat; // handles for tests and debugging
  current = { map, stop: () => { playing = false; cancelAnimationFrame(raf); clearTimeout(raf); } };
}

/**
 * A small map for one day: the route is drawn in while a boat, train, plane or walker travels it, and each stop's pin pops up as it is reached.
 * `env`: { n, mode, path, pins: [{name, ll}], legs: [{ mode, path, title }], esc, onPick(name) }. Returns nothing; use flyToPin(name) and replayDay().
 */
export function initDayMap(env) {
  destroyMap();
  const el = document.getElementById("daymap");
  if (!el) return;
  if (typeof L === "undefined") { el.innerHTML = '<div class="empty" style="padding:30px">The map library could not load. Check your connection and reload.</div>'; return; }
  const { n, pins, esc } = env, mode = env.mode ?? "walk", col = dayColor(n), R = reduced();
  const segs = [...env.legs.map((l, i) => ({ n: "leg" + i, path: l.path, pins: [], mode: l.mode, scale: modeScale(l.mode), title: l.title })), { n, path: env.path, pins, mode, scale: modeScale(mode) }];
  const tour = buildTour(segs);
  const all = [...tour.verts.map((v) => v.ll), ...pins.map((p) => p.ll)];
  if (!all.length) { el.innerHTML = '<div class="empty" style="padding:30px">No places on the map for this day.</div>'; return; }
  const map = L.map(el, { scrollWheelZoom: false, zoomAnimation: true, fadeAnimation: true });
  const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18, attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics" });
  osm.addTo(map);
  L.control.layers({ Map: osm, Satellite: sat }, null, { position: "topright", collapsed: true }).addTo(map);
  map.on("click", () => map.scrollWheelZoom.enable());
  el.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
  const bounds = L.latLngBounds(all);
  map.fitBounds(bounds.pad(0.25), { animate: false, maxZoom: 13 });

  // the whole route, faint, so you can see where the vehicle is headed
  for (const sg of segs) {
    if (sg.path.length < 2) continue;
    const air = sg.mode === "air", rail = sg.mode === "rail";
    L.polyline(sg.path, { color: air ? "#8a5a00" : rail ? "#3b4a45" : col, weight: air ? 3 : 4, opacity: 0.28, dashArray: air ? "8 8" : rail ? "2 8" : null, interactive: false }).addTo(map);
  }
  const trail = L.polyline([], { color: col, weight: 5, opacity: 0.95, lineCap: "round", lineJoin: "round", interactive: false }).addTo(map);
  const markers = new Map();
  pins.forEach((p, j) => {
    const m = L.marker(p.ll, { icon: L.divIcon({ className: "", html: `<div class="pin hid" style="background:${col}">${j + 1}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] }), title: p.name, keyboard: true }).addTo(map);
    m.bindTooltip(esc(p.name), { direction: "top", offset: [0, -12] });
    m.on("click", () => { env.onPick?.(p.name); flyToPin(p.name); });
    markers.set(p.name, m);
  });
  const iconFor = (m) => (m === "sail" ? BOAT : m === "rail" ? TRAIN : m === "air" ? PLANE : '<div class="dotpulse"></div>');
  let curMode = tour.verts[0]?.mode ?? mode;
  const rider = L.marker(tour.verts[0]?.ll ?? all[0], { icon: L.divIcon({ className: "boat", html: `<div class="boaticon">${iconFor(curMode)}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }), interactive: false, keyboard: false, zIndexOffset: 1000, opacity: 0 }).addTo(map);
  const pop = (name) => markers.get(name)?.getElement()?.firstChild?.classList.remove("hid");
  const showPins = () => pins.forEach((p) => pop(p.name));

  let raf = 0, token = 0;
  // The replay lasts in proportion to the real travel time (a short train hop is quick, a sailing day or a flight takes longer).
  const DURATION = Math.min(14000, Math.max(2200, tourHours(tour.total) * 1500));
  function place(dist) {
    const p = pointAt(tour, dist);
    if (!p) return;
    rider.setOpacity(1); rider.setLatLng(p.ll);
    const icon = rider.getElement()?.firstChild, m = p.mode ?? mode;
    if (icon && m !== curMode) { curMode = m; icon.innerHTML = iconFor(m); icon.style.transform = ""; }
    if (icon && m === "air") icon.style.transform = `rotate(${p.heading.toFixed(0)}deg)`;
    else if (icon && m !== "walk") icon.style.transform = `scaleX(${p.heading > 180 ? -1 : 1})`;
    trail.setLatLngs([...tour.verts.slice(0, p.seg).map((v) => v.ll), p.ll]);
  }
  function replay() {
    cancelAnimationFrame(raf); const mine = ++token;
    for (const m of markers.values()) m.getElement()?.firstChild?.classList.add("hid");
    trail.setLatLngs([]); rider.setOpacity(0);
    map.fitBounds(bounds.pad(0.25), { animate: false, maxZoom: 13 });
    if (R || !tour.total) { showPins(); trail.setLatLngs(tour.verts.map((v) => v.ll)); return; }
    let t0 = 0, nextStop = 0;
    const frame = (t) => {
      if (mine !== token) return;
      t0 ||= t;
      const f = Math.min(1, (t - t0) / DURATION), dist = easeInOutQuad(f) * tour.total;
      place(dist);
      while (nextStop < tour.stops.length && tour.stops[nextStop].at <= dist + 1e-9) pop(tour.stops[nextStop++].name);
      if (f < 1) raf = requestAnimationFrame(frame);
      else { showPins(); rider.setOpacity(0); }
    };
    raf = requestAnimationFrame(frame);
  }
  const easeInOutQuad = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
  function flyToPin(name) {
    const p = pins.find((x) => x.name === name);
    if (!p) return;
    pop(name);
    const mk = markers.get(name)?.getElement()?.firstChild;
    mk?.classList.remove("ping"); void mk?.offsetWidth; mk?.classList.add("ping");
    if (R) map.setView(p.ll, 14, { animate: false }); else map.flyTo(p.ll, 14, { duration: 1, easeLinearity: 0.3 });
  }
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); replay(); } }, { threshold: 0.4 });
  io.observe(el);
  current = { map, stop: () => { token++; cancelAnimationFrame(raf); io.disconnect(); }, flyToPin, replay, fit: () => map.fitBounds(bounds.pad(0.25), { animate: !R, maxZoom: 13 }) };
}
export const flyToPin = (name) => current?.flyToPin?.(name);
export const replayDay = () => current?.replay?.();
export const fitDay = () => current?.fit?.();
