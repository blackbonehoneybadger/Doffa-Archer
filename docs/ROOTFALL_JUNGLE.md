# Rootfall Jungle — Tour 02

## Runtime status

Milestone `0.16.0` adds `rootfall-jungle` as a complete second playable tour. It is selected from the tour overlay, stored as `selectedTourId`, and keeps its best-room and boss-win records separate from the Hollow Roastery. Milestone `0.16.1` adds the second complete architecture for every standard Rootfall district, bringing the tour to fifteen room plates without changing encounter logic. Milestone `0.16.2` completes secondary windup/release, hit, and delayed-defeat coverage for all four Rootfall elite guardians.

| Field | Value |
| --- | --- |
| Tour ID | `rootfall-jungle` |
| Code | `TOUR 02` |
| Name | `THE ROOTFALL JUNGLE` |
| District | `THE DROWNED WILD` |
| Theme | `organic-rootfall-jungle` |
| Enemy family | `rootfall_jungle` |
| Route | 50 rooms, four elites, one final boss |

Rootfall does not reuse Hollow Roastery environments, enemies, elite guardians, boss behavior, hazard kinds, room IDs, room layouts, theme, or family. The shared systems are limited to the fixed top-down camera, move/stop/attack loop, room transitions, rewards, progression, and validated content schema.

## Route

| Rooms | Environment | District | Standard enemy pool | Checkpoint |
| --- | --- | --- | --- | --- |
| 1–10 | `canopy` | Verdant Threshold | Razor Mantis, Seed Spitter | Room 10: Briar Jaguar |
| 11–20 | `mire` | Drowned Fen | Seed Spitter, Root Stalker, Razor Mantis | Room 15: Clearwater Hollow; room 20: Mire Bellower |
| 21–30 | `mycelium` | Mycelial Basilica | Spore Moth, Seed Spitter, Root Stalker | Room 25: Symbiotic Shrine; room 30: Orchid Maw |
| 31–40 | `briar` | Thorn Reliquary | Root Stalker, Razor Mantis, Spore Moth, Seed Spitter | Room 35: Moondew Sanctuary; room 40: Strangler Ape |
| 41–49 | `rootdeep` | Rootfall Depths | Razor Mantis, Root Stalker, Spore Moth, Seed Spitter | Room 45: Bloodroot Bargain; room 49: three-wave gauntlet |
| 50 | `rootheart` | Root Throne | — | Kaprizard — The Root Tyrant |

Room 1 grants the starter ability. Rooms `4, 8, 13, 18, 23, 28, 33, 38, 43, 47` contain two waves; room 49 contains three. Clearwater Hollow and Moondew Sanctuary restore 30% maximum health. Symbiotic Shrine and Bloodroot Bargain open a three-card Rootfall Covenant choice. All four safe rooms contain no enemies, hazards, obstacles, or destructible props.

## Standard enemies

| ID | HP | Speed | Radius | Contact | XP | Combat pattern |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `razor_mantis` | 62 | 118 | 24 | 12 | 10 | A 0.42-second aimed pounce, a short 620 px/s dash, then two perpendicular leaf bolts |
| `seed_spitter` | 72 | 62 | 27 | 9 | 13 | Holds 310–440 px range and alternates a fast single seed with a telegraphed three-seed fan |
| `root_stalker` | 104 | 84 | 30 | 15 | 17 | Burrows, reappears 135 px behind the hero's facing, then releases a six-way root burst |
| `spore_moth` | 82 | 88 | 28 | 10 | Orbits at approximately 290 px and fires a five-shot alternating-speed spore weave |

Standard enemy health scales by room through the shared encounter system. Each enemy owns a transparent 512×512 static fallback and a transparent 1152×2016 idle/move/attack atlas covering `E/SE/S/SW/W/NW/N/NE`.

## Elite guardians

| Room | ID | Base HP | Telegraph | Alternating patterns |
| ---: | --- | ---: | ---: | --- |
| 10 | `briar_jaguar` | 780 | 0.62 s | Two-part rake chain ending in a six-way burst; twelve-point thorn rosette with three readable gaps |
| 20 | `mire_bellower` | 940 | 0.72 s | Tight three-shot tongue lane; two offset ten-projectile bog rings at different speeds |
| 30 | `orchid_maw` | 1,120 | 0.60 s | Split petal clamp leaving a central dodge corridor; sixteen-projectile alternating-speed pollen spiral |
| 40 | `strangler_ape` | 1,340 | 0.68 s | Vine charge ending in an eight-way burst; twelve-way rootquake plus an aimed three-shot fan |

Elite health receives the shared room-number scaling. Their base atlases cover idle, move, and signature attack in all eight directions. Each guardian now also owns two transparent 1152×1344 runtime atlases: a secondary-pattern sheet with windup and release states, and a reaction sheet with hit and defeat states. The new source poses were authored through Higgsfield for the four cardinal views `N/E/S/W`; the runtime still exposes `E/SE/S/SW/W/NW/N/NE`, but each diagonal sector intentionally selects its nearest authored cardinal instead of claiming a separately authored diagonal or rotating a finished bitmap.

