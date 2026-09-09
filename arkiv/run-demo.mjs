import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createWalletClient } from '@arkiv-network/sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { http, parseEther, formatEther } from 'viem';
import {
  chain,
  RPC,
  RUN,
  reader,
  readSnapshot,
  stationInput,
  presenceInput,
  stringify,
  presenceFor,
} from './model.ts';
const secret = JSON.parse(readFileSync('.local/test-wallet.json', 'utf8'));
const account = privateKeyToAccount(secret.privateKey);
const wallet = createWalletClient({
  chain,
  account,
  transport: http(RPC, { timeout: 15000, retryCount: 0 }),
});
const start = await reader.getBalance({ address: account.address });
assert.equal(await reader.getChainId(), 7738577);
assert(start > parseEther('0.001'), 'Test wallet is not funded.');
const proof = {
  status: 'running',
  run: RUN,
  chainId: chain.id,
  sdk: '0.8.0-dev.4',
  startedAt: new Date().toISOString(),
  wallet: account.address,
  startingBalanceWei: String(start),
  transactions: [],
  snapshots: [],
  writes: ['create station', 'create presence'],
  deleteCalls: 0,
};
mkdirSync('arkiv/evidence', { recursive: true });
mkdirSync('public/evidence', { recursive: true });
function save() {
  writeFileSync('arkiv/evidence/live-run.json', stringify(proof));
  writeFileSync('public/evidence/latest.json', stringify(proof));
}
const gasPrice = await reader.getGasPrice();
const gas = 2_000_000n;
assert(
  gas * gasPrice * 2n <= parseEther('0.01'),
  'Worst-case fees exceed the 0.01 GLM test budget.',
);
console.log(
  'funded',
  formatEther(start),
  'GLM; capped cost for two transactions',
  formatEther(gas * gasPrice * 2n),
);
const stationId = 'desk-' + Date.now().toString(36);
try {
  save();
  const station = await wallet.createEntity(stationInput(stationId), {
    gas,
    gasPrice,
  });
  proof.transactions.push(station);
  save();
  console.log('STATION', stringify(station));
  const presence = await wallet.createEntity(presenceInput(stationId, 15), {
    gas,
    gasPrice,
  });
  proof.transactions.push(presence);
  save();
  console.log('PRESENCE', stringify(presence));
  const before = await readSnapshot();
  proof.before = before;
  proof.snapshots.push(before);
  save();
  const p = before.presences.find((p) => p.key === presence.entityKey);
  assert(p, 'Created presence was not independently queryable.');
  const s = before.stations.find((s) => s.key === station.entityKey);
  assert(s, 'Station not queryable.');
  assert.equal(presenceFor(s, before.presences)?.key, presence.entityKey);
  proof.receiptExpiry = String(presence.expiresAt);
  proof.queryExpiry = p.expiresAt;
  console.log('BEFORE', before.block, 'expires at', p.expiresAt);
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    const current = await readSnapshot();
    proof.snapshots.push(current);
    save();
    console.log(
      'QUERY block',
      current.block,
      'presence',
      current.presences.some((x) => x.key === presence.entityKey),
    );
    if (!current.presences.some((x) => x.key === presence.entityKey)) {
      assert(
        BigInt(current.block) >= BigInt(p.expiresAt),
        'Disappeared before expiry.',
      );
      assert(
        current.stations.some((x) => x.key === station.entityKey),
        'Station disappeared with presence.',
      );
      assert.equal(before.presenceQuery, current.presenceQuery);
      proof.after = current;
      proof.assertions = {
        presenceVisibleBefore: true,
        presenceAbsentAfter: true,
        stationStillVisible: true,
        sameQuery: true,
        expiryBoundaryReached: true,
        noDeleteCalls: true,
        receiptMatchesEntity: proof.receiptExpiry === proof.queryExpiry,
      };
      proof.status = 'passed';
      break;
    }
  }
  assert.equal(proof.status, 'passed', 'Timeout waiting for natural expiry.');
  const end = await reader.getBalance({ address: account.address });
  proof.endingBalanceWei = String(end);
  proof.costWei = String(start - end);
  proof.receipts = await Promise.all(
    proof.transactions.map((t) =>
      reader.getTransactionReceipt({ hash: t.txHash }),
    ),
  );
  proof.finishedAt = new Date().toISOString();
  save();
  console.log(
    'PASS',
    stringify(proof.assertions),
    'cost GLM',
    formatEther(start - end),
  );
} catch (e) {
  proof.status = 'failed';
  proof.error = e.shortMessage ?? e.message;
  proof.finishedAt = new Date().toISOString();
  save();
  console.error(proof.error);
  process.exitCode = 1;
}
