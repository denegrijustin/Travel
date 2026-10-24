// Airline liveries for the plane that flies the tour, and small marks for the booking cards. These are simplified drawings in each airline's
// colours (not the official artwork): swap the strings below for official SVGs if you have them.
const HULL = "M16 5l2 9 8 4v2l-8-2v5l3 2v1.5l-5-1-5 1V25l3-2v-5l-8 2v-2l8-4z"; // the plane, seen from above, nose up
const plane = (body, parts) => `<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><circle cx="16" cy="16" r="14.5" fill="#fff" stroke="#17201d" stroke-width="1.5"/><path d="${HULL}" fill="${body}" stroke="#17201d" stroke-width=".8" stroke-linejoin="round"/>${parts}</svg>`;

export const AIRLINES = {
  iberia: {
    name: "Iberia",
    colour: "#d7192d",
    // White jet, red tail and engines, yellow-and-red wing mark on the tail.
    plane: plane("#ffffff", '<path d="M13 24.5l3-1.2 3 1.2v1.8l-3-.7-3 .7z" fill="#d7192d"/><path d="M16 9v13" stroke="#ffc400" stroke-width="1.3"/><path d="M8 18.6l4.4-1.2M24 18.6l-4.4-1.2" stroke="#d7192d" stroke-width="1.6" stroke-linecap="round"/>'),
    mark: '<svg viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><path d="M3 17C8 4 18 2 26 3 20 4 13 8 9 17z" fill="#d7192d"/><path d="M9 17C12 11 17 7 24 5 20 9 17 13 15 17z" fill="#ffc400"/></svg>',
  },
  american: {
    name: "American Airlines",
    colour: "#0078d2",
    // Polished-aluminium jet with the blue and red flight symbol on the tail.
    plane: plane("#cfd5da", '<path d="M13 24.5l3-1.2v2.6l-3 .4z" fill="#0078d2"/><path d="M16 23.3l3 1.2v1.8l-3-.4z" fill="#c30e2e"/><path d="M8 18.6l4.4-1.2" stroke="#0078d2" stroke-width="1.6" stroke-linecap="round"/><path d="M24 18.6l-4.4-1.2" stroke="#c30e2e" stroke-width="1.6" stroke-linecap="round"/>'),
    mark: '<svg viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><path d="M4 18L14 2l3 2-7 14z" fill="#0078d2"/><path d="M11 18l9-13 3 1.5-6 11.5z" fill="#c30e2e"/><path d="M17 18l6-8 3 1-4 7z" fill="#9aa5ae"/></svg>',
  },
};
