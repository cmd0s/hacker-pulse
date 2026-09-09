import {
  createPublicClient,
  ExpirationTime,
  jsonToPayload,
  u64,
} from '@arkiv-network/sdk';
import { tiramisu } from '@arkiv-network/sdk/chains';
import { and, eq, gte, render } from '@arkiv-network/sdk/query';
import { http } from 'viem';

export const APP = 'hacker-pulse-ethrome-v1';
export const RUN = 'ethrome-pretest-0909';
export const RPC = 'https://rpc.tiramisu.db-chain.testnet.arkiv.network';
export const EXPLORER = 'https://tiramisu.explorer.arkiv.network';
export const chain = tiramisu;
export const reader = createPublicClient({
  chain,
  transport: http(RPC, { timeout: 12000, retryCount: 1 }),
});
export const selection = {
  key: true,
  owner: true,
  attributes: true,
  payload: true,
  expiresAt: true,
  createdAt: true,
} as const;
export function stationQuery(run = RUN) {
  return and(
    eq('app', APP),
    eq('run', run),
    eq('kind', 'station'),
    gte('seats', u64(1)),
  );
}
export function presenceQuery(run = RUN) {
  return and(
    eq('app', APP),
    eq('run', run),
    eq('kind', 'presence'),
    gte('seats', u64(1)),
  );
}
export function stationInput(stationId: string, run = RUN) {
  return {
    attributes: {
      app: APP,
      run,
      kind: 'station',
      station_id: stationId,
      zone: 'A',
      seats: u64(2),
    },
    payload: jsonToPayload({
      name: 'Arkiv Help Desk',
      description: 'SDK, queries & data modelling',
      synthetic: true,
    }),
    contentType: 'application/json',
    expires: ExpirationTime.fromBlocks(3600),
  };
}
export function presenceInput(stationId: string, blocks = 15, run = RUN) {
  if (!Number.isInteger(blocks) || blocks < 3 || blocks > 60)
    throw new Error('Presence lifetime must be 3–60 blocks.');
  return {
    attributes: {
      app: APP,
      run,
      kind: 'presence',
      station_id: stationId,
      zone: 'A',
      seats: u64(2),
    },
    payload: jsonToPayload({
      synthetic: true,
      purpose: 'Available for a demo',
    }),
    contentType: 'application/json',
    expires: ExpirationTime.fromBlocks(blocks),
  };
}
export type Row = {
  key: string;
  owner: string;
  stationId: string;
  name: string;
  description: string;
  seats: number;
  expiresAt: string;
  createdAt: string;
};
export type Snapshot = {
  observedAt: string;
  block: string;
  stationQuery: string;
  presenceQuery: string;
  stations: Row[];
  presences: Row[];
};
type RawEntity = {
  key?: string;
  owner?: string;
  expiresAt?: bigint;
  createdAt?: bigint;
  attributes?: Readonly<Record<string, { value: unknown }>>;
  payload?: Uint8Array;
};
function normalize(e: RawEntity): Row {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(new TextDecoder().decode(e.payload));
  } catch {
    /* Optional untrusted display data. */
  }
  return {
    key: e.key ?? '',
    owner: e.owner ?? '',
    stationId:
      typeof e.attributes?.station_id?.value === 'string'
        ? e.attributes.station_id.value
        : '',
    name:
      typeof payload?.name === 'string'
        ? payload.name.slice(0, 80)
        : 'Demo station',
    description:
      typeof payload?.description === 'string'
        ? payload.description.slice(0, 180)
        : '',
    seats: Number(e.attributes?.seats?.value ?? 0),
    expiresAt: String(e.expiresAt ?? 0),
    createdAt: String(e.createdAt ?? 0),
  };
}
export async function readSnapshot(run = RUN): Promise<Snapshot> {
  const block = await reader.getBlockNumber({ cacheTime: 0 });
  const [stations, presences] = await Promise.all([
    reader.query(stationQuery(run), {
      select: selection,
      atBlock: block,
      limit: 200,
    }),
    reader.query(presenceQuery(run), {
      select: selection,
      atBlock: block,
      limit: 200,
    }),
  ]);
  if (stations.cursor || presences.cursor)
    throw new Error(
      'Demo scope exceeds 200 rows. Use a new run ID; partial results are not evidence.',
    );
  if (stations.blockNumber !== block || presences.blockNumber !== block)
    throw new Error('RPC returned an inconsistent query block.');
  return {
    observedAt: new Date().toISOString(),
    block: String(block),
    stationQuery: render(stationQuery(run)),
    presenceQuery: render(presenceQuery(run)),
    stations: stations.entities.map(normalize),
    presences: presences.entities.map(normalize),
  };
}
export function presenceFor(station: Row, presences: Row[]): Row | undefined {
  return presences
    .filter(
      (p) =>
        p.stationId === station.stationId &&
        p.owner.toLowerCase() === station.owner.toLowerCase(),
    )
    .sort((a, b) => (BigInt(a.expiresAt) > BigInt(b.expiresAt) ? -1 : 1))[0];
}
export function stringify(value: unknown) {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === 'bigint' ? v.toString() : v),
    2,
  );
}
