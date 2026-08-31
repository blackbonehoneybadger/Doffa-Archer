# Room Assets

## Hollow Roastery — Runtime v3

The first tour has fifteen opaque portrait room plates loaded by exact variant through `src/game/room-art.js`. Five standard districts each alternate between two complete architectures, four route checkpoints have dedicated safe-room compositions, and the finale keeps one unique boss arena.

| Environment | Odd rooms / v1 | Even rooms / v2 |
| --- | --- | --- |
| `ash` | Ash Storage — `hollow-roastery-ash-v1.jpg` | Soot Conveyor — `hollow-roastery-ash-v2.jpg` |
| `ember` | Cracked Furnace — `hollow-roastery-ember-v1.jpg` | Boiler Gallery — `hollow-roastery-ember-v2.jpg` |
| `brass` | Grinder Hall — `hollow-roastery-brass-v1.jpg` | Meter Chamber — `hollow-roastery-brass-v2.jpg` |
| `smoke` | Steam Chamber — `hollow-roastery-smoke-v1.jpg` | Vapor Crypt — `hollow-roastery-smoke-v2.jpg` |
| `pressure` | Pressure Works — `hollow-roastery-pressure-v1.jpg` | Final Gauge — `hollow-roastery-pressure-v2.jpg` |
| `heart` | Roaster Heart — `hollow-roastery-heart-v1.jpg` | Unique finale; no recycled variant |

Dedicated safe-room plates override normal odd/even selection at fixed route checkpoints:

| Room | Type | Plate | Effect |
| --- | --- | --- | --- |
| 15 | Rest | Cooling Reservoir | Restore 30% maximum health |
| 25 | Event | Broker's Meter | Choose one of three field-contract abilities |
| 35 | Rest | Filter Chapel | Restore 30% maximum health |
| 45 | Event | Redline Contract | Choose one of three field-contract abilities |

All assets live under `assets/rooms/`. Every file is a 720×1280 progressive JPEG authored for the fixed portrait viewport. Large decorative machinery stays at the perimeter and the center remains open for characters, projectiles, telegraphs, and live collision objects.

## Rootfall Jungle — Runtime v2 / 0.16.1

Tour 02 adds fifteen independent 720×1280 JPEG plates. Five standard districts each alternate between two complete architectures, four route checkpoints have dedicated safe-room compositions, and the finale keeps one unique boss arena. Rootfall does not reuse a Hollow Roastery background, environment key, special-room composition, or boss arena.

| Environment | Odd rooms / v1 | Even rooms / v2 | Gameplay identity |
| --- | --- | --- | --- |
| `canopy` | Rootwake Landing — `rootfall-jungle-canopy-v1.jpg` | Sunken Canopy Cloister — `rootfall-jungle-canopy-v2.jpg` | Wet canopy, hanging roots, ruined stone, thorn blooms |
| `mire` | Drowned Fen — `rootfall-jungle-mire-v1.jpg` | Drowned Causeway — `rootfall-jungle-mire-v2.jpg` | Black water, mud, drowned masonry, venom pools |
| `mycelium` | Mycelial Basilica — `rootfall-jungle-mycelium-v1.jpg` | Spore Nave — `rootfall-jungle-mycelium-v2.jpg` | Fungal columns, cold spore light, spore clouds |
| `briar` | Thorn Reliquary — `rootfall-jungle-briar-v1.jpg` | Crimson Thorn Court — `rootfall-jungle-briar-v2.jpg` | Hooked thorns, blood vines, constrained lanes |
| `rootdeep` | Rootfall Depths — `rootfall-jungle-rootdeep-v1.jpg` | Black Sap Vault — `rootfall-jungle-rootdeep-v2.jpg` | Root ribs, black sap, compressed earth, amber corruption |
| `rootheart` | Root Throne — `rootfall-jungle-rootheart-v1.jpg` | Unique finale; no recycled variant | Open arena for the Root Tyrant finale |

Rootfall's fixed safe-room overrides are:

| Room | Type | Plate | Effect |
| --- | --- | --- | --- |
| 15 | Rest | `rootfall-jungle-clearwater-hollow-v1.jpg` | Restore 30% maximum health |
| 25 | Event | `rootfall-jungle-symbiotic-shrine-v1.jpg` | Choose one of three Rootfall Covenant abilities |
| 35 | Rest | `rootfall-jungle-moondew-sanctuary-v1.jpg` | Restore 30% maximum health |
| 45 | Event | `rootfall-jungle-bloodroot-bargain-v1.jpg` | Choose one of three Rootfall Covenant abilities |

Each of the five standard environments alternates its v1/v2 architecture independently from three deterministic collision layouts selected by `roomNumber % 3`. Canopy rotates root pillars, fallen roots, and an open grove; Mire rotates causeways, dry islands, and offset barriers; Mycelium rotates fungal pillars and shelf arrangements; Briar rotates vertical hedges, split lanes, and corner hooks; Rootdeep rotates ribs, staggered walls, and side coils. Background decoration remains non-colliding.

Rootfall hazards are also independent: thorn blooms use a 3.40-second cycle in Canopy, venom pools a 3.80-second cycle in Mire, spore clouds a 4.10-second cycle in Mycelium, faster thorn eruptions a 3.10-second cycle in Briar, and grasping roots a 2.90-second cycle in Rootdeep. Root Throne has no persistent room hazard so the boss patterns remain readable. Exact damage and active windows are recorded in [Rootfall Jungle — Tour 02](ROOTFALL_JUNGLE.md).

