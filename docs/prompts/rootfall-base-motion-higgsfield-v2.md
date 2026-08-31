# Rootfall Jungle base motion — Higgsfield production specification v2

> **Superseded and blocked from production.** The single `4×6` generation layout repeatedly duplicated directions, rotated bodies, and introduced grid artifacts. Keep this file only as an audit record. New work must follow `rootfall-multiframe-higgsfield-v3.md`; do not submit this v2 prompt again and do not connect its output to runtime.

This document defines the production source sheets that replace the nine rejected Rootfall Jungle `*-motion-v1.png` atlases. It covers Razor Mantis, Seed Spitter, Root Stalker, Spore Moth, Briar Jaguar, Mire Bellower, Orchid Maw, Strangler Ape, and Kaprizard — The Rootfall Tyrant.

The replacement art must be generated through Higgsfield from the approved subject references, reviewed as source art, normalized through the repository builder, and accepted in live gameplay before it is referenced by the content catalog. A raw generation is never a production runtime asset.

## Runtime limitation

The current enemy renderer selects one key pose for each state and direction. A base motion atlas therefore contains:

- eight authored directions: `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`;
- three states: `idle`, `move`, and `attack`;
- 24 cells in total.

This v2 pass fixes camera direction, front/back anatomy, upside-down or sideways bodies, identity drift, matte contamination, and state readability. It does **not** create a true multi-frame idle loop, locomotion cycle, or attack cycle. Those require a later renderer and atlas-schema extension with multiple frames per state and direction. Do not describe these 24-cell sheets as complete multi-frame animation.

## Rejected pilot record

The `nano_banana_2_lite` Razor Mantis pilot was rejected. It duplicated directions and drew visible grid lines, so it failed the authored eight-direction and clean-source-sheet requirements. The failed pilot is not production art, must not be copied into `assets/enemies/`, and must not be referenced by runtime content. Its only value is documenting that model/prompt combination as unsuitable without further correction.

## Required Higgsfield source layout

Generate one image per enemy. Never combine different enemies in one sheet.

- Canvas: vertical `2:3`.
- Preferred resolution: `2048x3072`, or the highest available `2:3` resolution.
- Grid: exactly four columns by six rows.
- Background: perfectly flat RGB `#00FF00`.
- Content: exactly 24 separate complete figures, four in every row.
- No printed labels, compass marks, borders, or visible grid lines.

| Source row | State | Directions from left to right |
| ---: | --- | --- |
| 1 | Idle | N, NE, E, SE |
| 2 | Idle | S, SW, W, NW |
| 3 | Move | N, NE, E, SE |
| 4 | Move | S, SW, W, NW |
| 5 | Primary attack | N, NE, E, SE |
| 6 | Primary attack | S, SW, W, NW |

Direction names describe the creature's real forward body, nose, chest, and attack vector on the game screen. The camera never rotates. North faces upward and away from the camera; south faces downward toward the camera. East and west are true profiles. Every diagonal is separately authored. A rotated, flopped, or mirrored finished bitmap is not acceptable.

## Shared Higgsfield prompt

Append exactly one subject block from the following section to this shared prompt.

