// Mock Home Assistant registries, states and history shaped like the supported integrations, used by the tests and
// the screenshots: Uptime Kuma monitors (with their tags), Ping hosts, a Healthchecks.io check and Certificate Expiry
// certificates (one of them matching the Ping host of the same name). Neutral names only.
// Every time is relative to the moment the module is loaded, placed in the middle of a slice of the uptime bar, so
// that two renders a few seconds apart draw the same pictures.
export const states = {};
export const entities = {};
export const devices = {};
export const labels = [
  { label_id: "infrastructure", name: "Infrastructure" },
  { label_id: "backups", name: "Backups" },
];

export const NOW = Date.now();
const minAgo = (m) => new Date(NOW - m * 60000).toISOString();
const device = (id, name, identifier, domain, extra = {}) =>
  (devices[id] = { id, name, name_by_user: null, identifiers: [[domain, identifier]], labels: [], ...extra });
const entity = (entity_id, device_id, platform, translation_key, state, attributes = {}, extra = {}) => {
  entities[entity_id] = { entity_id, device_id, platform, translation_key: translation_key || null, labels: [], ...extra };
  states[entity_id] = { entity_id, state: String(state), attributes, last_changed: extra.last_changed || minAgo(600), last_updated: minAgo(1) };
};

// Uptime Kuma monitor: a device with its status, response time, certificate, URL or hostname, type and tags sensors.
const kuma = (key, name, { status = "up", ms, cert, url, hostname, type = "http", tags = [], since = 600 }) => {
  const dev = `kuma_${key}`;
  device(dev, name, `monitor_${key}`, "uptime_kuma", { via_device_id: "kuma_instance" });
  entity(`sensor.${key}_status`, dev, "uptime_kuma", "status", status, { device_class: "enum", friendly_name: `${name} Status` }, { last_changed: minAgo(since) });
  entity(`sensor.${key}_response_time`, dev, "uptime_kuma", "response_time", status === "up" ? ms : "unknown", { unit_of_measurement: "ms", device_class: "duration" });
  if (cert !== undefined) entity(`sensor.${key}_certificate_expiry`, dev, "uptime_kuma", "cert_days_remaining", cert, { unit_of_measurement: "d", device_class: "duration" });
  if (url) entity(`sensor.${key}_monitored_url`, dev, "uptime_kuma", "url", url, {}, { entity_category: "diagnostic" });
  if (hostname) entity(`sensor.${key}_monitored_hostname`, dev, "uptime_kuma", "hostname", hostname, {}, { entity_category: "diagnostic" });
  entity(`sensor.${key}_monitor_type`, dev, "uptime_kuma", "type", type, { device_class: "enum" }, { entity_category: "diagnostic" });
  entity(`sensor.${key}_tags`, dev, "uptime_kuma", "tags", tags.length, { tags: tags.length ? tags : null, unit_of_measurement: "tags" }, { entity_category: "diagnostic" });
};

device("kuma_instance", "Uptime Kuma", "instance", "uptime_kuma");
entity("update.uptime_kuma_version", "kuma_instance", "uptime_kuma", "update", "off");
kuma("home_assistant", "Home Assistant", { ms: 42, cert: 61, url: "https://home.example.net", tags: ["Infrastructure"] });
kuma("cloud", "Cloud drive", { ms: 186, cert: 9, url: "https://cloud.example.net/login", type: "keyword", tags: ["Web"] });
kuma("media", "Media server", { status: "down", cert: 54, url: "https://media.example.net", tags: ["Media"], since: 14.5 });
kuma("passwords", "Password manager", { ms: 73, cert: 78, url: "https://vault.example.net", tags: ["Web"] });
kuma("photos", "Photo library", { status: "maintenance", cert: 40, url: "https://photos.example.net", tags: ["Media"], since: 105 });
kuma("mqtt", "MQTT broker", { ms: 3, hostname: "mqtt.lan", type: "port", tags: ["Infrastructure"] });
kuma("dns", "DNS resolver", { ms: 12, hostname: "192.168.1.2", type: "dns", tags: ["Infrastructure"] });

