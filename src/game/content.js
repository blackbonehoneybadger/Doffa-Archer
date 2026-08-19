import { DEFAULT_TOUR_ID } from "../config/game-config.js";

function freezeEnemy(id, definition) {
  return Object.freeze({ id, ...definition });
}

function freezeRoom(definition) {
  return Object.freeze({
    ...definition,
    enemies: Object.freeze([...definition.enemies]),
  });
}

function freezeTour(definition) {
  return Object.freeze({
    ...definition,
    rooms: Object.freeze(definition.rooms.map(freezeRoom)),
  });
}

export const ENEMY_CATALOG = Object.freeze({
  ash_hound: freezeEnemy("ash_hound", {
    family: "hollow_roastery",
    behavior: "ash_hound",
    hp: 46,
    speed: 102,
    radius: 25,
    contactDamage: 10,
    score: 100,
    boss: false,
  }),
  ember_oracle: freezeEnemy("ember_oracle", {
    family: "hollow_roastery",
    behavior: "ember_oracle",
    hp: 58,
    speed: 68,
    radius: 27,
    contactDamage: 8,
    score: 140,
    boss: false,
  }),
  brass_colossus: freezeEnemy("brass_colossus", {
    family: "hollow_roastery",
    behavior: "brass_colossus",
    hp: 118,
    speed: 52,
    radius: 34,
    contactDamage: 16,
    score: 200,
    boss: false,
  }),
  smoke_revenant: freezeEnemy("smoke_revenant", {
    family: "hollow_roastery",
    behavior: "smoke_revenant",
    hp: 76,
    speed: 76,
    radius: 29,
    contactDamage: 11,
    score: 180,
    boss: false,
  }),
  hollow_roaster: freezeEnemy("hollow_roaster", {
    family: "hollow_roastery",
    behavior: "hollow_roaster",
    hp: 1_050,
    speed: 45,
    radius: 72,
    contactDamage: 22,
    score: 2_500,
    boss: true,
  }),
});

export const TOURS = Object.freeze([
  freezeTour({
    id: "hollow-roastery",
    code: "TOUR 01",
    name: "THE HOLLOW ROASTERY",
    district: "FURNACE DISTRICT",
    family: "hollow_roastery",
    unlocked: true,
    rooms: [
      {
        id: "ash-intake",
        name: "ASH INTAKE",
        enemies: ["ash_hound", "ash_hound", "ash_hound", "ash_hound"],
      },
      {
        id: "ember-gallery",
        name: "EMBER GALLERY",
        enemies: ["ember_oracle", "ember_oracle", "ember_oracle", "ember_oracle"],
      },
      {
        id: "brass-vault",
        name: "BRASS VAULT",
        enemies: ["brass_colossus", "brass_colossus", "brass_colossus"],
      },
      {
        id: "smoke-choir",
        name: "SMOKE CHOIR",
        enemies: ["smoke_revenant", "smoke_revenant", "smoke_revenant", "smoke_revenant"],
      },
      {
        id: "pressure-floor",
        name: "PRESSURE FLOOR",
        enemies: ["ash_hound", "ember_oracle", "brass_colossus", "smoke_revenant", "smoke_revenant"],
      },
      {
        id: "roaster-heart",
        name: "ROASTER HEART",
        boss: true,
        enemies: ["hollow_roaster"],
      },
    ],
  }),
]);

export { DEFAULT_TOUR_ID };

export function getEnemyDefinition(enemyId) {
  return ENEMY_CATALOG[enemyId] ?? null;
}

export function getTourDefinition(tourId = DEFAULT_TOUR_ID) {
  return TOURS.find((tour) => tour.id === tourId) ?? null;
}

export function getRoomDefinition(tourId, roomNumber) {
  const tour = getTourDefinition(tourId);
  if (!tour || !Number.isInteger(roomNumber) || roomNumber < 1) {
    return null;
  }
  return tour.rooms[roomNumber - 1] ?? null;
}

export function validateContentCatalog(tours = TOURS, enemies = ENEMY_CATALOG) {
  const errors = [];
  const tourIds = new Set();
  const families = new Set();

  for (const tour of tours) {
    if (!tour.id || tourIds.has(tour.id)) {
      errors.push(`Duplicate or missing tour id: ${tour.id || "<empty>"}`);
    }
    tourIds.add(tour.id);

    if (!tour.family || families.has(tour.family)) {
      errors.push(`Tour ${tour.id} must use a unique enemy family`);
    }
    families.add(tour.family);

    if (!Array.isArray(tour.rooms) || tour.rooms.length < 2) {
      errors.push(`Tour ${tour.id} must contain at least two rooms`);
      continue;
    }

    const roomIds = new Set();
    tour.rooms.forEach((room, roomIndex) => {
      if (!room.id || roomIds.has(room.id)) {
        errors.push(`Tour ${tour.id} has a duplicate or missing room id`);
      }
      roomIds.add(room.id);

      if (!Array.isArray(room.enemies) || room.enemies.length === 0) {
        errors.push(`Room ${tour.id}/${room.id} has no enemies`);
        return;
      }

      const isFinalRoom = roomIndex === tour.rooms.length - 1;
      const bossEnemies = room.enemies.filter((enemyId) => enemies[enemyId]?.boss);
      if (isFinalRoom && (!room.boss || room.enemies.length !== 1 || bossEnemies.length !== 1)) {
        errors.push(`Final room ${tour.id}/${room.id} must contain exactly one boss`);
      }
      if (!isFinalRoom && (room.boss || bossEnemies.length > 0)) {
        errors.push(`Boss content is only allowed in the final room of ${tour.id}`);
      }

      for (const enemyId of room.enemies) {
        const enemy = enemies[enemyId];
        if (!enemy) {
          errors.push(`Room ${tour.id}/${room.id} references unknown enemy ${enemyId}`);
        } else if (enemy.family !== tour.family) {
          errors.push(`Enemy ${enemyId} does not belong to tour family ${tour.family}`);
        }
      }
    });
  }

  return Object.freeze(errors);
}
