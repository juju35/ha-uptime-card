// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { ACCENT, VERSION } from "./core.js";
import { UptimeCard, UptimeMiniCard } from "./cards.js";
import { UptimeCardEditor, UptimeMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("uptime-card", UptimeCard);
define("uptime-mini-card", UptimeMiniCard);
define("uptime-card-editor", UptimeCardEditor);
define("uptime-mini-card-editor", UptimeMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "uptime-card",
    name: "Uptime Card",
    description: "Services from Uptime Kuma, Healthchecks.io, Ping, connectivity sensors and Certificate Expiry: status, latency, 24-hour uptime bar, certificate expiry and groups by tag.",
  },
  {
    type: "uptime-mini-card",
    name: "Uptime Mini Card",
    description: "Compact service overview: how many services are up, and which ones are down.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-uptime-card" });
}

console.info(`%c UPTIME-CARD %c v${VERSION} `, `color: white; background: ${ACCENT[0]}; font-weight: 700;`, `color: ${ACCENT[0]}; background: white; font-weight: 700;`);