A lethal hit makes the elite untargetable, disables contact damage, and holds the directional defeat pose for 0.82 seconds before removal. Score, XP drops, and recovery rewards are issued once at the lethal hit; unlike a main-boss victory, an elite defeat does not cancel every hostile projectile in the room.

- [Rootfall elite complete animation board](previews/rootfall-elite-complete-animation-v1.jpg)

## Main boss

`rootfall_tyrant` is a giant black-sap root titan carrying Kaprizard's recognizable serious, closed-mouth face. Its static identity master is `/assets/enemies/rootfall-tyrant-kaprizard-v1.png`; its base, special, and reaction atlases are `/assets/enemies/rootfall-tyrant-motion-v1.png`, `/assets/enemies/rootfall-tyrant-special-v1.png`, and `/assets/enemies/rootfall-tyrant-reactions-v1.png`.

The Root Tyrant has 4,400 HP, speed 44, radius 80, contact damage 27, 500 run XP, and a render height of 340. Before half health it alternates five aimed root lanes with a sixteen-point thorn crown containing a readable gap. At half health it performs one Black Sap Awakening and releases two offset twelve-projectile rings. Its second phase increases the lane and crown density and adds a two-part Tyrant Rush ending in a ten-way burst. Defeat uses the same delayed, single-reward, hostile-projectile-cancellation rule as every main boss.

## Rooms and hazards

Rootfall ships fifteen 720×1280 JPEG plates: two complete architectures for each of the five standard districts, four dedicated safe-room plates, and the unique Root Throne. Standard combat rooms alternate deterministically between their district's v1 and v2 architecture by room number while continuing to select one of three collision layouts independently.

| Environment | Odd rooms / v1 | Even rooms / v2 |
| --- | --- | --- |
| `canopy` | Rootwake Landing — `rootfall-jungle-canopy-v1.jpg` | Sunken Canopy Cloister — `rootfall-jungle-canopy-v2.jpg` |
| `mire` | Drowned Fen — `rootfall-jungle-mire-v1.jpg` | Drowned Causeway — `rootfall-jungle-mire-v2.jpg` |
| `mycelium` | Mycelial Basilica — `rootfall-jungle-mycelium-v1.jpg` | Spore Nave — `rootfall-jungle-mycelium-v2.jpg` |
| `briar` | Thorn Reliquary — `rootfall-jungle-briar-v1.jpg` | Crimson Thorn Court — `rootfall-jungle-briar-v2.jpg` |
| `rootdeep` | Rootfall Depths — `rootfall-jungle-rootdeep-v1.jpg` | Black Sap Vault — `rootfall-jungle-rootdeep-v2.jpg` |
| `rootheart` | Root Throne — `rootfall-jungle-rootheart-v1.jpg` | Unique finale; no recycled variant |

| Environment | Hazard | Interval | Active | Damage | Geometry language |
| --- | --- | ---: | ---: | ---: | --- |
| `canopy` | Thorn bloom | 3.40 s | 0.90 s | 10 | Root pillars, fallen roots, open grove |
| `mire` | Venom pool | 3.80 s | 1.35 s | 10 | Causeways, dry islands, offset root barriers |
| `mycelium` | Spore cloud | 4.10 s | 1.45 s | 11 | Fungal pillars, side shelves, diagonal shelves |
| `briar` | Thorn eruption | 3.10 s | 0.82 s | 12 | Vertical hedges, split lanes, corner hooks |
| `rootdeep` | Grasping roots | 2.90 s | 0.90 s | 13 | Root ribs, staggered walls, side coils |
| `rootheart` | None | — | — | — | Open boss arena for attack readability |

Ambient leaf drift, mire bubbles, mycelial glow, briar motion, root light, and Root Throne pulse are deterministic visual layers. They do not consume combat RNG or change collision, damage, drops, or attacks.

Each standard district also owns one Higgsfield-authored destructible family: Thornseed Pod (`canopy`), Mire Resin Urn (`mire`), Spore Bulb (`mycelium`), Heartwood Knot (`briar`), and Root-Sap Cocoon (`rootdeep`). Regular combat rooms place one or two of these props without overlapping authored obstacles or hazards. Safe rooms, elite rooms, and the Root Throne remain prop-free for readability. Rootfall never reuses a Hollow Roastery crate, canister, case, urn, or tank.

## Acceptance locks

- All combat art uses the fixed orthographic top-down camera and eight-direction facing.
- Standard enemies and elites remain organic and biome-specific; no Roastery machine may be recolored into this family.
- Only the main boss uses Kaprizard's face and intentionally giant scale.
- Kaprizard's expression stays stern and closed-mouth in idle, attack, phase, hit, and defeat states.
- The five district palettes, two architectures per standard district, four hazard kinds, three-layout cadence, and Root Throne remain distinct from Tour 01.
- Tour selection, progress, receipts, and local results always preserve the exact tour ID.
- All beans, XP, equipment, drops, and receipts remain local prototype state with no token value.
