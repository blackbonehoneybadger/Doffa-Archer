# DOFFA Heroes

The first flagship game in the DOFFA Games universe: a portrait action-roguelite built for browser and mobile.

## Current milestone

Version `0.1.0` is the first playable vertical slice:

- tap the Roaster Core to collect entry beans;
- spend beans to enter a six-room run;
- move to evade and stop to auto-attack;
- choose one of three abilities after each cleared room;
- defeat the Hollow Roaster boss;
- receive a local, non-claimable test receipt.

All visuals in this milestone are original procedural placeholders. The production character and monster pipeline begins after the combat loop is approved.

## Run locally

No package installation is required.

```bash
npm run serve
```

Open `http://localhost:4173`. Keyboard controls are WASD or arrow keys. On a phone, drag anywhere inside the arena to move. The hero attacks automatically while standing still.

Run the repository checks with:

```bash
npm test
```

## Clean-token rule

This repository does not contain or depend on the retired DOFFA token, the lost reward wallet, private keys, seed phrases, or production mint addresses. Real token integration is blocked until the game has server-authoritative run validation, a tested reward economy, and a separately reviewed wallet/key-management design.

See [Game Design](docs/GAME_DESIGN.md), [Roadmap](docs/ROADMAP.md), [Art Direction](docs/ART_DIRECTION.md), and [Security Architecture](docs/SECURITY_ARCHITECTURE.md).
