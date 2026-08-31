# Roadmap

## Phase 1 — Vertical slice

- Approve move/stop/attack feel.
- Approve portrait layout and tap-to-enter loop.
- Tune both 50-room routes, twelve abilities, eight standard enemies, eight elite guardians, and two main bosses. Core attack patterns, telegraphs, wave countdowns, exit-door transitions, physical XP/healing drops, and in-room run-level choices are implemented; full balance playtesting remains.
- Completed run progression pass: enemies drop collectible roast shards, elites guarantee recovery charges, the run can reach level 12, and earned ability choices resume the interrupted room.
- Completed room presentation pass: five districts alternate ten illustrated coffee-industrial plates and the finale uses its own eleventh plate, with solid obstacles, timed hazards, and live door overlays.
- Completed first-tour enemy art pass: four original monsters, four elite guardians, and the Hollow Roaster now render as static pixel sprites with procedural fallbacks.
- Completed foundation: validated data definitions for tours, rooms, enemies, and bosses.
- Completed foundation: five-hero catalog, persistent selection, and distinct prototype weapons.
- Completed foundation: per-hero XP and levels, four-slot loadouts, item rarities, sanitized inventory, and local run drops.
- Completed corrected preview-art pass: transparent derivatives of the five accepted Higgsfield top-down masters appear in the roster and arena with their canonical weapons.
- Completed interim combat-feedback pass: static hero art now has deterministic movement/attack/hit/defeat posing, weapon cues, combat numbers, and bounded camera shake.
- Corrected the production art requirement: all combat assets use a single orthographic top-down camera. Existing front/three-quarter generations are reference-only, not runtime sprites.
- Removed the oversized katana ribbon from the placeholder renderer; final weapon motion will come from the authored hero animation.
- Completed the first corrected Higgsfield batch: five directional masters, five animation-key-pose sheets, and a six-room Hollow Roastery environment board.
- Completed eight-direction runtime facing for all five heroes: touch/keyboard movement preserves the exact angle, selects the nearest authored top-down view, and auto-attacks turn toward the selected enemy. This replaces the invalid full-image rotation that could render a hero upside down.
- Completed the first runtime motion-atlas pass for all five heroes: idle, run, attack, hit, and defeat frames now follow a tested priority state machine. Frames are enabled only for matching E/SE/SW/W cameras; the opposite hemisphere keeps its correct directional body view until dedicated frames are approved.
- Completed the Honey Badger full-direction pilot: 24 cleaned cells cover idle, run, and katana impact across N/NE/E/SE/S/SW/W/NW and take priority over the safe fallback in live combat.
- Completed full-direction idle/run/attack coverage for BOY, Mr. Kroo, Hadida, and Pata. All five heroes now use 24-cell transparent atlases in live combat; generated sheets are normalized into deterministic 4-by-6 runtime layouts.
- Completed full-direction hit/defeat coverage for the whole roster. Each hero now has a separate validated 16-cell transparent reaction atlas, and live rendering selects it before any older fallback pose.
- Completed full-direction idle/move/attack coverage for all four standard Hollow Roastery enemies. Each has a validated 24-cell transparent atlas; live facing follows displacement, charge direction, or locked ranged aim.
- Completed full-direction base motion for all four elite guardians. Kiln Warden, Pressure Widow, Cinder Bishop, and Grinder Saint each use a validated 24-cell idle/move/signature-attack atlas; live facing follows displacement, dash direction, or locked telegraph aim.
- Completed the 0.10.8 identity lock: corrected serious BOY likeness, lean Honey Badger and Mr. Kroo silhouettes, BOY-length Honey Badger beard, permanent Hadida papakha, and Kaprizard's serious face as the immutable identity of every main tour boss.
- Completed the first Kaprizard boss runtime pass: the Hollow Roaster uses a validated 24-cell idle/move/primary-attack atlas and follows its locked target direction during windup and release.
- Completed the 0.10.9 scale and boss-likeness correction: all five playable heroes share one gameplay height, only the main boss is oversized, and the Hollow Roaster uses the refined serious Kaprizard face master and motion atlas.
- Completed the 0.11.0 Hollow Roaster lifecycle: eight-direction secondary attack, one-time phase-two transition, hit reaction, delayed defeat, hostile-projectile cancellation, and single-payment reward handling are integrated and tested.
- Completed the 0.12.0 environment integration: six 720×1280 Hollow Roastery room plates now load by district, are available offline, preserve a procedural fallback, and remain separated from deterministic collision and hazard data.
- Completed the 0.13.0 environment-motion pass: all six districts have distinct ambient animation, all 50 rooms receive stable seeded variation, and visual RNG remains isolated from combat state.
- Completed the 0.14.0 room-architecture pass: the five standard districts now alternate between two structurally distinct 720×1280 plates, the Roaster Heart remains unique, loading stays lazy by exact variant, and all eleven assets are offline-ready.
- Completed the 0.15.0 interactive-room pass: five district-specific prop types provide destructible cover, while rooms 15/35 are dedicated recovery chambers and rooms 25/45 are dedicated field-contract events; all new code and fifteen room plates are offline-ready.
- Completed the 0.15.1 weapon-identity correction: Mr. Kroo now uses a bow-only portrait, eight-direction idle/run/release atlas, and bow-preserving hit/defeat atlas; Honey Badger keeps the katana as primary and gains a dedicated eight-direction shuriken-release atlas for his automatic secondary volley.
- Completed the 0.16.0 Rootfall Jungle pass: a persistent two-tour selector, a second 50-room route, five organic districts plus Root Throne, four dedicated Rootfall safe rooms, four new standard enemies, four new elite guardians, five Higgsfield-authored organic destructibles, biome-specific hazards and ambient motion, and the giant Kaprizard-faced Root Tyrant with a complete multi-phase behavior set.
- Completed the 0.16.1 Rootfall room-architecture pass: every standard organic district now alternates between two complete 720×1280 architectures. Rootfall has fifteen room plates, bringing both tours to thirty total while keeping visual selection independent from collision and encounter logic.
- Completed the 0.16.2 Rootfall elite-animation pass: Briar Jaguar, Mire Bellower, Orchid Maw, and Strangler Ape now use Higgsfield-authored secondary windup/release and hit/defeat source poses, plus delayed single-payment defeat handling. The source sheets contain four authored cardinal directions and feed eight runtime sectors by selecting the nearest cardinal for diagonals.
- Completed the 0.16.3 PWA safety pass: service-worker activation deletes only versioned DOFFA Heroes caches, navigation caching accepts only successful HTML for the game shell, unrelated same-origin routes are never replaced by the game shell, and requested updates wait until an active run returns home before activation or reload.
- Completed the 0.16.3 active-run checkpoint pass: paid runs resume from validated deterministic room boundaries without a second entry charge; checkpoint restoration sanitizes identity, room, HP, abilities, run XP, and RNG state; final rewards and checkpoint removal share one profile update so a finished run cannot pay twice.
- Completed the 0.16.4 animation-runtime foundation: authored clips now support independent FPS, loop/one-shot playback, state-timeline resets, arbitrary frame counts, exact source rectangles, and legacy atlas fallback for both heroes and enemies.
- Completed the 0.16.4 full-resolution paging foundation: future clips can split `E/SE/S/SW` and `W/NW/N/NE` into on-demand physical pages without shrinking the existing `288×336` frame or exceeding the current `1152×2016` texture envelope.
- Completed the 0.16.5 mobile asset-window pass: combat decodes only the current room's enemies and props, retains current/next backgrounds, releases cleared enemies before prefetching the next encounter, keeps surviving prop art until the door transition, and disposes run-owned rooms, pages, actors, and props at completion.
- Completed the 0.16.5 bounded page-cache pass: active pages keep a draw-frame lease, inactive pages fall back to a `64 MiB`/10-entry LRU, rejected loads remain retryable, pending loads cancel immediately at teardown, and stale async completions cannot resurrect an evicted enemy or hero.
- Completed the 0.16.5 lightweight PWA install: the service worker precaches only shell/code/icon assets, admits raster art only with the MIME required by its file type, and migrates previously cached valid allowlisted art before deleting an obsolete game cache.
- Completed the 0.16.5 Higgsfield assembler: a provenance-locked 128-frame manifest becomes six deterministic lossless PNG32 pages only after full decode, safe-path, chroma-border, margin, component, dimension, and quality-policy validation.
- Completed the 0.16.6 PWA icon pass: exact `192×192` and `512×512` PNG install icons, a separately padded `512×512` maskable icon, and Apple touch metadata are derived from the unchanged crest master, declared in the manifest, deeply decoded in tests, and included in the lightweight offline shell.
- Completed the 0.16.6 background-safety pass: hidden tabs stop simulation and Canvas repainting, reset elapsed time, and resume through exactly one fresh animation frame so a mobile player cannot take damage while the app is backgrounded.
- Completed the 0.16.6 storage-safe update pass: migrated raster files are deleted from obsolete game caches immediately after each successful target write; a failed write preserves the source cache and aborts activation before claiming clients.
- Completed the 0.16.6 explicit asset-ownership foundation: independent lease tokens share pending decodes, release idempotently, protect replacement owners from stale callbacks, and dispose late unowned results exactly once.
- Replaced the rejected Rootfall single-sheet prompt with the v3 128-frame production workflow. Higgsfield delays now pause art generation without lowering model, resolution, extraction quality, or directional accuracy; runtime remains on the reviewed legacy art until a complete enemy passes acceptance.
- Locked tour uniqueness at the content layer: every tour requires a unique visual theme and enemy family, and enemies cannot cross between tour families.

