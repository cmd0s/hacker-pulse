// Save as livewire-example.mjs and run with: node livewire-example.mjs
import { createPublicClient } from '@arkiv-network/sdk'
import { tiramisu } from '@arkiv-network/sdk/chains'
import { webSocket } from 'viem'

const client = createPublicClient({
  chain: tiramisu,
  transport: webSocket('wss://rpc.tiramisu.db-chain.testnet.arkiv.network'),
})

const stringify = (value) => JSON.stringify(value, (_, item) =>
  typeof item === 'bigint' ? item.toString() : item,
)

// Follow new events. Do not add fromBlock to this live-only example.
const stopEvents = client.watchEntityEvents({
  onEntityCreated: (event) => console.log('created', stringify(event)),
  onEntityDeleted: (event) => console.log('deleted', stringify(event)),
  onError: (error) => console.error('event watcher:', error),
})

const stopBlocks = client.watchBlockNumber({
  onBlockNumber: (blockNumber) => {
    console.log('block', blockNumber.toString())
    // A ticket board compares stored expiresAt values with this height.
    // Handle permanent entities and expiry extensions explicitly.
    // There is no EntityExpired callback in the tested SDK event ABI.
  },
  onError: (error) => console.error('block watcher:', error),
})

process.once('SIGINT', () => {
  stopEvents()
  stopBlocks()
  process.exit(0)
})
