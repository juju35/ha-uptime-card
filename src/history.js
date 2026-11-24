// ---------------------------------------------------------------------------
// History: the uptime bar
// ---------------------------------------------------------------------------
import { worst } from "./statuses.js";

export const BUCKETS = 48;
export const PERIODS_SHOWN = 6;
export const HISTORY_TTL = 5 * 60000;

// History of the websocket (compressed: { s, lu, lc } in seconds; or full: { state, last_changed }) as [{ t, s }].
export const toTimeline = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((r) => ({ t: r.lc != null || r.lu != null ? (r.lc ?? r.lu) * 1000 : Date.parse(r.last_changed || r.last_updated), s: r.s ?? r.state }))
    .filter((r) => Number.isFinite(r.t))
    .sort((a, b) => a.t - b.t);

// Status segments of the window [start, end): [{ from, to, status }], the current status closing the last one.
export const segments = (timeline, start, end, statusOf, current) => {
  const out = [];
  let cur = null;
  let from = start;
  for (const r of timeline) {
    if (r.t <= start) {
      cur = statusOf(r.s);
      continue;
    }
    if (r.t >= end) break;
    if (cur !== null) out.push({ from, to: r.t, status: cur });
    cur = statusOf(r.s);
    from = r.t;
  }
  out.push({ from, to: end, status: current ?? cur ?? "unknown" });
  return out;
};

// The bar: BUCKETS equal slices of the window, each with the worst status seen in it ("none": no data).
export const buckets = (segs, start, end, n = BUCKETS) => {
  const w = (end - start) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = start + i * w;
    const b = a + w;
    const seen = segs.filter((s) => s.from < b && s.to > a).map((s) => s.status);
    const st = worst(seen);
    out.push(seen.length && st !== "unknown" ? st : "none");
  }
  return out;
};

// Share of the window the service was up, among the time it was up or down (maintenance, pending and no data left
// out); null without any.
export const uptimeShare = (segs) => {
  let up = 0;
  let down = 0;
  for (const s of segs) {
    if (s.status === "up") up += s.to - s.from;
    else if (s.status === "down" || s.status === "off") down += s.to - s.from;
  }
  return up + down > 0 ? (100 * up) / (up + down) : null;
};

// The periods a service was up in the window, the latest first: [{ from, to, open }] (open: still up), with the
// total time up. Back-to-back up segments make one period.
export const upPeriods = (segs, end) => {
  const out = [];
  for (const s of segs) {
    if (s.status !== "up" || s.to <= s.from) continue;
    const last = out[out.length - 1];
    if (last && last.to === s.from) last.to = s.to;
    else out.push({ from: s.from, to: s.to });
  }
  const total = out.reduce((a, p) => a + p.to - p.from, 0);
  for (const p of out) p.open = p.to >= end;
  return { periods: out.reverse(), total };
};

// The history window (`period`), in the browser's time: the last `hours` (rolling, the default), today, yesterday or
// this week. The time is counted over [start, end) (end: now, or midnight for yesterday); the bar spans
// [start, barEnd), so that today and this week fill up as they go on. live: the window ends now (the current status
// closes it and a period up can still be open).
export const PERIODS = ["rolling", "today", "yesterday", "week"];
export const addDays = (ms, n) => {
  const d = new Date(ms);
  d.setDate(d.getDate() + n);
  return d.getTime();
};
export const historyWindow = (period, hours, now = Date.now(), firstDay = 1) => {
  const midnight = new Date(now).setHours(0, 0, 0, 0);
  if (period === "today") return { start: midnight, end: now, barEnd: addDays(midnight, 1), live: true };
  if (period === "yesterday") return { start: addDays(midnight, -1), end: midnight, barEnd: midnight, live: false };
  if (period === "week") {
    const start = addDays(midnight, -((new Date(midnight).getDay() - (firstDay % 7) + 7) % 7));
    return { start, end: now, barEnd: addDays(start, 7), live: true };
  }
  return { start: now - hours * 3600e3, end: now, barEnd: now, live: true };
};

// First day of the week of a locale (1 Monday … 7 Sunday), Monday when the browser cannot tell.
export const WEEK_START = {};
export const firstDayOfWeek = (locale) => {
  if (!(locale in WEEK_START)) {
    let day = 1;
    try {
      const l = new Intl.Locale(locale);
      day = (l.getWeekInfo?.() ?? l.weekInfo)?.firstDay || 1;
    } catch {
      day = 1;
    }
    WEEK_START[locale] = day;
  }
  return WEEK_START[locale];
};
