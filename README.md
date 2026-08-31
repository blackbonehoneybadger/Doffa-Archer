# DOFFA Heroes

The first flagship game in the DOFFA Games universe: a portrait action-roguelite built for browser and mobile.

## Next renderer

The production visual migration now uses the open-source PlayCanvas Engine instead of requiring Unity Hub. The current Canvas2D/PWA game remains the behavioral baseline at `/`, while an isolated mobile 3D control room is built at `/next/`. See the [Russian PlayCanvas mobile production plan](docs/PLAYCANVAS_MOBILE_PRODUCTION_PLAN_RU.md).

## Current milestone

Version `0.16.6` adds production PWA install icons while retaining the bounded mobile asset lifecycle, deterministic Higgsfield page assembler, production multi-frame runtime, safe PWA/update lifecycle, resumable active runs, two complete tours, and the oversized Kaprizard-faced bosses:

- tap the Roaster Core to collect entry beans;
- remove only DOFFA Heroes caches during service-worker activation, cache only successful game-shell navigation responses, and defer build activation/reload until an active run has returned home;
- spend beans to enter a 50-room run;
- resume a paid run from a validated safe-room boundary without paying twice; hero, tour, and loadout remain locked until that checkpoint is completed or abandoned;
- move to evade and stop to auto-attack;
- preserve the exact touch/keyboard movement angle while selecting the nearest of eight authored top-down body directions, then face the selected enemy while auto-attacking;
- read deterministic idle, run, attack, hit, and defeat states, with dedicated poses for all eight directions on all five heroes;
- play authored animation clips at independent FPS with looping idle/move cycles, one-shot attacks and reactions, deterministic state resets, and a legacy one-key-pose fallback;
- load full-resolution animation pages on demand by state and direction, keeping each physical texture within the existing `1152×2016` envelope instead of shrinking large enemies or bosses;
- pin only animation pages used by the active draw frame inside a `64 MiB` LRU budget, cancel unfinished decodes on state/run changes, and destroy late completions without reviving stale actors;
- decode enemies and props for the current combat room only, keep the next background ready, retain any still-visible current props through the open-door phase, and prefetch the next encounter only after the current room is cleared;
- stop the animation frame loop on home, result, choice, paused, and backgrounded screens so hidden mobile tabs cannot continue combat or spend battery;
- give decoded heroes, enemies, props, rooms, and animation pages explicit ownership handles so stale async releases cannot evict another room's live art;
- install the lightweight PWA shell first, cache only MIME-valid whitelisted art on demand, and stream previously cached art into the new build one file at a time without briefly doubling storage use;
- install with exact `192×192` and `512×512` PNG crests, a separately padded `512×512` maskable icon, and an Apple touch icon derived from the same undistorted vector master;
- see floating damage and recovery values, weapon-specific attack cues, impact bursts, and bounded camera shake;
- collect physical roast shards dropped by defeated enemies and reach up to run level 12;
- pause the current room on each run level-up, choose one of three abilities, then resume that same room;
- take one starter ability after room 1 and build from a catalog of 12 abilities;
- collect recovery charges, with a guaranteed charge from each elite guardian;
- choose between the Hollow Roastery and Rootfall Jungle before a run, with separate best-room and boss-win records;
- defeat either the Hollow Roaster after its one-time pressure surge or the Root Tyrant after its Black Sap Awakening;
- select Honey Badger, Hadida, BOY, Mr. Kroo, or Pata;
- see transparent top-down art built against the Higgsfield production specification for Honey Badger, Hadida, BOY, Mr. Kroo, and Pata in both the roster and live combat;
- fight with Honey Badger's katana plus secondary ricocheting shuriken, BOY's hammer, Mr. Kroo's recurve bow, or Hadida's bat;
- see Honey Badger switch to a dedicated eight-direction shuriken-release pose whenever the secondary volley fires;
- recognize the corrected serious BOY likeness, lean Mr. Kroo silhouette, lean Honey Badger with BOY-length black beard, and Hadida's permanent black wool papakha in every live state;
- see every playable hero at the same authored gameplay height; only the main boss is intentionally oversized;
- use Pata's pressure coffee rifle with its espresso chamber, gauge, and steam-powered rounds;
- face four standard coffee-industrial monsters and four original elite guardians with unique silhouettes and attack behaviors;
- face the separate Rootfall family: Razor Mantis, Seed Spitter, Root Stalker, Spore Moth, Briar Jaguar, Mire Bellower, Orchid Maw, and Strangler Ape;
- read Higgsfield-authored secondary windup/release and hit/defeat poses for all four Rootfall elite guardians; their source sheets contain four authored cardinal views, while the eight-sector runtime uses the nearest cardinal pose for each diagonal without rotating the bitmap;
- see a defeated Rootfall elite remain untargetable in its authored defeat pose before removal, with score and drops still granted exactly once;
- see Ash Hound, Ember Oracle, Brass Colossus, and Smoke Revenant turn to their real movement or aim vector through eight authored directions, with separate idle, move, and attack poses;
- see Kiln Warden, Pressure Widow, Cinder Bishop, and Grinder Saint use the same authored eight-direction runtime system for idle, movement, locked telegraph aim, and their signature-attack windups;
- read line, cone, charge, and radial telegraphs before dangerous enemy attacks;
- fight the fully illustrated oversized Hollow Roaster with Kaprizard's refined serious face across idle, movement, primary attack, pressure-lanes attack, phase transition, hit, and defeat poses;
- fight the giant Root Tyrant with the same locked serious Kaprizard identity but an original black-sap root body, root-lane and thorn-crown attacks, a two-ring phase transition, and an enraged two-part rush;
- clear one- and two-wave chambers with a visible countdown between groups;
- move through the opened upper door after the final wave to advance, with the room-1 door granting the starter ability;
- fight across five escalating districts and the Roaster Heart instead of one repeated grid;
- fight across fifteen distinct 720×1280 runtime backgrounds: two architectures for each standard district, four safe-room compositions, and the unique Roaster Heart;
- cross fifteen separate 720×1280 Rootfall plates: two complete architectures for each of Canopy, Mire, Mycelium, Briar, and Rootdeep, four organic safe rooms, and the unique Root Throne;
- navigate three deterministic collision layouts per Rootfall district while thorn, venom, spore, and grasping-root hazards use their own timings and visual language;
- break Rootfall's Thornseed Pods, Mire Resin Urns, Spore Bulbs, Heartwood Knots, and Root-Sap Cocoons without reusing Roastery machinery;
- enter four dedicated safe-room plates: Cooling Reservoir and Filter Chapel restore health, while Broker's Meter and Redline Contract grant a three-card field-contract choice;
- break five Hollow Roastery district-specific prop types that block actors and shots while intact, show damage feedback, release roast shards once, and permanently open their occupied lane after destruction;
- alternate deterministically between Ash Storage/Soot Conveyor, Cracked Furnace/Boiler Gallery, Grinder Hall/Meter Chamber, Steam Chamber/Vapor Crypt, and Pressure Works/Final Gauge as the route advances;
- see environment-specific live motion: falling ash, furnace breathing and sparks, rotating grinder mechanisms, drifting steam, pressure jets and gauge needles, and the Roaster Heart reactor pulse;
- receive a stable room-specific phase, direction, intensity, and one of four visual variants across the 50-room route without changing collision or hazard timing;
- navigate solid crates, walls, pipes, and pillars while timed steam, ember, smoke, and pressure vents cycle between warning and damage states;
- defeat the Kiln Warden, Pressure Widow, Cinder Bishop, and Grinder Saint in rooms 10, 20, 30, and 40;
- test five different weapon profiles, ranges, health pools, and attack rhythms;
- earn separate XP and levels for every hero;
- equip a weapon mod, armor, ring, and relic;
- recover common, rare, or epic local items after runs, with a guaranteed boss drop;
- receive a local, non-claimable test receipt;
- load the complete run from a validated tour/room/enemy content catalog;
- preserve the selected tour and independent progress for both playable tours.
- clear the active-run checkpoint and grant the local result in one profile update, preventing a completed run from being resumed for duplicate rewards.