```text
DOFFA HEROES — ROOTFALL JUNGLE production runtime sprite source sheet.

Use the attached creature reference as a strict subject-identity anchor. Preserve the exact creature species, silhouette, anatomy, limb count, proportions, materials, colors, markings and recognizable details in every cell. Ignore and do not reproduce any white, red, purple or dirty matte artifacts around the attached cutout.

OUTPUT LAYOUT:
Create one vertical 2:3 image containing exactly 24 separate full-body figures arranged in an exact invisible 4-column by 6-row grid. Every row must contain exactly four complete figures.

Row 1: IDLE facing N, NE, E, SE.
Row 2: IDLE facing S, SW, W, NW.
Row 3: MOVE facing N, NE, E, SE.
Row 4: MOVE facing S, SW, W, NW.
Row 5: PRIMARY ATTACK facing N, NE, E, SE.
Row 6: PRIMARY ATTACK facing S, SW, W, NW.

DIRECTION LOCK:
Direction means the creature's real forward body, nose, chest and attack vector on the game screen.
N faces upward and away from the camera, showing the back.
NE faces upward-right and away.
E is a true right-facing side view.
SE faces downward-right toward the camera.
S faces downward toward the camera, showing the front.
SW faces downward-left toward the camera.
W is a true left-facing side view.
NW faces upward-left and away.

The orthographic camera stays completely fixed in every cell. Rotate the actual creature naturally around its vertical body axis. Never rotate, tilt, flop or spin a finished front-view bitmap in the image plane. Gravity and the arena floor remain identical in all 24 cells.

CAMERA AND STYLE:
Fixed orthographic top-down gameplay camera, approximately 58 degrees above the horizontal arena plane. Show the top of the head, shoulders or carapace and the ground-facing footprint while preserving a readable full-body silhouette. Serious dark organic fantasy mobile-game asset, detailed sculptural hand-painted 2.5D rendering, wet bark, chitin, roots, fungal tissue and restrained biological glow. High silhouette clarity at phone scale. This is original DOFFA Heroes art.

CONSISTENCY:
Use the exact same creature design and body scale in all 24 cells. Each direction must be genuinely authored with correct front, side and back anatomy. Keep the center and ground or hover anchor stable. Fill approximately 75–82 percent of each cell while retaining at least 10 percent empty green margin. Keep every limb, wing, tail, thorn and weapon completely inside its own cell. Never overlap adjacent cells.

ANIMATION POSES:
Idle is a restrained combat-ready breathing pose.
Move clearly shifts weight in the travel direction and is visibly different from idle.
Primary attack is a readable anticipation or release key pose aimed in the listed direction and is visibly different from both idle and move.

EXTRACTION LOCK:
Use one perfectly flat solid RGB #00FF00 chroma-green background across the entire sheet. No gradients, texture, horizon, environment, floor, pedestal, drop shadow, contact shadow, ambient circle or reflection. No detached particles, projectiles, seeds, spores, dust, sap, pollen, debris, motion trails, speed lines, glow halos or magic effects. The creature itself must form one complete connected main silhouette in each cell.

FORBIDDEN:
No text, letters, numbers, captions, compass labels, borders or visible grid lines.
No duplicate directions.
No mirrored substitute poses.
No image-plane rotation.
No profile or cinematic camera.
No cute, chibi, toy, cartoon-food or pixel-art treatment.
No machinery, brass, pipes, boilers, guns or exposed mechanical parts.
No extra creatures, missing limbs, floating anatomy, cropped anatomy or design drift.
```

## Subject blocks

### Razor Mantis

Primary reference: `assets/enemies/razor-mantis.png`.

```text
SUBJECT — RAZOR MANTIS:
A narrow six-limbed predatory jungle mantis built from leaf-shaped chitin, wet bark fibers and dark burgundy organic joints. It has two unmistakable long sickle forearms, narrow leaf wings, hooked rear legs, curled antennae and hostile yellow-green eyes. No metal.

Idle: low alert hunting crouch with blades separated.
Move: fast low insect scuttle with a clear forward stride.
Primary attack: compressed aimed pounce anticipation, hind legs loaded and both sickle blades directed forward. Do not show detached leaf bolts.
```

### Seed Spitter

Primary reference: `assets/enemies/seed-spitter.png`.

```text
SUBJECT — SEED SPITTER:
A low heavy quadrupedal carnivorous seed-pod beast. Preserve its toothed forward muzzle, visible golden seeds inside the mouth, multiple thorned green-and-red pods growing from its back, hooked root tail and bark-covered clawed legs.

Idle: planted defensive stance, mouth partly closed.
Move: heavy rooted shuffle with one front and opposite rear limb advancing.
Primary attack: muzzle and seed sacs compressed toward the target, mouth open and aimed. Keep all seeds inside the mouth; no detached seed projectiles, spray or saliva.
```

### Root Stalker

Primary reference: `assets/enemies/root-stalker.png`.

```text
SUBJECT — ROOT STALKER:
A low asymmetrical burrowing root predator with a hollow bark head, broad hooked scythe claws, multiple root legs, leaf growth, red-brown fungal tissue and trailing connected tendrils. It must remain clearly different from the upright Orchid Maw.

Idle: flattened listening crouch.
Move: low crab-like root scuttle aimed forward.
Primary attack: emergence or burrow-windup pose, torso coiled and both primary claws spread toward the target. No soil cloud, hole, stones or detached roots.
```

### Spore Moth

Primary reference: `assets/enemies/spore-moth.png`.

```text
SUBJECT — SPORE MOTH:
A wide floating predatory moth with four large dark organic wings, skull-like wing markings, cold turquoise-blue bioluminescent wing edges, violet eyes, red-brown thorax and connected dangling legs. Preserve the same wing pattern in all cells.

Idle: symmetrical hovering wing pose.
Move: directional wing sweep and subtle body banking while the body itself truly faces the travel direction.
Primary attack: wings braced open and thorax aimed forward for a five-spore cast. No detached spores, stars, glow clouds or projectile trails.
```

### The Briar Jaguar

Primary reference: `assets/source/rootfall-elites/briar-jaguar-combat-sheet-v1.png`. The static `assets/enemies/briar-jaguar.png` may be attached as a secondary silhouette reference.

