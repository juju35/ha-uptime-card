// `track: up`: the time up of a service (a PC or a console) rather than its outages — "Off" in grey, not a problem,
// "Up for …", the time up over the window and the periods up.
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

const PC = "binary_sensor.desktop_pc";
const pcState = (state, since) => ({ entity_id: PC, state, attributes: { device_class: "connectivity", friendly_name: "Desktop PC" }, last_changed: iso(since) });
// On 3 h ago for 1 h 30 min, on again 40 min ago.
const pcHistory = [
  { s: "off", lu: (now - 24 * H) / 1000 },
  { s: "on", lu: (now - 3 * H) / 1000 },
  { s: "off", lu: (now - 1.5 * H) / 1000 },
  { s: "on", lu: (now - 40 * 60000) / 1000 },
];
const callWS = async (m) => {
  if (m.type === "config/label_registry/list") return [];
  if (m.type === "history/history_during_period") return Object.fromEntries(m.entity_ids.map((id) => [id, id === PC ? pcHistory : []]));
  throw new Error(m.type);
};
const hassWith = (pc) => ({
  entities: { ...entities, [PC]: { entity_id: PC, platform: "template", labels: [] } },
  devices,
  states: { ...states, [PC]: pc },
  language: "en",
  callWS,
});
const newCard = (config, hass) => {
  const card = new uc.UptimeCard();
  card.setConfig(config);
  card.hass = hass;
  return card;
};
const row = (h, id) => {
  const i = h.indexOf(`data-entity="${id}"`);
  return h.slice(i, h.indexOf('class="svc clickable"', i + 1) === -1 ? undefined : h.indexOf('class="svc clickable"', i + 1));
};

test("periods up: back-to-back up segments merge, the latest first, with the total time up", () => {
  const segs = [
    { from: 0, to: 10, status: "off" },
    { from: 10, to: 20, status: "up" },
    { from: 20, to: 25, status: "up" },
    { from: 25, to: 30, status: "off" },
    { from: 30, to: 40, status: "up" },
  ];
  const r = uc.upPeriods(segs, 40);
  assert.equal(r.total, 25);
  assert.deepEqual(
    [...r.periods].map((p) => [p.from, p.to, p.open]),
    [
      [30, 40, true],
      [10, 25, false],
    ],
  );
  assert.equal(uc.upPeriods([], 40).total, 0);
});

test("durations in hours and minutes", () => {
  assert.equal(uc.fmtDurationHM(12.7 * 60000, "en"), "12 min");
  assert.equal(uc.fmtDurationHM(3 * H, "en"), "3 hr");
  assert.equal(uc.fmtDurationHM(3 * H + 20 * 60000, "en"), "3 hr 20 min");
});

test("an off service tracked up is grey and not a problem; tracked down it is down", async () => {
  const hass = hassWith(pcState("off", now - 40 * 60000));
  const up = newCard({ group_by: "none", track: "up", entities: [PC] }, hass);
  await flush();
  let h = html(up);
  assert.match(h, /class="dot idle"/);
  assert.match(h, />Off</);
  assert.doesNotMatch(h, /Down for/);
  assert.match(h, /1 off/, "the chip counts it as off, in green");
  assert.equal(newCard({ only_problems: true, track: "up", entities: [PC] }, hass)._views().length, 0);
  h = html(newCard({ group_by: "none", entities: [PC] }, hass));
  assert.match(h, /Down for 40 min/);
});

test("a service tracked up shows since when, its time up over the window and its periods", async () => {
  const card = newCard({ group_by: "none", entities: [{ entity: PC, track: "up" }] }, hassWith(pcState("on", now - 40 * 60000)));
  await flush();
  card.hass = hassWith(pcState("on", now - 40 * 60000));
  const h = row(html(card), PC);
  assert.match(h, /Up for 40 min/);
  assert.match(h, /title="Time up · Last 24 hours">2 hr 10 min</, "1 h 30 min + 40 min");
  const periods = [...h.matchAll(/class="period( open)?">([^<]+)</g)].map((m) => [!!m[1], m[2]]);
  assert.equal(periods.length, 2);
  assert.ok(periods[0][0] && / – now$/.test(periods[0][1]), "the current period first, open");
  assert.ok(!periods[1][0] && /\d.* – .*\d/.test(periods[1][1]));
  assert.doesNotMatch(h, /class="pct "/, "no percentage");
  const hidden = newCard({ group_by: "none", show_periods: false, entities: [{ entity: PC, track: "up" }] }, hassWith(pcState("on", now - 40 * 60000)));
  await flush();
  hidden.hass = hassWith(pcState("on", now - 40 * 60000));
  assert.doesNotMatch(html(hidden), /class="periods"/);
});

test("the editor offers the counted time, down by default and out of the YAML", () => {
  const ed = new uc.UptimeCardEditor();
  ed.setConfig({});
  ed.hass = hassWith(pcState("on", now));
  const flat = (s) => s.flatMap((f) => (f.schema ? flat(f.schema) : [f]));
  const names = flat(ed._schema()).map((f) => f.name);
  assert.ok(names.includes("track") && names.includes("show_periods"));
  assert.equal(ed._defaults().track, "down");
});

test("every service tracked up is off: the rack follows the status chip (up), not unknown", async () => {
  const hass = hassWith(pcState("off", now - 40 * 60000));
  for (const Card of [uc.UptimeCard, uc.UptimeMiniCard]) {
    const card = new Card();
    card.setConfig({ track: "up", entities: [PC] });
    card.hass = hass;
    await flush();
    const sum = card._summary(card._allViews());
    assert.equal(sum.chip.cls, "ok");
    assert.equal(card._overall(sum), "up");
    // Tracked down, the same service off is down
    const down = new Card();
    down.setConfig({ entities: [PC] });
    down.hass = hass;
    assert.equal(down._overall(down._summary(down._allViews())), "down");
  }
  // No service in a known state: still unknown
  assert.equal(uc.UptimeCard.prototype._overall({ total: 2, up: 0, offs: 1, down: 0, pending: 0, maint: 0 }), "unknown");
});
