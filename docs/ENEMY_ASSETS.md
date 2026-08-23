# Enemy Asset Register

## Hollow Roastery — Prototype 0.11.0

| Enemy | Combat identity | Runtime asset | Backdrop |
| --- | --- | --- | --- |
| Ash Hound | Fast contact hunter | `/assets/enemies/ash-hound-motion-v1.png` | 24-cell RGBA atlas; static fallback retained |
| Ember Oracle | Aimed ranged caster | `/assets/enemies/ember-oracle-motion-v1.png` | 24-cell RGBA atlas; static fallback retained |
| Brass Colossus | Armored telegraphed charger | `/assets/enemies/brass-colossus-motion-v1.png` | 24-cell RGBA atlas; static fallback retained |
| Smoke Revenant | Orbiting three-shot gunner | `/assets/enemies/smoke-revenant-motion-v1.png` | 24-cell RGBA atlas; static fallback retained |
| The Kiln Warden | Cleaver charge and furnace shockwave guardian | `/assets/enemies/kiln-warden-motion-v1.png` | 24-cell RGBA atlas; static fallback retained |
| The Pressure Widow | Steam-fan and radial pressure guardian | `/assets/enemies/pressure-widow-motion-v1.png` | 24-cell RGBA atlas; static fallback retained |
| The Cinder Bishop | Crossfire and alternating-speed spiral guardian | `/assets/enemies/cinder-bishop-motion-v1.png` | 24-cell RGBA atlas; static fallback retained |
| The Grinder Saint | Saw charge and blade-ring guardian | `/assets/enemies/grinder-saint-motion-v1.png` | 24-cell RGBA atlas; static fallback retained |
| The Hollow Roaster | Kaprizard-faced alternating radial and aimed-lane boss | `/assets/enemies/hollow-roaster-motion-v2.png`, `/assets/enemies/hollow-roaster-special-v1.png`, `/assets/enemies/hollow-roaster-reactions-v1.png` | 24-cell base plus two 16-cell RGBA atlases; refined static fallback retained |

The nine sprites were produced with the built-in reference-image workflow from original dark coffee-industrial specifications and owner-supplied likeness references. No third-party game art, levels, UI, or proprietary assets were used.

Every enemy has a procedural canvas fallback, and all nine animated enemies retain reviewed static sprites as a loading fallback. Base motion atlases are transparent 1152×2016 PNGs arranged as a deterministic 4×6 runtime grid. The Hollow Roaster's special and reaction atlases are transparent 1152×1344 PNGs in deterministic 4×4 grids. The four Hollow Roastery elite guardians still require their second attack-pattern, hit, phase-change, and death sheets.

## Rootfall Jungle — Runtime 0.16.2

| Enemy | Combat identity | Runtime asset | Coverage |
| --- | --- | --- | --- |
| Razor Mantis | Telegraphed pounce ending in perpendicular leaf bolts | `/assets/enemies/razor-mantis-motion-v1.png` | 24-cell RGBA atlas; 512×512 static fallback |
| Seed Spitter | Range-keeping single seed / three-seed fan alternation | `/assets/enemies/seed-spitter-motion-v1.png` | 24-cell RGBA atlas; 512×512 static fallback |
| Root Stalker | Burrow, behind-player emergence, and six-way root burst | `/assets/enemies/root-stalker-motion-v1.png` | 24-cell RGBA atlas; 512×512 static fallback |
| Spore Moth | Orbiting five-shot alternating-speed weave | `/assets/enemies/spore-moth-motion-v1.png` | 24-cell RGBA atlas; 512×512 static fallback |
| The Briar Jaguar | Two-part rake chain and gapped thorn rosette | `/assets/enemies/briar-jaguar-motion-v1.png`, `/assets/enemies/briar-jaguar-special-v1.png`, `/assets/enemies/briar-jaguar-reactions-v1.png` | 24-cell base plus two 16-cell RGBA atlases; static fallback |
| The Mire Bellower | Tight tongue lane and two offset bog rings | `/assets/enemies/mire-bellower-motion-v1.png`, `/assets/enemies/mire-bellower-special-v1.png`, `/assets/enemies/mire-bellower-reactions-v1.png` | 24-cell base plus two 16-cell RGBA atlases; static fallback |
| The Orchid Maw | Split petal clamp and alternating-speed pollen spiral | `/assets/enemies/orchid-maw-motion-v1.png`, `/assets/enemies/orchid-maw-special-v1.png`, `/assets/enemies/orchid-maw-reactions-v1.png` | 24-cell base plus two 16-cell RGBA atlases; static fallback |
| The Strangler Ape | Vine charge and radial-plus-aimed rootquake | `/assets/enemies/strangler-ape-motion-v1.png`, `/assets/enemies/strangler-ape-special-v1.png`, `/assets/enemies/strangler-ape-reactions-v1.png` | 24-cell base plus two 16-cell RGBA atlases; static fallback |
| Kaprizard — The Root Tyrant | Root lanes, thorn crown, phase rings, and enraged rush | `/assets/enemies/rootfall-tyrant-motion-v1.png`, `/assets/enemies/rootfall-tyrant-special-v1.png`, `/assets/enemies/rootfall-tyrant-reactions-v1.png` | 24-cell base plus two 16-cell RGBA atlases; identity-locked static fallback |

