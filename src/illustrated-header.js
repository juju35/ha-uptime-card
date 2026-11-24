// ---------------------------------------------------------------------------
// Illustrated header ("banner"): the rack in a server room
// ---------------------------------------------------------------------------
import { STATUS_CLASS } from "./statuses.js";
import { STATE_COLORS } from "./picture.js";

// The server room, a 200 × 80 picture drawn at the banner's right over a 10 px concrete floor strip: a cable tray
// along the ceiling, a network cable running down into a small switch whose lights follow the overall status. The
// rack (rackSvg, with its own animations) stands on the strip at the right. `uid` keeps the ids of each card apart.
export const sceneSvg = (status, night, uid) => {
  const cls = STATUS_CLASS[status] || "idle";
  const led = cls === "ok" ? "#43c463" : STATE_COLORS[cls];
  const live = status !== "down" && status !== "unknown";
  const wall = night ? ["#232a36", "#2e3746", "#3a4456", "#2e3746", "#455066"] : ["#e7eaee", "#d6dbe1", "#c4cbd3", "#ffffff", "#c4cbd3"];
  const lines = [20, 40, 60].map((y) => `<line x1="0" y1="${y}" x2="200" y2="${y}"/>`).join("");
  return `<svg class="scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <defs><linearGradient id="uc-cable-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${live ? "#2f80ed" : wall[4]}"/><stop offset="1" stop-color="${live ? "#5c9df2" : wall[4]}"/></linearGradient></defs>
    <rect width="200" height="80" fill="${wall[0]}"/><g stroke="${wall[1]}" stroke-width=".8">${lines}</g>
    <path d="M0 8 H200" stroke="${wall[2]}" stroke-width="3"/>
    <path class="${live ? "uc-flow" : ""}" d="M10 8 V40" stroke="url(#uc-cable-${uid})" stroke-width="1.6" fill="none"${live ? "" : ' stroke-dasharray="3 4"'}/>
    <rect x="18" y="20" width="22" height="16" rx="2" fill="${wall[3]}" stroke="${wall[4]}"/>
    <circle class="${status === "down" || status === "pending" ? "uc-alarm" : live ? "uc-blink" : ""}" cx="24" cy="28" r="1.4" fill="${led}"/>
    <circle class="${live ? "uc-blink" : ""}" cx="29" cy="28" r="1.4" fill="${status === "down" ? "#43c463" : led}" style="animation-delay:.4s"/>
    <circle class="${live ? "uc-blink" : ""}" cx="34" cy="28" r="1.4" fill="${led}" style="animation-delay:.8s" opacity=".7"/></svg>`;
};

// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
export const isNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// The header icon's colour on the banner follows the overall status: all up in green, pending or a warning in amber,
// a service down in red, maintenance in blue, nothing known in neutral grey.
export const BANNER_STYLE = `
  .banner { position: relative; height: 90px; overflow: hidden; flex: none; --sky-text: #0d2a45; --sky-muted: #3b5b78;
            color: var(--sky-text); background: #e7eaee; }
  .banner.night { --sky-text: #fff; --sky-muted: rgba(255,255,255,.78); background: #232a36; }
  .banner .scene { position: absolute; right: 0; bottom: 10px; height: 80px; width: min(200px, 62%);
                   -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 14%); mask-image: linear-gradient(90deg, transparent 0, #000 14%); }
  /* The floor: a 10 px concrete strip, edge to edge. */
  .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: #9aa1a9; box-shadow: inset 0 2px 0 #b5bbc2; }
  .banner.night .ground { background: #2c323b; box-shadow: inset 0 2px 0 #3a4250; }
  .banner .htext { position: absolute; z-index: 1; left: 0; top: 0; bottom: 10px; right: calc(min(200px, 62%) - 70px); box-sizing: border-box;
                   display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; min-width: 0; }
  .banner .titles { min-height: 0; }
  .banner .name { color: var(--sky-text); }
  .banner .sub { font-size: 13px; color: var(--sky-muted); }
  .banner .type-icon { background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--uc-tint) 22%, transparent); }
  .banner .type-icon .icon, .banner .type-icon:is(.ok, .warn, .crit, .idle, .maint) .icon { fill: var(--uc-tint); }
  .banner.night .type-icon { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner.night .type-icon .icon, .banner.night .type-icon:is(.ok, .warn, .crit, .idle, .maint) .icon { fill: color-mix(in srgb, var(--uc-tint) 72%, #fff); }
  /* The rack stands on the strip (its feet on the concrete). */
  .banner .bart { position: absolute; right: 10px; bottom: 7px; height: 62px; }
  .banner.has-zoom .bart { right: 38px; }
  .banner .bart .picture { width: auto; height: 62px; aspect-ratio: 120 / 140; }
  .banner .bart .picture img { width: 100%; height: 100%; max-height: none; filter: drop-shadow(0 2px 3px rgba(0,0,0,.2)); }
  /* The mini card's detail button: a frosted round button in the banner's top-right corner. */
  .banner .zoom { all: unset; position: absolute; z-index: 2; top: 5px; right: 5px; margin: 0; cursor: pointer; width: 24px; height: 24px;
                  border-radius: 50%; display: grid; place-items: center; box-sizing: border-box; color: #33506b; background: rgba(255,255,255,.55);
                  box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .banner .zoom .icon { width: 16px; height: 16px; }
  .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
  .banner.night .zoom { color: #ffffff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #ffffff; }
  .banner .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .banner .htext .titles { flex: 1 1 0; min-width: 0; align-self: stretch; display: flex; flex-direction: column; justify-content: center; }
  .tstack { display: flex; flex-direction: column; gap: 1px; align-items: flex-start; min-width: 0; width: 100%; }
  .tstack > * { max-width: 100%; }
  /* The status pill on the banner: the status colour on frosted glass. */
  .banner .chip { display: inline-flex; align-items: center; gap: 4px; flex: 0 0 auto; margin: 0; max-width: 51%; padding: 1px 8px; border-radius: 12px;
                  font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; overflow: hidden; box-sizing: border-box;
                  background: color-mix(in srgb, var(--c, var(--uc-accent)) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c, var(--uc-accent)) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c, var(--uc-accent)) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c, var(--uc-accent)) 35%, #ffffff); }
  .banner .chip .dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--c, var(--uc-accent)); }
  .banner .chip .chip-text { display: inline; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .uc-flow { stroke-dasharray: 3 4; animation: uc-flow 1s linear infinite; }
  .uc-blink { animation: uc-blink 1.2s steps(2, jump-none) infinite; }
  .uc-alarm { animation: uc-breathe .8s ease-in-out infinite; }
  @keyframes uc-flow { to { stroke-dashoffset: -14; } }
  @keyframes uc-blink { 50% { opacity: .2; } }
  /* Narrow card: no room for the room beside the text, the rack stays. */
  @container ut-card (max-width: 300px) { .banner .scene { display: none; } .banner .htext { right: 66px; } .banner.has-zoom .htext { right: 94px; } }
  /* Narrowest mini card: the rack gives way too (see MINI_STYLE), the text runs up to the detail button. */
  @container ut-card (max-width: 200px) { .banner .htext, .banner.has-zoom .htext { right: 40px; } }
  .banner + .content { padding-top: 12px; }
`;
