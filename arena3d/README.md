# DOFA ARENA — True-3D Rootfall 08 Slice (Babylon.js spike)

**Status vocabulary:** [LOCKED] · [TARGET] · [TBD] · [PROPOSAL] · [DEPRECATED]

This package is a **parallel** mobile-web true-3D path beside the existing 2D Canvas/PWA prototype on `main`. It does **not** replace or delete the 2D prototype.

## Canon (this shell)

| Field | Value |
| --- | --- |
| Game | **DOFA ARENA** |
| Site | doffa.coffee |
| Token (name only) | $DOFA — **no** wallet/mint/claim in this slice |
| Antagonist | KAPRIZORD |
| Tour | **TOUR 02 · ROOTFALL JUNGLE** room **08 / 50** |
| Hero | Honey Badger · **KATANA** · placeholder head · **STRONG ROOTS** locked |

Owner quality-bar frame (TARGET, never used as scene geometry/texture):

- `docs/references/quality-bar/rootfall-08-target-quality-bar.jpg`
- Honey Badger turnaround TARGET: `docs/references/heroes/honey-badger-turnaround-target.jpg`
- Other hero turnarounds are archived as out-of-slice references only.

## Commands

```bash
# from repo root
npm run arena3d:install
npm run arena3d:gltf
npm run arena3d:test
npm run arena3d:build
npm run arena3d:dev          # http://localhost:5173/arena3d/
npm run serve                # 2D prototype + built /arena3d/ after build
npm test                     # 2D check + 3D slice tests
```

## Ready / partial / not started / blocked

### Ready
- Parallel Vite + Babylon.js entry at `/arena3d/`
- Portrait action camera HUD: pause · DOFA ARENA · TOUR 02 · ROOTFALL JUNGLE · 08/50 · Honey Badger · KATANA · HP · left stick · right attack
- Archero-feel world HUD: mesh-linked floating HP bars + damage numbers (feel refs in `docs/references/archero-feel/`, not Habby IP)
- Real 3D Rootfall room meshes (stone tiles, roots, foliage, torches, moss/glow veins) + optional glTF PBR floor tile
- Rigged Honey Badger hierarchy + katana swing VFX; placeholder head labeled; STRONG ROOTS decal non-mirrored
- Enemy set: insect elite, 2 plant turrets, 2 wood humanoids; plant shots use telegraph-before-damage
- Touch move + explicit attack button (stop-to-auto-attack **not** implemented — [TBD])
- RU + EN shell i18n
- PWA manifest scoped to `/arena3d/`
- Unit tests for combat helpers, canon names, no concept-JPEG-as-scene
- Orbit-proof camera toggle for depth evidence
- Live FPS / mesh / JS-heap readout in HUD

### Partial
- Visual fidelity vs Mobile Legends quality bar (procedural PBR spike ≠ authored AAA art)
- Skinned vertex deformation (TransformNode rig + Skeleton metadata; full skin weights [TARGET])
- Artist-authored glTF hero/enemy packs (floor tile glTF only in-repo)
- Service worker caching for the 3D bundle (manifest ready; SW integration light)
- Perf on mid-tier phones (report honest FPS from captures; not yet tuned)

### Not started
- Tours 03–06 3D rooms
- Full 50-room Rootfall route in 3D
- Other heroes in 3D
- Audio / ability draft for 3D path
- Production engine lock (Babylon remains measured spike)

### Blocked / owner ask
- Exact Honey Badger **face scan** — intentionally not invented; placeholder head shipped
- Stop-to-auto-attack control canon — [TBD]
- Final engine lock vs Babylon / other — spike only
- Token / wallet / reward authority — **out of scope forever for this PR**

## Hypothesis check

> Canvas + raster plates cannot hit the owner quality bar; a real glTF/PBR scene is required.

**Evidence from this spike:** the playable path is a Babylon.js scene of meshes, PBR materials, lights, shadows, and collision volumes. The quality-bar JPEG is stored under `docs/references/` and is rejected by `isForbiddenConceptTexture` / `assertNoConceptBillboard`. Sprite counts are **not** used as 3D proof. In-engine orbit screenshots/video are the acceptance evidence.
