const BASE_CHOICES = Object.freeze([
  Object.freeze({ id: "vital-pressure", name: "VITAL PRESSURE", glyph: "+", description: "Restore 35% health. Lose 8% attack damage.", effect: "heal-for-damage" }),
  Object.freeze({ id: "glass-boiler", name: "GLASS BOILER", glyph: "!", description: "Gain 18% attack damage. Lose 12% maximum health.", effect: "damage-for-health" }),
  Object.freeze({ id: "predator-focus", name: "PREDATOR FOCUS", glyph: "×", description: "Gain 10% critical chance. Lose 10% movement speed.", effect: "crit-for-speed" }),
  Object.freeze({ id: "redline-step", name: "REDLINE STEP", glyph: ">", description: "Gain 15% movement speed. Lose 10% attack damage.", effect: "speed-for-damage" }),
]);

const SAFE_ROOM_ORDER = Object.freeze([
  "clearwater-hollow-15", "symbiotic-shrine-25", "moondew-sanctuary-35", "bloodroot-bargain-45",
  "forge-rest-15", "forge-event-25", "forge-rest-35", "forge-event-45",
  "crystal-rest-15", "crystal-event-25", "crystal-rest-35", "crystal-event-45",
  "sunken-rest-15", "sunken-event-25", "sunken-rest-35", "sunken-event-45",
  "ashen-rest-15", "ashen-event-25", "ashen-rest-35", "ashen-event-45",
]);

export function getRoomTradeoffs(roomId) {
  const index = SAFE_ROOM_ORDER.indexOf(roomId);
  if (index < 0) return [];
  return [BASE_CHOICES[index % BASE_CHOICES.length], BASE_CHOICES[(index + 1) % BASE_CHOICES.length]]
    .map((choice) => ({ ...choice, id: `${roomId}:${choice.id}` }));
}

export function applyRoomTradeoff(player, choice) {
  if (!player || !choice) return false;
  if (choice.effect === "heal-for-damage") {
    player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * .35));
    player.damage = Math.max(1, Math.round(player.damage * .92));
  } else if (choice.effect === "damage-for-health") {
    player.damage = Math.max(1, Math.round(player.damage * 1.18));
    player.maxHp = Math.max(1, Math.round(player.maxHp * .88));
    player.hp = Math.min(player.hp, player.maxHp);
  } else if (choice.effect === "crit-for-speed") {
    player.critChance = Math.min(.75, player.critChance + .1);
    player.speed = Math.max(120, Math.round(player.speed * .9));
  } else if (choice.effect === "speed-for-damage") {
    player.speed = Math.round(player.speed * 1.15);
    player.damage = Math.max(1, Math.round(player.damage * .9));
  } else {
    return false;
  }
  return true;
}

export function resolveTradeoffById(id) {
  if (typeof id !== "string") return null;
  const roomId = id.split(":", 1)[0];
  return getRoomTradeoffs(roomId).find((choice) => choice.id === id) ?? null;
}
