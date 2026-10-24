// Airline liveries for the plane that flies the tour, and small marks for the booking cards. These are simplified drawings in each airline's
// colours (not the official artwork): swap the strings below for official SVGs if you have them.
const OUT = 'stroke="#17201d" stroke-width="1.1" stroke-linejoin="round"';
const FUSE = "M32 3c2.4 0 3.6 3.4 3.8 9l.5 33-1.2 10 3 3.5v2.5L32 60l-6.1 1.5V59l3-3.5-1.2-10 .5-33c.2-5.6 1.4-9 3.8-9z";
const WINGS = ["M31 20L5 40v5l26-9z", "M33 20l26 20v5l-26-9z"];
const TAILPLANE = ["M30 52l-10 6v3l10-3z", "M34 52l10 6v3l-10-3z"];
// The plane seen from above, nose up, 56 px; the page rotates it to the heading.
const plane = ({ body, wing, tail, engine, extra = "" }) => `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">${WINGS.map((d) => `<path d="${d}" fill="${wing}" ${OUT}/>`).join("")}${TAILPLANE.map((d) => `<path d="${d}" fill="${tail}" ${OUT}/>`).join("")}<ellipse cx="19" cy="38" rx="2.6" ry="5" fill="${engine}" ${OUT}/><ellipse cx="45" cy="38" rx="2.6" ry="5" fill="${engine}" ${OUT}/><path d="${FUSE}" fill="${body}" ${OUT}/>${extra}</svg>`;

export const AIRLINES = {
  iberia: {
    name: "Iberia",
    colour: "#d7192d",
    // White jet with a red tail and engines and a yellow stripe along the fuselage.
    plane: plane({ body: "#ffffff", wing: "#ffffff", tail: "#d7192d", engine: "#d7192d", extra: '<path d="M32 12v34" stroke="#ffc400" stroke-width="2.2" stroke-linecap="round"/><path d="M29 51.5l3-1.4 3 1.4V57l-3 1.2-3-1.2z" fill="#d7192d"/><path d="M6 41.5l7-5M58 41.5l-7-5" stroke="#d7192d" stroke-width="2.4" stroke-linecap="round"/>' }),
    mark: '<svg viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><path d="M3 17C8 4 18 2 26 3 20 4 13 8 9 17z" fill="#d7192d"/><path d="M9 17C12 11 17 7 24 5 20 9 17 13 15 17z" fill="#ffc400"/></svg>',
  },
  american: {
    name: "American",
    colour: "#0078d2",
    // Polished-aluminium jet; the tail carries the blue, white and red of the flight symbol.
    plane: plane({ body: "#cdd3d8", wing: "#c2c9cf", tail: "#0b3a6e", engine: "#9aa5ae", extra: '<path d="M26 56.5l6-2.4v5.6l-6 1.6z" fill="#0078d2"/><path d="M32 54.1l6 2.4v4.8l-6-1.6z" fill="#c30e2e"/><path d="M26 47h12" stroke="#fff" stroke-width="1.6"/><path d="M5 43l6-3.6" stroke="#0078d2" stroke-width="2.4" stroke-linecap="round"/><path d="M59 43l-6-3.6" stroke="#c30e2e" stroke-width="2.4" stroke-linecap="round"/>' }),
    mark: '<svg viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><path d="M4 18L14 2l3 2-7 14z" fill="#0078d2"/><path d="M11 18l9-13 3 1.5-6 11.5z" fill="#c30e2e"/><path d="M17 18l6-8 3 1-4 7z" fill="#9aa5ae"/></svg>',
  },
};

/** The map marker for a plane in an airline's livery: the plane (the page rotates `.prot`) with a name tag showing the logo. */
export const planeMarker = (key) => {
  const a = AIRLINES[key];
  return a ? `<div class="bigplane"><div class="prot">${a.plane}</div><div class="achip" style="--c:${a.colour}">${a.mark}<span>${a.name}</span></div></div>` : "";
};
