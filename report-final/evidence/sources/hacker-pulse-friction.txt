# Arkiv friction — ETHRome preflight, 2026-09-09

## SDK / network — reproduced on-chain

- **2026-09-09 15:40 CEST — P1: camelCase attribute passes SDK validation but fails on-chain.** Expected: `stationId` accepted, or rejected locally before gas is spent. Actual: `@arkiv-network/sdk@0.8.0-dev.4` built and submitted a transaction that reverted on Tiramisu (chain 7738577). The decoded message says `I` at byte 7 is outside the allowed charset, then lists A–Z as allowed. Reproduce: call `createEntity` with otherwise valid attributes and `stationId: 'desk-test'`. Our failing transaction: `0xb469105e01c65733c194fe9e3f96fc4d7d240b58c33f9825d6ffcd3fc7c92059`; receipt status reverted, gasUsed 49810. Change only the application attribute naming to `station_id` and writes succeed. Evidence: `evidence/failed-camelcase-run.json`, `evidence/failed-camelcase-receipt.json`. Recommendation: align SDK validator, node grammar and error text; include a network compatibility test. Failure scope established for this name/version/network, not every uppercase character.

## SDK documentation / MCP

- **2026-09-09 15:24 CEST — P2: recommended SDK lacks a usable current README through the gateway.** Expected: `get_package({id:'sdk-ethrome'})` gives installation and quickstart matching 0.8.0-dev.4. Actual: package is compatible but README is historical and rejected by default because its setup still points to ^0.6.0. The MCP helpfully provides pinned source references, which let us proceed. Reproduce the call to https://arkiv-mcp-gateway.vercel.app/ethrome. Evidence: workspace `knowledge/evidence/mcp-sdk-ethrome.json`. Recommendation: publish a verified copy-paste quickstart with typed attributes, `expires`, `select/query` and Tiramisu.
- **2026-09-09 15:24 CEST — P3: unexpected language in the startup workflow.** Expected: English workflow consistent with the event page. Actual: `get_workflow({name:'minimal_app'})` returns Spanish title and instructions. No language was requested. Evidence: workspace `knowledge/evidence/mcp-workflow-minimal.json`. Recommendation: English default or an explicit language parameter.
- **2026-09-09 15:41 CEST — P2: conflicting explanation of expiresAt.** Bounty documentation treats the receipt expiry as authoritative, while the published SDK return-type comment says it may be a lower bound computed before inclusion. The implementation extracts applied event expiries. Our actual creation returned 226471 and the subsequent query also returned 226471; no runtime mismatch was observed. Recommendation: correct stale comments and distinguish requested TTL, receipt expiry and block cadence. Evidence: MCP createentity source snapshot plus `evidence/live-run.json`.

## Network / expiry — successful behavior

15-block presence disappeared exactly at its queried expiry block 226471. It was present at 226470. The station remained. Before/after observations were 27.915 wall-clock seconds apart (the presence had already been included before the first observation). Both receipt/query expiry values matched. This validates this run, not a fixed block-time guarantee. Read failures were not deliberately injected on the live network.

## Access keys / faucet / wallet

User had already connected a wallet and claimed faucet funds before the test. User transferred 0.05 test GLM to an isolated local test wallet. We did not retest faucet claims, CAPTCHA, access-key issuance, or the user's MetaMask signing flow. SDK public reads and signed local-wallet writes succeeded without an access key.

## Explorer

Hub and MCP advertise different explorer hostnames. Alias behavior was not tested; do not report this as an outage. The UI uses the Hub's hostname.

## MCP coverage and limits

Passed: initialize, tools/list, server_status, network_status, search_knowledge, read_knowledge, list_packages, get_package, get_workflow. Gateway version 1.0.2, contentRevision ed8a16b238cfb6c7, configRevision 2026-09-09.1. These were direct HTTP protocol requests, not a persisted MCP client installation. No private code, test key, project idea, feedback submission, or check_submission payload was sent to MCP.

SDK/chain testing used independent reads and real transactions. The initial sandbox DNS/listen failures are tooling-environment issues, not Arkiv defects. We did not test WebSocket, recovery, large datasets, or load. Browser reads and recorded before/after controls were checked; external-wallet writes still require user interaction.
