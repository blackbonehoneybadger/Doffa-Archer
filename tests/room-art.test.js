import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getTourDefinition } from "../src/game/content.js";
import {
  ROOM_ART_CATALOG,
  ROOM_ENVIRONMENTS,
  getRoomArtCacheEntryCount,
  getRoomArt,
  getRoomArtVariantIndex,
  loadRoomArt,
  releaseRoomArt,
  validateRoomArtCatalog,
} from "../src/game/room-art.js";

const root = process.cwd();

function readJpegDimensions(buffer) {
  assert.equal(buffer[0], 0xff);
  assert.equal(buffer[1], 0xd8);
  let offset = 2;

  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) {
      offset += 1;
    }
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) {
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    const segmentLength = buffer.readUInt16BE(offset);
    const isStartOfFrame = marker >= 0xc0
      && marker <= 0xcf
      && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }

  throw new Error("JPEG dimensions were not found");
}

test("room art catalog covers every runtime environment", () => {
  assert.deepEqual(Object.keys(ROOM_ART_CATALOG), [...ROOM_ENVIRONMENTS]);
  assert.deepEqual(validateRoomArtCatalog(), []);
  assert.equal(getRoomArt("unknown"), null);
  for (const environment of [
    "ash",
    "ember",
    "brass",
    "smoke",
    "pressure",
    "canopy",
    "mire",
    "mycelium",
    "briar",
    "rootdeep",
  ]) {
    assert.equal(ROOM_ART_CATALOG[environment].variants.length, 2);
  }
  for (const environment of ["heart", "rootheart"]) {
    assert.equal(ROOM_ART_CATALOG[environment].variants.length, 1);
  }
});

test("all runtime room plates exist as exact 720 by 1280 JPEG files", () => {
  const paths = new Set();
  for (const environment of ROOM_ENVIRONMENTS) {
    const entry = ROOM_ART_CATALOG[environment];
    for (const art of [...entry.variants, ...(entry.specials ?? [])]) {
      assert.equal(paths.has(art.sprite), false, `Duplicate sprite for ${environment}/${art.id}`);
      paths.add(art.sprite);

      const filePath = join(root, art.sprite.slice(1));
      assert.equal(existsSync(filePath), true, `Missing ${art.sprite}`);
      assert.deepEqual(readJpegDimensions(readFileSync(filePath)), {
        width: 720,
        height: 1280,
      });
    }
  }
  assert.equal(paths.size, 30);
});

test("normal rooms alternate architecture without changing the unique boss room", () => {
  assert.equal(getRoomArtVariantIndex("ash", { roomNumber: 1 }), 0);
  assert.equal(getRoomArtVariantIndex("ash", { roomNumber: 2 }), 1);
  assert.equal(getRoomArtVariantIndex("ash", { roomNumber: 3 }), 0);
  assert.equal(getRoomArt("ash", { roomNumber: 2 }).id, "soot-conveyor");
  assert.equal(getRoomArt("ember", { roomNumber: 12 }).id, "boiler-gallery");
  assert.equal(getRoomArt("brass", { roomNumber: 22 }).id, "meter-chamber");
  assert.equal(getRoomArt("smoke", { roomNumber: 32 }).id, "vapor-crypt");
  assert.equal(getRoomArt("pressure", { roomNumber: 42 }).id, "final-gauge");
  assert.equal(getRoomArt("heart", { roomNumber: 999 }).id, "roaster-heart");
  assert.equal(getRoomArt("ember", { artVariant: "cooling-reservoir" }).id, "cooling-reservoir");
  assert.equal(getRoomArt("brass", { artVariant: "brokers-meter" }).id, "brokers-meter");
  assert.equal(getRoomArt("smoke", { artVariant: "filter-chapel" }).id, "filter-chapel");
  assert.equal(getRoomArt("pressure", { artVariant: "redline-contract" }).id, "redline-contract");

  const fallback = getRoomArtVariantIndex("ash", { roomId: "ash-fallback" });
  assert.equal(fallback, getRoomArtVariantIndex("ash", { roomId: "ash-fallback" }));
});

