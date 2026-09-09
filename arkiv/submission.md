# Hacker Pulse — ETHRome preflight submission

Status: functional pre-event test, not an official prize submission. R1–R5 are still draft; no public repository or organizer conversation is claimed.

- [x] Mission 02 — Built to expire.
- [ ] Mission 01 — Decommission.
- [ ] Mission 03 — Live wire.

A station becomes offline when its presence naturally expires, while its longer-lived description stays available. No delete operation or cleanup job is used.

Evidence:
- [Schema and two typed compound queries](schema.md)
- [Live network run, receipts and 14 snapshots](evidence/live-run.json)
- [Query implementation](model.ts)
- [Repeatable on-chain demo](run-demo.mjs)
- [Tests](query.test.mjs)
- [Friction report](friction.md)
- [Concise Polish report](report-pl.md)
- [Recorded before](evidence/screenshots/before.png) / [recorded after](evidence/screenshots/after.png)

Before: block 226457, target presence returned. After: block 226471, target absent, station still returned. Same query string. Presence expiry 226471 agrees between receipt and independent query. At-block snapshots are coherent across entity types.

Presence transaction: https://tiramisu.explorer.arkiv.network/tx/0xe757b9feb487b9ad1326fe21604ea6b00fa0c2ba72b2cc2c069b8a19a1ca9c92

Station transaction: https://tiramisu.explorer.arkiv.network/tx/0x3d8e6339e1487798ed1d70c9a0bae209f81a0c3cd185439b0872b68cff53dca3

UI demonstration: choose View before, then View after. These are explicitly labelled recorded network results. Live returns to fresh RPC queries. Connect a Tiramisu-funded MetaMask wallet, add a station, then Go available to repeat using your own wallet. The automated test-wallet station can only be reannounced by that test wallet.
