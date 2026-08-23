import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { ENEMY_CATALOG } from "../src/game/content.js";
import { HEROES } from "../src/game/heroes.js";

const root = process.cwd();

function localReferences(content) {
  return [...content.matchAll(/(?:href|src)="(\/[^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path !== "/");
}

test("HTML shell references only files that exist", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const references = localReferences(html);
  assert.ok(references.length >= 4);
  for (const reference of references) {
    assert.equal(existsSync(join(root, reference)), true, `Missing ${reference}`);
  }
});

test("manifest and Vercel configuration are valid JSON", () => {
  const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
  const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  assert.equal(manifest.name, "DOFFA Heroes");
  assert.equal(manifest.start_url, "/");
  assert.equal(vercel.headers[0].headers.some((header) => header.key === "Content-Security-Policy"), true);
});

test("browser shell has no external runtime scripts or styles", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.equal(/<(?:script|link)[^>]+(?:src|href)="https?:\/\//i.test(html), false);
});

test("offline shell includes the data-driven content and progression catalogs", () => {
  const worker = readFileSync(join(root, "service-worker.js"), "utf8");
  assert.equal(worker.includes('"/src/core/active-run-checkpoint.js"'), true);
  assert.equal(worker.includes('"/src/game/content.js"'), true);
  assert.equal(worker.includes('"/src/game/animation-page-cache.js"'), true);
  assert.equal(worker.includes('"/src/game/animation-player.js"'), true);
  assert.equal(worker.includes('"/src/game/asset-window.js"'), true);
  assert.equal(worker.includes('"/src/game/destructibles.js"'), true);
  assert.equal(worker.includes('"/src/game/arena-geometry.js"'), true);
  assert.equal(worker.includes('"/src/game/heroes.js"'), true);
  assert.equal(worker.includes('"/src/game/player-animation.js"'), true);
  assert.equal(worker.includes('"/src/game/equipment.js"'), true);
  assert.equal(worker.includes('"/src/game/progression.js"'), true);
  assert.equal(worker.includes('"/src/game/run-progression.js"'), true);
  assert.equal(worker.includes('"/src/game/hero-sprites.js"'), true);
  assert.equal(worker.includes('"/src/game/enemy-sprites.js"'), true);
  assert.equal(worker.includes('"/src/game/enemy-animation.js"'), true);
  assert.equal(worker.includes('"/src/game/sprite-loader.js"'), true);
  assert.equal(worker.includes('"/src/game/room-art.js"'), true);
  assert.equal(worker.includes('"/src/game/room-effects.js"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-ash-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-ash-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-ember-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-ember-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-brass-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-brass-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-smoke-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-smoke-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-pressure-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-pressure-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-heart-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-cooling-reservoir-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-brokers-meter-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-filter-chapel-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/hollow-roastery-redline-contract-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/props/ash-collection-crate-v1.png"'), true);
  assert.equal(worker.includes('"/assets/props/ember-canister-v1.png"'), true);
  assert.equal(worker.includes('"/assets/props/brass-grinder-case-v1.png"'), true);
  assert.equal(worker.includes('"/assets/props/smoke-filter-urn-v1.png"'), true);
  assert.equal(worker.includes('"/assets/props/pressure-tank-v1.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/honey-badger-lean-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/honey-badger-directions-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/honey-badger-motion-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/honey-badger-full-motion-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/honey-badger-shuriken-attack-v1.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/honey-badger-reactions-v2.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/boy-full-motion-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/boy-reactions-v2.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/boy-identity-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/boy-directions-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/boy-motion-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/mr-kroo-full-motion-v4.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/mr-kroo-reactions-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/mr-kroo-bow-v4.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/mr-kroo-directions-v4.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/mr-kroo-motion-v4.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/hadida-full-motion-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/hadida-reactions-v2.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/hadida-papakha-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/hadida-directions-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/hadida-motion-v3.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/pata-full-motion-v2.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/pata-reactions-v1.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/pata.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/pata-directions.png"'), true);
  assert.equal(worker.includes('"/assets/heroes/pata-motion.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/ash-hound.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/ash-hound-motion-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/ember-oracle.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/ember-oracle-motion-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/brass-colossus.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/brass-colossus-motion-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/smoke-revenant.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/smoke-revenant-motion-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/kiln-warden.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/kiln-warden-motion-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/pressure-widow.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/pressure-widow-motion-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/cinder-bishop.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/cinder-bishop-motion-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/grinder-saint.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/grinder-saint-motion-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/hollow-roaster-kaprizard-v3.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/hollow-roaster-motion-v2.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/hollow-roaster-special-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/hollow-roaster-reactions-v1.png"'), true);
  assert.equal(worker.includes("doffa-heroes-v0.16.6"), true);
  assert.equal(worker.includes("const TOUR_ASSETS = ["), true);
  assert.equal(worker.includes('"/assets/rooms/rootfall-jungle-canopy-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/rootfall-jungle-mire-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/rootfall-jungle-mycelium-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/rootfall-jungle-briar-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/rootfall-jungle-rootdeep-v2.jpg"'), true);
  assert.equal(worker.includes('"/assets/rooms/rootfall-jungle-rootheart-v1.jpg"'), true);
  assert.equal(worker.includes('"/assets/enemies/rootfall-tyrant-kaprizard-v1.png"'), true);
  assert.equal(worker.includes('"/assets/enemies/rootfall-tyrant-special-v1.png"'), true);
});

test("Rootfall elite special and reaction atlases are cached with the tour", () => {
  const worker = readFileSync(join(root, "service-worker.js"), "utf8");
  const tourAssets = worker.match(/const TOUR_ASSETS = \[([\s\S]*?)\];/)?.[1] ?? "";
  const eliteAssetStems = [
    "briar-jaguar",
    "mire-bellower",
    "orchid-maw",
    "strangler-ape",
  ];

  for (const assetStem of eliteAssetStems) {
    for (const atlasKind of ["special", "reactions"]) {
      const asset = `/assets/enemies/${assetStem}-${atlasKind}-v1.png`;
      assert.equal(tourAssets.includes(`"${asset}"`), true, `${asset} must be a TOUR_ASSET`);
    }
  }
});

test("every configured animation page is included in the offline whitelist", () => {
  const worker = readFileSync(join(root, "service-worker.js"), "utf8");
  const pageSprites = [];
  for (const hero of HEROES) {
    for (const animationKey of ["fullMotionAnimation", "reactionAnimation"]) {
      for (const page of Object.values(hero.art?.[animationKey]?.pages ?? {})) {
        pageSprites.push(page.sprite);
      }
    }
  }
  for (const enemy of Object.values(ENEMY_CATALOG)) {
    for (const animationKey of ["motionAnimation", "specialAnimation", "reactionAnimation"]) {
      for (const page of Object.values(enemy.art?.[animationKey]?.pages ?? {})) {
        pageSprites.push(page.sprite);
      }
    }
  }

  for (const sprite of pageSprites) {
    assert.equal(worker.includes(`"${sprite}"`), true, `${sprite} must be cached offline`);
    const png = readFileSync(join(root, sprite));
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG", sprite);
  }

  const animationOwners = [
    ...HEROES.map((hero) => hero.art),
    ...Object.values(ENEMY_CATALOG).map((enemy) => enemy.art),
  ];
  for (const art of animationOwners) {
    for (const animationKey of [
      "fullMotionAnimation",
      "motionAnimation",
      "specialAnimation",
      "reactionAnimation",
    ]) {
      for (const page of Object.values(art?.[animationKey]?.pages ?? {})) {
        const png = readFileSync(join(root, page.sprite));
        assert.equal(png.readUInt32BE(16), page.columns * 288, page.sprite);
        assert.equal(png.readUInt32BE(20), page.rows * 336, page.sprite);
        assert.equal(png[25], 6, `${page.sprite} must be RGBA`);
      }
    }
  }
});

test("every offline core and tour asset exists and all build versions agree", () => {
  const worker = readFileSync(join(root, "service-worker.js"), "utf8");
  const packageDefinition = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const html = readFileSync(join(root, "index.html"), "utf8");
  const config = readFileSync(join(root, "src/config/game-config.js"), "utf8");
  const assetBlocks = ["CORE_ASSETS", "TOUR_ASSETS"].map((name) =>
    worker.match(new RegExp("const " + name + " = \\[([\\s\\S]*?)\\];"))?.[1] ?? "");
  const assets = assetBlocks.flatMap((assetBlock) =>
    [...assetBlock.matchAll(/"(\/[^\"]+)"/g)].map((match) => match[1]));

  assert.ok(assets.length > 140);
  assert.equal(new Set(assets).size, assets.length, "Offline assets must not be duplicated");
  for (const asset of assets) {
    const localPath = asset === "/" ? "index.html" : asset.slice(1);
    assert.equal(existsSync(join(root, localPath)), true, `Missing offline asset ${asset}`);
  }

  assert.equal(html.includes(`PROTOTYPE ${packageDefinition.version}`), true);
  assert.equal(config.includes(`GAME_VERSION = "${packageDefinition.version}"`), true);
  assert.equal(worker.includes(`doffa-heroes-v${packageDefinition.version}`), true);
});

test("all playable heroes use one combat render height", () => {
  const game = readFileSync(join(root, "src/game/game.js"), "utf8");
  assert.equal(game.includes("const targetHeight = 170;"), true);
  assert.equal(game.includes('this.hero.id === "honey-badger"'), false);
});

test("every required UI element exists in the HTML shell", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const app = readFileSync(join(root, "src/ui/app.js"), "utf8");
  const requiredIds = [...app.matchAll(/requiredElement\("([^"]+)"\)/g)].map((match) => match[1]);

  assert.ok(requiredIds.length > 20);
  for (const id of requiredIds) {
    assert.equal(html.includes(`id="${id}"`), true, `Missing #${id}`);
  }
});
