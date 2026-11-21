// `period` (rolling, today, yesterday, this week) and `uptime_display: duration` (the time up instead of the
// percentage), issue #24.
import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const uc = load();
const flush = () => new Promise((r) => setTimeout(r, 10));
const html = (card) => card.shadowRoot.innerHTML;
const H = 3600e3;
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const midnight = new Date(now).setHours(0, 0, 0, 0);
const dayBefore = (ms) => {
  const d = new Date(ms);
  d.setDate(d.getDate() - 1);
  return d.getTime();
};

const NAS = "binary_sensor.nas_online";
const nasState = (state, since) => ({ entity_id: NAS, state, attributes: { device_class: "connectivity", friendly_name: "NAS" }, last_changed: iso(since) });
// Up for days, down for 1 h the day before yesterday's midnight + 10 h, i.e. yesterday at 10:00 → 11:00.
const yStart = dayBefore(midnight);
const nasHistory = [
  { s: "on", lu: (yStart - 48 * H) / 1000 },
  { s: "off", lu: (yStart + 10 * H) / 1000 },
  { s: "on", lu: (yStart + 11 * H) / 1000 },
];
const calls = [];
const callWS = async (m) => {
  if (m.type === "config/label_registry/list") return [];
  if (m.type === "history/history_during_period") {
    calls.push(m);
    return Object.fromEntries(m.entity_ids.map((id) => [id, id === NAS ? nasHistory : []]));
  }
  throw new Error(m.type);
};
const hass = () => ({
  entities: { ...entities, [NAS]: { entity_id: NAS, platform: "template", labels: [] } },
  devices,
  states: { ...states, [NAS]: nasState("on", yStart + 11 * H) },
  language: "en",
  callWS,
});
const card = async (config) => {
  const c = new uc.UptimeCard();
  c.setConfig({ group_by: "none", entities: [NAS], ...config });
  c.hass = hass();
  await flush();
  c.hass = hass();
  return c;
};
const row = (h) => h.slice(h.indexOf(`data-entity="${NAS}"`));

test("windows: rolling, today, yesterday and this week", () => {
  const at = new Date(2026, 10, 21, 12, 14).getTime(); // Saturday 21 November 2026, 12:14
  const day = (d, h = 0) => new Date(2026, 10, d, h).getTime();
  assert.deepEqual({ ...uc.historyWindow("rolling", 24, at) }, { start: at - 24 * H, end: at, barEnd: at, live: true });
  assert.deepEqual({ ...uc.historyWindow("today", 24, at) }, { start: day(21), end: at, barEnd: day(22), live: true });
  assert.deepEqual({ ...uc.historyWindow("yesterday", 24, at) }, { start: day(20), end: day(21), barEnd: day(21), live: false });
  assert.deepEqual({ ...uc.historyWindow("week", 24, at) }, { start: day(16), end: at, barEnd: day(23), live: true }, "from Monday");
  assert.equal(uc.historyWindow("week", 24, at, 7).start, day(15), "from Sunday where the week starts then");
  assert.equal(uc.historyWindow("week", 24, day(16, 9)).start, day(16), "on Monday, from that day");
  assert.equal(uc.historyWindow("nope", 48, at).start, at - 48 * H, "anything else is the rolling window");
});

test("durations of two days and more read in days and hours", () => {
  assert.equal(uc.fmtDurationHM(47 * H + 59 * 60000, "en"), "47 hr 59 min");
  assert.equal(uc.fmtDurationHM(48 * H, "en"), "2 days");
  assert.equal(uc.fmtDurationHM(6 * 24 * H + 23 * H + 30 * 60000, "en"), "6 days 23 hr");
});

test("uptime_display: duration shows the time up of a service tracked down, in the colour of its share", async () => {
  const h = row(html(await card({ period: "yesterday", uptime_display: "duration" })));
  assert.match(h, /class="pct dur warn" title="Time up · Yesterday">23 hr</, "23 h up out of 24 (95.8 %)");
  assert.doesNotMatch(h, />\d+ %</);
  const pct = row(html(await card({ period: "yesterday" })));
  assert.match(pct, /class="pct warn" title="Uptime · Yesterday">95 %</, "the percentage stays the default");
});

test("yesterday: the history asked ends at midnight, closed by the status it had then", async () => {
  calls.length = 0;
  await card({ period: "yesterday" });
  const m = calls.at(-1);
  assert.equal(m.start_time, iso(yStart));
  assert.equal(m.end_time, iso(midnight));
  calls.length = 0;
  await card({});
  assert.equal(calls.at(-1).end_time, undefined, "a live window has no end");
});

test("today: the bar spans the whole day and fills up as it goes on", async () => {
  const c = await card({ period: "today" });
  const v = c._views()[0];
  const slices = Math.floor(((now - midnight) / (24 * H)) * 48);
  assert.equal(v.bar.length, 48);
  assert.ok(v.bar.slice(slices + 1).every((b) => b === "none"), "the hours to come are empty");
  assert.ok(v.bar.slice(0, slices).every((b) => b === "up"));
  assert.equal(v.share, 100);
  assert.match(html(c), /Uptime · Today/);
});

test("the hero shows the average time up with uptime_display: duration", async () => {
  const c = await card({ period: "yesterday", uptime_display: "duration", entities: [NAS] });
  assert.match(html(c), /class="v">23 hr<\/span><span class="cap">Time up · Yesterday</);
});

test("the editor offers the period and the display, at their defaults out of the YAML; hours only for the rolling window", () => {
  const ed = new uc.UptimeCardEditor();
  ed.setConfig({});
  ed.hass = hass();
  const flat = (s) => s.flatMap((f) => (f.schema ? flat(f.schema) : [f]));
  let names = flat(ed._schema()).map((f) => f.name);
  assert.ok(names.includes("period") && names.includes("uptime_display") && names.includes("hours"));
  assert.equal(ed._defaults().period, "rolling");
  assert.equal(ed._defaults().uptime_display, "percent");
  ed.setConfig({ period: "today" });
  names = flat(ed._schema()).map((f) => f.name);
  assert.ok(!names.includes("hours"));
});