test("the authored fifty-room route exercises both standard variants", () => {
  const tour = getTourDefinition("hollow-roastery");
  const usedByEnvironment = new Map(ROOM_ENVIRONMENTS.map((environment) => [environment, new Set()]));

  tour.rooms.forEach((room, index) => {
    const art = getRoomArt(room.environment, {
      roomId: room.id,
      roomNumber: index + 1,
      artVariant: room.artVariant,
    });
    usedByEnvironment.get(room.environment).add(art.id);
  });

  assert.deepEqual([...usedByEnvironment.get("ash")].sort(), ["ash-storage", "soot-conveyor"]);
  assert.deepEqual([...usedByEnvironment.get("ember")].sort(), [
    "boiler-gallery", "cooling-reservoir", "cracked-furnace",
  ]);
  assert.deepEqual([...usedByEnvironment.get("brass")].sort(), [
    "brokers-meter", "grinder-hall", "meter-chamber",
  ]);
  assert.deepEqual([...usedByEnvironment.get("smoke")].sort(), [
    "filter-chapel", "steam-chamber", "vapor-crypt",
  ]);
  assert.deepEqual([...usedByEnvironment.get("pressure")].sort(), [
    "final-gauge", "pressure-works", "redline-contract",
  ]);
  assert.deepEqual([...usedByEnvironment.get("heart")], ["roaster-heart"]);
});

test("the authored Rootfall route uses every organic district and safe-room plate", () => {
  const tour = getTourDefinition("rootfall-jungle");
  const rootfallEnvironments = ["canopy", "mire", "mycelium", "briar", "rootdeep", "rootheart"];
  const usedByEnvironment = new Map(rootfallEnvironments.map((environment) => [environment, new Set()]));

  tour.rooms.forEach((room, index) => {
    const art = getRoomArt(room.environment, {
      roomId: room.id,
      roomNumber: index + 1,
      artVariant: room.artVariant,
    });
    assert.ok(art, `Missing art for Rootfall room ${index + 1}`);
    usedByEnvironment.get(room.environment).add(art.id);
  });

  for (const environment of ["canopy", "mire", "mycelium", "briar", "rootdeep"]) {
    const expected = [
      ...ROOM_ART_CATALOG[environment].variants,
      ...(ROOM_ART_CATALOG[environment].specials ?? []),
    ].map((art) => art.id).sort();
    assert.deepEqual(
      [...usedByEnvironment.get(environment)].sort(),
      expected,
      `Rootfall route must exercise both base variants and every safe plate for ${environment}`,
    );
  }
  assert.deepEqual([...usedByEnvironment.get("rootheart")], ["root-throne"]);
});

test("room art catalog rejects missing, duplicate, or processed backdrops", () => {
  const invalid = {
    ...ROOM_ART_CATALOG,
    ash: undefined,
    ember: {
      variants: [{ ...ROOM_ART_CATALOG.ember.variants[0], backdrop: "light" }],
    },
    heart: {
      variants: [{
        ...ROOM_ART_CATALOG.heart.variants[0],
        sprite: ROOM_ART_CATALOG.pressure.variants[0].sprite,
      }],
    },
  };
  const errors = validateRoomArtCatalog(invalid);
  assert.equal(errors.some((error) => error.includes("Missing room art for ash")), true);
  assert.equal(errors.some((error) => error.includes("ember must preserve")), true);
  assert.equal(errors.some((error) => error.includes("Duplicate room sprite path for heart")), true);
});

test("pending room art release avoids a duplicate image decode on reacquire", async () => {
  const previousImage = globalThis.Image;
  const images = [];
  let requests = 0;
  class DeferredImage {
    constructor() {
      this.listeners = new Map();
      images.push(this);
      requests += 1;
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    set src(_value) {}

    resolve() {
      this.listeners.get("load")?.();
    }
  }
  globalThis.Image = DeferredImage;
  const art = getRoomArt("ash", { roomNumber: 1 });
  const initialSize = getRoomArtCacheEntryCount();
  try {
    const first = loadRoomArt("ash", { roomNumber: 1 });
    assert.equal(releaseRoomArt(art.sprite), true);
    const second = loadRoomArt("ash", { roomNumber: 1 });
    assert.equal(first, second);
    assert.equal(requests, 1);
    images[0].resolve();
    await Promise.all([first, second]);
    assert.equal(getRoomArtCacheEntryCount(), initialSize + 1);
    releaseRoomArt(art.sprite);
    assert.equal(getRoomArtCacheEntryCount(), initialSize);
  } finally {
    releaseRoomArt(art.sprite);
    globalThis.Image = previousImage;
  }
});