// Ping: one device per host, named after the host (renamed in Home Assistant), the round trip time beside it.
const ping = (key, host, label, { on = true, rtt, entityLabels = [] } = {}) => {
  device(`ping_${key}`, host, `entry_${key}`, "ping", { name_by_user: label });
  entity(`binary_sensor.${key}`, `ping_${key}`, "ping", null, on ? "on" : "off", { device_class: "connectivity", friendly_name: label }, { labels: entityLabels });
  entity(`sensor.${key}_round_trip_time_average`, `ping_${key}`, "ping", "round_trip_time_avg", rtt, { unit_of_measurement: "ms", device_class: "duration" }, { entity_category: "diagnostic" });
};
ping("nas", "nas.lan", "NAS", { rtt: 1.4, entityLabels: ["infrastructure"] });
ping("router", "router.example.net", "Router", { rtt: 2.1 });

// Healthchecks.io: every check under one device.
device("healthchecks", "Healthchecks.io", "entry", "healthchecksio");
entity(
  "binary_sensor.nightly_backup",
  "healthchecks",
  "healthchecksio",
  null,
  "on",
  { device_class: "connectivity", friendly_name: "Nightly backup", last_ping: minAgo(7 * 60 + 15) },
  { labels: ["backups"] },
);

// Certificate Expiry: router.example.net goes to the Router row, example.org stands on its own.
const cert = (key, host, days) => {
  device(`cert_${key}`, host, `${host}:443`, "cert_expiry", { entry_type: "service" });
  entity(`sensor.${key}_cert_expiry`, `cert_${key}`, "cert_expiry", "certificate_expiry", new Date(NOW + days * 86400e3).toISOString(), {
    device_class: "timestamp",
    is_valid: true,
    error: null,
    friendly_name: `${host} Cert expiry`,
  });
};
cert("router", "router.example.net", 33.5);
cert("example_org", "example.org", 132.5);

// History of the last 24 hours, per status entity: [minutes ago, state] from the oldest; the state at the start of
// the window comes first. Changes sit in the middle of a 30-minute slice of the bar.
const HISTORY = {
  "sensor.media_status": [[1440, "up"], [375, "down"], [315, "up"], [14.5, "down"]],
  "sensor.cloud_status": [[1440, "up"], [555, "pending"], [525, "up"]],
  "sensor.photos_status": [[1440, "up"], [105, "maintenance"]],
  "sensor.dns_status": [[1440, "up"], [1095, "down"], [1065, "up"]],
  "binary_sensor.nas": [[1440, "on"], [1155, "off"], [1125, "on"]],
  "binary_sensor.nightly_backup": [[1440, "on"]],
};

// The websocket's history/history_during_period answer (compressed rows: s, lu in seconds).
export const history = (ids, start) =>
  Object.fromEntries(
    ids.map((id) => {
      const rows = HISTORY[id] || [[1440, states[id]?.state ?? "unknown"]];
      return [id, rows.map(([m, s]) => ({ s, lu: Math.max(start ?? 0, NOW - m * 60000) / 1000 }))];
    }),
  );

// The websocket calls the cards make.
export const callWS = async (msg) => {
  if (msg.type === "config/label_registry/list") return labels;
  if (msg.type === "history/history_during_period") return history(msg.entity_ids, Date.parse(msg.start_time));
  throw new Error(`unexpected ${msg.type}`);
};

// States of the animated pictures (one GIF each): everything up, one service pending, one in maintenance. The default
// states have one service down (and one in maintenance, drawn under the worse down).
export const allUp = { "sensor.media_status": { state: "up" }, "sensor.photos_status": { state: "up" }, "sensor.media_response_time": { state: "64" }, "sensor.photos_response_time": { state: "58" } };
export const pending = { "sensor.media_status": { state: "pending" }, "sensor.photos_status": { state: "up" }, "sensor.photos_response_time": { state: "58" } };
export const maintenance = { "sensor.media_status": { state: "up" }, "sensor.media_response_time": { state: "64" } };
