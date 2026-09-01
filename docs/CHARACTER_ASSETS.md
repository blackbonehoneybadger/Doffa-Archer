# Character Asset Register

## Runtime preview — 0.15.1

| Hero | Canonical weapon | Runtime asset | Status |
| --- | --- | --- | --- |
| Honey Badger | Katana; secondary shuriken | `/assets/heroes/honey-badger-lean-v3.png` | Lean identity master; BOY-length dense black beard |
| BOY | Hammer | `/assets/heroes/boy-identity-v3.png` | Corrected serious owner-supplied likeness |
| Mr. Kroo | Black recurve bow | `/assets/heroes/mr-kroo-bow-v4.png` | Thin silhouette; bow and compact quiver locked; scissors and shuriken removed |
| Hadida | Bat | `/assets/heroes/hadida-papakha-v3.png` | Corrected permanent black papakha |
| Pata | Pressure coffee rifle | `/assets/heroes/pata.png` | Higgsfield top-down preview sprite |

The project owner supplied two pixel-art references for Honey Badger, BOY, Mr. Kroo, and Hadida, plus one combined identity-and-weapon reference for Pata. The original reference files are intentionally not committed to the public game repository; only the derived runtime assets are present.

The active preview sprites are transparent extractions from the approved top-down Higgsfield directional masters. They replace the earlier front-facing combat placeholders. The complete source sheets stay outside the public runtime repository; only the reviewed single-frame derivatives used by the preview are shipped.

Before commercial release, retain written likeness and reference-asset permission for every represented person and complete manual frame cleanup, ability/victory coverage, and final animation approval.

## Higgsfield production references — 0.10.1

The corrected production pass uses a shared orthographic top-down camera. Directional masters and animation-key-pose sheets now exist for all five heroes:

| Hero | Directional master job | Animation key-pose job | Review |
| --- | --- | --- | --- |
| Honey Badger | `6f3fd70c-be82-458c-ac0d-6fc1808bf269` | `bb3d55f4-8b5f-4bea-a26f-09d8c02b39f2` | Accepted for cleanup |
| BOY | `a9ed385c-3086-4039-b887-a3fb1a488c54` | `79dcd773-4969-4a4f-813f-db3b28164687` | Directional master accepted; attack frames need camera normalization |
| Mr. Kroo | `b6651c8b-de19-4034-94f4-453f9039b85d` | `99146ee6-c036-4fc2-9f8c-015ccaedf18f` | Directional master accepted; attack frames need camera normalization |
| Hadida | `fcee526e-e3e6-4386-933e-2a10832e5b04` | `0c48e2c6-5b7d-4163-9914-1fc9c4744a53` | Accepted for cleanup |
| Pata | `427f596e-6465-42c2-8ec3-51fad27e509a` | `35b4bdf8-99b7-46ce-af8d-6603248f0bfc` | Accepted for cleanup |

These sheets cover idle, run contacts, attack anticipation and impact/release, hit, and defeat. They are production references rather than final atlases: scale, transparent padding, camera continuity, anatomy, weapon construction, and frame timing must be normalized before runtime animation export.

## Full-direction runtime motion — 0.10.9

| Hero | Runtime atlas | Authored coverage |
| --- | --- | --- |
| Honey Badger | `/assets/heroes/honey-badger-full-motion-v3.png` plus `/assets/heroes/honey-badger-shuriken-attack-v1.png` | 8-direction idle, run, three katana melee clips, and dedicated shuriken release; corrected long beard |
| BOY | `/assets/heroes/boy-full-motion-v3.png` plus `/assets/heroes/boy-gold-pistol-attack-v1.png` | 8-direction idle, run, three hammer melee clips, and dedicated gold-pistol release; corrected serious face |
| Mr. Kroo | `/assets/heroes/mr-kroo-full-motion-v4.png` plus `/assets/heroes/mr-kroo-bow-attack-v1.png` | 8-direction idle, run, three dagger melee clips, and dedicated bow release; thin silhouette, black bow and quiver |
| Hadida | `/assets/heroes/hadida-full-motion-v3.png` plus `/assets/heroes/hadida-cigarette-attack-v1.png` | 8-direction idle, run, three bat melee clips, and dedicated cigarette-butt flick; papakha in every cell |
| Pata | `/assets/heroes/pata-full-motion-v2.png` plus `/assets/heroes/pata-coffee-rifle-attack-v1.png` | 8-direction idle, run, three punch melee clips, and dedicated pressure-rifle fire |

Every full-motion atlas is a transparent 4-by-10 runtime sheet. Idle, run, and the three melee attack clips each occupy two rows and store directions in engine order `E, SE, S, SW, W, NW, N, NE`. Each hero also ships a dedicated 4-by-2 secondary-weapon release atlas used only while the ranged slot is active. The reproducible `scripts/build-full-motion-atlas.mjs` step validates the expected main figures, removes the chroma stage, isolates each complete figure, normalizes its frame, and rejects malformed sheets before export. `scripts/build-weapon-attack-atlases.py` expands melee variants and secondary release sheets from the locked identity art. Its visual-compass mapping corrects source generators that label front-facing art as north, so moving down shows the face and moving up shows the back. The 0.10.9 `scripts/normalize-runtime-atlas.mjs` pass brings the five source silhouettes to a shared body-height band, and the arena renderer uses the same 170-pixel destination height for every playable hero. Only the main boss is deliberately oversized.

The 0.10.4 source references were produced with the available built-in image-generation pipeline against the approved Higgsfield production specification. They are not represented as direct Higgsfield renders. Final commercial animation remains subject to the same Higgsfield review, manual cleanup, likeness approval, and phone-scale quality gates.

## Full-direction reactions — 0.10.9

| Hero | Runtime atlas | Authored coverage |
| --- | --- | --- |
| Honey Badger | `/assets/heroes/honey-badger-reactions-v2.png` | 8-direction hit and defeat; corrected long beard |
| BOY | `/assets/heroes/boy-reactions-v2.png` | 8-direction hit and defeat; corrected serious face |
| Mr. Kroo | `/assets/heroes/mr-kroo-reactions-v3.png` | 8-direction hit and defeat; thin silhouette, bow retained in every cell |
| Hadida | `/assets/heroes/hadida-reactions-v2.png` | 8-direction hit and defeat; papakha preserved |
| Pata | `/assets/heroes/pata-reactions-v1.png` | 8-direction hit and defeat |

Each reaction atlas is a transparent 4-by-4 runtime sheet. Hit occupies rows 0–1 and defeat rows 2–3, with directions stored in engine order `E, SE, S, SW, W, NW, N, NE`. The atlas builder now accepts a validated source-row count, so the same deterministic chroma removal, component count, direction reorder, frame normalization, alpha validation, and PNG32 export are used for both three-state motion sheets and two-state reaction sheets.

The 0.10.5 reaction references were produced with the available built-in image-generation pipeline using the approved Higgsfield production specification and the locked 0.10.4 runtime atlases as identity inputs. They are not represented as direct Higgsfield renders. Commercial release still requires manual frame cleanup, likeness approval, and final phone-scale timing review.
