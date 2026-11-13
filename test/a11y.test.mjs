// Keyboard access, names of the elements without text, readable state colors and reduced motion.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const uc = load();
const makeHass = () => ({ entities, devices, states, language: "en" });
const newCard = (config = {}, Card = uc.UptimeCard) => {
  const card = new Card();
  card.setConfig(config);
  card.hass = makeHass();
  return card;
};

// Opening tags of the elements a click acts on: an entity (more-info) or an action.
const clickables = (html) => html.match(/<[a-z-]+\b[^>]*\bdata-(?:entity|action)="[^"]*"[^>]*>/g) || [];

test("every clickable element of the full and mini cards can be reached and used from the keyboard", () => {
  const mini = newCard({}, uc.UptimeMiniCard);
  const zoomed = newCard({}, uc.UptimeMiniCard);
  zoomed._setZoom(true);
  for (const card of [newCard(), newCard({ group_by: "none" }), mini, zoomed]) {
    const tags = clickables(card.shadowRoot.innerHTML);
    assert.ok(tags.length >= 3, "the card has clickable elements");
    for (const tag of tags) {
      if (tag.startsWith("<button")) {
        assert.match(tag, /\baria-label="[^"]+"/, tag);
        continue;
      }
      assert.match(tag, /\brole="button"/, tag);
      assert.match(tag, /\btabindex="0"/, tag);
    }
  }
});

test("rows, the picture and the uptime bars have a name", () => {
  const html = newCard().shadowRoot.innerHTML;
  for (const tag of html.match(/<div class="svc clickable"[^>]*>/g)) assert.match(tag, /aria-label="[^"]+: [^"]+"/, tag);
  assert.match(html, /<div class="picture clickable" role="button" tabindex="0" data-entity="[^"]+" aria-label="Services">/);
  assert.match(html, /<img src="data:image\/svg\+xml,[^"]+" alt="">/);
});

test("group titles are buttons that tell whether they are unfolded", () => {
  const html = newCard({ collapsed: ["Web"] }).shadowRoot.innerHTML;
  assert.match(html, /<div class="section-title toggle" role="button" tabindex="0" data-action="toggle_group" data-group="Web" data-problem="0" aria-expanded="false">/);
  assert.match(html, /data-group="Media" data-problem="1" aria-expanded="true">/);
});

test("Enter and Space on an element with the button role click it; other keys do nothing", () => {
  const card = newCard();
  const keydown = card.shadowRoot.listeners.keydown;
  for (const [key, clicks] of [["Enter", 1], [" ", 1], ["a", 0]]) {
    let clicked = 0;
    let prevented = 0;
    keydown({ key, target: { getAttribute: (n) => (n === "role" ? "button" : null), click: () => clicked++ }, preventDefault: () => prevented++ });
    assert.equal(clicked, clicks, key);
    assert.equal(prevented, clicks, key);
  }
});

test("state colors are mixed with the text color for text; animations stop with reduced motion", () => {
  const src = readFileSync(new URL("../src/uptime-card.js", import.meta.url), "utf8");
  assert.match(src, /\.chip \{[^}]*color: color-mix\(in srgb, var\(--c, var\(--uc-ok\)\) 50%, var\(--primary-text-color\)\)/);
  assert.match(src, /\.svc-sub \.stxt \{ color: color-mix\(in srgb, var\(--c\) 50%, var\(--primary-text-color\)\)/);
  const html = newCard().shadowRoot.innerHTML;
  assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{ \*, \*::before, \*::after \{ transition: none !important; animation: none !important; \} \}/);
  assert.match(html, /\.svc \.dot\.crit, \.item \.dot\.crit \{ animation: uc-pulse/);
});
