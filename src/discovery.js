// ---------------------------------------------------------------------------
// Discovery: services from the registries
// ---------------------------------------------------------------------------
import { valid } from "./helpers.js";

// Host of a URL ("https://cloud.example.net/login" → "cloud.example.net"); null when it is not one.
export const hostOf = (url) => {
  try {
    return new URL(String(url)).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
};

export const deviceName = (dev) => (dev ? dev.name_by_user || dev.name || "" : "");

// The services found in the registries, cached per registry objects (Home Assistant replaces them when they change):
// [{ key, source, name?, device_id, status, latency?, cert?, cert_kind?, uptime?, url?, hostname?, type?, tags_entity? }]
// The name, host and tags are read at render time, from the states.
export const _cache = new WeakMap();
export const discover = (hass) => {
  const ents = hass.entities;
  const devs = hass.devices || {};
  const hit = _cache.get(ents);
  if (hit && hit.devs === devs) return hit.list;
  const list = [];
  const kuma = new Map();
  const pingByDevice = new Map();
  const pings = [];
  for (const e of Object.values(ents)) {
    const id = e.entity_id;
    const domain = id.split(".")[0];
    // A hidden status entity hides its service; the hidden sensors that only add to it (URL, response time…) still do.
    const extra = (e.platform === "uptime_kuma" && e.translation_key !== "status") || (e.platform === "ping" && domain !== "binary_sensor");
    if (e.disabled_by || (e.hidden && !extra)) continue;
    if (e.platform === "uptime_kuma" && e.device_id) {
      const m = kuma.get(e.device_id) || {};
      if (e.translation_key) m[e.translation_key] = id;
      kuma.set(e.device_id, m);
    } else if (e.platform === "healthchecksio" && domain === "binary_sensor") {
      list.push({ key: id, source: "healthchecks", status: id, device_id: e.device_id });
    } else if (e.platform === "ping") {
      if (domain === "binary_sensor") pings.push(e);
      else if (e.translation_key === "round_trip_time_avg" && e.device_id) pingByDevice.set(e.device_id, id);
    } else if (e.platform === "cert_expiry" && domain === "sensor") {
      const ident = (devs[e.device_id]?.identifiers || []).find((i) => i[0] === "cert_expiry");
      const host = ident ? String(ident[1]).replace(/:\d+$/, "").toLowerCase() : null;
      list.push({ key: id, source: "cert_expiry", status: id, cert: id, cert_kind: "timestamp", device_id: e.device_id, cert_host: host });
    }
  }
  for (const [device_id, m] of kuma) {
    if (!m.status) continue;
    list.push({
      key: m.status,
      source: "uptime_kuma",
      device_id,
      status: m.status,
      latency: m.response_time,
      cert: m.cert_days_remaining,
      cert_kind: m.cert_days_remaining ? "days" : undefined,
      cert_src: m.cert_days_remaining ? "kuma" : undefined,
      uptime: m.uptime_1d,
      url: m.url,
      hostname: m.hostname,
      type: m.type,
      tags_entity: m.tags,
    });
  }
  for (const e of pings) {
    list.push({ key: e.entity_id, source: "ping", status: e.entity_id, device_id: e.device_id, latency: pingByDevice.get(e.device_id) });
  }
  _cache.set(ents, { devs, list });
  return list;
};

// A service as given in the `entities` option (an entity id, or { entity, name, tags, latency_entity, cert_entity,
// uptime_entity }): a discovered service when the entity is the status of one (its latency, certificate… come along),
// else a service of its own.
export const fromConfig = (item, found) => {
  const o = typeof item === "string" ? { entity: item } : item || {};
  if (!o.entity) return null;
  const base = found.find((s) => s.status === o.entity) || { key: o.entity, source: "entity", status: o.entity };
  const svc = { ...base, key: o.entity, conf: o };
  if (o.latency_entity) svc.latency = o.latency_entity;
  if (o.uptime_entity) svc.uptime = o.uptime_entity;
  if (o.cert_entity) {
    svc.cert = o.cert_entity;
    svc.cert_src = "conf";
    svc.cert_kind = String(o.cert_entity).startsWith("sensor.") && base.source !== "uptime_kuma" ? undefined : svc.cert_kind;
  }
  return svc;
};

// The services a card shows, in discovery order: the `entities` option, or everything found (`auto`, the default
// without `entities`). A Certificate Expiry certificate whose host is the one of another service goes to that service
// (its row shows the expiry); the others are services of their own.
export const servicesFor = (hass, config) => {
  const found = discover(hass);
  const list = [];
  const seen = new Set();
  const add = (s) => {
    if (s && !seen.has(s.key)) {
      seen.add(s.key);
      list.push(s);
    }
  };
  for (const item of Array.isArray(config.entities) ? config.entities : []) add(fromConfig(item, found));
  const auto = config.auto ?? !(Array.isArray(config.entities) && config.entities.length);
  if (auto) {
    const only = config.sources ? new Set([].concat(config.sources)) : null;
    const exclude = new Set([].concat(config.exclude || []));
    for (const s of found) if ((!only || only.has(s.source)) && !exclude.has(s.key)) add({ ...s });
  }
  // Certificates onto the service of the same host: the first one of each host without a certificate of its own (an
  // Uptime Kuma one gives way: Certificate Expiry also tells an invalid certificate). One pass over the services.
  const owners = new Map();
  if (list.some((s) => s.source === "cert_expiry" && s.cert_host && !s.conf)) {
    for (const o of list) {
      if (o.source === "cert_expiry" || (o.cert && o.cert_src !== "kuma")) continue;
      const host = hostFor(hass, o);
      if (host && !owners.has(host)) owners.set(host, o);
    }
  }
  const out = [];
  for (const s of list) {
    const owner = s.source === "cert_expiry" && s.cert_host && !s.conf ? owners.get(s.cert_host) : null;
    if (owner && owner.cert_src !== "cert_expiry") {
      owner.cert = s.cert;
      owner.cert_kind = "timestamp";
      owner.cert_src = "cert_expiry";
      continue;
    }
    out.push(s);
  }
  for (const s of out) if (s.cert && !s.cert_kind) s.cert_kind = hass.states[s.cert]?.attributes?.device_class === "timestamp" ? "timestamp" : "days";
  return out;
};

// Host of a service, for the certificate matching and its subtitle: the URL or hostname of an Uptime Kuma monitor,
// the device name of a Ping host.
export const hostFor = (hass, svc) => {
  const st = (id) => (id ? hass.states[id] : undefined);
  if (svc.url && valid(st(svc.url))) return hostOf(st(svc.url).state);
  if (svc.hostname && valid(st(svc.hostname))) return String(st(svc.hostname).state).toLowerCase();
  if (svc.source === "ping") return String(hass.devices?.[svc.device_id]?.name || "").toLowerCase() || null;
  if (svc.cert_host) return svc.cert_host;
  return null;
};
