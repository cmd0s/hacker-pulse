#!/bin/sh
# Read-only replacement for the documentation's "By attribute" example.
curl --silent --show-error --max-time 15 \
  https://rpc.tiramisu.db-chain.testnet.arkiv.network \
  -H 'content-type: application/json' \
  --data-binary @- <<'JSON'
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "arkiv_query",
  "params": [
    "type = str('nft') AND status = str('active')",
    {"limit": "0xa", "select": {"key": true, "attributes": true}}
  ]
}
JSON
