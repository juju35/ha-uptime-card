// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

// A service status, from best to worst; its class colors the dots, chips and bars.
// "off" is a service down that the card tracks for its time up (`track: up`, a PC or a console): a normal state, in
// grey, not a problem; any time up in a slice of the bar outweighs it.
export const STATUS_RANK = { unknown: 0, off: 0.5, up: 1, maintenance: 2, pending: 3, down: 4 };
export const STATUS_CLASS = { up: "ok", down: "crit", pending: "warn", maintenance: "maint", unknown: "idle", off: "idle" };
export const UP_WORDS = new Set(["up", "on", "online", "ok", "connected", "home", "true", "running", "available", "alive", "healthy"]);
export const DOWN_WORDS = new Set(["down", "off", "offline", "error", "problem", "disconnected", "false", "unreachable", "failed", "dead", "unhealthy"]);

// Status of one raw state of a service's status entity. `deviceClass` is the one of its binary sensor: a "problem"
// sensor is on when the service is down.
export const statusFromState = (entityId, raw, deviceClass) => {
  const s = String(raw ?? "").toLowerCase();
  if (!s || s === "unknown" || s === "unavailable") return "unknown";
  if (String(entityId).startsWith("binary_sensor.")) {
    const up = s === "on";
    if (s !== "on" && s !== "off") return "unknown";
    return deviceClass === "problem" ? (up ? "down" : "up") : up ? "up" : "down";
  }
  if (s === "pending" || s === "maintenance") return s;
  if (UP_WORDS.has(s)) return "up";
  if (DOWN_WORDS.has(s)) return "down";
  return "unknown";
};

export const worst = (list) => list.reduce((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a), "unknown");
