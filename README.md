# Hacker Pulse

Arkiv ETHRome Mission 02 preflight. A station remains visible while its short-lived presence naturally expires on Tiramisu. Uses real data, typed compound queries, independently recorded evidence and wallet-owned presence.

## Start

Node 24 (tested), npm.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

Open the printed localhost URL in a browser. Reading and inspecting recorded proof need no wallet. To write, connect a MetaMask wallet already configured for Tiramisu (chain 7738577) with test GLM. Add a station, then Go available. The app asks MetaMask to sign; it never receives private keys. A station can only be reannounced by its owner. Existing automated-test stations belong to the separate test wallet.

`npm run demo` executes a real, gas-spending test using `.local/test-wallet.json` (ignored, never shipped). It caps worst-case fees of the two writes at 0.01 test GLM and records snapshots until expiry. Only run deliberately. It requires a funded test wallet and Node 24 TypeScript stripping. The finished run remains in `arkiv/evidence/live-run.json` and `public/evidence/latest.json`; archive these before a new run. No wallet key is included in this repository.

## Docker / Dokploy

The private source repository is `cmd0s/hacker-pulse`. For a shareable demo without ChatGPT sign-in, deploy the included Dockerfile through Dokploy. It runs the standalone Node production server on port 3000; no secrets or persistent volumes are required. The test wallet stays local.

See [Dokploy configuration and local Docker check](docs/dokploy.md). The existing `npm run build` still targets Sites; Docker uses `npm run build:node`.

## Demo

View before → View after shows **recorded results from a real verified run**, visibly labelled. Live returns to current public RPC data. Export evidence downloads browser observations and the separately labelled completed run. Station lifetime is 3600 blocks, so the live board will eventually empty; recorded proof survives.

- [Polish report](arkiv/report-pl.md)
- [Friction and reproduction](arkiv/friction.md)
- [Schema](arkiv/schema.md)
- [Submission draft](arkiv/submission.md)
- [Network receipts / snapshots](arkiv/evidence/live-run.json)

## Why Arkiv, and what changes with Postgres

Presence is a network-enforced lease shared by independent clients. A station stays available only while its owner's presence is returned by the network. A Postgres implementation could provide the same visible UX, but would need an application-defined clock and expiry predicate or cleanup worker. It would also put the board's operator in control of writes and the claimed history. Here, ownership and receipts can be checked independently through Tiramisu. The trade-offs are public metadata, gas, wallet interaction, eventual inclusion, and block-dependent rather than precise wall-clock expiry. This is useful for public availability signals, not private schedules or strict real-time safety controls.

## Deliberate limits

One run, at most 200 rows per type; overflow raises an error. Reads poll every three seconds (Mission 02, not Mission 03). No WS/reconnect claims, extension flow, production authentication, confidential payloads or load testing. Longer-lived station metadata also expires. A stale RPC snapshot is marked as such instead of being treated as offline. The current SDK/network naming mismatch is worked around using lowercase attribute names.
