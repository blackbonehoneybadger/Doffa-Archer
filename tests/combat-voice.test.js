import test from "node:test";
import assert from "node:assert/strict";

import { SUPPORTED_LOCALES } from "../src/i18n/locales.js";
import {
  COMBAT_VOICE_LINES,
  HERO_VOICE_PROFILES,
  CombatVoice,
  getCombatVoiceLine,
} from "../src/audio/combat-voice.js";

const REQUIRED_EVENTS = [
  "hurt", "death", "meleeFinisher", "rangedFinisher",
  "heavy", "bossVictory", "roomClear", "levelUp",
];

test("all twelve interface languages have a complete combat voice pack", () => {
  assert.equal(Object.keys(COMBAT_VOICE_LINES).length, 12);
  for (const [locale] of SUPPORTED_LOCALES) {
    for (const event of REQUIRED_EVENTS) {
      assert.ok(COMBAT_VOICE_LINES[locale]?.[event]?.length > 0, `${locale} ${event}`);
      assert.equal(typeof getCombatVoiceLine(event, { locale }), "string");
    }
  }
});

test("all five heroes have distinct bounded voice profiles", () => {
  assert.equal(Object.keys(HERO_VOICE_PROFILES).length, 5);
  const signatures = new Set();
  for (const profile of Object.values(HERO_VOICE_PROFILES)) {
    assert.ok(profile.rate >= 0.8 && profile.rate <= 1.1);
    assert.ok(profile.pitch >= 0.5 && profile.pitch <= 0.9);
    assert.ok(profile.volume > 0 && profile.volume <= 1);
    signatures.add(`${profile.rate}:${profile.pitch}:${profile.voiceIndex}`);
  }
  assert.equal(signatures.size, 5);
});

test("combat speech is localized, rate-limited, urgent, and safely mutable", () => {
  let now = 10_000;
  const spoken = [];
  let cancellations = 0;
  class FakeUtterance {
    constructor(text) {
      this.text = text;
    }
  }
  const synthesis = {
    getVoices: () => [{ lang: "ru-RU", name: "RU" }],
    speak: (utterance) => spoken.push(utterance),
    cancel: () => { cancellations += 1; },
  };
  const voice = new CombatVoice({
    locale: () => "ru",
    heroId: () => "hadida",
    cooldownMs: 1_000,
    now: () => now,
    synthesis,
    Utterance: FakeUtterance,
  });

  assert.equal(voice.play("hurt"), true);
  assert.equal(spoken[0].text, COMBAT_VOICE_LINES.ru.hurt[0]);
  assert.equal(spoken[0].lang, "ru-RU");
  assert.equal(spoken[0].pitch, HERO_VOICE_PROFILES.hadida.pitch);
  assert.equal(voice.play("heavy"), false);
  assert.equal(voice.play("death"), true);
  assert.equal(cancellations, 1);

  now += 1_100;
  assert.equal(voice.play("hurt"), true);
  assert.equal(spoken.at(-1).text, COMBAT_VOICE_LINES.ru.hurt[0]);
  voice.setMuted(true);
  assert.equal(voice.play("bossVictory"), false);
  assert.equal(cancellations, 2);
});

test("missing browser speech APIs and provider errors fail without throwing", () => {
  const missing = new CombatVoice({ synthesis: null, Utterance: null });
  assert.equal(missing.play("hurt"), false);

  class FakeUtterance { constructor(text) { this.text = text; } }
  const broken = new CombatVoice({
    synthesis: { getVoices: () => [], speak: () => { throw new Error("blocked"); } },
    Utterance: FakeUtterance,
  });
  assert.equal(broken.play("hurt"), false);
});
