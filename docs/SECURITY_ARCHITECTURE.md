# Security Architecture

## Current trust boundary

The vertical slice is offline-first and stores only local gameplay progress. Everything in browser storage is editable by the player and therefore has zero authority over future token rewards.

Local run receipts now include validated tour and hero identifiers plus the build version. This improves auditability, but the receipt remains explicitly non-claimable and never becomes reward authority.

## Production trust boundary

| Component | Trusted for rewards | Holds private keys |
| --- | --- | --- |
| Browser / Android client | No | No |
| Game-session API | Partially; validates session events | No treasury key |
| Reward policy service | Yes; calculates allowance and limits | No raw key |
| Transaction signer | Yes; signs only policy-approved transactions | Isolated signing key |
| Player wallet | Player-controlled | Player key only |
| Public website | No | No |

## Required controls before tokens

- Server-issued run ID, nonce, expiry, build version, and signed session configuration.
- Ordered event stream with sequence numbers and anti-replay storage.
- Impossible-state checks for speed, damage, room time, ability combinations, and duplicate completion.
- Per-account, device-risk, IP-risk, and global reward limits.
- Idempotent claim IDs and a single-use on-chain or server-side claim state.
- Multisig treasury, isolated reward signer, hardware-backed owner keys, tested recovery, and emergency pause.
- No wallet material in source control, build output, logs, analytics, or client configuration.
- Independent review of mint, claim, transfer, burn, and authority-revocation transactions.

## Proposed claim and burn shape

After a validated boss victory, the server creates a capped allowance. The player reviews and signs a transaction whose effects are explicit. A production design may atomically transfer the player share and burn a policy-defined share from a project-controlled reward allocation. No asset is removed from a player's wallet without that player's signature.

Percentages are intentionally unset until economy simulation is complete.