```text
SUBJECT — THE BRIAR JAGUAR:
A lean elite quadrupedal jaguar made from black wet bark, tightly braided vines and sharp blood-red thorns, with amber eyes, long thorned tail, large natural claws and a feline head. Match the approved Higgsfield combat-sheet identity. Never make it bipedal.

Idle: predatory four-legged crouch.
Move: long low feline prowl stride.
Primary attack: rake-chain anticipation, one foreclaw loaded across the body and the second aimed forward. No thorn rosette, giant branch crown, detached thorns or projectile effects.
```

### The Mire Bellower

Primary reference: `assets/source/rootfall-elites/mire-bellower-combat-sheet-v1.png`.

```text
SUBJECT — THE MIRE BELLOWER:
A massive elite swamp amphibian with broad rooted limbs, dark wet mossy hide, cattails and reeds attached to its back, heavy clawed feet and a recognizable turquoise bioluminescent throat sac. Match the approved Higgsfield combat-sheet identity.

Idle: broad stable amphibian squat, throat sac relaxed.
Move: heavy forward hop-crawl with clear limb weight transfer.
Primary attack: tongue-lane anticipation, body aimed forward, mouth open and throat sac compressed. The tongue may remain short and physically attached inside the mouth. No detached tongue, water rings, puddles, waves or projectiles.

In N, NW and NE views, show the real back, reeds and shoulder mass; do not show the frontal throat sac as if painted on the back.
```

### The Orchid Maw

Primary reference: `assets/source/rootfall-elites/orchid-maw-combat-sheet-v1.png`.

```text
SUBJECT — THE ORCHID MAW:
An elite carnivorous orchid-tree creature walking on multiple connected root legs. Preserve the large magenta-and-cream spotted toothed flower maw, attached tongue, twisted dark trunk, root claws and smaller hanging orchid buds. Match the approved Higgsfield combat-sheet identity.

Idle: flower partly closed in a restrained stalking stance.
Move: unmistakable root-leg stepping pose aimed in the travel direction.
Primary attack: petal-clamp anticipation or release with the central toothed maw opened toward the target. No pollen spiral, detached pollen, gas cloud or projectile.
```

### The Strangler Ape

Primary reference: `assets/source/rootfall-elites/strangler-ape-combat-sheet-v1.png`.

```text
SUBJECT — THE STRANGLER APE:
A powerful elite black-furred gorilla wrapped in strangler vines, layered bark armor, moss and attached leaves. Preserve the broad gorilla torso, massive bark-wrapped forearms, natural knuckles, dark face and hostile red eyes. Match the approved Higgsfield combat-sheet identity. It is larger than standard monsters but is not a giant main boss.

Idle: grounded knuckle stance.
Move: heavy directional knuckle-run stride.
Primary attack: vine-charge anticipation, torso leaning toward the target with both fists loaded for a forward rush. No rootquake ring, detached roots, stones or projectiles.
```

### Kaprizard — The Rootfall Tyrant

Reference priority:

1. A clean crop of the newest owner-supplied Kaprizard face reference, without phone UI or text. The private input stays outside the public repository.
2. `assets/enemies/rootfall-tyrant-kaprizard-v1.png` for the approved body language.
3. If the model accepts another reference, the current Rootfall Tyrant special or reaction sheet may be used only to preserve body construction.

```text
SUBJECT — KAPRIZARD, THE ROOTFALL TYRANT:
The only giant boss in this tour: a colossal humanoid root titan built from black sap, ancient ribbed roots, charred bark armor, restrained amber corruption, thorn growth and asymmetrical massive root arms.

IDENTITY LOCK:
The human face must preserve Kaprizard's recognizable broad facial structure from the attached identity reference: short black hair, natural thick dark eyebrows, dark eyes, broad nose and short reddish-brown beard. Serious hostile expression, closed mouth, absolutely no smile and no visible teeth. Preserve the same head and face in every appropriate direction without turning it into a generic fantasy warrior.

Directional anatomy must remain honest:
S, SE and SW show the recognizable face.
E and W show true profiles.
N, NE and NW show the back or top-back of the head and the titan's root back. Never paint a second face onto the back of the head, shoulders or torso.

Idle: immovable threatening root-titan stance.
Move: extremely heavy deliberate stride with body weight shifting forward.
Primary attack: thorn-crown or heavy-arm attack anticipation, arms and upper roots contracting toward the target. No root lanes, projectile crown, sap rings, detached thorns or phase aura.

Keep the head subtly readable at phone scale without using a caricatured oversized head. Do not reuse the Hollow Roaster body, mechanical armor, boilers or brass.
```

## Credit-efficient generation order

Estimate the exact cost for one reference-controlled `2:3` image before starting and reserve at least one image-equivalent for a corrected attempt.

