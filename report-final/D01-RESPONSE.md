# D01 — example and evidence clarification

Thanks for asking — I should clarify the scope of D01. The reported scenario involved a **stale event ABI filter** during the agent-assisted dry run.

This reconstructs the problematic filter; the original failing script was not preserved:

```js
import { createPublicClient } from '@arkiv-network/sdk'
import { tiramisu } from '@arkiv-network/sdk/chains'
import { webSocket, parseAbiItem } from 'viem'

const client = createPublicClient({
  chain: tiramisu,
  transport: webSocket(
    'wss://rpc.tiramisu.db-chain.testnet.arkiv.network'
  ),
})

console.log(await client.getBlockNumber())

client.watchEvent({
  address: '0x4400000000000000000000000000000000000044',
  event: parseAbiItem(
    'event ArkivEntityCreated(uint256 indexed entityKey, address indexed owner, uint256 expirationBlock, uint256 cost)'
  ),
  onLogs: console.log,
  onError: console.error,
})
```

The SDK 0.8.0 ABI captured during testing instead defines:

```solidity
event EntityCreated(
  bytes32 indexed entityKey,
  address indexed owner,
  uint64 expiresAt,
  uint8 creationFlags
)
```

These signatures produce different `topic0` values. The legacy filter therefore cannot match the captured 0.8.0 creation event, even though block reads work. This follows from event-scoped filtering in [viem’s `watchEvent`](https://viem.sh/docs/actions/public/watchEvent).

Using SDK 0.8.0’s `client.watchEntityEvents()` worked. We preserved the [working listener](https://github.com/cmd0s/hacker-pulse/blob/8c7ed02/report-final/evidence/livewire/watch.mjs) and [event log](https://github.com/cmd0s/hacker-pulse/blob/8c7ed02/report-final/evidence/livewire/watch-log-2026-09-09.txt#L78), including an `EntityCreated` callback for block **226476** at **13:41:44.013Z** on September 9.

One qualification: we did not retain the original failing listener or its source URL. Consequently, I cannot identify a specific outdated page in your documentation or substantiate a general SDK regression. D01 is best treated as a compatibility/onboarding observation; the preserved evidence directly verifies the successful path.