The v3 Rootfall production workflow deliberately waits for enough Higgsfield capacity to generate and approve all 128 frames of one enemy. It never substitutes a cheaper model, lower resolution, mirrored direction, rotated bitmap, or duplicated frame. The rejected single-sheet pilot remains outside runtime. Once a complete approved source set exists, the strict assembler validates its Higgsfield job provenance, deep-decodes every PNG, removes only border-connected chroma, and atomically builds six lossless A/B runtime pages.

All five heroes now use cleaned Higgsfield-spec eight-direction top-down atlases in live combat. Dedicated idle, run, weapon-attack, hit, and defeat poses cover E/SE/S/SW/W/NW/N/NE for Honey Badger, BOY, Mr. Kroo, Hadida, and Pata without rotating a finished bitmap. Their source figures and runtime renderer are normalized to one shared gameplay height; body shape remains distinct without turning one hero into a giant. Honey Badger, BOY, and Hadida use identity-preserving v3 motion atlases; Mr. Kroo uses the corrected bow-only v4 pack; Pata keeps the approved v2 set. Both tours own four standard enemies, four elite guardians, one boss, and five destructible families with independent behavior and art. Rootfall's four elites now add special and reaction atlases with secondary windup/release, hit, and delayed defeat states; their four cardinal Higgsfield source views are expanded to eight runtime sectors by choosing the nearest cardinal for diagonals. The Hollow Roaster and Root Tyrant each add special and reaction atlases, cancel hostile shots on victory, and cannot pay rewards twice. Every main tour boss inherits Kaprizard's serious face while its body, mechanics, oversized scale, and tour-specific silhouette remain original. Thirty illustrated room plates now supply the live environment layer across both tours: each tour has ten standard-district architectures, four dedicated safe rooms, and one unique finale. Deterministic room seeds animate each biome while collision geometry, damaging hazards, props, doors, and telegraphs remain separate gameplay overlays. Directional victory/ability art, Hollow Roastery elite secondary/reaction art, equipment art, balance, and navigation AI remain production work. Equipment, hero XP, run XP, beans, and drops are browser-local prototype state with no token value.

