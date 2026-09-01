# DOFFA Heroes — Vertical Slice Design

## Product promise

A serious portrait action-roguelite with short room-based runs, readable combat, strong ability combinations, and original worlds ranging from coffee-industrial horror to organic jungle corruption. The control rhythm is simple: move to evade, stop to attack.

This project may use genre conventions as references, but it does not copy another game's code, art, UI, names, characters, levels, audio, or proprietary assets.

## Core loop

1. Tap the Roaster Core to earn off-chain entry beans.
2. Spend beans to start a run.
3. Select a tour and clear its configured enemy waves in a sealed combat room.
4. Move through the opened exit door.
5. Collect physical roast shards and recovery charges dropped inside the room.
6. On each run level-up, pause combat, choose one of three random upgrades, and resume the same room.
7. Repeat until the tour boss.
8. Generate a reward-eligibility receipt after a verified victory.
9. In production, a server validates the receipt before any token claim exists.

## Milestones 0.16.0–0.16.6

- Two complete selectable tours: the Hollow Roastery and the Rootfall Jungle, each with 50 rooms, four elite checkpoints, one final boss, a unique theme, and a unique enemy family.
- A persistent tour-selection overlay with independent best-room and boss-win records and tour-bound run receipts.
- Rootfall Jungle route: Canopy, Mire, Mycelium, Briar, Rootdeep, and the Root Throne finale.
- Four Rootfall standard enemies with independent behaviors: Razor Mantis pounce, Seed Spitter range control, Root Stalker burrow ambush, and Spore Moth orbiting weave.
- Four Rootfall elite guardians at rooms 10/20/30/40: Briar Jaguar, Mire Bellower, Orchid Maw, and Strangler Ape.
- Higgsfield-authored secondary windup/release and hit/defeat source poses for all four Rootfall elites. The source covers `N/E/S/W`; live combat exposes eight sectors by assigning every diagonal to its nearest authored cardinal pose without bitmap rotation.
- Delayed Rootfall elite defeat keeps the final pose visible for 0.82 seconds, blocks targeting and contact damage, and preserves single-payment score and drop handling without clearing unrelated hostile projectiles.
- Fifteen Rootfall room plates: two complete architectures for each standard district, four dedicated rest/event compositions, and the unique Root Throne.
- Stable odd/even visual selection gives every standard district both architectures while remaining independent from its three-layout collision cadence.
- Five environment-bound organic destructibles generated through Higgsfield: Thornseed Pod, Mire Resin Urn, Spore Bulb, Heartwood Knot, and Root-Sap Cocoon.
- Three deterministic collision layouts per standard Rootfall district, separate from Hollow Roastery's odd/even architecture system.
- Rootfall hazard language: timed thorn blooms, venom pools, spore clouds, and grasping roots with biome-specific cadence and damage.
- Rootfall wave cadence: double waves at rooms 4/8/13/18/23/28/33/38/43/47 and a three-wave room-49 gauntlet.
- Rootfall safe rooms at 15/25/35/45: Clearwater Hollow and Moondew Sanctuary restore 30% health; Symbiotic Shrine and Bloodroot Bargain grant a three-card Rootfall Covenant choice.
- Kaprizard — The Root Tyrant at room 50: a giant black-sap root body, serious locked Kaprizard face, root lanes, thorn crown, one Black Sap Awakening below half health, and an enraged two-part rush.
- Dedicated static and eight-direction idle/move/attack art for all eight Rootfall standard/elite enemies; secondary/release and hit/defeat atlases for all four Rootfall elites; plus base, special, hit, and defeat atlases for the Root Tyrant.
- Six deterministic Rootfall ambient profiles for leaf drift, mire bubbles, mycelial glow, briar motion, root light, and the Root Throne pulse.
- Versioned active-run checkpoints persist only deterministic room-start, checkpoint-choice, and event-exit boundaries. Resume restores the paid run without charging again; malformed checkpoints are discarded, and completion clears the checkpoint in the same profile mutation that grants the local reward.
- PWA updates defer activation and reload while a run, ability choice, or room exit is active, and the offline shell precaches the checkpoint validator required for a cold resume.
- A reusable multi-frame animation player advances clips by authored FPS, loops idle/movement, holds one-shot terminal frames, resets cleanly on state changes, and keeps every existing one-pose atlas as a compatible fallback.
- Full-resolution physical pages preserve `288×336` cells for future Rootfall v3 clips: four directions per page, time along rows, on-demand loading, and no texture larger than `1152×2016`.
- Rootfall v3 requires 128 accepted frames per enemy and explicitly waits when Higgsfield capacity is insufficient rather than reducing model, resolution, direction coverage, or extraction quality.
- Runtime ownership is bounded: current combat owns its enemies and props, the room window owns only current/next backgrounds, cleared enemies are released before the next encounter is prefetched, and surviving current props stay owned until the player actually exits.
- Full-resolution animation pages are protected only while used by the current draw frame and otherwise share a `64 MiB` LRU; explicit owner leases cover other decoded combat/room art, and finishing a run cancels unfinished decodes before releasing every run-owned handle.
- Hidden tabs suspend simulation and painting entirely, clear accumulated elapsed time, and restart with one zero-delta frame when visible so combat never advances behind the player's back.
- The PWA install caches the lightweight shell immediately and fills its approved large-art cache on demand; version activation streams MIME-valid files into the new cache one at a time, deletes each old copy only after the successful write, and discards poisoned raster entries.
- PWA installation exposes exact `192×192` and `512×512` PNG crests plus a dedicated safely padded `512×512` maskable asset; Apple touch metadata and the offline shell use the same source-derived icon family.
- The production assembler requires all 128 unique source frames and their Higgsfield job IDs, rejects fallback/mirroring/rotation/upscaling, and emits six exact lossless A/B pages only after deep validation.

