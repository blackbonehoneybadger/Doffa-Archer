const TIER_WEIGHT = Object.freeze({ S: 1, A: 2, B: 3 });

function ability(id, glyph, name, description, category, tier, apply) {
  return Object.freeze({ id, glyph, name, description, category, tier, weight: TIER_WEIGHT[tier], apply });
}

export const ABILITIES = Object.freeze([
  ability("black_volley", "II", "BLACK VOLLEY", "Fire one additional projectile. Each projectile deals slightly less damage.", "trajectory", "S", (player) => {
    player.projectileCount += 1;
    player.damage *= 0.88;
  }),
  ability("pressure_bore", "→", "PRESSURE BORE", "Projectiles penetrate one additional target.", "trajectory", "A", (player) => { player.pierce += 1; }),
  ability("cinder_step", "∆", "CINDER STEP", "Increase movement speed by 18 percent.", "stat", "A", (player) => { player.speed *= 1.18; }),
  ability("black_steel", "+", "BLACK STEEL", "Increase maximum health by 25 and restore 25 health.", "survival", "A", (player) => {
    player.maxHp += 25;
    player.hp = Math.min(player.maxHp, player.hp + 25);
  }),
  ability("deadeye", "◎", "DEADEYE", "Gain 15 percent critical-hit chance.", "stat", "S", (player) => { player.critChance = Math.min(0.75, player.critChance + 0.15); }),
  ability("roaster_core", "◈", "ROASTER CORE", "Attack 20 percent faster.", "stat", "S", (player) => { player.attackInterval *= 0.8; }),
  ability("brass_return", "↯", "BRASS RETURN", "Projectiles ricochet once from chamber walls.", "trajectory", "A", (player) => { player.wallBounces += 1; }),
  ability("void_pressure", "◆", "VOID PRESSURE", "Increase all attack damage by 24 percent.", "stat", "S", (player) => { player.damage *= 1.24; }),
  ability("magnetic_draft", "⌁", "MAGNETIC DRAFT", "Collect shards and recovery charges from farther away and faster.", "utility", "B", (player) => {
    player.pickupRadius += 110;
    player.pickupSpeed *= 1.25;
  }),
  ability("recovery_drip", "✚", "RECOVERY DRIP", "Restore five percent maximum health whenever a chamber is cleared.", "recovery", "A", (player) => { player.healOnRoomClearPct = Math.min(0.25, player.healOnRoomClearPct + 0.05); }),
  ability("pressure_shell", "⬡", "PRESSURE SHELL", "Reduce incoming damage by twelve percent.", "survival", "S", (player) => { player.damageReduction = Math.min(0.55, player.damageReduction + 0.12); }),
  ability("deep_roast", "◉", "DEEP ROAST", "Fire larger impact rounds with a wider blast at slightly reduced direct damage.", "impact", "A", (player) => {
    player.projectileRadius *= 1.35;
    player.splashRadius += 36;
    player.damage *= 0.94;
  }),
  ability("cross_pressure", "↔", "CROSS PRESSURE", "Ranged attacks fire two side projectiles. Total damage is slightly reduced.", "trajectory", "S", (player) => {
    player.extraShotAngles ??= [];
    player.extraShotAngles.push(-Math.PI / 2, Math.PI / 2);
    player.damage *= 0.86;
  }),
  ability("rear_guard", "↓", "REAR GUARD", "Ranged attacks fire one projectile behind the hero.", "trajectory", "A", (player) => {
    player.extraShotAngles ??= [];
    player.extraShotAngles.push(Math.PI);
    player.damage *= 0.94;
  }),
  ability("chain_arc", "ϟ", "CHAIN ARC", "Hits discharge lightning into nearby enemies for 32 percent damage.", "element", "S", (player) => { player.chainDamagePct = Math.max(player.chainDamagePct ?? 0, 0.32); }),
  ability("cinder_coat", "♨", "CINDER COAT", "Attacks ignite enemies for 45 percent damage over time.", "element", "A", (player) => { player.burnDamagePct = Math.max(player.burnDamagePct ?? 0, 0.45); }),
  ability("frost_lock", "❄", "FROST LOCK", "Attacks slow enemies by 38 percent for two seconds.", "element", "A", (player) => { player.frostSlowPct = Math.max(player.frostSlowPct ?? 0, 0.38); }),
  ability("toxic_roast", "☣", "TOXIC ROAST", "Attacks poison enemies for 60 percent damage over four seconds.", "element", "A", (player) => { player.poisonDamagePct = Math.max(player.poisonDamagePct ?? 0, 0.60); }),
  ability("death_burst", "✹", "DEATH BURST", "Defeated enemies explode for 70 percent attack damage.", "impact", "S", (player) => {
    player.deathBurstPct = Math.max(player.deathBurstPct ?? 0, 0.70);
    player.deathBurstRadius = Math.max(player.deathBurstRadius ?? 0, 105);
  }),
  ability("guardian_discs", "◌", "GUARDIAN DISCS", "Gain two seconds of invulnerability every ten seconds.", "survival", "S", (player) => {
    player.shieldPulseInterval = 10;
    player.shieldPulseDuration = 2;
    player.shieldPulseTimer = Math.min(player.shieldPulseTimer ?? 4, 4);
  }),
  ability("blood_thirst", "♥", "BLOOD THIRST", "Recover 1.2 percent maximum health after defeating an enemy.", "recovery", "S", (player) => { player.bloodThirstPct = Math.min(0.05, (player.bloodThirstPct ?? 0) + 0.012); }),
  ability("rage_boiler", "!", "RAGE BOILER", "Deal up to 38 percent more damage as health falls.", "stat", "S", (player) => { player.rageMaxPct = Math.max(player.rageMaxPct ?? 0, 0.38); }),
  ability("tempered_edge", "†", "TEMPERED EDGE", "Melee attacks gain 22 percent damage and reach.", "melee", "A", (player) => {
    player.meleeDamagePct = (player.meleeDamagePct ?? 0) + 0.22;
    player.meleeRangePct = (player.meleeRangePct ?? 0) + 0.18;
  }),
  ability("execution_pressure", "×", "EXECUTION PRESSURE", "Critical hits deal 55 percent additional critical damage.", "stat", "A", (player) => { player.critMultiplier = Math.min(3.5, (player.critMultiplier ?? 2) + 0.55); }),
  ability("diagonal_barrage", "◇", "DIAGONAL BARRAGE", "Ranged attacks add two diagonal pressure bolts at reduced total damage.", "trajectory", "S", (player) => {
    player.extraShotAngles ??= [];
    player.extraShotAngles.push(-Math.PI / 4, Math.PI / 4);
    player.damage *= 0.88;
  }),
  ability("brass_chain", "↝", "BRASS CHAIN", "Projectiles jump to one nearby enemy after impact.", "trajectory", "S", (player) => {
    player.enemyRicochets = Math.min(3, (player.enemyRicochets ?? 0) + 1);
  }),
  ability("cold_wake", "✣", "COLD WAKE", "Defeated enemies release a freezing wave around them.", "impact", "A", (player) => {
    player.deathFrostRadius = Math.max(player.deathFrostRadius ?? 0, 125);
  }),
  ability("pressure_guard", "◒", "PRESSURE GUARD", "A rotating pressure guard destroys some incoming projectiles.", "survival", "S", (player) => {
    player.projectileBlockChance = Math.min(0.42, (player.projectileBlockChance ?? 0) + 0.22);
  }),
  ability("strong_heart", "♥+", "STRONG HEART", "Recovery pickups restore 28 percent more health.", "recovery", "A", (player) => {
    player.healMultiplier = (player.healMultiplier ?? 1) * 1.28;
  }),
  ability("fury_coil", "⚡", "FURY COIL", "Attack faster as health falls, up to 34 percent.", "stat", "S", (player) => {
    player.lowHealthAttackSpeedPct = Math.max(player.lowHealthAttackSpeedPct ?? 0, 0.34);
  }),
  ability("grace_valve", "♡", "GRACE VALVE", "Receive up to 45 percent more healing as health falls.", "recovery", "A", (player) => {
    player.lowHealthHealPct = Math.max(player.lowHealthHealPct ?? 0, 0.45);
  }),
  ability("evasive_smoke", "≋", "EVASIVE SMOKE", "Gain up to 18 percent dodge chance as health falls.", "survival", "S", (player) => {
    player.lowHealthDodgePct = Math.max(player.lowHealthDodgePct ?? 0, 0.18);
  }),
  ability("smart_roast", "XP", "SMART ROAST", "Collect 25 percent more run experience.", "utility", "A", (player) => {
    player.xpMultiplier = Math.max(player.xpMultiplier ?? 1, 1.25);
  }),
  ability("execution_mark", "☠", "EXECUTION MARK", "Non-boss hits have a small chance to execute weakened enemies.", "stat", "S", (player) => {
    player.executeChance = Math.min(0.12, (player.executeChance ?? 0) + 0.055);
  }),
  ability("sluggish_powder", "≈", "SLUGGISH POWDER", "Enemy projectiles travel 24 percent slower.", "survival", "A", (player) => {
    player.enemyProjectileSlowPct = Math.min(0.45, (player.enemyProjectileSlowPct ?? 0) + 0.24);
  }),
  ability("second_ignition", "1UP", "SECOND IGNITION", "Revive once per run with 55 percent health.", "survival", "S", (player) => {
    player.extraLives = Math.max(player.extraLives ?? 0, 1);
  }),
  ability("cinder_orbit", "●", "CINDER ORBIT", "A controlled fire orbit damages and ignites nearby enemies.", "aura", "A", (player) => { player.auraFire = Math.max(player.auraFire ?? 0, 0.34); }),
  ability("frost_orbit", "○", "FROST ORBIT", "A frost orbit damages and slows nearby enemies.", "aura", "A", (player) => { player.auraFrost = Math.max(player.auraFrost ?? 0, 0.30); }),
  ability("toxic_orbit", "◍", "TOXIC ORBIT", "A toxic orbit damages and poisons nearby enemies.", "aura", "A", (player) => { player.auraPoison = Math.max(player.auraPoison ?? 0, 0.32); }),
  ability("volt_orbit", "◉", "VOLT ORBIT", "An electric orbit shocks nearby enemies.", "aura", "S", (player) => { player.auraVolt = Math.max(player.auraVolt ?? 0, 0.38); }),
  ability("cinder_strike", "♨↓", "CINDER STRIKE", "Periodically call a burning strike onto the nearest enemy.", "strike", "A", (player) => { player.strikeFire = Math.max(player.strikeFire ?? 0, 0.82); }),
  ability("frost_strike", "❄↓", "FROST STRIKE", "Periodically call a slowing frost strike onto the nearest enemy.", "strike", "A", (player) => { player.strikeFrost = Math.max(player.strikeFrost ?? 0, 0.74); }),
  ability("toxic_strike", "☣↓", "TOXIC STRIKE", "Periodically call a poisonous strike onto the nearest enemy.", "strike", "A", (player) => { player.strikePoison = Math.max(player.strikePoison ?? 0, 0.78); }),
  ability("volt_strike", "ϟ↓", "VOLT STRIKE", "Periodically call a chain-lightning strike onto the nearest enemy.", "strike", "S", (player) => { player.strikeVolt = Math.max(player.strikeVolt ?? 0, 0.88); }),
  ability("meteor_crucible", "☄", "METEOR CRUCIBLE", "Periodically drop a wide blast onto a group of enemies.", "meteor", "S", (player) => {
    player.meteorDamagePct = Math.max(player.meteorDamagePct ?? 0, 1.35);
    player.meteorRadius = Math.max(player.meteorRadius ?? 0, 115);
  }),
]);

export function chooseAbilityCards(rng, count = 3, ownedIds = []) {
  if (!rng || typeof rng.shuffle !== "function") throw new TypeError("chooseAbilityCards requires an RNG with shuffle()");
  if (!Number.isInteger(count) || count < 1) throw new RangeError("count must be a positive integer");
  const owned = new Set(ownedIds);
  const fresh = ABILITIES.filter((candidate) => !owned.has(candidate.id));
  const source = fresh.length >= count ? fresh : ABILITIES;
  const weighted = source.flatMap((candidate) => Array.from({ length: candidate.weight }, () => candidate));
  const result = [];
  for (const candidate of rng.shuffle(weighted)) {
    if (!result.some(({ id }) => id === candidate.id)) result.push(candidate);
    if (result.length >= count) break;
  }
  return result;
}

export function applyAbility(player, abilityId) {
  const selected = ABILITIES.find((candidate) => candidate.id === abilityId);
  if (!selected) throw new RangeError(`Unknown ability: ${abilityId}`);
  selected.apply(player);
  return selected;
}