Rootfall also has five independent Higgsfield-generated destructible sprites, all normalized to transparent 384×384 RGBA runtime files:

| Environment | Prop | Runtime sprite |
| --- | --- | --- |
| `canopy` | Thornseed Pod | `canopy-thornseed-pod-v1.png` |
| `mire` | Mire Resin Urn | `mire-resin-urn-v1.png` |
| `mycelium` | Spore Bulb | `mycelium-spore-bulb-v1.png` |
| `briar` | Heartwood Knot | `briar-heartwood-knot-v1.png` |
| `rootdeep` | Root-Sap Cocoon | `rootdeep-sap-cocoon-v1.png` |

Only regular combat rooms place these objects. Deterministic placement rejects overlaps with room walls, active hazards, and other props; safe rooms, guardian arenas, and the final boss arena remain clear.

## Deterministic selection and loading

`getRoomArtVariantIndex()` alternates both tours' standard plates by authored room number. It uses the stable room ID only as a fallback when no number exists. Rootfall's visual architecture alternation remains independent from its three-layout collision cadence. Roaster Heart and Root Throne each resolve to their sole finale plate.

The selection consumes no combat RNG and cannot change enemy composition, attacks, drops, damage, obstacles, hazards, or rewards. Runtime image promises are cached by exact sprite path, so entering one room decodes only its selected background rather than both district variants.

## Runtime layering

1. The selected illustrated plate fills the complete Canvas.
2. A restrained readability shade protects live silhouettes and projectiles.
3. Deterministic ambient animation renders from the room identity.
4. Hazards, collision obstacles, and destructible props render from the room definition.
5. The interactive exit door, encounter number/name, countdown, enemies, heroes, VFX, and HUD remain live layers.
6. If an image cannot load, the procedural palette/grid/fixture renderer supplies a safe fallback.

Background pixels never define collision or damage. This keeps visual iteration independent from gameplay rules and prevents a decorative pipe, furnace, or floor seam from silently changing a room.

## Ambient animation — 0.13.0 / 0.16.1

`src/game/room-effects.js` assigns every authored room a deterministic visual seed derived only from its ID and room number. That seed controls one of four effect variants, active side, phase, intensity, particle paths, and mechanism direction without consuming combat RNG.

| Environment | Live motion |
| --- | --- |
| `ash` | falling ash and edge-light drift |
| `ember` | furnace breathing, wall heat, and rising sparks |
| `brass` | rotating perimeter mechanisms and metallic dust |
| `smoke` | slow side-wall steam plumes and smoke motes |
| `pressure` | short pressure jets, moving gauge needles, and condensation |
| `heart` | reactor breathing, ember lift, and rotating segmented floor rings |
| `canopy` | falling leaf motes and drifting canopy highlights |
| `mire` | edge bubbles, damp motes, and low green pulse |
| `mycelium` | center-rising spores and a breathing turquoise fungal glow |
| `briar` | falling red motes and animated edge thorns |
| `rootdeep` | rising amber particles, root glow, and slow concentric motion |
| `rootheart` | concentrated throne pulse, rising motes, and rotating root rings |

The ambient layer is drawn behind collision obstacles, damaging hazards, telegraphs, characters, and projectiles. It is visual-only and stops when the fixed simulation clock is paused. `npm run preview:rooms` rebuilds the compact animation review GIF from the production seed and mote functions.

## Production provenance

The source environment bibles are recorded in `docs/ART_DIRECTION.md`. Hollow Roastery and Rootfall v1 plates were created with the available built-in reference-image pipeline using the approved Higgsfield camera, composition, material, and readability specification. The five Rootfall v2 architectures were generated directly through Higgsfield Soul Location at 9:16 and normalized to progressive 720×1280 JPEG runtime plates. The Rootfall destructible family was generated directly through Higgsfield/Recraft and normalized into transparent runtime sprites.

The locked generation mode was `stylized-concept`. Every prompt required a centered 9:16 arena, approximately 58-degree orthographic top-down camera, top exit, bottom entry, open central playfield, environment-specific perimeter construction, and no characters, UI, hazards, or loose collision props. Hollow Roastery uses dark coffee-industrial materials; Rootfall Jungle replaces those materials with wet stone, roots, black sap, fungi, thorns, and organic light.

- The six-plate environment board is `docs/previews/hollow-roastery-runtime-rooms-v1.jpg`.
- The ten-plate standard-district comparison is `docs/previews/hollow-roastery-room-variants-v2.jpg`.
- The Rootfall ten-plate standard-district comparison is `docs/previews/rootfall-jungle-room-variants-v1.jpg`.
- The base prompt set is `docs/prompts/hollow-roastery-runtime-rooms-v1.md`.
- The architecture-variation prompt set is `docs/prompts/hollow-roastery-room-variants-v2.md`.

## Validation

`tests/room-art.test.js` verifies all twelve environment keys, both tours' two-variant standard-district rule, both unique finale plates, deterministic special-room selection, unique IDs and paths, real JPEG encoding, and exact 720×1280 dimensions for all thirty plates. `tests/destructibles.test.js` validates all ten tour-specific prop definitions, deterministic placement, collision, destruction, and single-payment reward rule. `tests/static-shell.test.js` and `tests/pwa-safety.test.js` verify the lightweight offline shell plus the strict on-demand allowlist for room plates, props, and combat atlases. `npm run preview:room-variants` rebuilds the Hollow Roastery comparison board directly from production assets.
