import assert from "node:assert/strict";
import { test } from "node:test";
import { allUp, callWS, devices, entities, labels, maintenance, pending, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const uc = load();
const flush = () => new Promise((r) => setTimeout(r, 10));

const makeHass = (st = states, extra = {}) => ({ entities, devices, states: st, language: "en", ...extra });
const withOverrides = (o) => {
  const st = { ...states };
  for (const [id, v] of Object.entries(o)) st[id] = { ...st[id], ...v };
  return st;
};
const html = (card) => card.shadowRoot.innerHTML;
const newCard = (config = {}, hass = makeHass(), Card = uc.UptimeCard) => {
  const card = new Card();
  card.setConfig(config);
  card.hass = hass;
  return card;
};
const rows = (card) => [...html(card).matchAll(/class="svc clickable"[^>]*data-entity="([^"]+)"/g)].map((m) => m[1]);
const click = (card, dataset, extra = {}) => card._onClick({ composedPath: () => [{ dataset }], stopPropagation() {}, ...extra });

test("services are found in the registries: Uptime Kuma monitors, Ping hosts, Healthchecks.io checks, certificates", () => {
  const list = uc.discover(makeHass());
  const by = (src) => [...list.filter((s) => s.source === src).map((s) => s.status)].sort();
  assert.equal(by("uptime_kuma").length, 7, "one per monitor device with a status sensor (the instance device is left out)");
  assert.deepEqual(by("ping"), ["binary_sensor.nas", "binary_sensor.router"]);
  assert.deepEqual(by("healthchecks"), ["binary_sensor.nightly_backup"]);
  assert.deepEqual(by("cert_expiry"), ["sensor.example_org_cert_expiry", "sensor.router_cert_expiry"]);
  const media = list.find((s) => s.status === "sensor.media_status");
  assert.equal(media.latency, "sensor.media_response_time");
  assert.equal(media.cert, "sensor.media_certificate_expiry");
  assert.equal(media.tags_entity, "sensor.media_tags");
  assert.equal(list.find((s) => s.status === "binary_sensor.nas").latency, "sensor.nas_round_trip_time_average");
});

test("a certificate goes to the service of the same host, the others stand on their own", () => {
  const list = uc.servicesFor(makeHass(), {});
  const router = list.find((s) => s.status === "binary_sensor.router");
  assert.equal(router.cert, "sensor.router_cert_expiry");
  assert.equal(router.cert_kind, "timestamp");
  assert.ok(!list.some((s) => s.key === "sensor.router_cert_expiry"));
  assert.ok(list.some((s) => s.key === "sensor.example_org_cert_expiry"));
  assert.equal(list.length, 11);
});

test("statuses: Uptime Kuma states, connectivity and problem binary sensors, everyday words", () => {
  const s = uc.statusFromState;
  for (const st of ["up", "down", "pending", "maintenance"]) assert.equal(s("sensor.x", st), st);
  assert.equal(s("binary_sensor.x", "on", "connectivity"), "up");
  assert.equal(s("binary_sensor.x", "off", "connectivity"), "down");
  assert.equal(s("binary_sensor.x", "on", "problem"), "down");
  assert.equal(s("binary_sensor.x", "off", "problem"), "up");
  assert.equal(s("sensor.x", "Online"), "up");
  assert.equal(s("sensor.x", "offline"), "down");
  assert.equal(s("sensor.x", "unavailable"), "unknown");
  assert.equal(s("sensor.x", "something"), "unknown");
  assert.equal(uc.worst(["up", "maintenance", "down", "pending"]), "down");
});

test("the full card: header summary and chip, problems first, latency, certificate and uptime", async () => {
  const card = newCard({ group_by: "none" }, makeHass(states, { callWS }));
  await flush();
  const h = html(card);
  assert.match(h, /<div class="sub">9\/11 up<\/div>/);
  assert.match(h, /class="chip crit" title="1 down"/);
  assert.match(h, /class="type-icon crit"/);
  assert.equal(rows(card)[0], "sensor.media_status", "the service down comes first");
  assert.equal(rows(card)[1], "sensor.photos_status", "then maintenance");
  assert.match(h, /Down for 14 min/);
  assert.match(h, /42 ms/);
  assert.match(h, /class="ssl warn"[^>]*><svg[^>]*><path[^>]*\/><\/svg><span>SSL 9 days<\/span>/);
  assert.match(h, /SSL 33 days/, "the router row carries its Certificate Expiry certificate");
  // History: 48 slices, the DNS outage 18 hours ago is red, its uptime rounded down.
  const dns = h.slice(h.indexOf('data-entity="sensor.dns_status"'));
  const bar = dns.slice(dns.indexOf('class="hbar"'), dns.indexOf("</div>", dns.indexOf('class="hbar"')));
  assert.equal((bar.match(/<i /g) || []).length, 48);
  assert.match(bar, /class="crit"/);
  assert.match(dns, /<span class="pct warn" title="Uptime">97 %<\/span>/);
});

test("the hero: picture of the overall state, alerts of the service down and of the closest certificate, sources", async () => {
  const card = newCard({}, makeHass());
  const h = html(card);
  assert.match(h, /<div class="state crit">1 down<\/div>/);
  assert.match(h, /alert-line crit[^>]*data-entity="sensor\.media_status"[^>]*>.*Media server: Down for 14 min/);
  assert.match(h, /alert-line warn[^>]*data-entity="sensor\.cloud_certificate_expiry"[^>]*>.*Cloud drive: SSL 9 days/);
  assert.match(h, /<span>Uptime Kuma<\/span><b>7<\/b>/);
  assert.match(h, /<img src="data:image\/svg\+xml,/);
  assert.doesNotMatch(html(newCard({ show_hero: false })), /class="hero"/);
});

test("the picture follows the overall state, each with its own animation", () => {
  const svg = (o) => decodeURIComponent(html(newCard({}, makeHass(withOverrides(o)))).match(/data:image\/svg\+xml,([^"]+)/)[1]);
  assert.match(svg(allUp), /class="trace"/);
  assert.match(svg({}), /class="ring d0"/);
  assert.match(svg(pending), /class="dots"/);
  assert.match(svg(maintenance), /class="sway"/);
  for (const s of ["up", "down", "pending", "maintenance", "unknown"]) assert.match(uc.rackSvg(s), /prefers-reduced-motion/);
});

test("groups by tag: Uptime Kuma tags and HA labels, a service down unfolds its group, Other last", async () => {
  const card = newCard({}, makeHass(states, { callWS }));
  await flush();
  const groups = [...html(card).matchAll(/data-group="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(groups, ["Backups", "Infrastructure", "Media", "Web", "Other"]);
  const infra = html(card).slice(html(card).indexOf('data-group="Infrastructure"'), html(card).indexOf('data-group="Media"'));
  assert.match(infra, /binary_sensor\.nas/, "the NAS has the HA label Infrastructure");
  const folded = newCard({ collapsed: true }, makeHass(states, { callWS }));
  await flush();
  assert.match(html(folded), /data-group="Web" data-problem="0" aria-expanded="false"/);
  assert.match(html(folded), /data-group="Media" data-problem="1" aria-expanded="true"/);
});

test("a group title folds and unfolds its group, a click elsewhere folds it back", () => {
  const card = newCard({ group_by: "source" });
  card.connectedCallback();
  assert.match(html(card), /data-group="Ping" data-problem="0" aria-expanded="true"/);
  click(card, { action: "toggle_group", group: "Ping", problem: "0" });
  assert.match(html(card), /data-group="Ping" data-problem="0" aria-expanded="false"/);
  card._onOutside({ composedPath: () => [] });
  assert.match(html(card), /data-group="Ping" data-problem="0" aria-expanded="true"/);
  card.disconnectedCallback();
});

test("folding: a tap elsewhere (pointer), not a press in the card released outside; leaving the page folds back", () => {
  const card = newCard({ group_by: "source" });
  card.connectedCallback();
  click(card, { action: "toggle_group", group: "Ping", problem: "0" });
  // A slider pressed in the card and released outside of it: nothing folds back.
  card._outside.tap({ composedPath: () => [card] });
  assert.match(html(card), /data-group="Ping" data-problem="0" aria-expanded="false"/);
  // A tap on a spot that sends no click (iOS): the pointer alone folds it back.
  card._outside.tap({ composedPath: () => [] });
  assert.match(html(card), /data-group="Ping" data-problem="0" aria-expanded="true"/);
  // Left with the group folded and back: in its default state.
  click(card, { action: "toggle_group", group: "Ping", problem: "0" });
  card.disconnectedCallback();
  card.connectedCallback();
  assert.match(html(card), /data-group="Ping" data-problem="0" aria-expanded="true"/);
  card.disconnectedCallback();
});

test("filters: only_problems, tags, sources, exclude and sort by name", () => {
  assert.deepEqual(rows(newCard({ only_problems: true, group_by: "none" })), ["sensor.media_status", "sensor.photos_status", "sensor.cloud_status"]);
  assert.deepEqual(rows(newCard({ tags: ["Media"] })).sort(), ["sensor.media_status", "sensor.photos_status"]);
  assert.deepEqual(rows(newCard({ sources: ["ping"] })).sort(), ["binary_sensor.nas", "binary_sensor.router"]);
  assert.ok(!rows(newCard({ exclude: ["binary_sensor.nas"] })).includes("binary_sensor.nas"));
  const names = [...html(newCard({ sort: "name", group_by: "none" })).matchAll(/class="svc-name">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "en")));
  assert.match(html(newCard({ only_problems: true }, makeHass(withOverrides({ ...allUp, "sensor.cloud_certificate_expiry": { state: "60" } })))), /All services operational/);
});

test("entities listed in the options: a known service keeps its sensors, any other entity becomes a service", () => {
  const st = { ...states, "binary_sensor.printer": { entity_id: "binary_sensor.printer", state: "off", attributes: { device_class: "connectivity", friendly_name: "Printer" }, last_changed: new Date(Date.now() - 3 * 3600e3).toISOString() } };
  const ents = { ...entities, "binary_sensor.printer": { entity_id: "binary_sensor.printer", platform: "template", labels: [] } };
  const card = newCard({ group_by: "none", entities: [{ entity: "sensor.media_status", name: "Movies", tags: ["Home"] }, "binary_sensor.printer"] }, { entities: ents, devices, states: st, language: "en" });
  const h = html(card);
  assert.deepEqual(rows(card), ["sensor.media_status", "binary_sensor.printer"], "both down: by name, Movies then Printer");
  assert.match(h, /Movies/);
  assert.match(html(newCard({ entities: [{ entity: "sensor.media_status", tags: ["Home"] }] })), /data-group="Home"/);
  assert.match(h, /Down for 3 h/);
  assert.match(h, /SSL 54 days/, "the monitor's certificate comes along");
});

test("an unrelated state change does not rebuild the card, a service's state does", () => {
  const hass = makeHass();
  const card = newCard({}, hass);
  let renders = 0;
  const render = card._render.bind(card);
  card._render = () => {
    renders++;
    return render();
  };
  card.hass = { ...hass, states: { ...states, "light.elsewhere": { entity_id: "light.elsewhere", state: "on", attributes: {} } } };
  assert.equal(renders, 0);
  card.hass = { ...hass, states: withOverrides({ "sensor.home_assistant_response_time": { state: "55" } }) };
  assert.equal(renders, 1);
  assert.match(html(card), /55 ms/);
});

test("history: segments, slices with the worst status and uptime share", () => {
  const start = 0;
  const end = 48 * 1000;
  const tl = uc.toTimeline([{ s: "up", lu: 0 }, { s: "down", lu: 10.5 }, { s: "up", lu: 12.5 }]);
  const segs = uc.segments(tl, start, end, (raw) => raw, "up");
  assert.deepEqual([...segs.map((s) => s.status)], ["up", "down", "up"]);
  const b = uc.buckets(segs, start, end);
  assert.equal(b.length, 48);
  assert.deepEqual([...b.slice(9, 14)], ["up", "down", "down", "down", "up"]);
  assert.equal(Math.round(uc.uptimeShare(segs) * 100) / 100, 95.83);
  assert.equal(uc.buckets([], start, end)[0], "none");
  assert.equal(uc.uptimeShare([{ from: 0, to: 5, status: "maintenance" }]), null);
});

test("formats: durations, latencies, whole percentages rounded down", () => {
  assert.equal(uc.fmtDuration(14.6 * 60000, "en"), "14 min");
  assert.equal(uc.fmtDuration(3 * 3600e3, "en"), "3 hr");
  assert.equal(uc.fmtDuration(3 * 86400e3, "en"), "3 days");
  assert.equal(uc.fmtLatency(41.6, "en"), "42 ms");
  assert.equal(uc.fmtLatency(1234, "en"), "1.2 sec");
  assert.equal(uc.fmtPct(99.97, "en"), "99 %");
  assert.equal(uc.fmtPct(100, "en"), "100 %");
});

test("certificate alerts: warning and critical thresholds, expired, plain http monitors have none", () => {
  const card = newCard({ ssl_warning_days: 60, ssl_critical_days: 40 });
  const h = html(card);
  assert.match(h, /class="ssl crit"[^>]*>.*?SSL 33 days/);
  assert.match(h, /class="ssl warn"[^>]*>.*?SSL 54 days/);
  const expired = html(newCard({}, makeHass(withOverrides({ "sensor.example_org_cert_expiry": { state: new Date(Date.now() - 86400e3).toISOString() } }))));
  assert.match(expired, /SSL expired/);
  assert.match(expired, /aria-label="example\.org: Down"/);
  const plain = html(newCard({}, makeHass(withOverrides({ "sensor.passwords_monitored_url": { state: "http://vault.lan" } }))));
  assert.doesNotMatch(plain, /SSL 78 days/);
});

test("a click on a row opens the more-info of its status entity", () => {
  const card = newCard();
  click(card, { entity: "sensor.dns_status" });
  assert.equal(card.events.at(-1).type, "hass-more-info");
  assert.equal(card.events.at(-1).detail.entityId, "sensor.dns_status");
});

test("the mini card: X/Y up, the services down, a detail button to the full list and back", () => {
  const card = newCard({}, makeHass(), uc.UptimeMiniCard);
  card.connectedCallback();
  let h = html(card);
  assert.match(h, /<span class="big">9<\/span><span class="of">\/11<\/span>/);
  assert.match(h, /class="item crit clickable"[^>]*data-entity="sensor\.media_status"/);
  assert.match(h, /<span class="since">14 min<\/span>/);
  assert.match(h, /class="zoom" data-action="zoom"/);
  click(card, { action: "zoom" }, { detail: 1 });
  h = html(card);
  assert.match(h, /class="svc clickable"/);
  assert.match(h, /aria-label="Show less"/);
  card._onUnzoom({ composedPath: () => [] });
  assert.match(html(card), /class="big"/);
  assert.doesNotMatch(html(newCard({ zoom: false }, makeHass(), uc.UptimeMiniCard)), /class="zoom"/);
  assert.match(html(newCard({}, makeHass(withOverrides(allUp)), uc.UptimeMiniCard)), /All services operational/);
  card.disconnectedCallback();
});

test("without any service, the cards say so", () => {
  const empty = { entities: {}, devices: {}, states: {}, language: "en" };
  assert.match(html(newCard({}, empty)), /No service found/);
  assert.match(html(newCard({}, empty, uc.UptimeMiniCard)), /No service found/);
  assert.match(html(newCard({}, { states: {}, language: "en" })), /2024\.8/);
});

test("labels are read once from the label registry", async () => {
  let calls = 0;
  const hass = makeHass(states, {
    callWS: async (m) => {
      if (m.type === "config/label_registry/list") calls++;
      return callWS(m);
    },
  });
  const card = newCard({}, hass);
  await flush();
  card.hass = { ...hass };
  await flush();
  assert.equal(calls, 1);
  assert.ok(labels.length);
});

test("the visual editor keeps the YAML minimal and the entities' own options", () => {
  const ed = new uc.UptimeCardEditor();
  ed.setConfig({ entities: [{ entity: "sensor.media_status", name: "Movies" }] });
  ed.hass = makeHass();
  const form = ed._form;
  assert.deepEqual([...form.data.entities], ["sensor.media_status"]);
  let out;
  ed.dispatchEvent = (ev) => {
    out = ev.detail.config;
  };
  form.listeners["value-changed"]({
    stopPropagation() {},
    detail: { value: { ...form.data, entities: ["sensor.media_status", "binary_sensor.nas"], show_latency: true, hours: 24, title: "" } },
  });
  assert.deepEqual(JSON.parse(JSON.stringify(out)), { entities: [{ entity: "sensor.media_status", name: "Movies" }, "binary_sensor.nas"] });
  const mini = new uc.UptimeMiniCardEditor();
  mini.setConfig({});
  mini.hass = makeHass();
  const names = JSON.stringify(mini._form.schema);
  assert.match(names, /"zoom"/);
  assert.match(names, /"max_items"/);
});

test("the cards are registered for the card picker, with the visual editors", () => {
  assert.deepEqual([...uc.window.customCards.map((c) => c.type)], ["uptime-card", "uptime-mini-card"]);
  assert.equal(uc.UptimeCard.getConfigElement().constructor, uc.UptimeCardEditor);
  assert.equal(uc.UptimeMiniCard.getConfigElement().constructor, uc.UptimeMiniCardEditor);
  assert.deepEqual({ ...uc.UptimeCard.getStubConfig() }, {});
  assert.deepEqual({ ...new uc.UptimeCard().getGridOptions() }, { columns: 12, min_columns: 9, rows: "auto" });
});

test("a change after the history was loaded only colors the time since it began", async () => {
  const card = newCard({ group_by: "none" }, makeHass(states, { callWS }));
  await flush();
  // The DNS resolver goes down 2 minutes ago, after the history was read (its last recorded change is 17 hours old).
  const st = withOverrides({ "sensor.dns_status": { state: "down", last_changed: new Date(Date.now() - 120000).toISOString() } });
  card.hass = makeHass(st, { callWS });
  const h = html(card);
  const dns = h.slice(h.indexOf('data-entity="sensor.dns_status"'));
  const bar = dns.slice(dns.indexOf('class="hbar"'), dns.indexOf("</div>", dns.indexOf('class="hbar"')));
  assert.equal((bar.match(/class="crit"/g) || []).length, 3, "the old outage (2 slices) and the last slice only");
  assert.match(dns, /title="Uptime">97 %/, "2 minutes out of 24 hours, not 17 hours");
});

test("a certificate that fails validation reads invalid, not unknown", () => {
  const st = withOverrides({
    "sensor.example_org_cert_expiry": { state: "unknown", attributes: { device_class: "timestamp", is_valid: false, error: "hostname mismatch" } },
    "sensor.router_cert_expiry": { state: "unknown", attributes: { device_class: "timestamp", is_valid: false, error: "expired" } },
  });
  const card = newCard({ group_by: "none" }, makeHass(st));
  const h = html(card);
  const org = h.slice(h.indexOf('data-entity="sensor.example_org_cert_expiry" aria-label="example.org'));
  assert.match(org.slice(0, 200), /aria-label="example.org: Down"/);
  assert.match(h, /class="ssl crit"[^>]*><svg[^>]*><path[^>]*\/><\/svg><span>SSL invalid<\/span>/);
  const router = h.slice(h.indexOf('data-entity="binary_sensor.router" aria-label="Router'));
  assert.match(router.slice(0, router.indexOf('class="hbar"')), /SSL invalid/, "on the row of the service of its host too");
});

test("a Certificate Expiry certificate also goes to an Uptime Kuma monitor of its host", () => {
  const ents = { ...entities };
  const devs = { ...devices, cert_vault: { id: "cert_vault", name: "vault.example.net", identifiers: [["cert_expiry", "vault.example.net:443"]], labels: [] } };
  ents["sensor.vault_cert_expiry"] = { entity_id: "sensor.vault_cert_expiry", device_id: "cert_vault", platform: "cert_expiry", translation_key: "certificate_expiry", labels: [] };
  const st = { ...states, "sensor.vault_cert_expiry": { state: new Date(Date.now() + 20 * 86400e3).toISOString(), attributes: { device_class: "timestamp", is_valid: true } } };
  const list = uc.servicesFor({ entities: ents, devices: devs, states: st }, {});
  const vault = list.find((s) => s.status === "sensor.passwords_status");
  assert.equal(vault.cert, "sensor.vault_cert_expiry");
  assert.ok(!list.some((s) => s.key === "sensor.vault_cert_expiry"), "no row of its own");
});

test("a hidden sensor that only adds to a monitor keeps it, a hidden status hides it", () => {
  const ents = { ...entities, "sensor.media_monitored_url": { ...entities["sensor.media_monitored_url"], hidden: true } };
  const media = uc.discover({ entities: ents, devices, states }).find((s) => s.status === "sensor.media_status");
  assert.equal(media.url, "sensor.media_monitored_url");
  const ents2 = { ...entities, "sensor.media_status": { ...entities["sensor.media_status"], hidden: true } };
  assert.ok(!uc.discover({ entities: ents2, devices, states }).some((s) => s.device_id === "kuma_media"));
});

test("the services are not matched again on an unrelated state change", () => {
  const card = newCard({}, makeHass());
  const first = card._services();
  card.hass = makeHass({ ...states, "light.unrelated": { state: "on", attributes: {} } });
  assert.equal(card._services(), first);
});
