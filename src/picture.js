// ---------------------------------------------------------------------------
// Picture: a drawn server rack with a heartbeat badge, colored and animated by the overall state
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { STATUS_CLASS } from "./statuses.js";

// Animations of the picture. It is an <img>, so CSS animations run but no script does.
//   up          — the heartbeat trace runs across the badge, the drive lights flicker
//   down        — alarm rings spread from the badge, the failed unit's lights blink red, the trace is flat
//   pending     — the badge's three dots light up in turn, the lights blink orange
//   maintenance — the wrench of the badge swings, the lights stay blue
export const ANIM_CSS = `
  .trace { stroke-dasharray: 34 60; animation: trace 1.6s linear infinite; }
  .flicker { animation: flicker 1.2s steps(2, jump-none) infinite; }
  .blink { animation: blink 1s ease-in-out infinite; }
  .ring { transform-box: fill-box; transform-origin: center; animation: ring 1.8s ease-out infinite; }
  .dots circle { animation: dot 1.5s ease-in-out infinite; }
  .sway { transform-box: view-box; animation: sway 1.6s ease-in-out infinite alternate; }
  .d1 { animation-delay: -.5s; } .d2 { animation-delay: -1s; } .d3 { animation-delay: -.3s; } .d4 { animation-delay: -.8s; }
  @keyframes trace { from { stroke-dashoffset: 94; } to { stroke-dashoffset: 0; } }
  @keyframes flicker { 0% { opacity: 1; } 50% { opacity: .35; } 100% { opacity: 1; } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .15; } }
  @keyframes ring { from { transform: scale(.7); opacity: .9; } to { transform: scale(1.6); opacity: 0; } }
  @keyframes dot { 0%, 100% { opacity: .25; } 40% { opacity: 1; } }
  @keyframes sway { from { transform: rotate(-14deg); } to { transform: rotate(14deg); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`;

export const STATE_COLORS = { ok: "#43a047", warn: "#ffa600", crit: "#db4437", maint: "#039be5", idle: "#9e9e9e" };

// The rack for an overall status (up, down, pending, maintenance, unknown): three units with their lights, and the
// badge at the bottom right.
export const rackSvg = (status = "up") => {
  const cls = STATUS_CLASS[status] || "idle";
  const col = STATE_COLORS[cls];
  const units = [0, 1, 2]
    .map((i) => {
      const y = 22 + i * 32;
      const failed = status === "down" && i === 1;
      const lc = failed ? STATE_COLORS.crit : status === "unknown" ? "#6b7280" : status === "up" || status === "down" ? STATE_COLORS.ok : col;
      const anim = status === "up" || (status === "down" && !failed) ? `flicker d${i + 2}` : (status === "pending" || failed) ? `blink d${i}` : "";
      return `<rect x="26" y="${y}" width="68" height="24" rx="5" fill="#2b3038"/><rect x="26" y="${y}" width="68" height="4" rx="2" fill="#ffffff" opacity=".06"/>
        <circle cx="36" cy="${y + 12}" r="3" fill="${lc}" class="${anim}"/><circle cx="45" cy="${y + 12}" r="3" fill="${status === "up" || (status === "down" && !failed) ? "#8bc34a" : lc}" opacity=".85" class="${status === "up" || (status === "down" && !failed) ? `flicker d${i}` : anim}"/>
        ${[0, 1, 2, 3].map((k) => `<rect x="${56 + k * 8}" y="${y + 7}" width="4" height="10" rx="1.5" fill="#414852"/>`).join("")}`;
    })
    .join("");
  const bx = 92;
  const by = 112;
  let badge = `<circle cx="${bx}" cy="${by}" r="19" fill="${col}"/><circle cx="${bx}" cy="${by}" r="19" fill="none" stroke="#ffffff" stroke-opacity=".9" stroke-width="2.5"/>`;
  const ecg = `M${bx - 13} ${by} h6 l3 -8 l4 15 l3 -11 l2 4 h8`;
  if (status === "up") {
    badge += `<path d="${ecg}" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${ecg}" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" class="trace"/>`;
  } else if (status === "down") {
    badge = [0, 1]
      .map((i) => `<circle cx="${bx}" cy="${by}" r="19" fill="none" stroke="${col}" stroke-width="2.5" class="ring d${i}"/>`)
      .join("") + badge;
    badge += `<path d="M${bx - 12} ${by} h24" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>`;
  } else if (status === "pending") {
    badge += `<g class="dots" fill="#ffffff">${[-7, 0, 7].map((dx, i) => `<circle cx="${bx + dx}" cy="${by}" r="2.8" class="${i ? `d${i}` : ""}"/>`).join("")}</g>`;
  } else if (status === "maintenance") {
    badge += `<g class="sway" style="transform-origin:${bx}px ${by}px"><path transform="translate(${bx - 9} ${by - 9}) scale(.75)" fill="#ffffff" d="${ICONS.wrench}"/></g>`;
  } else {
    badge += `<path d="M${bx - 8} ${by} h16" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><style>${ANIM_CSS}</style><defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f3f6"/><stop offset="1" stop-color="#c3c9d2"/></linearGradient></defs>
    <ellipse cx="60" cy="134" rx="40" ry="4" opacity=".22"/>
    <rect x="18" y="10" width="84" height="122" rx="10" fill="url(#g)" stroke="#aab1bb"/>
    <rect x="22" y="14" width="76" height="102" rx="7" fill="#1d2127" opacity=".12"/>
    ${units}
    <rect x="30" y="124" width="10" height="6" rx="2" fill="#8d95a0"/><rect x="80" y="124" width="10" height="6" rx="2" fill="#8d95a0"/>
    ${badge}</svg>`;
};

export const svgUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