1. Generate Razor Mantis as the only pilot.
2. Validate all 24 cells, direction semantics, camera, chroma extraction, and runtime assembly.
3. Only after the pilot passes, generate Seed Spitter, Root Stalker, Spore Moth, and Rootfall Tyrant.
4. Generate the elites in encounter order when the remaining balance permits: Briar Jaguar, Mire Bellower, Orchid Maw, Strangler Ape.

Do not buy multiple variants by default. Do not submit all nine before the pilot passes. Do not compress multiple enemies into one board. A cheaper model that cannot retain 24 consistent subject identities is false economy.

Use this hard-budget calculation:

```text
available image count = floor((balance - one retry reserve) / per-image cost)
```

## File naming and provenance

Do not overwrite the rejected `v1` runtime files during review. Store approved source sheets and runtime derivatives with explicit v2 names:

```text
assets/source/rootfall-base-motion/razor-mantis-base-motion-sheet-v2.png
assets/enemies/razor-mantis-motion-v2.png
```

Use the same naming pattern for:

- `seed-spitter`;
- `root-stalker`;
- `spore-moth`;
- `briar-jaguar`;
- `mire-bellower`;
- `orchid-maw`;
- `strangler-ape`;
- `rootfall-tyrant`.

For each accepted source record the Higgsfield model, job ID, date, prompt version, source references, review result, and reviewer. Private likeness photographs stay outside the repository. Only approved stylized derivatives ship.

## Build command

Build each accepted 4x6 source sheet without mirrored compass correction, custom direction maps, or bitmap flips:

```bash
node scripts/build-full-motion-atlas.mjs \
  assets/source/rootfall-base-motion/ENEMY-base-motion-sheet-v2.png \
  assets/enemies/ENEMY-motion-v2.png \
  --chroma-green \
  --split-directions
```

The builder must emit a transparent `1152x2016` `sRGBA` runtime atlas. It reorders the authored source directions into the engine order `E, SE, S, SW, W, NW, N, NE`. Only after visual and runtime acceptance should `src/game/content.js` be updated from `motion-v1.png` to the corresponding `motion-v2.png` path.

## Acceptance checklist

### Higgsfield source sheet

- [ ] The image is vertical `2:3` and contains exactly six rows of four figures.
- [ ] There are exactly 24 complete main figures.
- [ ] N shows the real back and S shows the real front.
- [ ] E and W are true profiles.
- [ ] NE, SE, SW, and NW are separately authored anatomical views.
- [ ] No direction is duplicated or substituted with a mirror.
- [ ] No body is rotated sideways or upside down in the image plane.
- [ ] Camera pitch, gravity, scale, and lighting remain stable across all cells.
- [ ] Idle, move, and attack are clearly different poses.
- [ ] Identity, anatomy, materials, colors, markings, and limb count remain consistent.
- [ ] No body part is clipped or crosses into a neighboring cell.
- [ ] Each figure retains at least 10 percent green clearance.
- [ ] Background is uniformly `#00FF00` with no floor, texture, shadow, or gradient.
- [ ] There are no labels, borders, compass letters, or visible grid lines.
- [ ] There are no detached projectiles, particles, debris, puddles, roots, spores, or VFX.
- [ ] There are no white, red, purple, or dirty matte artifacts.
- [ ] The Razor Mantis source does not reproduce the rejected `nano_banana_2_lite` pilot's duplicated directions or grid lines.

### Runtime atlas

- [ ] `build-full-motion-atlas.mjs` succeeds with `--chroma-green --split-directions` only.
- [ ] Chroma component validation finds `4/4/4/4/4/4` main figures.
- [ ] `identify` reports `1152 2016 srgba`.
- [ ] Deep PNG decompression validation passes.
- [ ] Alpha edges contain no green, white, red, or purple fringe.
- [ ] Ground or hover anchor does not jump between directions and states.
- [ ] The new file remains `motion-v2.png` until it is explicitly accepted.

### Live gameplay

- [ ] All eight directions are inspected for idle, move, and attack.
- [ ] Movement faces the actual movement vector.
- [ ] Attack faces the locked target vector.
- [ ] South reads as the front and north reads as the back.
- [ ] The sprite remains readable at its configured render height: Mantis 112 px, Spitter 126 px, Stalker 138 px, Moth 132 px, Jaguar 220 px, Bellower 230 px, Orchid 238 px, Ape 244 px, Tyrant 340 px.
- [ ] Only the Rootfall Tyrant reads as a giant main boss.
- [ ] Kaprizard likeness is manually approved in S, SE, SW, E, and W.
- [ ] N, NE, and NW do not contain a duplicate face.
- [ ] The runtime path and service-worker precache are updated only after approval.
- [ ] A cold offline launch loads every accepted v2 atlas.
