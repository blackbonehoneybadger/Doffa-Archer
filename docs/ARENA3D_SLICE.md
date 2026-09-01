# DOFA ARENA — true 3D Rootfall slice

Parallel Babylon.js + glTF/PBR path. The Canvas/PWA prototype on `main` is unchanged.

## Entry

- 2D prototype: `/` (`npm run serve`)
- 3D slice: `/arena3d/` (`npm install && npm run dev:3d`)
- Production-style static serve after `npm run build:3d`, then `npm run serve`

## Why Babylon.js

- Web-first, tree-shakeable `@babylonjs/core`, first-class glTF/PBR, bones/nodes, glow, shadows, no native engine.
- PlayCanvas/Unity spikes and draft PR #3 (Three.js background plane + billboards) are not this path. This slice never maps the concept JPEG onto a plane.

## Identity lock

Honey Badger is bald, long black beard, tattooed torso, honey-badger chest mark, exact `STRONG ROOTS` on the upper back (not mirrored), black steel katana + belt shurikens, dark pants, sneakers, gameplay height 1.70 m. The head is an explicit **placeholder** until a true-to-owner face scan exists. Face, extra tattoo slogans, and a new weaponsheet were not invented.

Public names in this shell: **DOFA ARENA**, **KAPRIZORD**, **dofa.coffee**. `$DOFA` is named only as later. TAP BEAN is not in this path. Loot is local and non-claimable.

## Honest status

| Item | Status | Notes |
| --- | --- | --- |
| Parallel 3D entry, 2D prototype preserved | ready | Home link + `/arena3d/` |
| Portrait HUD matching the target frame | ready | Pause, DOFA ARENA, TOUR 02 · ROOTFALL JUNGLE, 08/50, Honey Badger / KATANA / HP, joystick, attack |
| Unique Rootfall room as 3D geometry | partial | Stone floor, roots, foliage, torches, moss, glow veins, cover collision. Not Mobile Legends mesh density / authored photogrammetry. |
| PBR materials | partial | Local albedo + metallic-roughness, emissive veins/torches. No authored texture set or IBL studio HDR. |
| Honey Badger as 3D rigged character | partial | Transform-node rig, katana swing, STRONG ROOTS decal, chest mark, placeholder head. Not a production skinned glTF from a face scan. |
| Unique enemy meshes | partial | Razor Mantis, Seed Spitter, Root Stalker as distinct topology, not palette-swaps. Greybox-plus, not hero-quality organic sculpts. |
| Projectiles, cover, telegraphs | ready | Seeds are meshes; telegraphs appear before damage; cover blocks movement. |
| Touch move + explicit attack | ready | Stop-to-auto-attack still TBD, as requested. |
| Deterministic / seeded room 08 | ready | Seed `rootfall-08-v1`; replay tests included. |
| RU/EN shell | ready | Slice HUD/pause only. |
| PWA-capable 3D page | partial | Manifest, portrait standalone, reuses install icons. Not added to the 2D service-worker precache (avoids replacing `/arena3d/` with the 2D shell). |
| Tests | ready | New slice tests plus existing 2D suite. |
| In-engine captures | ready | `docs/previews/arena3d-rootfall-08-combat.png` and `...-orbit.png`. Headless SwiftShader FPS in those stills is not a phone measurement. |
| Mobile Legends visual parity | not started | Quality bar is the attached concept. This spike is real 3D, not that bar. |
| Token / wallet / mint / claim | not started | Intentionally out of scope. |
| 250-room 3D game | not started | One room vertical slice. |
| Production Honey Badger face | blocked | Owner face scan not in repo. |

## Performance budget

Aim: mid-range mobile web, 30+ FPS in this single room. Measure with the on-screen FPS line and `npm run capture:3d` (Chrome/SwiftShader in CI-like environments is a lower bound, not a phone).
