# Art Direction

## Tone

Serious dark fantasy with a tour-specific material language. Hollow Roastery uses scorched brass, black ceramic, steam pressure, volcanic glass, aged leather, hard shadows, and controlled amber highlights. Rootfall Jungle uses wet stone, ancient roots, black sap, venom green, cold mycelial light, blood-red briars, and restrained amber corruption.

Avoid cute food mascots, smiling beans, toy proportions, and generic children's-cartoon language. Coffee influences materials, architecture, weapons, rituals, and atmosphere rather than turning every creature into food.

## Character pipeline

The 0.13.0 roster uses project-owner-supplied reference art for Honey Badger, BOY, Mr. Kroo, Hadida, and Pata. Directional still atlases plus cleaned eight-direction idle/run/attack and hit/defeat atlases now appear in combat at one shared playable-character height. They validate identity, silhouette, costume, weapon, state timing, and phone-scale readability; directional ability/victory coverage and likeness releases remain required before commercial release.

1. Receive photographs or reference art and written likeness approval from the person represented.
2. Lock the canonical weapon and costume for every hero.
3. Produce and approve a front/side/back character sheet and facial-expression sheet.
4. Generate or sculpt production assets from the approved sheet.
5. Clean anatomy, topology, hands, clothing, props, and identity consistency manually.
6. Rig and create movement, attack, hit, ability, victory, and defeat animations.
7. Test readability on a phone before final export.

Higgsfield is the primary concept and motion-reference pipeline for DOFFA Heroes. The current master-lineup pass uses the five owner-supplied references and the locked weapons: Honey Badger / katana plus secondary shuriken, BOY / hammer, Mr. Kroo / black recurve bow, Hadida / bat, and Pata / pressure coffee rifle.

The Higgsfield production order is:

1. Approve one shared visual-language lineup for scale, materials, palette, and silhouette.
2. Generate one identity-locked turnaround per hero: front, three-quarter, side, and back.
3. Generate weapon close-ups and attack-key poses before any motion pass.
4. Generate short movement, attack, hit, ability, victory, and defeat references from the approved stills.
5. Convert approved motion references into deterministic runtime sprite sheets, then clean every frame manually.

The first five-character turnaround and attack-key-pose passes were corrected for milestone 0.10.1 with one shared prompt structure, camera, lighting system, material language, and locked weapon brief. Each hero now has neutral, run, attack, hit, and defeat references. Reviewed single-frame derivatives are used in the preview; full source sheets remain external production references pending cleanup and likeness clearance.

## Identity and scale lock — 0.10.9

- Every main tour boss uses Kaprizard's recognizable face with a stern, closed-mouth, non-smiling expression. The refined identity anchor locks his broad facial structure, short black hair, natural thick brows, dark eyes, and short reddish-brown beard. Boss bodies, armor, scale, mechanics, and tour materials remain free to change and must stay unique to their tour.
- BOY uses the owner-supplied second facial reference: short dark hair, very long dense black beard, serious closed-mouth expression, black `BOY` hoodie, blue pants, and hammer.
- Honey Badger stays bald, tattooed, visibly lean, and armed with a katana plus belt-carried shuriken. His beard is now the same long, dense, full black type as BOY's while his face remains Honey Badger's own.
- Mr. Kroo is visibly thin in every frame and keeps the backward cap, sunglasses, black recurve bow, and compact quiver identity. Scissors and shuriken are forbidden in all new Mr. Kroo art.
- Hadida wears the tall black Caucasian wool papakha in every portrait, movement direction, attack, hit, and defeat frame and keeps the hardwood bat.
- The private photo inputs remain outside the public repository. Only reviewed stylized derivatives are shipped.
- A smiling frame, body-shape drift, missing papakha, shortened Honey beard, or boss-face substitution is a failed asset and must not enter `assets/`.
- Honey Badger, BOY, Mr. Kroo, Hadida, and Pata share one gameplay render height and one normalized atlas footprint. Only a main boss may use the intentionally giant character scale; weapons, hats, hair, and poses may extend beyond the common body line without changing the hero's stature.

## Locked gameplay camera

