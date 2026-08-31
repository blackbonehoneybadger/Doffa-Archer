# Rootfall multi-frame production — Higgsfield specification v3

The machine-readable production manifest and deterministic page-assembly contract are defined in [rootfall-multiframe-manifest-schema-v1.md](rootfall-multiframe-manifest-schema-v1.md).

This specification replaces the rejected single-sheet v2 workflow. It creates genuine multi-frame animation for all nine Rootfall enemies without rotating, mirroring, duplicating, or lowering the quality of a generated direction.

## Non-negotiable quality rule

- If Higgsfield is queued, unavailable, slow, or temporarily fails, keep the job waiting or retry with the exact approved parameters.
- Never switch to a cheaper model, lower resolution, lower background-removal tier, turbo preset, or generic substitute to finish faster.
- Never fill a missing direction by flipping, rotating, warping, or reusing another direction.
- A partial generation batch stays outside runtime until the complete enemy passes every automated and manual gate.
- Work on code, manifests, tests, and previews may continue while generation is waiting.

## Required authored coverage

Each enemy requires 128 approved source frames:

| Clip | Frames per direction | Directions | Total |
| --- | ---: | ---: | ---: |
| Idle | 4 | 8 | 32 |
| Move | 6 | 8 | 48 |
| Primary attack | 6 | 8 | 48 |
| **Total** |  |  | **128** |

Runtime direction order is `E, SE, S, SW, W, NW, N, NE`.

Every direction is a real authored anatomical view. `N` shows the back, `S` shows the front, `E/W` are true profiles, and diagonals have their own front/back anatomy. The orthographic camera remains approximately 58 degrees above the arena plane.

## Generation order

1. Produce eight clean directional masters in this review order: `S, N, E, W, SE, SW, NE, NW`.
2. Reject the set immediately if `W`, `NW`, or any other view is mirrored, front-painted, or camera-inconsistent.
3. From each approved directional master, produce three separate clip groups: idle, move, and primary attack.
4. Generate only one direction and one clip per job. A compact `1×4` or `1×6` strip may be accepted only after a pilot proves exact frame count, continuity, camera lock, and clean extraction. Otherwise produce individual frames.
5. Use the same directional master plus the previous accepted frame as continuity references.
6. Finish and approve one enemy before spending credits on the next.

The Razor Mantis remains the pilot. The rejected `nano_banana_2_lite` sheet in `output/higgsfield-tests/` is an audit artifact only and must never be used as a reference or runtime source.

## Motion requirements

### Idle — four-frame seamless loop

1. combat-ready neutral;
2. restrained inhale or organic tension;
3. peak tension;
4. return toward neutral.

Frame 4 must flow back into frame 1 without a camera, scale, anchor, anatomy, or lighting jump.

### Move — six-frame loop

Show a real locomotion cycle and weight transfer for the creature's anatomy. A translated idle pose is a rejection. Frame 6 must flow back into frame 1.

### Primary attack — six-frame one-shot

1. neutral transition;
2. anticipation;
3. maximum windup;
4. strike or release;
5. follow-through;
6. recovery.

Do not bake detached projectiles, dust, spores, roots, trails, impact flashes, or floor effects into body frames.

## Physical runtime pages

Logical animation has eight direction columns, but physical files are split into two four-direction pages so every frame remains `288×336` and no texture exceeds the current safe `1152×2016` envelope.

| Page | Directions | Idle dimensions | Move dimensions | Attack dimensions |
| --- | --- | ---: | ---: | ---: |
| A | `E, SE, S, SW` | `1152×1344` | `1152×2016` | `1152×2016` |
| B | `W, NW, N, NE` | `1152×1344` | `1152×2016` | `1152×2016` |

Each page stores directions in columns and animation time in rows. Runtime chooses the page from direction, then advances the row by clip time. Pages load on demand; legacy `4×6` atlases remain a fallback until an entire v3 enemy is approved.

Example runtime metadata:

```js
{
  version: 1,
  directions: ["east", "south-east", "south", "south-west", "west", "north-west", "north", "north-east"],
  pages: {
    "idle-a": { sprite: "/assets/enemies/razor-mantis-idle-a-v3.png", columns: 4, rows: 4, directions: ["east", "south-east", "south", "south-west"] },
    "idle-b": { sprite: "/assets/enemies/razor-mantis-idle-b-v3.png", columns: 4, rows: 4, directions: ["west", "north-west", "north", "north-east"] },
    "move-a": { sprite: "/assets/enemies/razor-mantis-move-a-v3.png", columns: 4, rows: 6, directions: ["east", "south-east", "south", "south-west"] },
    "move-b": { sprite: "/assets/enemies/razor-mantis-move-b-v3.png", columns: 4, rows: 6, directions: ["west", "north-west", "north", "north-east"] },
    "attack-a": { sprite: "/assets/enemies/razor-mantis-attack-a-v3.png", columns: 4, rows: 6, directions: ["east", "south-east", "south", "south-west"] },
    "attack-b": { sprite: "/assets/enemies/razor-mantis-attack-b-v3.png", columns: 4, rows: 6, directions: ["west", "north-west", "north", "north-east"] }
  },
  clips: {
    idle: { pages: ["idle-a", "idle-b"], startRow: 0, frameCount: 4, fps: 4, loop: true },
    move: { pages: ["move-a", "move-b"], startRow: 0, frameCount: 6, fps: 10, loop: true },
    attack: { pages: ["attack-a", "attack-b"], startRow: 0, frameCount: 6, fps: 15, loop: false, lockDirection: true }
  }
}
```

## Background and extraction

- Use one flat key color selected per enemy so it is clearly separated from that enemy's materials.
- Retain at least 8 percent empty key-color margin on every edge.
- Remove only the background connected to the outer border using a low, recorded tolerance.
- Never use global `#00FF00` transparency with high fuzz on green Rootfall bodies.
- Export lossless `PNG32` sRGBA. Do not palette-quantize with `-colors 512`.
- Body, weapon, wings, tail, roots, and attached vegetation remain one complete in-frame subject; VFX are exported separately.

## Automated rejection gates

- exactly 128 registered source frames and no reused source path;
- full decode of every source and output file;
- exactly one main connected foreground component unless the approved anatomy requires attached separated elements;
- at least 8 percent source margin;
- normalized anchor variance no greater than ±4 px;
- body-scale variation inside one clip no greater than 4 percent;
- alpha-edge key-color contamination below 0.5 percent;
- reject suspicious duplicate directions at SSIM above 0.965;
- reject mirrored substitutions when flipped SSIM exceeds 0.94;
- adjacent-frame silhouette-area change no greater than 12 percent;
- adjacent-frame center movement no greater than 6 px after anchor normalization;
- idle and move loops close cleanly;
- idle, move, and attack silhouettes remain visibly distinct;
- each physical page has the exact dimensions and `srgba` channels listed above.

## Manual approval gates

- fixed top-down camera and stable lighting;
- correct front, back, profiles, and all four diagonals;
- stable species identity, anatomy, limb count, materials, and markings;
- readable weight transfer in move;
- readable anticipation, strike/release, and recovery in attack;
- no grid lines, labels, shadows, floor, halos, detached VFX, clipped anatomy, or matte fringe;
- phone-scale gameplay preview at the real render height;
- direction-cycle and state-cycle preview;
- for Rootfall Tyrant, Kaprizard's face is recognizable only on front and appropriate profile views; no face appears on `N`, `NE`, or `NW`.

Only after every gate passes may the content catalog switch from `motion-v1.png` to the six approved v3 pages.