## Phase 2 — Production foundation

- Add account service, server-created run sessions, event validation, and anti-replay storage.
- Add deterministic combat telemetry suitable for cheat analysis.
- Extend the prototype equipment and hero-level catalogs with upgrades, dismantling, room modifiers, and versioned server balance tables.
- Build Android wrapper, signed release pipeline, crash reporting, and staged rollout.

## Phase 3 — Art and content

- Generate and approve the 128-frame Razor Mantis v3 pilot through Higgsfield when sufficient capacity is available; then replace the remaining eight Rootfall base-motion packs one complete enemy at a time.
- Add directional recovery, ability, and victory frames for the whole roster, plus final hand/weapon continuity cleanup and phone-scale timing polish.
- Add secondary-pattern, hit, defeat, and phase-transition frames for the four Hollow Roastery elite guardians; the Hollow Roaster's equivalent states are complete.
- Expand the district pass with collision-mask tooling, more prop arrangements, and richer rest/event interactions.
- Produce final models/sprites, rigs, attack/hit/death animation sets, VFX, UI, music, and sound.
- Continue shipping tours whose monster and boss families do not repeat; the Hollow Roastery and Rootfall Jungle establish the first two independent families.

## Phase 4 — Economy rehearsal

- Run the complete reward economy with non-transferable test credits.
- Simulate abuse, bots, account farms, withdrawal bursts, and reward-vault exhaustion.
- Finalize emissions, claim limits, sinks, burn ratio, pause controls, and transparency data.

## Phase 5 — New token

- Create fresh development and production wallets with hardware-backed keys and multisig.
- Test backup recovery before funding anything.
- Deploy and audit on Solana devnet.
- Create the new production token only after game and economy approval.
- Publish mint, authorities, allocation, reward-vault, burn, and audit information.

## Phase 6 — Launch

- Add DOFFA Games to doffa.coffee.
- Release browser build and signed Android build.
- Use web/PWA content updates immediately; use store-managed native updates after Play Store/App Store publication.
- Operate new tours, balance patches, security reviews, and transparent reward reporting.