- All runtime heroes, enemies, bosses, rooms, props, hazards, pickups, and weapon animations use one fixed orthographic top-down camera pitched approximately 58 degrees from horizontal.
- Runtime character art must primarily show the top of the head, shoulders, weapon, and arena footprint while retaining a readable full-body silhouette at phone scale.
- Front, profile, and cinematic three-quarter views are allowed only for menus, portraits, and marketing. They are not valid combat sprites.
- Directional masters cover N, NE, E, SE, S, SW, W, and NW at identical scale before animation production begins.
- Runtime movement and aiming remain continuous across 360 degrees. The eight authored directions supply the nearest animation set; weapon origins, projectiles, telegraphs, and collision use the exact continuous angle.
- Every hero receives idle, run, attack anticipation, attack impact, recovery, hit, defeat, and victory motion authored from the same Higgsfield reference element and camera lock.
- Long colored weapon ribbons are not part of the runtime language. Motion must read through pose, weapon placement, brief impact shapes, particles, and contact feedback.

The previous front/three-quarter sheets remain likeness and costume references only. They are not approved as combat-camera assets.

Raw generations are never treated as final game-ready assets. Anatomy, likeness, hands, weapon construction, frame continuity, alpha edges, and phone-scale readability must pass review before an image enters `assets/`.

## Higgsfield environment pipeline

- Every tour starts with a Higgsfield environment bible covering the shared camera, floor grid, walls, doors, obstacles, hazards, props, lighting, palette, and boss-room language.
- Standard, elite, event, rest, and boss rooms are generated as clean top-down plates from that bible before they are converted into modular runtime tiles and collision data.
- Enemies, bosses, pickups, props, and effects are generated from the same tour bible so lighting and perspective never drift between the character layer and the room.
- A new tour must introduce its own architecture, monster family, boss, hazards, and palette; it cannot be a recolor of a previous tour.

The first Hollow Roastery room-board pass is Higgsfield job `0449a571-2b65-4911-bb00-44905ce3e306`. It contains six aligned production references: ash storage, cracked furnace, grinder hall, steam chamber, pressure-pipe room, and the boss roaster. Milestone 0.12.0 converts that approved visual target into six exact 720×1280 runtime plates; milestone 0.14.0 adds Soot Conveyor, Boiler Gallery, Meter Chamber, Vapor Crypt, and Final Gauge as second architectures for the five standard districts; milestone 0.15.0 adds four dedicated safe-room compositions and five transparent destructible prop masters. Milestone 0.16.0 adds a separate ten-plate Rootfall bible covering Canopy, Mire, Mycelium, Briar, Rootdeep, four organic safe rooms, and the Root Throne. Milestone 0.16.1 adds five alternate standard-district architectures generated directly through Higgsfield Soul Location, bringing Rootfall to fifteen runtime plates. Collision markup, hazards, obstacles, doors, telegraphs, prop health, and encounter labels stay as independent runtime layers. Additional layout coverage, collision-mask tooling, and broader phone/performance testing remain production work.

## Rootfall Jungle visual lock — 0.16.0

- Rootfall is damp, ancient, predatory, and fully organic. Exposed mechanisms, boilers, pipes, gauges, brass armor, smoke engines, and Roastery silhouettes are forbidden.
- Canopy uses rain-dark stone, hanging roots, dense leaves, red coffee cherries, and green shafts of light.
- Mire uses black water, mud, drowned masonry, roots, algae, and sparse venom-green highlights.
- Mycelium uses pale fungal columns, turquoise spore light, violet shadow, and cathedral-like natural structures.
- Briar uses hooked thorns, blood-red flowers, strangler vines, narrow lanes, and dark stone ossuaries.
- Rootdeep uses enormous rib-like roots, black sap channels, compressed earth, amber corruption, and a sense of descending scale.
- Root Throne is an open boss arena framed by massive roots and a concentrated black-sap/amber pulse. The playable center stays clear enough to read the Root Tyrant's crown, lane, phase, and rush telegraphs.
- Five standard environments each own two 720×1280 runtime architectures and three independent deterministic collision layouts. The four safe rooms and boss room use unique plates.
- Leaf drift, mire bubbles, mycelial glow, briar motion, root light, and Root Throne pulse remain visual-only seeded layers behind combat.
- Thorn, venom, spore, and grasping-root hazards use distinct colors and timing. Ambient particles never imitate their filled damage circles or attack telegraphs.

## Runtime room-plate lock — 0.12.0

