# Hacker Pulse data model

SDK: `@arkiv-network/sdk@0.8.0-dev.4`. Network: Tiramisu, chain 7738577.
Scope: `app = hacker-pulse-ethrome-v1`, `run = ethrome-pretest-0909`.

| Attribute | station | presence | Purpose |
|---|---|---|---|
| app | str | str | Namespace isolation |
| run | str | str | Reproducible demo scope |
| kind | str('station') | str('presence') | Entity type |
| station_id | str | str | Relation between description and presence |
| zone | str('A') | str('A') | Public location label (synthetic) |
| seats | u64(2) | u64(2) | Numeric capacity filter |
| $owner | chain address | chain address | Presence must be authored by the station owner |
| $expiresAt | block number | block number | Network-resolved expiry |

Payload: station name and description; presence purpose and synthetic-data marker. These fields are display-only. The UI bounds strings and renders text, not HTML. Credentials, personal information, private code, keys, and real device telemetry remain off-chain. Local test-wallet material is ignored by Git and is never in the browser bundle or hosted app.

TTL: station 3600 blocks, keeping the description through a short test; presence 15 blocks so absence drives availability. This is not a promise of 30 seconds. All entities eventually expire. We read actual `expiresAt` back from the network. The UI does not remove rows based on a local timer. Reannouncing creates a new presence; lifetime extension is out of scope.

Queries (same expressions used by `arkiv/model.ts`):

```ts
and(eq('app', APP), eq('run', RUN), eq('kind', 'station'), gte('seats', u64(1)))
and(eq('app', APP), eq('run', RUN), eq('kind', 'presence'), gte('seats', u64(1)))
```

Both query at the same explicit block using `reader.query(expression, {select, atBlock, limit:200})`. A cursor fails closed rather than silently ignoring later pages. This deliberately bounded demo supports up to 200 entities per type/run; it is not a production directory. The UI matches station_id and owner before marking a station available, preventing a different wallet from impersonating a station's presence. An RPC failure preserves the previous snapshot and shows a stale-data warning.

Attribute-name workaround: use lowercase `station_id`; the event SDK accepts `stationId` locally but the live node rejected it. See friction.md.