All nine Rootfall enemies belong only to `rootfall_jungle`; content validation rejects placement in another tour. They use the same fixed top-down camera and deterministic eight-direction selector as Tour 01, but their silhouettes, materials, movement, attacks, particles, and telegraphs are organic and independent. The four elite guardians now combine their base idle/move/signature-attack atlases with secondary windup/release and hit/defeat atlases. Defeat remains visible for 0.82 seconds, blocks targeting and contact damage, and cannot duplicate score or drops.

The earlier Rootfall static and base-motion art was produced through the available reference-image workflow against the approved Higgsfield camera, organic material bible, and locked Kaprizard identity; it is not represented as direct Higgsfield output. The 0.16.2 elite secondary and reaction source poses were authored through Higgsfield for `N/E/S/W`, then normalized into transparent 1152×1344 PNGs. Their 16-cell runtime atlases expose eight facing sectors by assigning each diagonal to its nearest authored cardinal pose; they do not pretend the diagonal source views were separately authored. Static fallbacks are transparent 512×512 PNGs, and base motion atlases are transparent 1152×2016 PNGs.

See [Rootfall Jungle — Tour 02](ROOTFALL_JUNGLE.md) for exact stats, room milestones, hazards, and attack cadence.

## Rootfall elite complete runtime — 0.16.2

Briar Jaguar's thorn rosette, Mire Bellower's bog rings, Orchid Maw's pollen spiral, and Strangler Ape's rootquake each select dedicated windup and release poses. Their primary rake-chain, tongue-lane, petal-clamp, and vine-charge patterns continue to use the base signature-attack rows. Hit reaction overrides either attack pose, while defeat has the highest visual priority and remains on screen during the delayed-removal window.

- [complete secondary/reaction atlas board](previews/rootfall-elite-complete-animation-v1.jpg)

## Hollow Roaster complete runtime — 0.11.0

The main boss now has seven live states across `E/SE/S/SW/W/NW/N/NE`: idle, movement, primary radial attack, secondary pressure-lanes attack, phase-two transition, hit reaction, and defeat. Below half health it pauses for one authored phase transition, emits a radial pressure surge once, then resumes its faster pattern cadence. A final blow keeps the boss alive only for a 1.15-second collapsed pose, disables targeting and contact damage, cancels hostile projectiles, grants rewards once, and only then removes the entity.

The two new source sheets were created through the available built-in reference-image pipeline using the approved Higgsfield production specification, the refined Hollow Roaster body master, the accepted motion atlas, and the private Kaprizard identity reference. They are not claimed as direct Higgsfield renders. The private reference remains outside the repository; only cleaned transparent derivatives ship.

- [complete seven-state atlas board](previews/hollow-roaster-complete-animation-v1.jpg)
- [animated direction/state preview](previews/hollow-roaster-complete-animation-v1.gif)

## Main-boss identity rule — 0.11.0

Every main tour boss uses Kaprizard's recognizable face with a stern, closed-mouth, non-smiling expression. The refined master preserves the new owner-supplied reference's broad face, short black hair, natural thick brows, dark eyes, and short reddish-brown beard. The body is intentionally not shared: each tour gets an original giant silhouette, materials, movement, attack language, hazards, and phase design. The first implementation is the Hollow Roaster, with `/assets/enemies/hollow-roaster-kaprizard-v3.png` as its static identity master and `/assets/enemies/hollow-roaster-motion-v2.png` as its eight-direction idle/move/primary-attack runtime atlas. The second is the Root Tyrant, with `/assets/enemies/rootfall-tyrant-kaprizard-v1.png` as its static identity master and `/assets/enemies/rootfall-tyrant-motion-v1.png` as its base runtime atlas.

