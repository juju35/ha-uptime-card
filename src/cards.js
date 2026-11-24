// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
import { ICONS, SOURCES, SOURCE_ORDER } from "./core.js";
import { ago, esc, fmtDuration, fmtDurationHM, fmtLatency, fmtPct, fmtUnit, intlLocale, num, svgIcon, t, valid } from "./helpers.js";
import { STATUS_CLASS, statusFromState } from "./statuses.js";
import { rackSvg, svgUri } from "./picture.js";
import { BANNER_STYLE, isNight, sceneSvg } from "./illustrated-header.js";
import { deviceName, discover, hostFor, servicesFor } from "./discovery.js";
import { HISTORY_TTL, PERIODS, PERIODS_SHOWN, buckets, firstDayOfWeek, historyWindow, segments, toTimeline, upPeriods, uptimeShare } from "./history.js";
import { BASE_STYLE, FULL_STYLE, MINI_STYLE } from "./styles.js";

export let _uid = 0;

// Element names of Home Assistant dialogs (the more-info opened from the card, among others).
export const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
export const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. It counts when the press and the release are both outside the card (a slider dragged out of the card
// does not fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through
// the click event.
export const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOutside(card, ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOutside(card, ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOutside(card, ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

export const FOCUS_SELECTOR = "[data-action], [data-entity]";
export const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};

export const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);

// ---------------------------------------------------------------------------
// Shadow DOM patching: an update rewrites only what changed, so the kept nodes keep their running animations (the
// rack's lights, the ECG trace), their decoded pictures, focus and hover, and <ha-card> is never replaced (Home
// Assistant draws a new one a moment later: the card would collapse to its border while the pill is measured and
// the page jump).
// ---------------------------------------------------------------------------
export const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
export const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
export const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
export const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    if (o !== ref) cur.insertBefore(o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      // A custom element given no content (an icon) may draw its own: left as it is.
      if (n.childNodes.length || !n.localName.includes("-")) patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
// Writes `html` into `root` in place; a plain rewrite where there is no DOM to patch (the tests' stand-ins).
export const morph = (root, html) => {
  const tpl = typeof document !== "undefined" ? document.createElement("template") : null;
  if (!tpl?.content || !root.childNodes) {
    root.innerHTML = html;
    return;
  }
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

export const DEFAULTS = { hours: 24, ssl_warning_days: 14, ssl_critical_days: 3, latency_warning: 1000, max_items: 5 };

export class UptimeBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._rev = 0;
    this._uid = ++_uid;
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // No rewrite of the card between the press and the release: Home Assistant updates the card several times a
    // second, and a rewrite under the pointer replaces the element pressed, so that the click lands on the card itself
    // and does nothing. The pending render is done once released (after the click). The focus is only kept across
    // rewrites for the keyboard: put back after a mouse click or a tap, it would draw the focus ring.
    this.shadowRoot.addEventListener("pointerdown", () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    // Enter / Space on an element with the button role acts as a click, as on a <button>.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      this._byPointer = false;
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
  }

  // Home Assistant pushes a new hass on every state change of the whole instance: the card is only rebuilt when
  // something it shows changed (see _deps).
  set hass(hass) {
    this._hass = hass;
    this.toggleAttribute?.("dark", !!hass?.themes?.darkMode);
    this._loadLabels();
    const deps = this._deps();
    const prev = this._lastDeps;
    if (deps && prev && deps.length === prev.length && deps.every((d, i) => d === prev[i])) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // What a render reads: the registries, the language, the theme, the labels and history loaded, the minute (relative
  // times) and the state objects of every entity of the services shown.
  _deps() {
    const h = this._hass;
    if (!h?.entities || !this._config) return null;
    const ids = this._services().flatMap((s) => [s.status, s.latency, s.cert, s.uptime, s.url, s.hostname, s.type, s.tags_entity]);
    return [h.entities, h.devices, h.language, h.locale, h.themes?.darkMode, this._rev, this._minute, ...ids.map((id) => (id ? h.states[id] : undefined))];
  }

  connectedCallback() {
    // A click elsewhere on the page folds the groups back to their defaults (clicks inside a dialog opened from the
    // card leave them as they are).
    this._onOutside ??= (ev) => {
      if (!this._toggled?.size || !isOutside(this, ev)) return;
      this._toggled = new Map();
      this._update();
    };
    (this._outside ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._resize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        cancelAnimationFrame(this._fitFrame);
        this._fitFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._resize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
    // Back on the page after leaving it: rendered again in its default state, label changes followed again.
    if (this._hass) this._watchLabels();
    if (this._hass && this._config) this._update();
    // "Down for 12 min" moves on its own, and the uptime bar slides: re-checked every minute.
    clearInterval(this._tick);
    this._minute = Math.floor(Date.now() / 60000);
    this._tick = setInterval(() => {
      this._minute = Math.floor(Date.now() / 60000);
      if (this._hass) this.hass = this._hass;
    }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._tick = null;
    this._unwatchLabels();
    this._outside?.off();
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(this._fitFrame);
    this._resize?.disconnect();
    this._fitWidth = null;
    this._pressing = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded or with its popup open.
    this._toggled = new Map();
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._lastDeps = null;
    this._history = null;
    this._update();
  }

  _opt(key) {
    const v = Number(this._config[key]);
    return Number.isFinite(v) && this._config[key] !== "" && this._config[key] !== null ? v : DEFAULTS[key];
  }

  // The history window: `period` (rolling over `hours`, today, yesterday or this week).
  _period() {
    return PERIODS.includes(this._config.period) ? this._config.period : "rolling";
  }

  _window(now = Date.now()) {
    return historyWindow(this._period(), this._opt("hours"), now, firstDayOfWeek(this._locale()));
  }

  // "Last 24 hours", "Today", "Yesterday", "This week".
  _windowLabel() {
    const p = this._period();
    return p === "rolling" ? this._t("history", { h: this._opt("hours") }) : this._t(`period_${p}`);
  }

  // The uptime of a service as its time up over the window rather than a percentage: always when it is tracked up,
  // else with `uptime_display: duration`.
  _asDuration(v) {
    return v.track === "up" || this._config.uptime_display === "duration";
  }

  // What a service's time is counted as: "down" (outages, the default) or "up" (time on, for a PC or a console):
  // its `track` in `entities`, else the card's.
  _track(svc) {
    const v = svc.conf?.track ?? this._config.track;
    return v === "up" ? "up" : "down";
  }

  // The status pill goes right after the title only when the whole title and the pill's whole label fit on that row;
  // otherwise it takes a line of its own under the subtitle (.titles.below, the subtitle cut to one line). In the
  // banner (where that line may run over the picture), when the titles still run below the top of the ground strip or
  // out of the banner, and in the classic header when the label does not fit even alone, the pill keeps its dot alone,
  // beside the title (.titles.dotonly). Measured in fractional pixels.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".titles") || []) {
      const row = t.querySelector(".trow");
      const chips = row ? [...row.querySelectorAll(":scope > .chip")] : [];
      if (!chips.length || !row.getBoundingClientRect) continue;
      t.classList.remove("below", "dotonly");
      const name = row.querySelector(":scope > .name");
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const widths = chips.map((c) => c.getBoundingClientRect().width);
      let need = -gap;
      if (name && getComputedStyle(name).display !== "none") {
        name.style.flex = "none";
        need = name.getBoundingClientRect().width;
        name.style.flex = "";
      }
      for (const w of widths) need += gap + w;
      const room = row.getBoundingClientRect().width + 0.01;
      if (need <= room) continue;
      t.classList.add("below");
      const banner = t.closest(".banner");
      const cut = !banner && widths.some((w) => w > room);
      let out = false;
      if (banner) {
        const b = banner.getBoundingClientRect();
        const floor = b.bottom - (banner.querySelector(".ground")?.getBoundingClientRect().height ?? 10) + 0.5;
        out = [...t.querySelectorAll(".name, .sub, .chip")].some((e) => {
          const r = e.getBoundingClientRect();
          return r.height && (r.bottom > floor || r.top < b.top - 0.5 || r.right > b.right + 0.5);
        });
      }
      if (cut || out) t.classList.replace("below", "dotonly");
    }
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // The services of the card, kept while the registries, the config and the few states they depend on (URLs and
  // hostnames for the certificate matching, listed certificates for their kind) stay the same: Home Assistant replaces
  // hass.states on every state change of the instance, so keying on it would redo the matching all the time.
  _services() {
    const h = this._hass;
    const found = discover(h);
    if (this._svcFound !== found || this._svcConf !== this._config) {
      this._svcFound = found;
      this._svcConf = this._config;
      const conf = [].concat(this._config.entities || []).map((o) => o?.cert_entity);
      this._svcIds = [...found.flatMap((s) => [s.url, s.hostname]), ...conf].filter(Boolean);
    }
    const key = [found, h.devices, this._config, ...this._svcIds.map((id) => h.states[id])];
    if (this._svcKey && sameDeps(this._svcKey, key)) return this._svcList;
    this._svcKey = key;
    this._svcList = servicesFor(h, this._config);
    return this._svcList;
  }

  // HA labels of the entities and devices, by id → name (the label registry is not in hass): loaded once, then again
  // whenever a label is created, renamed or deleted (label_registry_updated), while the card is on the page.
  _loadLabels(again = false) {
    const h = this._hass;
    if (typeof h?.callWS !== "function") return;
    this._watchLabels();
    // Loaded again: the names in hand stay shown until the new ones are in.
    if ((this._labels && !again) || this._labelsLoading) return;
    this._labelsLoading = true;
    Promise.resolve(h.callWS({ type: "config/label_registry/list" }))
      .then((rows) => {
        this._labels = Object.fromEntries((Array.isArray(rows) ? rows : []).map((l) => [l.label_id, l.name]));
        this._rev++;
        if (this._hass) this.hass = this._hass;
      })
      .catch(() => {
        this._labels ||= {};
      })
      .finally(() => {
        this._labelsLoading = false;
      });
  }

  _watchLabels() {
    const conn = this._hass?.connection;
    if (this._labelsSub || this.isConnected === false || typeof conn?.subscribeEvents !== "function") return;
    const sub = Promise.resolve(
      conn.subscribeEvents(() => this._loadLabels(true), "label_registry_updated"),
    ).catch(() => null);
    this._labelsSub = sub;
  }

  _unwatchLabels() {
    const sub = this._labelsSub;
    this._labelsSub = null;
    sub?.then((unsub) => typeof unsub === "function" && unsub());
  }

  // Loads the history of the status entities for the uptime bar and percentage, again after HISTORY_TTL or when
  // the services change.
  _loadHistory(services) {
    const h = this._hass;
    const c = this._config;
    if (typeof h?.callWS !== "function") return;
    const periods = c.show_periods !== false && services.some((s) => this._track(s) === "up");
    if (c.show_history === false && c.show_uptime === false && !periods) return;
    const ids = services.filter((s) => s.source !== "cert_expiry").map((s) => s.status);
    if (!ids.length) return;
    // A rolling window keeps its key as it slides; a calendar one (today, yesterday, this week) gets a new one when
    // the day or the week turns.
    const w = this._window();
    const period = this._period();
    const key = `${ids.join(",")}|${period}|${period === "rolling" ? this._opt("hours") : w.start}`;
    const fresh = this._history && this._history.key === key && Date.now() - this._history.at < HISTORY_TTL;
    if (fresh || this._historyLoading === key) return;
    this._historyLoading = key;
    const range = { start_time: new Date(w.start).toISOString(), ...(w.live ? {} : { end_time: new Date(w.end).toISOString() }) };
    Promise.resolve(
      h.callWS({ type: "history/history_during_period", ...range, entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false }),
    )
      .then((res) => {
        this._history = { key, at: Date.now(), data: Object.fromEntries(ids.map((id) => [id, toTimeline(res?.[id])])) };
      })
      .catch(() => {
        this._history = { key, at: Date.now(), data: {} };
      })
      .finally(() => {
        this._historyLoading = null;
        this._rev++;
        if (this._hass && this.isConnected !== false) this.hass = this._hass;
      });
  }

  _update() {
    if (!this._hass || !this._config) return;
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    const html = this._render();
    if (html !== this._html) {
      const kept = this._byPointer ? null : this._focusedSpot();
      this._html = html;
      morph(this.shadowRoot, html);
      this._fitPill();
      // A new <ha-card> draws its frame a moment later: the pill is measured again once it has.
      const card = this.shadowRoot.querySelector?.("ha-card");
      if (card && card !== this._card) {
        this._card = card;
        Promise.resolve(card.updateComplete).then(() => {
          if (this._card === card && this.isConnected !== false) this._fitPill();
        });
      }
      if (kept) this._restoreFocus(kept);
    }
  }

  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const key = focusKey(el);
    if (!key) return null;
    const index = this._focusables(key).indexOf(el);
    return index < 0 ? null : { key, index };
  }

  _focusables(key) {
    return [...this.shadowRoot.querySelectorAll(FOCUS_SELECTOR)].filter((n) => focusKey(n) === key);
  }

  _restoreFocus({ key, index }) {
    this._focusables(key)[index]?.focus({ preventScroll: true });
  }

  _onClick(ev) {
    this._pressing = false;
    if (ev.detail === 0) this._byPointer = false;
    const el = ev.composedPath().find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!el) return;
    ev.stopPropagation();
    const { action, entity } = el.dataset;
    if (action === "zoom") return this._toggleZoom(ev);
    if (action === "toggle_group") {
      const key = el.dataset.group;
      this._toggled = new Map(this._toggled).set(key, !this._isCollapsed(key, el.dataset.problem === "1"));
      return this._update();
    }
    if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
  }

  // Everything a row shows about a service, read from the states.
  _view(svc) {
    const h = this._hass;
    const c = this._config;
    const st = this._s(svc.status);
    const locale = this._locale();
    const view = { svc, entity: svc.status, name: c.names?.[svc.key] || svc.conf?.name || "" };
    // Status
    if (svc.source === "cert_expiry") {
      // A certificate that fails validation has no expiry: its sensor reads unknown, with is_valid false.
      const exp = st && Date.parse(st.state);
      view.status =
        st?.attributes?.is_valid === false ? "down" : !valid(st) ? "unknown" : Number.isFinite(exp) && exp < Date.now() ? "down" : "up";
    } else {
      view.status = statusFromState(svc.status, st?.state, st?.attributes?.device_class);
    }
    view.track = svc.source === "cert_expiry" ? "down" : this._track(svc);
    const off = (status) => (view.track === "up" && status === "down" ? "off" : status);
    view.status = off(view.status);
    if (!view.name) {
      const dev = h.devices?.[svc.device_id];
      view.name =
        svc.source === "uptime_kuma" || svc.source === "ping"
          ? deviceName(dev) || st?.attributes?.friendly_name || svc.status
          : svc.source === "cert_expiry"
            ? deviceName(dev) || svc.cert_host || st?.attributes?.friendly_name || svc.status
            : st?.attributes?.friendly_name || deviceName(dev) || svc.status;
    }
    view.since = st && view.status !== "up" && svc.source !== "cert_expiry" ? Date.parse(st.last_changed) : null;
    // Tracked up: since when it has been up.
    view.upSince = st && view.track === "up" && view.status === "up" ? Date.parse(st.last_changed) : null;
    // Subtitle: host, monitor type or last ping
    const host = hostFor(h, svc);
    if (svc.source === "healthchecks" && st?.attributes?.last_ping) {
      const lp = Date.parse(st.attributes.last_ping);
      if (Number.isFinite(lp)) view.detail = this._t("last_ping", { when: ago(locale, lp) });
    } else if (svc.source === "cert_expiry") {
      view.detail = svc.cert_host || "";
    } else if (host && host !== String(view.name).toLowerCase()) {
      view.detail = host;
    } else if (svc.type && valid(this._s(svc.type))) {
      const ts = this._s(svc.type);
      view.detail = h.formatEntityState ? h.formatEntityState(ts) : ts.state;
    }
    // Latency in ms
    const ls = this._s(svc.latency);
    let lat = num(ls);
    if (lat !== null && ls.attributes?.unit_of_measurement === "s") lat *= 1000;
    if (lat !== null && ls.attributes?.unit_of_measurement === "µs") lat /= 1000;
    view.latency = view.status === "up" || view.status === "pending" ? lat : null;
    view.latencyCls = lat !== null && lat > this._opt("latency_warning") ? "warn" : "";
    // Certificate: days left, date
    const cs = this._s(svc.cert);
    if (cs?.attributes?.is_valid === false) view.cert = { days: null, date: null, invalid: true, cls: "crit" };
    else if (cs && valid(cs)) {
      let days = null;
      let date = null;
      if (svc.cert_kind === "timestamp") {
        const ms = Date.parse(cs.state);
        if (Number.isFinite(ms)) {
          days = Math.floor((ms - Date.now()) / 86400e3);
          date = ms;
        }
      } else {
        days = num(cs);
        if (days !== null) date = Date.now() + days * 86400e3;
      }
      // An Uptime Kuma monitor of a plain http:// URL has no certificate (its sensor reads 0 or -1); a Certificate Expiry
      // one of the same host still counts.
      const plain = svc.cert_src === "kuma" && svc.url && /^http:/i.test(this._s(svc.url)?.state || "");
      if (days !== null && !plain) {
        const invalid = cs.attributes?.is_valid === false;
        view.cert = {
          days,
          date,
          invalid,
          cls: invalid || days < 0 || days <= this._opt("ssl_critical_days") ? "crit" : days <= this._opt("ssl_warning_days") ? "warn" : "ok",
        };
      }
    }
    // Tags: Uptime Kuma's, the HA labels of the entity and its device, the option's
    view.tags = this._tagsOf(svc);
    // History and uptime
    const w = this._window();
    const { start, end } = w;
    let timeline = this._history?.data?.[svc.status];
    // The history is reloaded every few minutes: a change since then is added from the state, so that the current
    // status only covers the time since it began (not everything since the last change recorded in the history).
    const lc = st ? Date.parse(st.last_changed) : Number.NaN;
    if (timeline && Number.isFinite(lc) && !(timeline.length && timeline[timeline.length - 1].t >= lc)) timeline = [...timeline, { t: lc, s: st.state }];
    if (timeline && svc.source !== "cert_expiry") {
      const dc = st?.attributes?.device_class;
      // A window that ended (yesterday) is closed by the status it had then, not by the current one.
      const segs = segments(timeline, start, end, (raw) => off(statusFromState(svc.status, raw, dc)), w.live ? view.status : undefined);
      view.bar = buckets(segs, start, w.barEnd);
      view.share = uptimeShare(segs);
      const up = upPeriods(segs, w.live ? end : Number.POSITIVE_INFINITY);
      view.total = up.total;
      if (view.track === "up") view.periods = up.periods;
    }
    // Uptime Kuma's own 1-day uptime, for the default window (the last 24 hours); its time up, without the history.
    const us = this._s(svc.uptime);
    if (this._period() === "rolling" && this._opt("hours") === 24 && num(us) !== null) {
      view.share = num(us);
      if (!Number.isFinite(view.total)) view.total = (view.share / 100) * (end - start);
    }
    return view;
  }

  _tagsOf(svc) {
    const out = [];
    const add = (v) => {
      const s = String(v ?? "").trim();
      if (s && !out.includes(s)) out.push(s);
    };
    const ts = this._s(svc.tags_entity);
    for (const tag of (Array.isArray(ts?.attributes?.tags) ? ts.attributes.tags : [])) {
      if (tag && typeof tag === "object") add(tag.value ? `${tag.name}: ${tag.value}` : tag.name);
      else add(tag);
    }
    const labels = this._labels || {};
    const ent = this._hass.entities[svc.status];
    const dev = this._hass.devices?.[ent?.device_id ?? svc.device_id];
    for (const id of [...(ent?.labels || []), ...(dev?.labels || [])]) add(labels[id] || id);
    for (const tag of [].concat(svc.conf?.tags || [])) add(tag);
    return out;
  }

  _isProblem(v) {
    return (v.status !== "up" && v.status !== "off") || (v.cert && v.cert.cls !== "ok" && this._config.show_ssl !== false);
  }

  // Views of the services shown, sorted.
  _views(all = this._allViews()) {
    let views = [...all];
    if (this._config.only_problems) views = views.filter((v) => this._isProblem(v));
    const byName = (a, b) => String(a.name).localeCompare(String(b.name), this._locale());
    const order = { down: 0, pending: 1, maintenance: 2, unknown: 3, up: 4, off: 5 };
    views.sort(this._config.sort === "name" ? byName : (a, b) => order[a.status] - order[b.status] || byName(a, b));
    return views;
  }

  // Counts over every service of the card (the filters of the list left aside but the tags one).
  _summary(views) {
    const count = (st) => views.filter((v) => v.status === st).length;
    const certs = views.filter((v) => v.cert && v.cert.cls !== "ok" && this._config.show_ssl !== false).map((v) => (v.cert.cls === "crit" ? "crit" : "warn"));
    const slow = views.some((v) => v.latencyCls === "warn" && this._config.show_latency !== false);
    const total = views.length;
    const up = count("up");
    const down = count("down");
    const pending = count("pending");
    const maint = count("maintenance");
    const offs = count("off");
    let chip;
    if (down) chip = { cls: "crit", text: this._t("n_down", { n: down }) };
    else if (pending) chip = { cls: "warn", text: this._t("n_pending", { n: pending }) };
    else if (maint) chip = { cls: "maint", text: this._t("n_maintenance", { n: maint }) };
    else if (total && up === total) chip = { cls: "ok", text: this._t("all_up") };
    else if (offs && up + offs === total) chip = { cls: "ok", text: this._t("n_off", { n: offs }) };
    else chip = total ? { cls: "idle", text: this._t("unknown") } : null;
    const levels = [chip?.cls || "", ...certs, slow ? "warn" : ""];
    const icon = levels.includes("crit") ? "crit" : levels.includes("warn") ? "warn" : chip?.cls || "";
    return { total, up, down, pending, maint, offs, chip, icon };
  }

  // Every service of the card, the tags filter applied (not only_problems): what the totals count.
  _allViews() {
    const services = this._services();
    this._loadHistory(services);
    let views = services.map((s) => this._view(s));
    const filter = this._config.tags ? [].concat(this._config.tags).map(String) : null;
    if (filter) views = views.filter((v) => v.tags.some((tg) => filter.includes(tg)));
    return views;
  }

  // Overall status drawn by the picture: down, pending or maintenance when one service is, up when all others are.
  // A service tracked up that is off (`track: up`) is a normal state: with only up and off services the picture is
  // up, like the status chip, even when every one of them is off.
  _overall(sum) {
    if (sum.down) return "down";
    if (sum.pending) return "pending";
    if (sum.maint) return "maintenance";
    return sum.up || (sum.offs && sum.offs === sum.total) ? "up" : "unknown";
  }

  // Share of the services in each status, as a thin segmented bar.
  _ratio(sum) {
    const parts = [
      ["ok", sum.up],
      ["maint", sum.maint],
      ["warn", sum.pending],
      ["crit", sum.down],
      ["idle", sum.total - sum.up - sum.maint - sum.pending - sum.down],
    ].filter(([, n]) => n > 0);
    return `<div class="ratio" aria-hidden="true">${parts.map(([cls, n]) => `<i class="${cls}" style="flex:${n}"></i>`).join("")}</div>`;
  }

  // The rack picture (opens the first service down, else nothing more than the card).
  _pictureBlock(overall, views) {
    const target = views.find((v) => v.status === overall && overall !== "up") || null;
    const label = esc(this._config.title || this._t("title"));
    const attrs = target ? ` clickable" role="button" tabindex="0" data-entity="${esc(target.entity)}` : `" role="img`;
    return `<div class="picture${attrs}" aria-label="${label}"><img src="${svgUri(rackSvg(overall))}" alt=""></div>`;
  }

  _certLabel(cert) {
    if (cert.invalid) return this._t("ssl_invalid");
    if (cert.days < 0) return this._t("ssl_expired");
    return this._t("ssl_in", { d: fmtUnit(cert.days, "day", this._locale()) });
  }

  _illustrated() {
    return this._config?.illustration !== false;
  }

  // The illustrated header: the rack of the overall status in its server room, the title and the status on the wall
  // at its left, the round icon in the status colour. Its subtitle is the status in words and the share of services up.
  _banner(sum, overall, views) {
    const c = this._config;
    const zoom = this._zoomButton();
    const night = isNight(this._hass, c);
    // The status in the pill on the title row (in the round icon's colour, a certificate or a slow service included),
    // the share of services up in the subtitle.
    const sub = this._t("summary", { up: sum.up.toLocaleString(this._locale()), total: sum.total.toLocaleString(this._locale()) });
    const chip = sum.chip;
    const pill = chip
      ? `<span class="chip ${sum.icon || chip.cls}" title="${esc(chip.text)}" aria-label="${esc(chip.text)}"><span class="dot"></span><span class="chip-text">${esc(chip.text)}</span></span>`
      : "";
    return `
      <div class="banner${night ? " night" : ""}${zoom ? " has-zoom" : ""}">
        ${sceneSvg(overall, night, this._uid)}<div class="ground"></div>
        <div class="htext">
          <span class="type-icon${sum.icon ? ` ${sum.icon}` : ""}">${svgIcon(ICONS.heart_pulse)}</span>
          <div class="titles"><div class="tstack">
            <div class="trow"><div class="name">${esc(c.title || this._t("title"))}</div>${pill}</div>
            <div class="sub" title="${esc(sub)}">${esc(sub)}</div>
          </div></div>
        </div>
        <div class="bart">${this._pictureBlock(overall, views)}</div>
        ${zoom}
      </div>`;
  }

  _header(sum, sub) {
    const c = this._config;
    const chip = sum.chip;
    return `
      <div class="header${sub ? "" : " nosub"}">
        <span class="type-icon${sum.icon ? ` ${sum.icon}` : ""}">${svgIcon(ICONS.heart_pulse)}</span>
        <div class="titles">
          <div class="trow"><div class="name">${esc(c.title || this._t("title"))}</div>${
            chip
              ? `<span class="chip ${chip.cls}" title="${esc(chip.text)}" aria-label="${esc(chip.text)}"><span class="dot"></span><span class="chip-text">${esc(chip.text)}</span></span>`
              : ""
          }</div>
          ${sub ? `<div class="sub" title="${esc(sub)}">${esc(sub)}</div>` : ""}
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  _zoomButton() {
    return "";
  }

  _toggleZoom() {}

  _errorCard(key) {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t(key))}</div></ha-card>`;
  }

  _statusText(v) {
    if (v.status === "down" && Number.isFinite(v.since)) return this._t("down_for", { d: fmtDuration(Date.now() - v.since, this._locale()) });
    if (v.status === "up" && Number.isFinite(v.upSince)) return this._t("up_for", { d: fmtDurationHM(Date.now() - v.upSince, this._locale()) });
    return this._t(v.status);
  }
}

export class UptimeCard extends UptimeBase {
  static getConfigElement() {
    return document.createElement("uptime-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    const n = this._lastCount ?? 4;
    return Math.max(3, Math.ceil(n * 1.2) + 2);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 9, rows: "auto" };
  }

  _isCollapsed(key, problem) {
    if (this._toggled?.has(key)) return this._toggled.get(key);
    // A group with a service down is always shown unfolded (it can still be folded by hand).
    if (problem) return false;
    const c = this._config.collapsed;
    if (c === true) return true;
    return [].concat(c || []).map(String).includes(key);
  }

  _row(v) {
    const c = this._config;
    const locale = this._locale();
    const cls = STATUS_CLASS[v.status];
    const statusTxt = this._statusText(v);
    const sub = [];
    const src = SOURCES[v.svc.source] || SOURCES.entity;
    if (v.status !== "up" || v.track === "up") sub.push(`<span class="txt stxt ${cls}">${esc(statusTxt)}</span>`);
    else if (v.detail) sub.push(`<span class="txt">${esc(v.detail)}</span>`);
    if (v.cert && c.show_ssl !== false) {
      const label = this._certLabel(v.cert);
      const title = Number.isFinite(v.cert.date)
        ? this._t("ssl_expires_on", { date: new Date(v.cert.date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }) })
        : label;
      if (sub.length) sub.push(`<span class="sep" aria-hidden="true">·</span>`);
      sub.push(`<span class="ssl ${v.cert.cls}" title="${esc(title)}">${svgIcon(v.cert.cls === "ok" ? ICONS.lock : ICONS.lock_alert)}<span>${esc(label)}</span></span>`);
    }
    const meta = [];
    if (c.show_latency !== false && v.latency !== null && v.latency !== undefined)
      meta.push(`<span class="lat ${v.latencyCls}" title="${esc(this._t("latency"))}">${esc(fmtLatency(v.latency, locale))}</span>`);
    const shareCls = (p) => (p >= 99 ? "" : p >= 95 ? "warn" : "crit");
    if (c.show_uptime !== false && this._asDuration(v) && Number.isFinite(v.total)) {
      // The time up over the window rather than a percentage (tracked up, or `uptime_display: duration`); a service
      // tracked down keeps the colour of its share.
      const pc = v.track === "up" || v.share == null ? "" : shareCls(v.share);
      meta.push(`<span class="pct dur ${pc}" title="${esc(`${this._t("time_up")} · ${this._windowLabel()}`)}">${esc(fmtDurationHM(v.total, locale))}</span>`);
    } else if (c.show_uptime !== false && v.share !== null && v.share !== undefined) {
      meta.push(`<span class="pct ${shareCls(v.share)}" title="${esc(`${this._t("uptime")} · ${this._windowLabel()}`)}">${esc(fmtPct(v.share, locale))}</span>`);
    }
    const bar =
      c.show_history !== false && v.bar
        ? `<div class="hbar" role="img" aria-label="${esc(`${this._windowLabel()}${v.share != null ? `: ${fmtPct(v.share, locale)}` : ""}`)}">${v.bar.map((b) => `<i class="${b === "none" ? "none" : STATUS_CLASS[b]}"></i>`).join("")}</div>`
        : "";
    const periods = c.show_periods !== false && v.track === "up" && v.periods?.length ? this._periods(v.periods) : "";
    const label = `${v.name}: ${statusTxt}`;
    return `<div class="svc clickable" role="button" tabindex="0" data-entity="${esc(v.entity)}" aria-label="${esc(label)}">
        <span class="dot ${cls}" title="${esc(statusTxt)}"></span>
        <div class="svc-main"><div class="svc-name">${esc(v.name)}</div><div class="svc-sub">${svgIcon(ICONS[src.icon])}${sub.join("")}</div></div>
        <div class="meta">${meta.join("")}</div>
        ${bar}${periods}
      </div>`;
  }

  // The periods up of a service tracked up, the latest first: "17:10 – now", "Mon 14:02 – 15:30" (the day when it is
  // not today); the first PERIODS_SHOWN, the others counted as +N.
  _periods(list) {
    const locale = this._locale();
    const today = new Date().toDateString();
    const hm = (ms) => new Date(ms).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    const day = (ms) => (new Date(ms).toDateString() === today ? "" : `${new Date(ms).toLocaleDateString(locale, { weekday: "short" })} `);
    const text = (p) => `${day(p.from)}${hm(p.from)} – ${p.open ? this._t("now") : `${new Date(p.to).toDateString() === new Date(p.from).toDateString() ? "" : day(p.to)}${hm(p.to)}`}`;
    const shown = list.slice(0, PERIODS_SHOWN);
    const all = list.map(text).join(", ");
    return `<div class="periods" title="${esc(all)}" aria-label="${esc(`${this._t("time_up")}: ${all}`)}">${shown
      .map((p) => `<span class="period${p.open ? " open" : ""}">${esc(text(p))}</span>`)
      .join("")}${list.length > shown.length ? `<span class="period more">+${list.length - shown.length}</span>` : ""}</div>`;
  }

  // Groups of the list: [{ key, label, icon, views }], or null for a flat list.
  _groups(views) {
    const by = this._config.group_by ?? "tag";
    if (by === "none") return null;
    const map = new Map();
    const push = (key, label, icon, v) => {
      if (!map.has(key)) map.set(key, { key, label, icon, views: [] });
      map.get(key).views.push(v);
    };
    if (by === "source") {
      for (const v of views) {
        const s = v.svc.source;
        push(s, SOURCES[s]?.label || this._t("src_entity"), SOURCES[s]?.icon || "connection", v);
      }
      return SOURCE_ORDER.filter((k) => map.has(k)).map((k) => map.get(k));
    }
    if (!views.some((v) => v.tags.length)) return null;
    const filter = this._config.tags ? [].concat(this._config.tags).map(String) : null;
    const other = [];
    for (const v of views) {
      const tags = filter ? v.tags.filter((tg) => filter.includes(tg)) : v.tags;
      if (!tags.length) other.push(v);
      for (const tg of tags) push(`tag:${tg}`, tg, "tag", v);
    }
    const locale = this._locale();
    const groups = filter
      ? filter.filter((tg) => map.has(`tag:${tg}`)).map((tg) => map.get(`tag:${tg}`))
      : [...map.values()].sort((a, b) => a.label.localeCompare(b.label, locale));
    if (other.length) groups.push({ key: "other", label: this._t("other"), icon: "server", views: other });
    return groups;
  }

  _list(views) {
    return `<div class="list">${views.map((v) => this._row(v)).join("")}</div>`;
  }

  _group(g) {
    const sum = this._summary(g.views);
    const problem = g.views.some((v) => v.status === "down");
    const closed = this._isCollapsed(g.label, problem);
    const countCls = sum.down ? "crit" : sum.pending ? "warn" : "";
    return `<div class="group">
        <div class="section-title toggle" role="button" tabindex="0" data-action="toggle_group" data-group="${esc(g.label)}" data-problem="${problem ? 1 : 0}" aria-expanded="${!closed}">
          ${svgIcon(ICONS[g.icon], g.icon === "tag" ? "tag-icon" : "")}<span class="label">${esc(g.label)}</span>
          <span class="count ${countCls}">${esc(this._t("summary", { up: sum.up, total: sum.total }))}</span>${svgIcon(ICONS.chevron_down, "chevron")}
        </div>
        ${closed ? "" : this._list(g.views)}
      </div>`;
  }

  // The hero: the rack picture of the overall state, the state in words, the share of services up, the service
  // down the longest and the most urgent certificate, and the integrations the services come from.
  // The hero's big line: the average uptime of the services over the history window (the status itself is in the
  // header pill, the share of services up in its subtitle). Nothing when no service has an uptime yet.
  _uptimeLine(all) {
    if (this._config.show_uptime === false) return "";
    const shares = all.map((v) => v.share).filter((x) => x !== null && x !== undefined && Number.isFinite(x));
    if (!shares.length) return "";
    const avg = shares.reduce((a, b) => a + b, 0) / shares.length;
    const pc = avg >= 99 ? "ok" : avg >= 95 ? "warn" : "crit";
    // `uptime_display: duration`: the average time up of the services over the window.
    const totals = all.filter((v) => Number.isFinite(v.share)).map((v) => v.total).filter(Number.isFinite);
    if (this._config.uptime_display === "duration" && totals.length) {
      const time = totals.reduce((a, b) => a + b, 0) / totals.length;
      const cap = `${this._t("time_up")} · ${this._windowLabel()}`;
      return `<div class="state uptime ${pc}"><span class="v">${esc(fmtDurationHM(time, this._locale()))}</span><span class="cap">${esc(cap)}</span></div>`;
    }
    const caption = `${this._t("uptime")} · ${this._windowLabel()}`;
    return `<div class="state uptime ${pc}"><span class="v">${esc(fmtPct(avg, this._locale()))}</span><span class="cap">${esc(caption)}</span></div>`;
  }

  _hero(all, sum) {
    const c = this._config;
    const locale = this._locale();
    const lines = [];
    const down = all.filter((v) => v.status === "down").sort((a, b) => (a.since || 0) - (b.since || 0))[0];
    if (down)
      lines.push(
        `<div class="alert-line crit clickable" role="button" tabindex="0" data-entity="${esc(down.entity)}">${svgIcon(ICONS.alert)}<span>${esc(`${down.name}: ${this._statusText(down)}`)}</span></div>`,
      );
    if (c.show_ssl !== false) {
      const left = (v) => (v.cert.invalid ? -Infinity : v.cert.days);
      const cert = all.filter((v) => v.cert && v.cert.cls !== "ok").sort((a, b) => left(a) - left(b))[0];
      if (cert)
        lines.push(
          `<div class="alert-line ${cert.cert.cls} clickable" role="button" tabindex="0" data-entity="${esc(cert.svc.cert)}">${svgIcon(ICONS.lock_alert)}<span>${esc(`${cert.name}: ${this._certLabel(cert.cert)}`)}</span></div>`,
        );
    }
    const counts = new Map();
    for (const v of all) counts.set(v.svc.source, (counts.get(v.svc.source) || 0) + 1);
    const tags = SOURCE_ORDER.filter((k) => counts.has(k)).map(
      (k) => `<span class="tag">${svgIcon(ICONS[SOURCES[k].icon])}<span>${esc(SOURCES[k].label || this._t("src_entity"))}</span><b>${counts.get(k).toLocaleString(locale)}</b></span>`,
    );
    const overall = this._overall(sum);
    return `<div class="hero">
        ${this._illustrated() ? "" : this._pictureBlock(overall, all)}
        <div class="info">
          ${this._uptimeLine(all)}
          <div class="ratio-line">${this._ratio(sum)}<span class="v">${esc(this._t("summary", { up: sum.up.toLocaleString(locale), total: sum.total.toLocaleString(locale) }))}</span></div>
          ${lines.join("")}
          ${tags.length > 1 ? `<div class="tags">${tags.join("")}</div>` : ""}
        </div>
      </div>`;
  }

  _render() {
    if (!this._hass.entities) return this._errorCard("no_registry");
    const all = this._allViews();
    const views = this._views(all);
    this._lastCount = views.length;
    if (!all.length) return this._errorCard("no_services");
    const sum = this._summary(all);
    const groups = this._groups(views);
    let body;
    if (!views.length) body = `<div class="empty-line">${svgIcon(ICONS.check_circle)}<span>${esc(this._t("all_operational"))}</span></div>`;
    else body = groups ? groups.map((g) => this._group(g)).join("") : this._list(views);
    const hero = this._config.show_hero === false ? "" : this._hero(all, sum);
    const ill = this._illustrated();
    return `<style>${BASE_STYLE}${FULL_STYLE}${ill ? BANNER_STYLE : ""}</style>
      <ha-card>
        ${ill ? this._banner(sum, this._overall(sum), all) : this._header(sum, this._t("summary", { up: sum.up, total: sum.total }))}
        <div class="content">${hero}${body}</div>
      </ha-card>`;
  }
}

// The mini card: X/Y services up and the services down. Its detail button (top right, `zoom: false` removes it)
// switches it to the full list and back, and a click anywhere else on the page brings the compact view back.
export class UptimeMiniCard extends UptimeCard {
  constructor() {
    super();
    this._onUnzoom = (ev) => {
      if (this._zoomed && isOutside(this, ev)) this._setZoom(false);
    };
  }

  static getConfigElement() {
    return document.createElement("uptime-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    (this._unzoom ??= watchOutside(this, (ev) => this._onUnzoom(ev))).on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom?.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
    this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
  }

  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _render() {
    if (this._zoomed) return super._render();
    if (!this._hass.entities) return this._errorCard("no_registry");
    const views = this._allViews();
    if (!views.length) return this._errorCard("no_services");
    const sum = this._summary(views);
    const locale = this._locale();
    const down = views.filter((v) => v.status === "down").sort((a, b) => (b.since || 0) - (a.since || 0) || String(a.name).localeCompare(String(b.name), locale));
    const max = Math.max(0, Math.round(this._opt("max_items")));
    const shown = down.slice(0, max);
    const items = shown.length
      ? `<div class="items">${shown
          .map(
            (v) =>
              `<div class="item crit clickable" role="button" tabindex="0" data-entity="${esc(v.entity)}" aria-label="${esc(`${v.name}: ${this._statusText(v)}`)}"><span class="dot crit"></span><span class="nm">${esc(v.name)}</span>${
                Number.isFinite(v.since) ? `<span class="since">${esc(fmtDuration(Date.now() - v.since, locale))}</span>` : ""
              }</div>`,
          )
          .join("")}${down.length > shown.length ? `<div class="more">+${down.length - shown.length}</div>` : ""}</div>`
      : !down.length
        ? `<div class="ok-line">${svgIcon(ICONS.check_circle)}<span>${esc(sum.up === sum.total ? this._t("all_operational") : sum.chip?.text || "")}</span></div>`
        : "";
    const ill = this._illustrated();
    return `<style>${BASE_STYLE}${MINI_STYLE}${ill ? BANNER_STYLE : ""}</style>
      <ha-card>
        ${ill ? this._banner(sum, this._overall(sum), views) : this._header(sum, "")}
        <div class="content">
          ${ill ? "" : this._pictureBlock(this._overall(sum), views)}
          <div class="info">
            <div class="total"><span class="big">${sum.up.toLocaleString(locale)}</span><span class="of">/${sum.total.toLocaleString(locale)}</span><span class="lbl">${esc(this._t("services_up"))}</span></div>
            ${this._ratio(sum)}
            ${items}
          </div>
        </div>
      </ha-card>`;
  }
}