See the current visual-target boards and gameplay composites:

- [Tour 01 environment progression](docs/previews/tour01-hollow-roastery-overview.jpg)
- [six integrated Hollow Roastery runtime room plates](docs/previews/hollow-roastery-runtime-rooms-v1.jpg)
- [ten standard-room architecture variants used by the runtime](docs/previews/hollow-roastery-room-variants-v2.jpg)
- [animated six-environment ambient-effects preview](docs/previews/hollow-roastery-ambient-effects-v1.gif)
- [integrated Room 01 / Room 50 runtime combat board](docs/previews/hollow-roastery-runtime-combat-v1.jpg)
- [Room 01 runtime combat composite](docs/previews/hollow-roastery-room01-runtime-composite-v1.jpg)
- [Room 50 runtime boss composite](docs/previews/hollow-roastery-room50-runtime-composite-v1.jpg)
- [standard-room combat](docs/previews/tour01-room07-ash-intake.jpg)
- [elite-room combat](docs/previews/tour01-room30-pressure-elite.jpg)
- [Hollow Roaster boss combat](docs/previews/tour01-room50-hollow-roaster.jpg)
- [Hollow Roaster complete seven-state atlas board](docs/previews/hollow-roaster-complete-animation-v1.jpg)
- [Hollow Roaster animated direction/state preview](docs/previews/hollow-roaster-complete-animation-v1.gif)
- [Tour 02 organic-enemy direction test](docs/previews/tour02-room08-rootfall-jungle.jpg)
- [Rootfall Jungle two-architecture runtime board](docs/previews/rootfall-jungle-room-variants-v1.jpg)
- [Rootfall elite secondary/reaction runtime board](docs/previews/rootfall-elite-complete-animation-v1.jpg)
- [Rootfall Jungle runtime specification](docs/ROOTFALL_JUNGLE.md)
- [integrated eight-direction hero atlas](docs/previews/hero-eight-direction-runtime.jpg)
- [integrated hero motion key poses](docs/previews/hero-motion-runtime.jpg)
- [Honey Badger eight-direction idle/run/attack reference](docs/previews/honey-eight-direction-motion-reference-v2.jpg)
- [Honey Badger animated direction/state preview](docs/previews/honey-eight-direction-motion-preview.gif)
- [Historical pre-bow four-hero comparison board](docs/previews/four-hero-full-motion-runtime.jpg)
- [four-hero animated direction/state preview](docs/previews/four-hero-eight-direction-motion-preview.gif)
- [five-hero directional hit/defeat atlas board](docs/previews/five-hero-reaction-runtime.jpg)
- [five-hero animated hit/defeat preview](docs/previews/five-hero-directional-reactions-preview.gif)
- [standard-enemy gameplay motion composite](docs/previews/standard-enemy-gameplay-preview.jpg)
- [four standard-enemy full-motion atlases](docs/previews/standard-enemy-full-motion-runtime.jpg)
- [standard-enemy animated direction/state preview](docs/previews/standard-enemy-directional-motion-preview.gif)
- [elite-guardian gameplay motion composite](docs/previews/elite-guardian-gameplay-preview.jpg)
- [four elite-guardian full-motion atlases](docs/previews/elite-guardian-full-motion-runtime.jpg)
- [elite-guardian animated direction/state preview](docs/previews/elite-guardian-directional-motion-preview.gif)
- [corrected hero and Kaprizard boss identity board](docs/previews/identity-lock-corrections-v3.jpg)
- [corrected eight-direction identity preview](docs/previews/identity-lock-directional-preview.gif)
- [equal-height hero and oversized Kaprizard boss board](docs/previews/identity-scale-lock-v4.jpg)
- [equal-height eight-direction gameplay preview](docs/previews/identity-scale-directional-v4.gif)
- [hero animation key poses](docs/previews/hero-animation-keyposes.jpg)
- [enemy animation key poses](docs/previews/enemy-animation-keyposes.jpg)

