# DOFFA Heroes — Unity production project

Open this folder with Unity `6000.3.22f1` and install Android Build Support.

For a batch compile/import pass, set `UNITY_EDITOR` to that editor executable and run `npm run check:unity` from the repository root. The command intentionally fails when the approved Unity editor is unavailable.

For the deterministic CI smoke gate, invoke Unity with `-batchmode -quit -executeMethod Doffa.Editor.PrototypeRoomSmokeValidator.ValidateForBatch`. On a clean project the gate creates and assigns `Assets/DOFFA/Settings/Rendering/DOFFA_UniversalRenderPipeline.asset` plus its `UniversalRendererData`, then verifies the exact editor version and Input System setup, regenerates `Room_Prototype_01`, saves all generated assets, checks required objects/components and serialized references, and verifies that the scene is enabled in Build Settings. It exits with code `1` on any validation failure. Generated assets remain under `Assets/DOFFA/Scenes`, `Assets/DOFFA/Materials/Prototype`, and `Assets/DOFFA/Settings/Rendering` so the CI job can upload them. The gate also writes `Artifacts/UnitySmoke/validation.json`; CI must require `success: true` to protect against silent editor exits.

The existing browser game at the repository root remains the mechanics and balance reference while the production client is rebuilt here. Do not copy browser sprites into the 3D runtime as billboard characters.

## First editor pass

1. Let Unity resolve Input System and URP packages.
2. Create a URP Asset and assign it in Graphics and Quality settings.
3. Run `DOFFA > Prototype > Build Room Prototype 01`. The builder sets the product identity, linear color space, fixed portrait orientation, mobile reference resolution, and adds the scene to Build Settings.
4. Open the generated `Assets/DOFFA/Scenes/Room_Prototype_01.unity` scene and enter Play Mode.
5. Move with WASD, arrow keys, a gamepad left stick, or the generated lower-left mobile stick.
6. Stop near an enemy to auto-attack. Enemies steer around obstacles, telegraph before melee damage, and stay defeated.
7. Defeat all three enemies, wait for the north door to open, and cross the exit trigger.
8. Run the full checklist in `docs/UNITY_PROTOTYPE_ROOM_ACCEPTANCE_RU.md` before marking the gray-room milestone complete.
9. Create five `HeroIdentityDefinition` assets and five `TourDefinition` assets.
10. Run `DOFFA > Validate Production Content`.

The validator intentionally fails until all expected production definitions exist. It is a gate, not a demo-data generator.

The orange capsule, red enemy capsules, simple obstacles, telegraph discs, and strike line are disposable engineering stand-ins. They exist only to approve movement, facing, collision, bounded camera framing, stop-to-attack rhythm, enemy steering, incoming damage, room clearance, mobile input, and phone performance before final Honey Badger and environment art are imported.
