# Visual previews

These files communicate the approved visual target for the first playable tour.

- `tour01-hollow-roastery-overview.jpg` shows the five Hollow Roastery sectors and final boss room.
- `hollow-roastery-runtime-rooms-v1.jpg` shows the exact six 720×1280 environment files loaded by the current Canvas renderer: Ash Storage, Cracked Furnace, Grinder Hall, Steam Chamber, Pressure Works, and Roaster Heart.
- `hollow-roastery-room-variants-v2.jpg` compares the exact ten standard-district runtime files introduced in 0.14.0: two structurally different architectures per district. The unique Roaster Heart remains on the v1 board.
- `hollow-roastery-ambient-effects-v1.gif` cycles the six environments through their deterministic 0.13.0 ambient pass using the same room-state and mote functions as the renderer.
- `hollow-roastery-runtime-combat-v1.jpg` compares Room 01 and Room 50 using the exact runtime backgrounds and selected live atlas cells for Pata, the standard monsters, and Hollow Roaster.
- `hollow-roastery-room01-runtime-composite-v1.jpg` and `hollow-roastery-room50-runtime-composite-v1.jpg` preserve the two portrait composites at the full 720×1280 game resolution.
- `tour01-room07-ash-intake.jpg` shows a standard pursuit-and-telegraph encounter.
- `tour01-room30-pressure-elite.jpg` shows an elite encounter with a radial pressure pattern.
- `tour01-room50-hollow-roaster.jpg` shows Pata fighting the final boss with the pressure coffee rifle.
- `tour02-room08-rootfall-jungle.jpg` is the approved visual-separation target for the now-playable Rootfall Jungle: roots, wet stone, mantises, seed-spitters, and root stalkers instead of reused Roastery machines. It remains a design composite rather than a live browser capture.
- `arena3d-rootfall-08-combat.png` and `arena3d-rootfall-08-orbit.png` are in-engine Babylon.js captures of the parallel true-3D slice (combat camera and orbit proof). They are not the concept JPEG reused as a background.
- `rootfall-jungle-room-variants-v1.jpg` compares the exact ten standard-district Rootfall plates used by the runtime after 0.16.1: two Higgsfield-authored architectures per organic district. The four safe rooms and unique Root Throne remain separate plates.
- `rootfall-elite-complete-animation-v1.jpg` shows the exact 0.16.2 secondary windup/release and hit/defeat runtime atlases for Briar Jaguar, Mire Bellower, Orchid Maw, and Strangler Ape. Higgsfield authored the four cardinal source poses; diagonal runtime sectors intentionally reuse the nearest cardinal rather than being described as separately authored views.
- `hero-eight-direction-runtime.jpg` shows the exact E/SE/S/SW/W/NW/N/NE still-frame selection now wired into live combat for all five heroes.
- `hero-motion-runtime.jpg` shows the normalized idle, ready, run, windup, impact, hit, and defeat frames used by the animation state machine.
- `honey-eight-direction-motion-reference-v2.jpg` records the historical 24-cell Honey Badger pilot. The corrected active derivative with the lean silhouette and BOY-length beard is `assets/heroes/honey-badger-full-motion-v3.png`.
- `honey-eight-direction-motion-preview.gif` cycles the cleaned runtime pilot through N/NE/E/SE/S/SW/W/NW and its idle/run/attack states.
- `boy-eight-direction-motion-reference-v2.jpg`, `hadida-eight-direction-motion-reference-v2.jpg`, and `pata-eight-direction-motion-reference-v2.jpg` show cleaned 24-cell runtime derivatives introduced in 0.10.4. `mr-kroo-eight-direction-motion-reference-v2.jpg` is retained only as a historical pre-bow review; the active bow-only atlas is `assets/heroes/mr-kroo-full-motion-v4.png`.
- `four-hero-full-motion-runtime.jpg` is the historical pre-bow comparison board; it is not an active-runtime authority for Mr. Kroo.
- `four-hero-eight-direction-motion-preview.gif` cycles BOY, Mr. Kroo, Hadida, and Pata together through all eight idle/run/attack directions.
- `five-hero-reaction-runtime.jpg` shows the five normalized 16-cell hit/defeat atlases introduced in 0.10.5.
- `five-hero-directional-reactions-preview.gif` cycles the complete roster through all eight hit and defeat directions.
- `standard-enemy-full-motion-runtime.jpg` shows the normalized 24-cell runtime atlases for Ash Hound, Ember Oracle, Brass Colossus, and Smoke Revenant introduced in 0.10.6.
- `standard-enemy-directional-motion-preview.gif` cycles the four standard enemies through every idle, move, and attack direction.
- `standard-enemy-gameplay-preview.jpg` places selected integrated runtime cells into the approved Hollow Roastery room plate with representative health, telegraph, and touch-control layers.
- `elite-guardian-full-motion-runtime.jpg` shows the normalized 24-cell runtime atlases for Kiln Warden, Pressure Widow, Cinder Bishop, and Grinder Saint introduced in 0.10.7.
- `elite-guardian-directional-motion-preview.gif` cycles all four elite guardians through every idle, move, and signature-attack direction.
- `elite-guardian-gameplay-preview.jpg` places selected integrated elite runtime cells into a pressure-room motion lab with distinct locked attack directions and representative telegraphs.
- `identity-lock-corrections-v3.jpg` shows the approved serious BOY, lean long-bearded Honey Badger, thin Mr. Kroo, papakha-wearing Hadida, and Kaprizard-faced main-boss master.
- `identity-lock-directional-preview.gif` cycles the corrected four heroes and Hollow Roaster through the live E/SE/S/SW/W/NW/N/NE idle sectors.
- `identity-scale-lock-v4.jpg` compares the five normalized playable-hero silhouettes at one gameplay height against the deliberately oversized refined Kaprizard boss.
- `identity-scale-directional-v4.gif` cycles the normalized heroes and oversized boss through the live E/SE/S/SW/W/NW/N/NE sectors.
- `hollow-roaster-complete-animation-v1.jpg` shows the exact seven live Hollow Roaster states across all eight runtime directions.
- `hollow-roaster-complete-animation-v1.gif` cycles those integrated base, special, reaction, and defeat cells by direction.
- `hero-animation-keyposes.jpg` records the current hero motion-key references.
- `enemy-animation-keyposes.jpg` records the current enemy and boss motion-key references.

The gameplay composites use approved room, hero, and enemy production references plus representative HUD and effect layers. They are not live browser captures. The 0.12.0 combat composites use the exact Hollow Roastery runtime room files and extracted cells from the integrated character/enemy atlases; their HUD, obstacles, hazards, and telegraphs are representative deterministic overlays. The current renderer supports both playable tours, thirty room plates, twelve environment-motion profiles, ten tour-specific destructible families, integrated eight-direction hero atlases, eight standard-enemy atlases, eight elite-guardian base atlases, complete secondary/reaction coverage for all four Rootfall elites, and complete base/special/reaction coverage for both Kaprizard-faced main bosses. Directional ability/victory frames, Hollow Roastery elite secondary/reaction animation, richer safe-room interactions, and live Rootfall gameplay capture boards remain production work.

Tour 01 and Tour 02 are playable in the repository today. Rootfall Jungle establishes the rule for every later tour: it owns its environment bible, monster family, hazards, guardians, boss, animations, and progress record and is not a recolor of the first tour. The content validator rejects repeated tour themes, repeated enemy families, and cross-tour enemy placement.
