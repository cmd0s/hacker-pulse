curl https://rpc.tiramisu.db-chain.testnet.arkiv.network \
  -H "content-type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"arkiv_query",
    "params":[
      "type = str('nft') AND status = str('active')",
      {"limit":"0xa","select":{"key":true,"attributes":true}}
    ]
  }'