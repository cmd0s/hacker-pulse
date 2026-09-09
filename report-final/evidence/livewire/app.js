import { createPublicClient } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { webSocket, hexToString, isHex } from "viem"

const MATCH = "AS Roma vs Inter"
const QUERY = `match = str('${MATCH}')`
const BLOCK_SECONDS = 2

const $ = (id) => document.getElementById(id)
const rows = new Map()
let currentBlock = 0n
let eventCount = 0

const client = createPublicClient({ chain: tiramisu, transport: webSocket() })

function attr(entity, name) {
  const a = entity?.attributes?.[name]
  if (a === undefined) return undefined
  return typeof a === "object" && a !== null && "value" in a ? a.value : a
}

function payloadText(payload) {
  if (payload instanceof Uint8Array) return new TextDecoder().decode(payload)
  if (typeof payload === "string") return isHex(payload) ? hexToString(payload) : payload
  return String(payload ?? "")
}

function shortKey(k) { return `${k.slice(0, 10)}…${k.slice(-6)}` }

function logLine(kind, text) {
  const li = document.createElement("li")
  li.className = kind
  li.textContent = `${new Date().toISOString().slice(11, 23)}  ${text}`
  $("log").prepend(li)
  while ($("log").children.length > 40) $("log").lastChild.remove()
}

function upsert(entity, { fresh = false } = {}) {
  if (attr(entity, "match") !== MATCH) return
  const key = entity.key
  let el = rows.get(key)
  if (!el) {
    el = document.createElement("tr")
    el.innerHTML = `<td class="k"></td><td class="t"></td><td class="p"></td><td class="o"></td><td class="e"></td><td class="c"></td>`
    $("tbody").prepend(el)
    rows.set(key, el)
  }
  el.dataset.expiresAt = String(entity.expiresAt)
  el.querySelector(".k").textContent = shortKey(key)
  el.querySelector(".t").textContent = String(attr(entity, "ticket_no") ?? "—")
  el.querySelector(".p").textContent = payloadText(entity.payload)
  el.querySelector(".o").textContent = shortKey(entity.owner)
  el.querySelector(".e").textContent = String(entity.expiresAt)
  if (fresh) { el.classList.add("fresh"); setTimeout(() => el.classList.remove("fresh"), 4000) }
  tick()
}

function remove(key, reason) {
  const el = rows.get(key)
  if (!el) return
  el.classList.add(reason)
  setTimeout(() => { el.remove(); rows.delete(key) }, 6000)
}

function tick() {
  $("block").textContent = currentBlock.toString()
  for (const [key, el] of rows) {
    if (el.classList.contains("expired") || el.classList.contains("deleted")) continue
    const left = BigInt(el.dataset.expiresAt) - currentBlock
    const c = el.querySelector(".c")
    if (left <= 0n) {
      c.textContent = "EXPIRED"
      logLine("expired", `expired (block ${currentBlock}) ${shortKey(key)} — gone from queries, no event emitted`)
      remove(key, "expired")
    } else {
      c.textContent = `${left} blk · ${(Number(left) * BLOCK_SECONDS)}s`
    }
  }
  $("count").textContent = String([...rows.values()].filter((e) => !e.classList.contains("expired")).length)
}

async function seed() {
  const res = await client.query(QUERY, { includeData: { attributes: true, payload: true, metadata: true } })
  currentBlock = BigInt(res.blockNumber ?? currentBlock)
  for (const e of res.entities.reverse()) upsert(e)
  logLine("info", `seeded ${res.entities.length} entities from query "${QUERY}" @ block ${res.blockNumber}`)
}

async function onCreated(ev) {
  eventCount++
  $("events").textContent = String(eventCount)
  const entity = await client.getEntity(ev.entityKey)
  if (attr(entity, "match") !== MATCH) return
  logLine("created", `EntityCreated push → ${shortKey(ev.entityKey)} ticket ${attr(entity, "ticket_no")} expires @${ev.expiresAt}`)
  upsert(entity, { fresh: true })
}

async function main() {
  $("status").textContent = "connecting…"
  currentBlock = await client.getBlockNumber()
  $("status").textContent = `wss ✓ chain ${tiramisu.id} · transport=${client.transport.type} · eth_subscribe (no polling)`
  await seed()

  client.watchBlockNumber({ emitOnBegin: true, onBlockNumber: (bn) => { currentBlock = bn; tick() } })

  client.watchEntityEvents({
    onError: (e) => logLine("error", `watchEntityEvents: ${e?.shortMessage || e?.message || e}`),
    onEntityCreated: (ev) => onCreated(ev).catch((e) => logLine("error", String(e?.message || e))),
    onEntityDeleted: (ev) => { eventCount++; if (rows.has(ev.entityKey)) { logLine("deleted", `EntityDeleted push → ${shortKey(ev.entityKey)}`); remove(ev.entityKey, "deleted") } },
    onExpiryExtended: (ev) => { eventCount++; const el = rows.get(ev.entityKey); if (el) { el.dataset.expiresAt = String(ev.newExpiresAt ?? ev.expiresAt); el.querySelector(".e").textContent = el.dataset.expiresAt; logLine("info", `ExpiryExtended push → ${shortKey(ev.entityKey)} now @${el.dataset.expiresAt}`) } },
    onEntityPatched: (ev) => { eventCount++; if (rows.has(ev.entityKey)) client.getEntity(ev.entityKey).then((e) => { logLine("info", `EntityPatched push → ${shortKey(ev.entityKey)}`); upsert(e, { fresh: true }) }) },
  })
  logLine("info", "subscribed: watchEntityEvents + watchBlockNumber over the same WebSocket")
}

main().catch((e) => { $("status").textContent = `FAILED: ${e?.shortMessage || e?.message || e}`; logLine("error", String(e?.stack || e)) })