This identity rule applies only to main tour bosses, not standard enemies or elite guardians. The private owner-supplied face photograph is not committed; only the stylized reviewed derivatives ship.

## Elite-guardian full-direction base runtime — 0.10.7

The four elite guardians now share the tested E/SE/S/SW/W/NW/N/NE selector and three authored base states: idle, move, and signature attack. Kiln Warden uses a dual-cleaver charge windup, Pressure Widow an aimed steam-fan windup, Cinder Bishop a cinder-cross cast, and Grinder Saint a saw-charge pose. The active telegraph aim or dash vector overrides incidental movement so an elite never attacks while visually facing away from its target.

The source sheets were produced with the available built-in reference-image generation pipeline against the approved Higgsfield production specification and locked elite masters. They are not claimed as direct Higgsfield outputs. Pressure Widow's incomplete source variant was rejected; idle/move and the complete eight-direction attack block were validated separately and normalized into one runtime atlas without inventing a missing direction.

- [runtime atlas board](previews/elite-guardian-full-motion-runtime.jpg)
- [direction/state animation preview](previews/elite-guardian-directional-motion-preview.gif)
- [gameplay motion composite](previews/elite-guardian-gameplay-preview.jpg)

## Standard-enemy full-direction runtime — 0.10.6

The standard-enemy pipeline locks E/SE/S/SW/W/NW/N/NE and three authored states: idle, move, and attack. Ash Hound uses the attack state on contact, Ember Oracle during its aimed channel and release, Brass Colossus during its locked charge windup, and Smoke Revenant during its three-shot telegraph and release. Movement facing comes from actual post-collision displacement; ranged and charge telegraphs override it with the locked aim vector.

The source sheets were produced with the available built-in image-generation pipeline against the approved Higgsfield production specification and locked enemy references. They are not claimed as direct Higgsfield outputs. The atlas builder validates the number of figures in every source row and emits only normalized RGBA output; incomplete variants were rejected rather than mirrored or duplicated.

- [runtime atlas board](previews/standard-enemy-full-motion-runtime.jpg)
- [direction/state animation preview](previews/standard-enemy-directional-motion-preview.gif)
- [gameplay motion composite](previews/standard-enemy-gameplay-preview.jpg)

## Higgsfield top-down motion references — 0.10.1

The first corrected enemy pass locks the same gameplay camera used by the heroes and rooms. These sheets are approved as silhouette and motion-key references, not as final runtime atlases.

| Family | Higgsfield job | Coverage | Review |
| --- | --- | --- | --- |
| Ash Hound | `5e147f06-5f63-4b38-bbb0-827ba3165d86` | forward/back views and charge/run keys | Accepted for cleanup |
| Ember Oracle | `7bc406d0-05c6-48d1-8763-be8dc68a440b` | idle, cast, turn, and hit keys | Accepted for cleanup |
| Brass Colossus | `d40f51a1-5163-4b24-8d8e-3478d57be586` | walk, turn, charge, and impact keys | Accepted for cleanup |
| Smoke Revenant | `c8e24c4c-5a40-4c6b-ac96-854bf2e96ba1` | hover, aim, fire, and hit keys | Accepted for cleanup |
| Sector guardians | `ab451b2c-81f7-4c97-84e9-bc3547f4bd80` | four distinct elite silhouettes | Accepted as guardian lineup |
| Hollow Roaster | `f3b8a6c3-2d87-49d8-b569-1f3cb463bf3f` | idle, movement, shield, slam, and phase keys | Accepted for cleanup |

The reviewed contact sheet is [enemy-animation-keyposes.jpg](previews/enemy-animation-keyposes.jpg). Standard-enemy and elite-guardian base idle/move/attack exports are integrated, the Rootfall elites have complete secondary/reaction coverage, and the Hollow Roaster has complete multi-pattern, phase, hit, and defeat key coverage. Final production still requires manual edge and pivot cleanup, additional in-betweens, effect separation, Hollow Roastery elite secondary/reaction states, and phone-scale timing polish.