- Every plate uses the fixed 58-degree top-down camera and a centered 9:16 arena with top exit and bottom entry.
- Large machinery is confined to walls and corners; the central combat lane stays readable for 360-degree movement, enemies, projectiles, and the oversized boss.
- Ash, ember, brass, smoke, pressure, and heart districts have distinct architecture and lighting rather than palette-only recolors.
- The Roaster Heart keeps its reactor in the upper wall and leaves the boss zone empty; the boss itself remains a separate animated entity.
- Runtime JPEGs are opaque, 720×1280, locally cached, and loaded through a validated environment catalog with the procedural arena retained as fallback.
- Decorative background features never imply collision or damage. Only the deterministic gameplay overlay controls blocking and hazards.

## Runtime environment-motion lock — 0.13.0

- Ambient motion reinforces the six room identities: ash falls, furnace light breathes, grinder hardware rotates, steam drifts, pressure valves discharge, and the Heart reactor pulses.
- Every room identity deterministically selects its visual phase, active side, intensity, and one of four variants. The system never consumes combat RNG, so decoration cannot change enemy spawns, drops, or attacks.
- Ambient steam and glow remain at the perimeter or below gameplay contrast. They never reuse the strong filled circles, lane shapes, or countdown language reserved for damaging hazards and attack telegraphs.
- Animation pauses with the simulation and resumes from the same clock. Re-entering the same authored room reproduces the same motion identity rather than a random visual arrangement.
- The preview GIF is generated from the same effect-state and mote functions used by the runtime; it is a compact review artifact, not a screen recording.

## Runtime architecture-variation lock — 0.14.0

- Ash, ember, brass, smoke, and pressure each own two structurally different 720×1280 plates; the second pass changes perimeter machinery and floor construction rather than applying a palette swap.
- Odd and even room numbers alternate the two plates across every district. The assignment is deterministic, does not consume combat RNG, and cannot change enemies, damage, drops, collision, hazards, or telegraph timing.
- The Roaster Heart remains a single unique finale plate so the main boss never appears in a recycled standard-room shell.
- Every variant preserves the locked 58-degree top-down camera, centered top exit and bottom entry, quiet combat contrast, and open center. Illustrated machinery remains non-colliding decoration.
- The runtime caches by exact sprite path and decodes only a room's selected variant. All eleven plates remain available to the offline PWA.

## Monster rule

Each tour owns a distinct monster family, visual grammar, attack language, palette, and boss. Later tours do not recolor and rename an earlier monster. Shared technical rigs are acceptable only when the final silhouette and behavior remain clearly different.

The Hollow Roastery family uses scorched organic tissue, black iron, aged ivory, tarnished brass, pressure hardware, smoke, and internal furnace light. Ash Hound is a low charging predator; Ember Oracle is a vertical occult caster; Brass Colossus is a broad piston-driven tank; Smoke Revenant is a thin floating gunner; Hollow Roaster is a four-limbed furnace engine. Their silhouettes remain distinguishable even before color and effects are applied.

The Rootfall Jungle family uses chitin, wet bark, strangler roots, seed pods, fungal membranes, thorn armor, black sap, and bioluminescent spores. Razor Mantis is a narrow bladed pouncer; Seed Spitter is a planted ranged pod; Root Stalker is a low burrowing ambusher; Spore Moth is a wide floating caster. Briar Jaguar, Mire Bellower, Orchid Maw, and Strangler Ape remain distinct elite silhouettes rather than enlarged standard enemies. The Root Tyrant is the only giant in the tour: a black-sap root titan carrying Kaprizard's locked stern face.

Milestone 0.11.0 completes the Kaprizard-faced Hollow Roaster with deterministic idle, move, primary attack, pressure-lanes attack, phase-two, hit, and defeat coverage across all eight directions. Movement uses actual post-collision displacement; telegraph windups and releases use locked aim; phase and defeat override ordinary reactions so the boss never points away or snaps back to idle. The atlas builder validates the eight runtime sectors as `E/SE/S/SW/W/NW/N/NE`. The available built-in reference-image pipeline was driven by the approved Higgsfield production specification and locked identity masters; these files are not represented as direct Higgsfield renders. Automatic extraction rejects malformed component counts, wrong dimensions, or missing alpha before an asset enters `assets/`.

Milestone 0.16.0 applies the same identity and camera locks to Kaprizard — The Root Tyrant while changing every non-face property: root-and-black-sap body, 340-pixel runtime height, root-lane attack, thorn crown, Black Sap Awakening, enraged rush, and the Root Throne environment. Its serious expression is preserved across base, secondary, phase, hit, and defeat atlases.