These boards document the target camera, scale, encounter readability, and effect language. Both room boards are assembled from the exact 720×1280 files loaded by the Canvas renderer; the 0.13.0 environment GIF reuses the production room seed/mote functions; and the boss board/GIF are assembled directly from the integrated runtime atlases. Gameplay images remain deterministic composites rather than browser captures. See the [preview notes](docs/previews/README.md).

## Run locally

No package installation is required.

```bash
npm run serve
```

Open `http://localhost:4173`. Keyboard controls are WASD or arrow keys. On a phone, drag anywhere inside the arena to move. The hero attacks automatically while standing still.

Run the repository checks with:

```bash
npm test
```

## Clean-token rule

This repository does not contain or depend on the retired DOFFA token, the lost reward wallet, private keys, seed phrases, or production mint addresses. Real token integration is blocked until the game has server-authoritative run validation, a tested reward economy, and a separately reviewed wallet/key-management design.

See [Game Design](docs/GAME_DESIGN.md), [Rootfall Jungle](docs/ROOTFALL_JUNGLE.md), [Roadmap](docs/ROADMAP.md), [Art Direction](docs/ART_DIRECTION.md), [Room Assets](docs/ROOM_ASSETS.md), [Character Assets](docs/CHARACTER_ASSETS.md), [Enemy Assets](docs/ENEMY_ASSETS.md), and [Security Architecture](docs/SECURITY_ARCHITECTURE.md).
