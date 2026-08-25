import test from "node:test";
import assert from "node:assert/strict";

import {
  ENEMY_CATALOG,
  TOURS,
} from "../src/game/content.js";
import { getEncounterSignature } from "../src/game/encounter-design.js";
import {
  getRoomArt,
  getRoomCompositeIdentity,
} from "../src/game/room-art.js";
import { getRoomTradeoffs } from "../src/game/room-tradeoffs.js";

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function signature(value) {
  return JSON.stringify(canonicalize(value));
}

function normalizedIdentity(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function assertUnique(entries, label) {
  const firstOwnerByValue = new Map();
  for (const { owner, value } of entries) {
    assert.notEqual(value, "", `${owner} must define ${label}`);
    assert.equal(
      firstOwnerByValue.has(value),
      false,
      `${owner} duplicates ${label} from ${firstOwnerByValue.get(value)}`,
    );
    firstOwnerByValue.set(value, owner);
  }
}

function visualGeometry(room) {
  return {
    obstacles: room.obstacles.map(({ x, y, width, height, kind }) => ({
      x,
      y,
      width,
      height,
      kind,
    })),
    hazards: room.hazards.map(({ x, y, radius, kind }) => ({
      x,
      y,
      radius,
      kind,
    })),
    destructibles: room.destructibles.map(({ x, y, width, height, type }) => ({
      x,
      y,
      width,
      height,
      type,
    })),
  };
}

function encounterIdentity(room) {
  return {
    roomType: room.roomType,
    environment: room.environment,
    reward: room.reward,
    elite: room.elite,
    boss: room.boss,
    waves: room.waves,
    geometry: visualGeometry(room),
  };
}

function tourContentIdentity(tour) {
  return tour.rooms.map((room) => ({
    ...encounterIdentity(room),
    restorationPct: room.restorationPct ?? null,
    artVariant: room.artVariant ?? null,
  }));
}

function roomOwner(tour, room, roomIndex) {
  return `${tour.id}/${roomIndex + 1}:${room.id}`;
}

test("tour and room identity namespaces cannot repeat", () => {
  for (const key of ["id", "code", "name", "district", "theme", "family"]) {
    assertUnique(
      TOURS.map((tour) => ({
        owner: tour.id,
        value: normalizedIdentity(tour[key]),
      })),
      `tour ${key}`,
    );
  }

  assertUnique(
    TOURS.map((tour) => ({
      owner: tour.id,
      value: signature(tourContentIdentity(tour)),
    })),
    "authored tour content",
  );

  const rooms = TOURS.flatMap((tour) => tour.rooms.map((room, roomIndex) => ({
    tour,
    room,
    roomIndex,
    owner: roomOwner(tour, room, roomIndex),
  })));

  for (const key of ["id", "name"]) {
    assertUnique(
      rooms.map(({ room, owner }) => ({
        owner,
        value: normalizedIdentity(room[key]),
      })),
      `global room ${key}`,
    );
  }

  assertUnique(
    rooms.map(({ room, roomIndex, owner }) => ({
      owner,
      value: signature(getRoomCompositeIdentity(room.id, roomIndex + 1, room.environment)),
    })),
    "room composite identity",
  );

  assertUnique(
    rooms.map(({ room, roomIndex, owner }) => {
      const art = getRoomArt(room.environment, {
        roomId: room.id,
        roomNumber: roomIndex + 1,
        artVariant: room.artVariant,
      });
      assert.ok(art, `${owner} must resolve room art`);
      return {
        owner,
        value: signature({
          sprite: art.sprite,
          composite: getRoomCompositeIdentity(room.id, roomIndex + 1, room.environment),
        }),
      };
    }),
    "rendered room identity",
  );
});

test("every combat room has unique visual geometry and an exact encounter identity", () => {
  for (const tour of TOURS) {
    const combatRooms = tour.rooms
      .map((room, roomIndex) => ({
        room,
        roomIndex,
        owner: roomOwner(tour, room, roomIndex),
      }))
      .filter(({ room }) => room.roomType === "combat");

    assertUnique(
      combatRooms.map(({ room, owner }) => ({
        owner,
        value: signature(visualGeometry(room)),
      })),
      `visual combat geometry inside ${tour.id}`,
    );

    assertUnique(
      combatRooms.map(({ room, owner }) => ({
        owner,
        value: getEncounterSignature(room.waves),
      })),
      `ordered enemy formation inside ${tour.id}`,
    );

    assertUnique(
      combatRooms.map(({ room, owner }) => ({
        owner,
        value: signature(encounterIdentity(room)),
      })),
      `exact combat encounter inside ${tour.id}`,
    );
  }
});

test("tour themes, environments, and enemies never leak into another tour", () => {
  const environmentOwner = new Map();
  const enemyOwner = new Map();
  const enemyArtOwner = new Map();

  for (const tour of TOURS) {
    const environments = new Set(tour.rooms.map((room) => room.environment));
    const enemyIds = new Set(tour.rooms.flatMap((room) => room.enemies));

    for (const environment of environments) {
      assert.equal(
        environmentOwner.has(environment),
        false,
        `${tour.id} reuses ${environment} from ${environmentOwner.get(environment)}`,
      );
      environmentOwner.set(environment, tour.id);
    }

    for (const enemyId of enemyIds) {
      const enemy = ENEMY_CATALOG[enemyId];
      assert.ok(enemy, `${tour.id} references unknown enemy ${enemyId}`);
      assert.equal(enemy.family, tour.family, `${enemyId} has the wrong tour family`);
      assert.equal(
        enemyOwner.has(enemyId),
        false,
        `${tour.id} reuses enemy ${enemyId} from ${enemyOwner.get(enemyId)}`,
      );
      enemyOwner.set(enemyId, tour.id);

      for (const artPath of [
        enemy.art.sprite,
        enemy.art.motionSprite,
        enemy.art.specialSprite,
        enemy.art.reactionSprite,
      ].filter(Boolean)) {
        assert.equal(
          enemyArtOwner.has(artPath),
          false,
          `${tour.id}/${enemyId} reuses enemy art from ${enemyArtOwner.get(artPath)}`,
        );
        enemyArtOwner.set(artPath, `${tour.id}/${enemyId}`);
      }
    }
  }
});

test("every enemy-free room has a distinct authored choice or restoration intent", () => {
  const safeRoomIntents = [];
  const choiceIds = [];

  for (const tour of TOURS) {
    for (const [roomIndex, room] of tour.rooms.entries()) {
      if (room.roomType === "combat") {
        assert.ok(room.enemies.length > 0, `${room.id} cannot be an empty combat room`);
        continue;
      }

      const owner = roomOwner(tour, room, roomIndex);
      const choices = getRoomTradeoffs(room.id);
      assert.match(room.artVariant ?? "", /^[a-z0-9-]+$/, `${owner} needs authored safe-room art`);
      assert.equal(choices.length, 2, `${owner} must offer exactly two tradeoffs`);
      assert.notEqual(choices[0].effect, choices[1].effect, `${owner} choices must have different effects`);

      for (const choice of choices) {
        assert.match(choice.description, /Gain|Restore/, `${choice.id} needs a benefit`);
        assert.match(choice.description, /Lose/, `${choice.id} needs a cost`);
        choiceIds.push({ owner, value: normalizedIdentity(choice.id) });
      }

      if (room.roomType === "rest") {
        assert.ok(room.restorationPct > 0, `${owner} must restore health`);
      } else {
        assert.equal(room.roomType, "event", `${owner} uses an unknown safe-room intent`);
        assert.equal(room.reward, "event", `${owner} must resolve an event reward`);
      }

      safeRoomIntents.push({
        owner,
        value: signature({
          roomType: room.roomType,
          reward: room.reward,
          artVariant: room.artVariant,
          restorationPct: room.restorationPct ?? null,
          choices: choices.map(({ effect }) => effect),
        }),
      });
    }
  }

  assert.ok(safeRoomIntents.length > 0, "The route must contain intentional safe rooms");
  assertUnique(safeRoomIntents, "safe-room intent");
  assertUnique(choiceIds, "safe-room choice id");
});
