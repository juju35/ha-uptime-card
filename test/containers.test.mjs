// The card in parents outside the native views (layout-card, button-card, a grid or horizontal stack): it neither
// falls to its borders where it is sized by its content (inline-block, a grid "auto" column) nor refuses to shrink
// below its natural width in a "1fr 1fr" grid or a flex row, placed directly or wrapped in a <div>.
// Rendered in Chromium when Playwright and its browser are installed (`npx playwright install chromium`); skipped
// otherwise (the CI test job has no browser: the CSS rules themselves are checked in narrow.test.mjs).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";

const source = readFileSync(new URL("../src/uptime-card.js", import.meta.url), "utf8");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {}
const browser = await chromium?.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}).catch(() => null);

const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;border:1px solid #ddd;overflow:hidden}</style><slot></slot>"; } });`;

// [name, total width, parent style, cards in the parent, style of each card (or of its wrapper)]
const CONTEXTS = [];
for (const w of [320, 600]) {
  CONTEXTS.push([`inline-block ${w}`, w, "display:inline-block", 1, ""]);
  CONTEXTS.push([`grid auto ${w}`, w, "display:grid;grid-template-columns:auto;justify-content:start", 1, ""]);
  CONTEXTS.push([`flex 1 1 0 ${w}`, w, "display:flex", 2, "flex:1 1 0"]);
}
for (const w of [320, 360, 500]) CONTEXTS.push([`grid 1fr 1fr ${w}`, w, "display:grid;grid-template-columns:1fr 1fr;gap:8px", 2, ""]);

for (const type of ["uptime-card", "uptime-mini-card"]) {
  test(`${type} keeps a width and stays inside shrink-to-fit, grid and flex parents`, { skip: !browser && "no Chromium" }, async () => {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    try {
      await page.setContent('<!doctype html><body style="margin:0;font-family:Arial,sans-serif"></body>');
      await page.addScriptTag({ content: HA_CARD });
      await page.addScriptTag({ content: source });
      const results = await page.evaluate(
        async ({ type, CONTEXTS, states, entities, devices }) => {
          const hass = { states, entities, devices, language: "en", locale: { language: "en" }, themes: {}, callService() {} };
          const runs = [];
          for (const [name, width, parentStyle, count, itemStyle] of CONTEXTS) {
            for (const wrapped of [false, true]) {
              const outer = document.body.appendChild(document.createElement("div"));
              outer.style.width = `${width}px`;
              const parent = outer.appendChild(document.createElement("div"));
              parent.style.cssText = parentStyle;
              const cards = [];
              for (let i = 0; i < count; i++) {
                const card = document.createElement(type);
                card.setConfig({ type: `custom:${type}` });
                card.hass = hass;
                const item = wrapped ? document.createElement("div") : card;
                if (wrapped) item.appendChild(card);
                item.style.cssText = itemStyle;
                parent.appendChild(item);
                cards.push(card);
              }
              runs.push({ name: `${name}${wrapped ? " (in a div)" : ""}`, outer, cards });
            }
          }
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          return runs.map(({ name, outer, cards }) => {
            const box = outer.getBoundingClientRect();
            return {
              name,
              cards: cards.map((card) => {
                const haCard = card.shadowRoot.querySelector("ha-card").getBoundingClientRect();
                let inside = 0;
                for (const e of card.shadowRoot.querySelectorAll("ha-card *")) {
                  if (e.closest("svg") || e.tagName === "STYLE") continue;
                  const r = e.getBoundingClientRect();
                  if (r.width) inside = Math.max(inside, Math.round(r.right - haCard.right));
                }
                return { width: Math.round(haCard.width), overflow: Math.round(haCard.right - box.right), inside };
              }),
            };
          });
        },
        { type, CONTEXTS, states, entities, devices },
      );
      const natural = type === "uptime-card" ? 400 : 300;
      for (const { name, cards } of results) {
        for (const { width, overflow, inside } of cards) {
          assert.ok(overflow <= 0, `${name}: the card overflows its parent by ${overflow} px (width ${width})`);
          assert.ok(width >= 100, `${name}: the card falls to ${width} px`);
          assert.ok(inside <= 0, `${name}: content ${inside} px outside the card (width ${width})`);
        }
        // Shrink-to-fit parents with room to spare: the card takes its natural width, not its borders.
        if (/^(inline-block|grid auto) 600/.test(name)) assert.equal(cards[0].width, natural, name);
      }
    } finally {
      await page.close();
    }
  });
}

// The status pill of the illustrated header: its whole label on the title row (or on its own line under the subtitle
// when the row runs out of room), never more than about half the title block, the title kept readable; the mini
// card's detail button in the banner's top-right corner.
for (const type of ["uptime-card", "uptime-mini-card"]) {
  test(`${type}: the status pill shows its whole label, the title stays readable`, { skip: !browser && "no Chromium" }, async () => {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    try {
      await page.setContent('<!doctype html><body style="margin:0;font-family:Arial,sans-serif"></body>');
      await page.addScriptTag({ content: HA_CARD });
      await page.addScriptTag({ content: source });
      const results = await page.evaluate(
        async ({ type, states, entities, devices }) => {
          const hass = { states, entities, devices, language: "en", locale: { language: "en" }, themes: {}, callService() {} };
          const cards = [245, 300, 400, 500].map((w) => {
            const outer = document.body.appendChild(document.createElement("div"));
            outer.style.width = `${w}px`;
            const card = outer.appendChild(document.createElement(type));
            card.setConfig({ type: `custom:${type}` });
            card.hass = hass;
            return [w, card];
          });
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          return cards.map(([w, card]) => {
            const q = (s) => card.shadowRoot.querySelector(s);
            const box = (e) => e?.getBoundingClientRect();
            const chip = q(".banner .chip");
            const text = chip.querySelector(".chip-text");
            const name = q(".banner .name");
            const titles = box(q(".banner .titles"));
            const banner = box(q(".banner"));
            const zoom = box(q(".banner .zoom"));
            return {
              w,
              whole: text.scrollWidth <= text.clientWidth + 1,
              share: box(chip).width / titles.width,
              // On the title row (vertically centred on the title), or on its own line under the subtitle.
              inline: Math.abs(box(chip).top + box(chip).height / 2 - (box(name).top + box(name).height / 2)) <= 2,
              below: box(chip).top >= box(name).bottom,
              inside: box(chip).right <= titles.right + 1,
              name: name.scrollWidth <= name.clientWidth + 1 || name.clientWidth >= 40,
              zoom: zoom && { top: Math.round(zoom.top - banner.top), right: Math.round(banner.right - zoom.right), w: Math.round(zoom.width) },
            };
          });
        },
        { type, states, entities, devices },
      );
      for (const r of results) {
        assert.ok(r.whole, `${r.w} px: the pill's label is cut`);
        assert.ok(r.inline || r.below, `${r.w} px: the pill is neither on the title row nor under the subtitle`);
        if (r.inline) assert.ok(r.share <= 0.52, `${r.w} px: the pill takes ${Math.round(r.share * 100)} % of the title block`);
        assert.ok(r.inside, `${r.w} px: the pill runs out of the title block`);
        assert.ok(r.name, `${r.w} px: the title is cut to nothing`);
        if (type === "uptime-mini-card") assert.deepEqual(r.zoom, { top: 5, right: 5, w: 24 }, `${r.w} px: the detail button is out of its corner`);
      }
    } finally {
      await page.close();
    }
  });
}

test.after(() => browser?.close());
