// The README screenshots (PNG) and animations (GIF) rendered by scripts/screenshots.mjs.
// Every capture has a twin in the other theme ("-dark" for a light capture, "-light" for a dark one)
// that shows exactly the same state: only the theme differs (checked by test/screenshots.test.mjs).
import { allUp, maintenance, pending } from "./mock-states.mjs";

const pair = (file, type, width, config = {}, extra = {}) => [
  { file, type, theme: "light", width, config, ...extra },
  { file: `${file}-dark`, type, theme: "dark", width, config, ...extra },
];

export const shots = [
  ...pair("card", "uptime-card", 460),
  ...pair("mini-card", "uptime-mini-card", 380),
  ...pair("mini-card-all-up", "uptime-mini-card", 380, {}, { overrides: allUp }),
  ...pair("mini-card-zoom", "uptime-mini-card", 460, {}, { clicks: [".zoom"] }),
  ...pair("card-by-source", "uptime-card", 460, { group_by: "source", show_hero: false }),
  ...pair("card-problems", "uptime-card", 460, { only_problems: true }),
  ...pair("card-folded", "uptime-card", 460, { collapsed: true }),
  // Narrow cards: the full card at its minimum width (9 of 12 columns of a 320 px Sections view, 238 px) and the
  // mini card at 6 columns of a phone's Sections view (170 px).
  ...pair("card-narrow", "uptime-card", 238, { only_problems: true }),
  ...pair("mini-card-narrow", "uptime-mini-card", 170),
];

// One looping GIF per distinct animated state (each plays different keyframes), on the full card showing only the
// services with a problem:
//   up          — every service up: the heartbeat trace runs across the badge, the drive lights flicker
//   down        — a service down: alarm rings spread from the badge, the failed unit blinks red, its row's dot pulses
//   pending     — a service pending (retrying): the badge's dots light up in turn, the lights and the row's dot blink
//   maintenance — a service in maintenance: the wrench of the badge swings
export const gifs = [
  ...pair("up", "uptime-card", 460, { only_problems: true, show_ssl: false }, { overrides: allUp }),
  ...pair("down", "uptime-card", 460, { only_problems: true, show_ssl: false }),
  ...pair("pending", "uptime-card", 460, { only_problems: true, show_ssl: false }, { overrides: pending }),
  ...pair("maintenance", "uptime-card", 460, { only_problems: true, show_ssl: false }, { overrides: maintenance }),
];
