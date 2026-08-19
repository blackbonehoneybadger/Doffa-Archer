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

## Milestone 0.4.0

- Five selectable hero placeholders: Honey Badger, Hadida, Boya, Mr. Kroo, and Pata.
- Distinct health, speed, damage, range, fire rate, projectile count, ricochet, and splash profiles.
- Persistent local hero selection and hero identity in the run HUD, results, and local receipt.
- Persistent XP and levels stored separately for all five heroes.
- Four equipment slots: weapon mod, armor, ring, and relic.
- Ten equipment definitions across common, rare, and epic rarities.
- Sanitized local inventory and loadout migration from profile schema v3 to v4.
- Room-based local drop chance and one guaranteed item after a boss victory.
- Level and loadout modifiers are snapshotted when a run starts.
- Six rooms and one boss.
- Four enemy archetypes with distinct movement or attack behavior.
- Eight abilities and random three-card choices.
- Keyboard and touch movement.
- Local beans, entry cost, run reward, best-room progress, and boss wins.
- Installable PWA shell and update detection.
- Local test receipt explicitly marked non-claimable and non-chain.
- Data-driven definitions for the tour, six named rooms, its enemy family, and its boss.
- Per-tour local progress with migration from the original aggregate profile.
- Tour- and hero-bound local receipts so future server validation has explicit content identities.

## Economy boundary

Beans, hero XP, equipment, and drops are prototype gameplay state and have no blockchain value. Local storage is intentionally treated as untrusted. Real DOFFA rewards are not part of this milestone.

The future claim flow is:

`client run request → server session → validated events → anti-cheat decision → claim allowance → player-signed transaction`

Burning will be implemented only in an audited transaction design. The client will never receive a treasury or reward-wallet private key.

## Production quality gates

- Combat is enjoyable without rewards.
- A full run works on target low- and mid-range Android devices.
- Reward issuance survives replay, clock manipulation, save editing, and request tampering.
- Economy simulation defines daily caps, emission budget, sinks, and emergency pause rules.
- Every real-person character has written approval for likeness use.
