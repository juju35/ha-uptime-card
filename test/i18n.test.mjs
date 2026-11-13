// Every language has every text of English, with the same placeholders, and is offered in the visual editor.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { load } from "./load.mjs";

const uc = load();
const LANGS = ["en", "fr", "de", "es", "it", "nl", "pt", "pl", "sr", "sr-Latn", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("the cards speak the 22 languages, and no other", () => {
  assert.deepEqual([...Object.keys(uc.STRINGS)].sort(), [...LANGS].sort());
});

test("every language has every English text, with the same placeholders, and nothing else", () => {
  const en = uc.STRINGS.en;
  for (const l of LANGS) {
    const tr = uc.STRINGS[l];
    assert.deepEqual([...Object.keys(tr)].sort(), [...Object.keys(en)].sort(), l);
    for (const k of Object.keys(en)) {
      assert.ok(String(tr[k]).trim(), `${l}.${k} is empty`);
      assert.deepEqual(vars(tr[k]), vars(en[k]), `${l}.${k} placeholders`);
    }
  }
});

test("the language follows the option, then Home Assistant, by base language, else English", () => {
  assert.equal(uc.lang({ language: "de" }, {}), "de");
  assert.equal(uc.lang({ locale: { language: "fr-CA" } }, {}), "fr");
  assert.equal(uc.lang({ language: "sr-Latn" }, {}), "sr-Latn");
  assert.equal(uc.lang({ language: "ja" }, {}), "en");
  assert.equal(uc.lang({ language: "en" }, { language: "el" }), "el");
  assert.equal(uc.intlLocale({ language: "pt" }, {}), "pt-PT");
  assert.equal(uc.t({ language: "fr" }, {}, "summary", { up: 3, total: 4 }), "3/4 en ligne");
});

test("the visual editor offers every language, and the build splits them all out", () => {
  const src = readFileSync(new URL("../src/uptime-card.js", import.meta.url), "utf8");
  for (const l of LANGS) assert.match(src, new RegExp(`\\["${l}", "[^"]+"\\]`), l);
  const split = readFileSync(new URL("../scripts/i18n-split.mjs", import.meta.url), "utf8");
  for (const l of LANGS) assert.ok(split.includes(`"${l}"`), l);
});
