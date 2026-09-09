"""Run three bounded public reads; never submit transactions or load credentials."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
QUERIES = [
    ("docs-original", json.loads((ROOT / "docs-query-shell-result.json").read_text())),
    ("docs-corrected", {
        "jsonrpc": "2.0", "id": 2, "method": "arkiv_query",
        "params": ["type = str('nft') AND status = str('active')", {
            "limit": "0xa", "select": {"key": True, "attributes": True},
        }],
    }),
    ("large-expiry", {
        "jsonrpc": "2.0", "id": 3, "method": "arkiv_query",
        "params": ["$expiresAt > u64(1000000000)", {
            "limit": "0xa", "select": {
                "key": True, "createdAt": True, "expiresAt": True,
                "contentType": True, "creationFlags": True,
            },
        }],
    }),
]

for name, body in QUERIES:
    response = subprocess.run([
        "curl", "--silent", "--show-error", "--max-time", "15",
        "https://rpc.tiramisu.db-chain.testnet.arkiv.network",
        "-H", "content-type: application/json", "--data-binary", "@-",
    ], input=json.dumps(body), capture_output=True, text=True, check=True)
    result = json.loads(response.stdout)
    (ROOT / f"{name}-rpc.json").write_text(
        json.dumps({"request": body, "response": result}, indent=2) + "\n"
    )
    print(name, json.dumps(result))
