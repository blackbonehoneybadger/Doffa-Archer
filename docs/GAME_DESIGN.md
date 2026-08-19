# DOFFA Heroes — Vertical Slice Design

## Product promise

A serious portrait action-roguelite with short room-based runs, readable combat, strong ability combinations, and an original dark coffee-industrial world. The control rhythm is simple: move to evade, stop to attack.

This project may use genre conventions as references, but it does not copy another game's code, art, UI, names, characters, levels, audio, or proprietary assets.

## Core loop

1. Tap the Roaster Core to earn off-chain entry beans.
2. Spend beans to start a run.
3. Clear a sealed combat room.
4. Choose one of three random upgrades.
5. Repeat until the tour boss.
6. Generate a reward-eligibility receipt after a verified victory.
7. In production, a server validates the receipt before any token claim exists.

## Milestone 0.1.1

- One playable hero placeholder.
- Six rooms and one boss.
- Four enemy archetypes with distinct movement or attack behavior.
- Eight abilities and random three-card choices.
- Keyboard and touch movement.
- Local beans, entry cost, run reward, best-room progress, and boss wins.
- Installable PWA shell and update detection.
- Local test receipt explicitly marked non-claimable and non-chain.

## Economy boundary

Beans are gameplay energy and have no blockchain value. Local storage is intentionally treated as untrusted. Real DOFFA rewards are not part of this milestone.

The future claim flow is:

`client run request → server session → validated events → anti-cheat decision → claim allowance → player-signed transaction`

Burning will be implemented only in an audited transaction design. The client will never receive a treasury or reward-wallet private key.

## Production quality gates

- Combat is enjoyable without rewards.
- A full run works on target low- and mid-range Android devices.
- Reward issuance survives replay, clock manipulation, save editing, and request tampering.
- Economy simulation defines daily caps, emission budget, sinks, and emergency pause rules.
- Every real-person character has written approval for likeness use.
