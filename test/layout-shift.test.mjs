// Browser test (Chromium through Playwright; CHROMIUM_PATH, or skipped without one): a state update must not move
// the page nor restart the card's animations. Home Assistant's <ha-card> and <ha-icon> render their shadow DOM a
// microtask after they are connected (the stand-ins below do the same): a card that rewrote its shadow root on every
// Uptime Kuma heartbeat replaced them, collapsed to its border while the status pill was measured and restarted the
// rack and ECG animations. Each card is mounted at the bottom of a scrolled page (no scroll anchoring, as in Safari)
// and gets 20 updates, half of them to an entity it does not show: those change nothing in its DOM, the others patch
// it in place (no element removed, <ha-card>, the icons and the running animations kept), and neither the card's
// height nor the scroll position moves.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, test } from "node:test";
import { callWS, devices, entities, states } from "../scripts/mock-states.mjs";

const source = readFileSync(new URL("../src/uptime-card.js", import.meta.url), "utf8");
const STAND_INS = `
customElements.define("ha-card", class extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(":host{display:block;border:1px solid #ddd;border-radius:12px;overflow:hidden}");
    root.adoptedStyleSheets = [sheet];
    this.updateComplete = new Promise((done) => queueMicrotask(() => { root.innerHTML = "<slot></slot>"; done(true); }));
  }
});
customElements.define("ha-icon", class extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    queueMicrotask(() => { root.innerHTML = '<span style="display:inline-flex;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)"></span>'; });
  }
});`;

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {}
const browser = await chromium?.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}).catch(() => null);
after(() => browser?.close());

// [card, config, shown entity that changes on every heartbeat, mini card expanded]
const CASES = [
  ["uptime-card", {}, "sensor.home_assistant_response_time"],
  ["uptime-card", { illustration: false }, "sensor.home_assistant_response_time"],
  ["uptime-mini-card", {}, "sensor.home_assistant_response_time", true],
];

test("heartbeats patch the cards in place: nothing for other entities, no element removed, no jump", { skip: !browser && "no Chromium", timeout: 120000 }, async () => {
  for (const [tag, config, id, zoom] of CASES) {
    const page = await browser.newPage({ viewport: { width: 900, height: 700 }, timezoneId: "UTC" });
    await page.setContent(
      "<!doctype html><body style='margin:0;font-family:Arial,sans-serif;overflow-anchor:none'><div style='height:1500px'></div><div id='root' style='width:400px'></div><div style='height:40px'></div></body>",
    );
    await page.addScriptTag({ content: STAND_INS });
    await page.addScriptTag({ content: source });
    await page.exposeFunction("__callWS", (msg) => callWS(msg));
    const r = await page.evaluate(
      async ({ tag, config, id, zoom, data }) => {
        const frame = () => new Promise((res) => requestAnimationFrame(res));
        const el = document.createElement(tag);
        el.setConfig({ type: `custom:${tag}`, ...config });
        let h = { ...data, language: "en", locale: { language: "en" }, themes: {}, callService() {}, callWS: (m) => window.__callWS(m) };
        el.hass = h;
        document.getElementById("root").appendChild(el);
        if (zoom) el._setZoom(true);
        for (let i = 0; i < 20; i++) await frame();
        await new Promise((res) => setTimeout(res, 200));
        for (let i = 0; i < 5; i++) await frame();
        window.scrollTo(0, document.documentElement.scrollHeight);
        await frame();
        const scroll = window.scrollY;
        const height = el.getBoundingClientRect().height;
        const kept = [...el.shadowRoot.querySelectorAll("ha-card, ha-icon, svg")];
        const log = { unrelated: 0, removed: 0, changed: 0, heights: new Set([height]) };
        let own = false;
        const count = (ms) => {
          for (const m of ms) {
            if (!own) log.unrelated++;
            else log.changed++;
            log.removed += [...m.removedNodes].filter((n) => n.nodeType === 1).length;
          }
        };
        const mo = new MutationObserver(count);
        mo.observe(el.shadowRoot, { subtree: true, childList: true, attributes: true, characterData: true });
        for (let i = 0; i < 20; i++) {
          own = i % 2 === 1;
          const states = { ...h.states };
          if (own) states[id] = { ...states[id], state: String(40 + i), last_updated: new Date().toISOString() };
          else states["sensor.unrelated"] = { entity_id: "sensor.unrelated", state: String(i), attributes: {} };
          h = { ...h, states };
          el.hass = h;
          for (let f = 0; f < 3; f++) {
            await frame();
            log.heights.add(el.getBoundingClientRect().height);
          }
          count(mo.takeRecords());
        }
        mo.disconnect();
        return {
          unrelated: log.unrelated,
          removed: log.removed,
          changed: log.changed,
          heights: [...log.heights],
          drift: window.scrollY - scroll,
          kept: kept.every((n) => n.isConnected),
        };
      },
      { tag, config, id, zoom, data: { states, entities, devices } },
    );
    const label = `${tag} ${JSON.stringify(config)}${zoom ? " expanded" : ""}`;
    assert.ok(r.changed > 0, `${label}: the heartbeat is shown (the test updates a displayed entity)`);
    assert.equal(r.unrelated, 0, `${label}: an update of another entity changes nothing`);
    assert.equal(r.removed, 0, `${label}: a heartbeat removes no element`);
    assert.ok(r.kept, `${label}: <ha-card>, the icons and the pictures are kept`);
    assert.deepEqual(r.heights, [r.heights[0]], `${label}: the height never changes`);
    assert.equal(r.drift, 0, `${label}: the page does not scroll`);
    await page.close();
  }
});
