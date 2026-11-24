// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { STRINGS } from "./i18n/strings.js";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: the card's language: option, else HA's full locale (keeps its region) when its base matches the
// resolved card language, else that language. A bare "pt" (European Portuguese in HA) becomes "pt-PT".
export const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

export const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

export const valid = (s) => !!s && !["unknown", "unavailable", ""].includes(s.state);

export const num = (s) => {
  if (!valid(s)) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

export const UNIT_FMT = {};
export const fmtUnit = (v, unit, locale, digits = 0) =>
  (UNIT_FMT[`${locale}|${unit}|${digits}`] ??= new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: digits })).format(v);

// A duration in milliseconds as one short unit: "12 min", "3 h", "2 d" (whole units, rounded down).
export const fmtDuration = (ms, locale) => {
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 60) return fmtUnit(min, "minute", locale);
  const h = Math.floor(min / 60);
  if (h < 48) return fmtUnit(h, "hour", locale);
  return fmtUnit(Math.floor(h / 24), "day", locale);
};

// A longer duration in hours and minutes: "12 min", "3 h", "3 h 20 min" (rounded down to the minute); in days and
// hours from 48 hours: "6 d 23 h".
export const fmtDurationHM = (ms, locale) => {
  const min = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h >= 48) {
    const d = Math.floor(h / 24);
    return h % 24 ? `${fmtUnit(d, "day", locale)} ${fmtUnit(h % 24, "hour", locale)}` : fmtUnit(d, "day", locale);
  }
  if (!h) return fmtUnit(m, "minute", locale);
  return m ? `${fmtUnit(h, "hour", locale)} ${fmtUnit(m, "minute", locale)}` : fmtUnit(h, "hour", locale);
};

// A response time: "42 ms" below a second, "1.2 s" above.
export const fmtLatency = (ms, locale) => (ms < 1000 ? fmtUnit(Math.round(ms), "millisecond", locale) : fmtUnit(ms / 1000, "second", locale, 1));

// Uptime as a whole percentage, rounded down below 100: any downtime shows (99.97 % reads 99 %, never 100 %).
export const fmtPct = (p, locale) => `${(p >= 100 ? 100 : Math.max(0, Math.floor(p))).toLocaleString(locale)} %`;

export const RTF = {};
export const ago = (locale, ms) => {
  const rtf = (RTF[locale] ??= new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "long" }));
  const s = Math.round((ms - Date.now()) / 1000);
  const a = Math.abs(s);
  if (a < 60) return rtf.format(0, "minute");
  if (a < 3600) return rtf.format(Math.trunc(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.trunc(s / 3600), "hour");
  return rtf.format(Math.trunc(s / 86400), "day");
};
