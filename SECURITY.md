# Security Policy

## Supported version

Security fixes currently target the latest commit on `main`.

## Reporting a vulnerability

Do not publish credentials, wallet material, exploit details, or player data in a public issue. Use the repository's private security-advisory channel when it is enabled, or contact the repository owner privately.

## Non-negotiable rules

- Never commit a seed phrase, private key, keypair JSON, signing key, access token, or production mint address.
- The browser client is untrusted. It may request an action but must never authorize a token reward.
- A completed run becomes reward-eligible only after server-side validation and anti-replay checks.
- Development, staging, treasury, rewards, and release signing use separate credentials.
- The retired token and lost reward wallet are not reused by this project.
- No production key is created until backup restoration and multisig recovery are tested.

The current vertical slice has no backend, wallet connection, token transfer, token burn, analytics SDK, or third-party runtime dependency.
