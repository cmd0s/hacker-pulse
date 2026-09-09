import { createPublicClient } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { webSocket } from "viem"

const json = (v) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x))
const log = (...a) => console.log(new Date().toISOString(), ...a)
const ownerFilter = process.argv[2]?.toLowerCase()

const client = createPublicClient({ chain: tiramisu, transport: webSocket() })
log("chain", tiramisu.id, "block", (await client.getBlockNumber()).toString())

client.watchEntityEvents({
  onError: (e) => log("ERROR", e?.shortMessage || e?.message || String(e)),
  onEvent: (ev) => {
    if (ownerFilter && ev.owner?.toLowerCase() !== ownerFilter) return
    log(">>>", ev.type, json(ev))
  },
})
log("watching (eth_subscribe over wss)", ownerFilter ? `owner=${ownerFilter}` : "all owners")