The shared vertical-slice foundation retained from `0.15.x` includes:

- Five selectable heroes with transparent top-down preview art built against the Higgsfield production specification: Honey Badger, Hadida, BOY, Mr. Kroo, and Pata.
- Eleven illustrated 720×1280 Hollow Roastery runtime plates: two distinct architectures for every standard district plus the unique Roaster Heart, with procedural rendering retained only as a load-failure fallback.
- Four dedicated 720×1280 safe-room plates at rooms 15, 25, 35, and 45: two recovery rooms and two field-contract events, with no enemies, hazards, or blocking props.
- Five environment-bound destructible prop types placed deterministically in ordinary combat rooms; intact props block actors and projectiles, friendly attacks damage them, destruction opens the lane, and each prop pays its score and roast-shard reward only once.
- Stable odd/even room assignment alternates the two architectures inside every ten-room district; only the selected JPEG is decoded when a room starts.
- Deterministic collision rectangles, hazards, obstacles, exit state, encounter text, and telegraphs remain separate Canvas overlays so decorative art never changes gameplay geometry.
- Six environment-specific ambient systems: ash drift, furnace heat/sparks, grinder rotation, smoke plumes, pressure jets/gauges, and Roaster Heart reactor/ring motion.
- Stable room-identity hashing assigns phase, direction, intensity, and four visual variants without consuming combat RNG or changing simulation state.
- Locked weapon identities: Honey Badger / katana plus secondary shuriken, BOY / hammer plus gold pistol, Mr. Kroo / dagger plus recurve bow, Hadida / bat plus cigarette butts, and Pata / punch plus pressure coffee rifle.
- Each melee weapon cycles three distinct attack clips. Each ranged/secondary weapon uses one dedicated release atlas.
- Honey Badger's secondary volley selects its own eight-direction release atlas, while katana strikes continue to use the primary melee attack rows.
- Locked visual identities: BOY uses the corrected serious facial reference; Honey Badger and Mr. Kroo remain lean; Honey Badger carries BOY-length dense black facial hair; Hadida keeps a tall black papakha in every state.
- Shared playable-character scale: all five heroes use one normalized body-height band and the same in-arena render height; only the main boss is intentionally giant.
- Pata's locked weapon identity: pressure coffee rifle with an espresso chamber and steam-driven long-range rounds.
- Distinct health, speed, damage, range, fire rate, projectile count, ricochet, and splash profiles.
- Persistent local hero selection and hero identity in the run HUD, results, and local receipt.
- Persistent XP and levels stored separately for all five heroes.
- Four equipment slots: weapon mod, armor, ring, and relic.
- Ten equipment definitions across common, rare, and epic rarities.
- Sanitized local inventory and loadout migration from profile schema v3 to v4.
- Room-based local drop chance and one guaranteed item after a boss victory.
- Level and loadout modifiers are snapshotted when a run starts.
- Fifty rooms per tour, with four elite guardians, four safe checkpoints, standard encounters, and one final boss.
- One- and two-wave standard rooms, with a countdown before the next group.
- A physical exit-door step between combat and the ability choice.
- Five escalating Canvas districts plus the Roaster Heart finale.
- Solid room obstacles, projectile blocking/ricochet, and timed steam, ember, smoke, and pressure hazards.
- Four standard enemy archetypes and four elite guardians with distinct movement or attack behavior.
- Validated 24-cell top-down idle/move/attack atlases for Ash Hound, Ember Oracle, Brass Colossus, and Smoke Revenant, with static fallbacks for safe loading.
- Validated 24-cell top-down idle/move/signature-attack atlases for Kiln Warden, Pressure Widow, Cinder Bishop, and Grinder Saint, with static fallbacks for safe loading.
- Refined Kaprizard-faced Hollow Roaster static master, validated 24-cell idle/move/primary atlas, and two validated 16-cell atlases for pressure lanes, phase two, hit, and defeat.
- Kiln Warden, Pressure Widow, Cinder Bishop, and Grinder Saint checkpoints at rooms 10/20/30/40.
- Pre-attack telegraphs for aimed bolts, spread volleys, colossus charges, both boss patterns, and the one-time phase-two surge below half health.
- Physical roast-shard drops with magnetic collection and a visible run-XP meter.
- Twelve run levels, with one three-card ability choice for every earned level and combat resuming in the same room.
- One room-1 starter choice plus a catalog of twelve offensive, defensive, recovery, and collection abilities.
- Physical recovery charges, guaranteed from elite guardians and possible from standard enemies when health is low.
- A deterministic animation-state machine with defeat > hit > attack > run > idle priority and normalized Higgsfield-spec motion atlases for all five heroes.
- Dedicated idle, run, canonical-weapon attack, hit, and defeat cells for N/NE/E/SE/S/SW/W/NW on Honey Badger, BOY, Mr. Kroo, Hadida, and Pata.
- Weapon-specific impact cues, pressure flashes, floating damage/recovery values, death impact bursts, and bounded camera shake.
- Keyboard and touch movement.
- Continuous 360-degree movement-facing in the arena. Gameplay keeps the exact input/target angle while the renderer selects the nearest of eight authored top-down atlas directions; every auto-attack turns toward its selected target before the weapon event is created.
- Continuous enemy-facing from actual displacement and locked telegraph aim. Standard enemies and elite guardians select E/SE/S/SW/W/NW/N/NE without mirroring or rotating a finished attack frame.
- Continuous boss-facing from locked telegraph aim. Both the Hollow Roaster and Root Tyrant select the nearest authored direction during windup, release, phase change, hit reaction, and defeat; delayed defeat blocks targeting and duplicate rewards while preserving the final pose.
- Local beans, entry cost, run reward, best-room progress, and boss wins.
- Installable PWA shell and update detection.
- Local test receipt explicitly marked non-claimable and non-chain.
- Data-driven definitions for 100 named rooms across two tours, with independent layouts, hazards, enemies, elites, and final bosses.
- Per-tour local progress with migration from the original aggregate profile.
- Tour- and hero-bound local receipts so future server validation has explicit content identities.

