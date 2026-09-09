# Arkiv ETHROME — report and demos

[Final test report](ARKIV-ETHROME-FINAL-REPORT.md) — consolidated findings, reproduction steps, and 29 screenshots. Share the entire `report-final/` directory to preserve attachments.

## Hacker Pulse — Mission 02: Built to expire

[Live demo](https://hacker-pulse.f12lab.net) · [GitHub repository (private)](https://github.com/cmd0s/hacker-pulse)

A station availability board where short-lived presence expires while the station description remains. Recorded before/after views show the same query returning different results at the expiry boundary, without a delete operation. Switch to Live for current network reads.

## Live Wire — Mission 03: Live Wire

[Live demo](https://livewire.f12lab.net) · [GitHub repository (private)](https://github.com/cmd0s/arkiv-livewire)

A ticket board receives entity events over WebSocket without a repeating query loop. Block updates drive the countdown and remove expired tickets locally; expiry itself is not a pushed event. The repository includes the app, Dockerfile, report, and screenshots.

## Reviewed Arkiv services

[Staging Hub](https://stage.hub.arkiv.network/) · [Block Explorer](https://tiramisu.explorer.arkiv.network/) · [Block Explorer Data](https://tiramisu.explorer.arkiv.network/data) · [Data Explorer](https://data.arkiv.network/) · [Documentation](https://docs.arkiv.network/)
