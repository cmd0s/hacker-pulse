'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Activity,
  ArrowUpRight,
  Radio,
  Blocks,
  Download,
  Plus,
  Wallet,
  Check,
  Circle,
  RefreshCw,
} from 'lucide-react';
import { createWalletClient } from '@arkiv-network/sdk';
import { custom, formatEther, type EIP1193Provider, type Address } from 'viem';
import { Button } from '@/components/ui/button';
import {
  APP,
  RUN,
  RPC,
  EXPLORER,
  chain,
  reader,
  readSnapshot,
  presenceFor,
  stationInput,
  presenceInput,
  stringify,
  type Snapshot,
} from '@/arkiv/model';
type Proof = {
  status: string;
  run?: string;
  before?: Snapshot;
  after?: Snapshot;
  transactions?: { txHash: string; entityKey: string; expiresAt: string }[];
  assertions?: Record<string, boolean>;
};
const short = (s: string) => `${s.slice(0, 8)}…${s.slice(-5)}`;
function subscribeLocation(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}
function getRun() {
  const value = new URLSearchParams(window.location.search).get('run');
  return value && /^[a-zA-Z0-9_-]{1,64}$/.test(value) ? value : RUN;
}
export default function Home() {
  const [liveSnapshot, setSnapshot] = useState<Snapshot>();
  const [account, setAccount] = useState<Address>();
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [proofMode, setProofMode] = useState<'live' | 'before' | 'after'>(
    'live',
  );
  const [busy, setBusy] = useState('');
  const [proof, setProof] = useState<Proof>();
  const [transactions, setTransactions] = useState<
    { txHash: string; entityKey: string; expiresAt: string }[]
  >([]);
  const snapshot =
    proofMode === 'before'
      ? proof?.before
      : proofMode === 'after'
        ? proof?.after
        : liveSnapshot;
  const history = useRef<Snapshot[]>([]);
  const run = useSyncExternalStore(subscribeLocation, getRun, () => RUN);
  const inFlight = useRef(false);
  useEffect(() => {
    let alive = true;
    async function refresh() {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const v = await readSnapshot(run);
        if (alive) {
          setSnapshot(v);
          setReadError('');
          if (history.current.at(-1)?.block !== v.block)
            history.current = [...history.current.slice(-179), v];
        }
      } catch (e) {
        if (alive) setReadError(e instanceof Error ? e.message : String(e));
      } finally {
        inFlight.current = false;
      }
    }
    void refresh();
    const t = setInterval(refresh, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [run]);
  useEffect(() => {
    const load = () =>
      fetch('/evidence/latest.json', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => {
          if (p && typeof p === 'object' && 'status' in p) setProof(p as Proof);
        })
        .catch(() => {});
    void load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);
  function provider(): EIP1193Provider {
    const p = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
    if (!p)
      throw new Error(
        'Open this page in the browser with MetaMask installed. Reading needs no wallet.',
      );
    return p;
  }
  async function connect() {
    setBusy('Connecting wallet');
    try {
      const a = (await provider().request({
        method: 'eth_requestAccounts',
      })) as Address[];
      if (!a[0]) throw new Error('No wallet selected.');
      setAccount(a[0]);
      setBalance(
        Number(formatEther(await reader.getBalance({ address: a[0] }))).toFixed(
          5,
        ),
      );
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  }
  async function write(kind: 'station' | 'presence', stationId?: string) {
    if (!account) {
      await connect();
      return;
    }
    setBusy(
      kind === 'station'
        ? 'Confirm station in wallet'
        : 'Confirm presence in wallet',
    );
    try {
      const p = provider();
      await p.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7614d1' }],
      });
      const a = (await p.request({ method: 'eth_accounts' })) as Address[];
      if (a[0]?.toLowerCase() !== account.toLowerCase())
        throw new Error('Wallet account changed. Reconnect before writing.');
      const w = createWalletClient({ chain, account, transport: custom(p) });
      const r = await w.createEntity(
        kind === 'station'
          ? stationInput(`desk-${crypto.randomUUID().slice(0, 8)}`, run)
          : presenceInput(stationId!, 15, run),
      );
      setTransactions((v) => [...v, { ...r, expiresAt: String(r.expiresAt) }]);
      setSnapshot(await readSnapshot(run));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  }
  function download() {
    const blob = new Blob(
      [
        stringify({
          app: APP,
          chainId: chain.id,
          run,
          transactions,
          snapshots: history.current,
          verifiedRun: proof,
        }),
      ],
      { type: 'application/json' },
    );
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = 'hacker-pulse-evidence.json';
    a.click();
    URL.revokeObjectURL(u);
  }
  const active =
    snapshot?.stations.filter((s) => presenceFor(s, snapshot.presences))
      .length ?? 0;
  const verified = proof?.status === 'passed' && proof.run === run;
  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Activity size={24} />
          </span>
          Hacker Pulse<span className="edition">ETHROME / 2026</span>
        </Link>
        <div className="top-actions">
          <span className="network">
            <i className={readError || !liveSnapshot ? 'dot warn' : 'dot'} />
            Tiramisu testnet
          </span>
          <Button
            variant="outline"
            onClick={connect}
            disabled={!!busy}
            className="wallet"
          >
            <Wallet />
            {account ? `${short(account)} · ${balance} GLM` : 'Connect wallet'}
          </Button>
        </div>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">MISSION 02 / BUILT TO EXPIRE</p>
          <h1>
            Here now.
            <br />
            <span>Gone when the lease ends.</span>
          </h1>
          <p className="intro-copy">
            A live availability board for hackathon demo stations.
            <br />
            Presence expires on Arkiv. The station stays.
          </p>
        </div>
        <div className="block-readout">
          <span className="eyebrow">
            {proofMode === 'live'
              ? 'LATEST QUERY BLOCK'
              : 'RECORDED QUERY BLOCK'}
          </span>
          <strong>
            {snapshot ? Number(snapshot.block).toLocaleString('en-US') : '—'}
          </strong>
          <span>
            <Blocks size={15} /> Expiry follows blocks, not the clock
          </span>
        </div>
      </section>
      {(error || readError) && (
        <div role="alert" className="error">
          <strong>Could not complete the request.</strong>
          <p>{(error || readError).slice(0, 800)}</p>
          <small>
            Displayed data may be stale. An RPC error never marks a station
            offline.
          </small>
        </div>
      )}
      <section className="workspace">
        <div className="board">
          <div className="section-heading">
            <div>
              <h2>
                Station board{' '}
                <span className="count">{snapshot?.stations.length ?? 0}</span>
              </h2>
              <p>
                <span className="green">{active} available</span>
                <span className="separator">/</span>
                {(snapshot?.stations.length ?? 0) - active} offline
              </p>
            </div>
            <Button
              onClick={() => write('station')}
              disabled={!!busy || proofMode !== 'live'}
              variant="outline"
            >
              <Plus />
              Add station
            </Button>
          </div>
          {!snapshot?.stations.length ? (
            <div className="empty-state">
              <Radio size={35} />
              <h3>{snapshot ? 'The floor is quiet.' : 'Reading the floor…'}</h3>
              <p>
                {snapshot
                  ? 'Add a station, then announce a short presence. Public demo data only.'
                  : 'Fetching stations and presence from Tiramisu.'}
              </p>
              <Button onClick={() => write('station')} disabled={!!busy}>
                Create your station
                <ArrowUpRight />
              </Button>
            </div>
          ) : (
            <div className="station-grid">
              {snapshot.stations.map((s) => {
                const p = presenceFor(s, snapshot.presences);
                const own = account?.toLowerCase() === s.owner.toLowerCase();
                return (
                  <article
                    className={`station ${p ? 'available' : 'offline'}`}
                    key={s.key}
                  >
                    <div className="station-top">
                      <span className="station-number">
                        ZONE A / {s.seats} SEATS
                      </span>
                      <span className={`status ${p ? 'on' : ''}`}>
                        <i className={p ? 'dot' : 'dot off'} />
                        {p ? 'Available' : 'Offline'}
                      </span>
                    </div>
                    <div className="station-symbol">
                      <Radio size={34} />
                    </div>
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
                    <div className="lease">
                      <span>
                        {p ? 'Presence expires at block' : 'Presence'}
                      </span>
                      <strong>
                        {p
                          ? Number(p.expiresAt).toLocaleString('en-US')
                          : 'No active lease'}
                      </strong>
                      {p && (
                        <small>
                          {Math.max(
                            0,
                            Number(
                              BigInt(p.expiresAt) - BigInt(snapshot.block),
                            ),
                          )}{' '}
                          blocks remaining · network-dependent duration
                        </small>
                      )}
                    </div>
                    <div className="station-footer">
                      <a
                        href={`${EXPLORER}/address/${s.owner}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {short(s.owner)}
                        <ArrowUpRight size={13} />
                      </a>
                      <Button
                        onClick={() => write('presence', s.stationId)}
                        disabled={!!busy || !!p || !own || proofMode !== 'live'}
                        variant={p ? 'outline' : 'default'}
                      >
                        {p ? 'Presence active' : 'Go available · 15 blocks'}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <div className="board-note">
            <RefreshCw size={14} />
            <span>
              {proofMode === 'live'
                ? 'Read every 3 seconds · state comes from query results · no delete calls'
                : 'RECORDED EVIDENCE · actual query result from the verified run'}
            </span>
          </div>
        </div>
        <aside className="proof-panel">
          <p className="eyebrow">THE EXPIRY PROOF</p>
          <h2>
            Same query.
            <br />
            Different answer.
          </h2>
          <p>
            A presence appears, then disappears naturally. Its station remains
            queryable.
          </p>
          <div className="proof-step">
            <span className="step-icon">01</span>
            <div>
              <h3>Before expiry</h3>
              <p>
                {verified
                  ? `Block ${proof.before?.block} · ${proof.before?.presences.length} presence`
                  : 'Waiting for a recorded live run'}
              </p>
            </div>
            {verified && <Check className="green" size={18} />}
          </div>
          <div className="proof-step">
            <span className="step-icon">02</span>
            <div>
              <h3>After expiry</h3>
              <p>
                {verified
                  ? `Block ${proof.after?.block} · ${proof.after?.presences.length} presence`
                  : 'Same filter, later block'}
              </p>
            </div>
            {verified && <Check className="green" size={18} />}
          </div>
          <div className={`proof-verdict ${verified ? 'passed' : ''}`}>
            {verified ? <Check size={20} /> : <Circle size={18} />}
            <span>
              {verified
                ? 'Natural expiry verified on Tiramisu'
                : 'Live proof pending'}
            </span>
          </div>
          <div className="proof-controls">
            <Button
              variant="outline"
              disabled={!verified}
              onClick={() => setProofMode('before')}
            >
              View before
            </Button>
            <Button
              variant="outline"
              disabled={!verified}
              onClick={() => setProofMode('after')}
            >
              View after
            </Button>
            <Button
              variant="outline"
              disabled={proofMode === 'live'}
              onClick={() => setProofMode('live')}
            >
              Live
            </Button>
          </div>
          <Button onClick={download} variant="outline" className="export">
            <Download />
            Export evidence
          </Button>
          {verified && (
            <a
              className="evidence-link"
              href="/evidence/latest.json"
              target="_blank"
            >
              Open verified run JSON
              <ArrowUpRight size={14} />
            </a>
          )}
          <p className="proof-footnote">
            The recorded run is separate from current availability. Reannounce a
            presence to demonstrate again.
          </p>
        </aside>
      </section>
      <section className="query-panel">
        <div>
          <p className="eyebrow">NETWORK RECEIPT</p>
          <h2>What the board actually asks</h2>
        </div>
        <pre>
          {snapshot?.presenceQuery ?? 'Connecting to the Arkiv query endpoint…'}
        </pre>
        <div className="query-meta">
          <span>Run: {run}</span>
          <span>SDK 0.8.0-dev.4</span>
          <span>Chain {chain.id}</span>
          <span>
            {snapshot
              ? `Observed ${new Date(snapshot.observedAt).toLocaleTimeString()}`
              : RPC}
          </span>
        </div>
        {transactions.map((t) => (
          <a
            className="tx"
            key={t.txHash}
            href={`${EXPLORER}/tx/${t.txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            Transaction {short(t.txHash)}
            <ArrowUpRight size={13} />
          </a>
        ))}
      </section>
      <footer>
        <span>
          <Activity size={15} /> Hacker Pulse · ETHRome preflight
        </span>
        <a
          href="https://stage.hub.arkiv.network/ethrome"
          target="_blank"
          rel="noreferrer"
        >
          Built with Arkiv
          <ArrowUpRight size={14} />
        </a>
      </footer>
      {busy && (
        <output className="busy">
          <Activity size={17} />
          {busy}…
        </output>
      )}
    </main>
  );
}