## Gameplay camera

Combat uses a fixed orthographic top-down camera across every tour. Characters never switch to a profile or front-facing illustration inside the arena. Hero and enemy silhouettes, attacks, collision footprints, props, hazards, and room geometry are authored against the same camera pitch and scale.

Movement direction controls body direction: up, down, left, right, every diagonal, and every angle between them. While moving, the hero faces the live input vector. While stationary and attacking, the hero faces the selected enemy before the weapon event is created.

Every tour declares a unique visual theme and a unique enemy family. Catalog validation rejects repeated tour themes, repeated families, and any enemy placed outside its owning family. Rootfall Jungle therefore uses organic jungle enemies, hazards, guardians, and a root-titan boss rather than recolored Hollow Roastery machines. See the authoritative [Rootfall Jungle runtime specification](ROOTFALL_JUNGLE.md).

## Economy boundary

Beans, hero XP, run XP, equipment, and drops are prototype gameplay state and have no blockchain value. Local storage is intentionally treated as untrusted. Real DOFFA rewards are not part of this milestone.

The future claim flow is:

`client run request → server session → validated events → anti-cheat decision → claim allowance → player-signed transaction`

Burning will be implemented only in an audited transaction design. The client will never receive a treasury or reward-wallet private key.

## Production quality gates

- Combat is enjoyable without rewards.
- A full run works on target low- and mid-range Android devices.
- Reward issuance survives replay, clock manipulation, save editing, and request tampering.
- Economy simulation defines daily caps, emission budget, sinks, and emergency pause rules.
- Every real-person character has written approval for likeness use.
