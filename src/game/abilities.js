export const ABILITIES = Object.freeze([
  Object.freeze({
    id: "black_volley",
    glyph: "II",
    name: "BLACK VOLLEY",
    description: "Fire one additional projectile. Each projectile deals slightly less damage.",
    apply(player) {
      player.projectileCount += 1;
      player.damage *= 0.88;
    },
  }),
  Object.freeze({
    id: "pressure_bore",
    glyph: "→",
    name: "PRESSURE BORE",
    description: "Projectiles penetrate one additional target.",
    apply(player) {
      player.pierce += 1;
    },
  }),
  Object.freeze({
    id: "cinder_step",
    glyph: "∆",
    name: "CINDER STEP",
    description: "Increase movement speed by 18 percent.",
    apply(player) {
      player.speed *= 1.18;
    },
  }),
  Object.freeze({
    id: "black_steel",
    glyph: "+",
    name: "BLACK STEEL",
    description: "Increase maximum health by 25 and restore 25 health.",
    apply(player) {
      player.maxHp += 25;
      player.hp = Math.min(player.maxHp, player.hp + 25);
    },
  }),
  Object.freeze({
    id: "deadeye",
    glyph: "◎",
    name: "DEADEYE",
    description: "Gain 15 percent critical-hit chance.",
    apply(player) {
      player.critChance = Math.min(0.75, player.critChance + 0.15);
    },
  }),
  Object.freeze({
    id: "roaster_core",
    glyph: "◈",
    name: "ROASTER CORE",
    description: "Attack 20 percent faster while standing still.",
    apply(player) {
      player.attackInterval *= 0.8;
    },
  }),
  Object.freeze({
    id: "brass_return",
    glyph: "↯",
    name: "BRASS RETURN",
    description: "Projectiles ricochet once from chamber walls.",
    apply(player) {
      player.wallBounces += 1;
    },
  }),
  Object.freeze({
    id: "void_pressure",
    glyph: "◆",
    name: "VOID PRESSURE",
    description: "Increase all projectile damage by 32 percent.",
    apply(player) {
      player.damage *= 1.32;
    },
  }),
  Object.freeze({
    id: "magnetic_draft",
    glyph: "⌁",
    name: "MAGNETIC DRAFT",
    description: "Pull roast shards and recovery charges from farther away and collect them faster.",
    apply(player) {
      player.pickupRadius += 110;
      player.pickupSpeed *= 1.25;
    },
  }),
  Object.freeze({
    id: "recovery_drip",
    glyph: "✚",
    name: "RECOVERY DRIP",
    description: "Restore five percent maximum health whenever a chamber is cleared.",
    apply(player) {
      player.healOnRoomClearPct = Math.min(0.25, player.healOnRoomClearPct + 0.05);
    },
  }),
  Object.freeze({
    id: "pressure_shell",
    glyph: "⬡",
    name: "PRESSURE SHELL",
    description: "Reduce incoming damage by twelve percent.",
    apply(player) {
      player.damageReduction = Math.min(0.55, player.damageReduction + 0.12);
    },
  }),
  Object.freeze({
    id: "deep_roast",
    glyph: "◉",
    name: "DEEP ROAST",
    description: "Fire larger impact rounds with a wider blast, at slightly reduced direct damage.",
    apply(player) {
      player.projectileRadius *= 1.35;
      player.splashRadius += 36;
      player.damage *= 0.94;
    },
  }),
]);

export function chooseAbilityCards(rng, count = 3, ownedIds = []) {
  if (!rng || typeof rng.shuffle !== "function") {
    throw new TypeError("chooseAbilityCards requires an RNG with shuffle()");
  }

  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError("count must be a positive integer");
  }

  const owned = new Set(ownedIds);
  const fresh = ABILITIES.filter((ability) => !owned.has(ability.id));
  const pool = fresh.length >= count ? fresh : ABILITIES;
  return rng.shuffle(pool).slice(0, Math.min(count, pool.length));
}

export function applyAbility(player, abilityId) {
  const ability = ABILITIES.find((candidate) => candidate.id === abilityId);
  if (!ability) {
    throw new RangeError(`Unknown ability: ${abilityId}`);
  }

  ability.apply(player);
  return ability;
}
