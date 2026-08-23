# Rootfall multiframe assembler manifest — schema v1

`scripts/build-higgsfield-multiframe-pages.mjs` converts one complete,
approved Higgsfield enemy source set into six staging PNG pages. It does not
change `src/game/content.js`, the service-worker precache, or any existing
runtime asset.

The assembler is deliberately strict. It has no options for mirroring,
rotation, direction substitution, upscaling, palette quantization, cheaper
models, or incomplete coverage. If Higgsfield is unavailable, keep waiting;
do not alter the manifest quality lock to make a lower-quality batch pass.

## Command

```bash
node scripts/build-higgsfield-multiframe-pages.mjs \
  production/rootfall/razor-mantis/manifest.json \
  output/rootfall-v3/razor-mantis
```

The output directory must not already contain any of the six expected files.
The assembler validates all 128 source files before atomically publishing the
completed staging pages.

## Complete example

The `frames` array below is abbreviated for readability. A real manifest must
contain all 128 unique entries.

```json
{
  "version": 1,
  "enemyId": "razor-mantis",
  "frame": {
    "width": 288,
    "height": 336
  },
  "directions": [
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
    "north",
    "north-east"
  ],
  "clips": {
    "idle": {
      "frameCount": 4,
      "fps": 4,
      "loop": true
    },
    "move": {
      "frameCount": 6,
      "fps": 10,
      "loop": true
    },
    "attack": {
      "frameCount": 6,
      "fps": 15,
      "loop": false,
      "lockDirection": true
    }
  },
  "quality": {
    "provider": "higgsfield",
    "model": "seedream_v4_5",
    "tier": "high",
    "allowFallback": false,
    "allowMirroring": false,
    "allowRotation": false,
    "allowUpscaling": false,
    "losslessOutput": true
  },
  "chroma": {
    "keyColor": "#00ff00",
    "tolerancePercent": 4,
    "minimumMarginPercent": 8
  },
  "normalization": {
    "paddingPixels": 8,
    "alignment": "bottom"
  },
  "frames": [
    {
      "clip": "idle",
      "direction": "east",
      "frame": 0,
      "source": "frames/idle/east/000.png",
      "jobId": "higgsfield-job-id"
    },
    {
      "clip": "idle",
      "direction": "east",
      "frame": 1,
      "source": "frames/idle/east/001.png",
      "jobId": "higgsfield-job-id"
    }
  ]
}
```

`jobId` is required on every frame and records the originating Higgsfield job.
Other provenance fields may also be retained. The assembler ignores unknown
provenance fields but never ignores a job, coverage, or source-path error.

## Required fields

### `version`

Must be `1`.

### `enemyId`

Lowercase kebab case. It becomes the safe output filename prefix.

### `frame`

Locked to `288×336`. Sources may be larger, but the assembler only shrinks
them with Lanczos filtering. It rejects any source that would need upscaling.

### `directions`

Must contain the exact engine order:

```text
east, south-east, south, south-west,
west, north-west, north, north-east
```

### `clips`

The keys and their JSON insertion order are fixed:

| Clip | Frames | FPS | Loop | Direction lock |
| --- | ---: | ---: | --- | --- |
| `idle` | 4 | 4 | yes | no |
| `move` | 6 | 10 | yes | no |
| `attack` | 6 | 15 | no | yes |

### `quality`

- `provider` must be `higgsfield`.
- `model` records the exact approved model.
- The rejected `nano_banana_2_lite` pilot model is never accepted.
- `tier` is `high`, `max`, or `4k`.
- fallback, mirroring, rotation, and upscaling must all be `false`.
- `losslessOutput` must be `true`.

These values are a provenance and policy lock. They do not submit Higgsfield
jobs and cannot silently replace a failed model.

### `chroma`

- `keyColor` is a six-digit RGB hex color selected away from the enemy's own
  palette.
- `tolerancePercent` is `0–8`. High global fuzz is intentionally impossible.
- `minimumMarginPercent` is `8–25` on every source edge.

The assembler verifies the entire outer border, then removes only chroma pixels
connected to the four outer corners. An identical key-colored region enclosed
inside the creature is preserved. It never applies global color transparency.

### `normalization`

- `paddingPixels` is `0–32`.
- `alignment` is `bottom` for grounded enemies or `center` for a hovering
  enemy such as Spore Moth.

### `frames`

Exactly 128 entries are required:

```text
8 directions × (4 idle + 6 move + 6 attack) = 128
```

Every `(clip, direction, frame)` tuple must appear exactly once. Every `source`
must be a unique relative `.png` path contained under the manifest directory.
Absolute paths and `..` traversal are rejected. Every PNG is fully inflated
and CRC-checked before assembly. Every entry must also retain a non-empty
`jobId`; a source set without Higgsfield provenance cannot be published.

## Output layout

The assembler creates these filenames:

```text
ENEMY-idle-a-v3.png
ENEMY-idle-b-v3.png
ENEMY-move-a-v3.png
ENEMY-move-b-v3.png
ENEMY-attack-a-v3.png
ENEMY-attack-b-v3.png
```

Page A contains `east, south-east, south, south-west`. Page B contains `west,
north-west, north, north-east`. Directions are columns; time is rows.

| Clip | Each page | Cells |
| --- | ---: | ---: |
| Idle | `1152×1344` | `4×4` |
| Move | `1152×2016` | `4×6` |
| Attack | `1152×2016` | `4×6` |

Every output is an 8-bit lossless `PNG32` `sRGBA` image with metadata stripped
and compression level 9. The script never calls `-colors`, so it does not
palette-quantize production art.

## Automated failure conditions

Assembly stops before publishing pages when any of these occurs:

- incomplete, duplicated, unsupported, or reordered coverage;
- reused, missing, unsafe, non-PNG, truncated, or undecodable source;
- source dimensions below the runtime cell;
- non-uniform or incorrect outer chroma border;
- less than the declared source margin;
- zero or multiple main foreground components;
- an extracted subject that would require upscaling;
- a frame or page with unexpected dimensions, alpha channels, or bit depth;
- any expected output filename already exists.

Visual direction, identity, anatomy, temporal continuity, duplicate-direction
SSIM, and phone-scale gameplay approval remain separate review gates described
in [Rootfall multi-frame production — Higgsfield specification v3](rootfall-multiframe-higgsfield-v3.md).
