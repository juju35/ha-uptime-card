// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { SOURCES, SOURCE_ORDER } from "./core.js";
import { lang, t } from "./helpers.js";
import { discover } from "./discovery.js";
import { PERIODS } from "./history.js";
import { DEFAULTS, sameDeps } from "./cards.js";

export const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];

export class UptimeEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [
      ["illustration", true],
      ["show_title", true],
      ["show_subtitle", true],
      ["show_hero", true],
      ["show_latency", true],
      ["show_history", true],
      ["show_uptime", true],
      ["show_ssl", true],
      ["show_periods", true],
      ["only_problems", false],
    ];
  }

  static get numbers() {
    return ["hours", "ssl_warning_days", "ssl_critical_days", "latency_warning"];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const nums = { hours: [1, 168, "h"], ssl_warning_days: [0, 365, "d"], ssl_critical_days: [0, 365, "d"], latency_warning: [1, 60000, "ms"], max_items: [0, 50] };
    return [
      { name: "title", selector: { text: {} } },
      { name: "entities", selector: { entity: { multiple: true, filter: [{ domain: "binary_sensor" }, { domain: "sensor" }] } } },
      ...this._discoveryFields(),
      {
        type: "grid",
        name: "",
        schema: [
          { name: "group_by", selector: { select: { mode: "dropdown", options: ["tag", "source", "none"].map((v) => ({ value: v, label: tr(`group_${v}`) })) } } },
          { name: "sort", selector: { select: { mode: "dropdown", options: ["status", "name"].map((v) => ({ value: v, label: tr(`sort_${v}`) })) } } },
          { name: "track", selector: { select: { mode: "dropdown", options: ["down", "up"].map((v) => ({ value: v, label: tr(`track_${v}`) })) } } },
          { name: "period", selector: { select: { mode: "dropdown", options: PERIODS.map((v) => ({ value: v, label: tr(`period_${v}`) })) } } },
          {
            name: "uptime_display",
            selector: { select: { mode: "dropdown", options: [{ value: "percent", label: tr("uptime_percent") }, { value: "duration", label: tr("time_up") }] } },
          },
        ],
      },
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        type: "grid",
        name: "",
        // The history length only counts for the rolling window.
        schema: this.constructor.numbers
          .filter((name) => name !== "hours" || !PERIODS.includes(this._config.period) || this._config.period === "rolling")
          .map((name) => ({
          name,
          selector: { number: { min: nums[name][0], max: nums[name][1], mode: "box", ...(nums[name][2] ? { unit_of_measurement: nums[name][2] } : {}) } },
        })),
      },
      { name: "illustration_theme", selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } } },
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  // What the card finds by itself: `auto`, the integrations to look in, the services found to leave out, and the tag
  // and folded-group filters (lists of names). `collapsed: true` (every group) stays as written, out of the form.
  _discoveryFields() {
    const found = this._hass ? discover(this._hass).map((s) => s.key) : [];
    const excluded = [].concat(this._config.exclude || []).filter((id) => !found.includes(id));
    const ids = [...found, ...excluded];
    return [
      { name: "auto", selector: { boolean: {} } },
      {
        name: "sources",
        selector: { select: { multiple: true, mode: "list", options: SOURCE_ORDER.filter((k) => SOURCES[k].label).map((value) => ({ value, label: SOURCES[value].label })) } },
      },
      ...(ids.length ? [{ name: "exclude", selector: { entity: { multiple: true, include_entities: ids } } }] : []),
      { name: "tags", selector: { text: { multiple: true } } },
      ...(this._config.collapsed === true ? [] : [{ name: "collapsed", selector: { text: { multiple: true } } }]),
    ];
  }

  // `auto` defaults to true without `entities`, else false.
  static autoDefault(config) {
    return ![].concat(config.entities || []).length;
  }

  _defaults() {
    return { ...Object.fromEntries(this.constructor.toggles), group_by: "tag", sort: "status", track: "down", period: "rolling", uptime_display: "percent", illustration_theme: "auto", ...Object.fromEntries(this.constructor.numbers.map((n) => [n, DEFAULTS[n]])) };
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => (s.name === "zoom" ? t(this._hass, this._config, "zoom_helper") : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        // The entities keep their options (name, tags…) when they were objects in the YAML.
        if (Array.isArray(config.entities)) {
          const prev = new Map([].concat(this._config.entities || []).map((e) => [typeof e === "string" ? e : e?.entity, e]));
          config.entities = config.entities.map((id) => prev.get(id) ?? id);
        }
        const defaults = this._defaults();
        // `auto` left at its default (the one shown, or the one of the new `entities`) stays out of the YAML.
        const auto = this.constructor.autoDefault;
        if ((this._config.auto === undefined && config.auto === auto(this._config)) || config.auto === auto(config)) delete config.auto;
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          if (v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length) || (k in defaults && JSON.stringify(v) === JSON.stringify(defaults[k])))
            delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._defaults(), ...this._config };
    data.entities = [].concat(this._config.entities || []).map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean);
    data.auto ??= this.constructor.autoDefault(this._config);
    for (const k of ["sources", "exclude", "tags"]) if (data[k] !== undefined) data[k] = [].concat(data[k]).map(String);
    if (data.collapsed !== undefined && data.collapsed !== true) data.collapsed = [].concat(data.collapsed).map(String);
    this._form.hass = this._hass;
    const h = this._hass;
    const dataDeps = [this._config];
    if (!sameDeps(this._dataDeps, dataDeps)) {
      this._dataDeps = dataDeps;
      this._form.data = data;
    }
    // The services found (the exclude list) and `collapsed: true` (no field) change the form too.
    const deps = [lang(h, this._config), h.entities, this._config.collapsed === true, String(this._config.exclude ?? "")];
    if (!sameDeps(this._schemaDeps, deps)) {
      this._schemaDeps = deps;
      this._form.schema = this._schema();
    }
  }
}

export class UptimeCardEditor extends UptimeEditorBase {}

export class UptimeMiniCardEditor extends UptimeEditorBase {
  static get toggles() {
    return [...UptimeEditorBase.toggles, ["zoom", true]];
  }

  static get numbers() {
    return [...UptimeEditorBase.numbers, "max_items"];
  }
}
