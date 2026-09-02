# DOFA ARENA — True-3D status (Rootfall 08 spike)

See full detail in [`arena3d/README.md`](../arena3d/README.md).

## Camera (owner ask 2026-09-01)

Action camera is **Archero / Unity top-down**: steep `beta ≈ 0.4`, hero in the lower third, look toward the enemy pack. Orbit mode is depth-proof only.

Feel refs (camera/HUD/combat chrome only — not IP to clone): [`references/archero-feel/`](references/archero-feel/). World overlay: floating HP bars + damage numbers linked to 3D meshes (`arena3d/src/scene/worldHud.js`).

## Art pipeline note (Higgsfield / Gemini / Nano Banana / Codex / Grok)

This cloud VM has **no** Higgsfield / Gemini / Nano Banana / Grok image API credentials. Those tools belong in the offline art pipeline for authored glTF/PBR packs that can approach the quality-bar TARGET. This spike keeps **real Babylon meshes** and treats the quality-bar JPEG as TARGET reference only — never as a scene plate.

## In-engine proof (not the concept JPEG)

| Capture | Path |
| --- | --- |
| Action camera (Archero top-down) | [`previews/arena3d/rootfall-08-action-camera.png`](previews/arena3d/rootfall-08-action-camera.png) |
| Orbit depth proof | [`previews/arena3d/rootfall-08-orbit-depth-proof.png`](previews/arena3d/rootfall-08-orbit-depth-proof.png) |
| Capture report | [`previews/arena3d/capture-report.json`](previews/arena3d/capture-report.json) |

TARGET quality bar (reference only, never scene texture): [`references/quality-bar/rootfall-08-target-quality-bar.jpg`](references/quality-bar/rootfall-08-target-quality-bar.jpg)

## Honest summary

| Bucket | Items |
| --- | --- |
| Ready | Parallel `/arena3d/` Babylon path; Archero top-down camera; floating HP/damage world HUD; HUD canon names; real meshes + glTF floor; HB rig + katana; 5 enemies with telegraphs; touch move + attack; RU/EN; tests; orbit proof captures |
| Partial | Visual parity vs quality-bar TARGET (procedural PBR ≠ authored ML/Higgsfield art); full skin weights; SW caching of 3D bundle; mobile FPS tuning |
| Not started | Higgsfield/Gemini authored hero/enemy/room glTF packs; Tours 03–06 3D; full 50-room 3D route; other heroes; 3D audio/abilities; final engine lock |
| Blocked | Exact HB face scan (not invented); stop-to-auto-attack [TBD]; token/wallet authority; cloud AI art APIs not configured in this agent VM |
