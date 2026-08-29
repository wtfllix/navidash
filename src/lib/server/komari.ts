import { z } from 'zod';

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 1_000_000;
const METADATA_CACHE_TTL_MS = 60_000;
const STATUS_CACHE_TTL_MS = 4_000;

const komariNodeSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  region: z.string().max(32).optional(),
  traffic_limit: z.number().finite().nonnegative().optional(),
});

const komariNodeStatusSchema = z.object({
  client: z.string().uuid(),
  time: z.string().datetime(),
  cpu: z.number().finite().optional(),
  ram: z.number().finite().nonnegative().optional(),
  ram_total: z.number().finite().positive().optional(),
  disk: z.number().finite().nonnegative().optional(),
  disk_total: z.number().finite().positive().optional(),
  net_in: z.number().finite().nonnegative().optional(),
  net_out: z.number().finite().nonnegative().optional(),
  net_total_up: z.number().finite().nonnegative().optional(),
  net_total_down: z.number().finite().nonnegative().optional(),
  online: z.boolean(),
  uptime: z.number().finite().nonnegative().optional(),
});

const rpcEnvelopeSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.string(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
    })
    .optional(),
});

type KomariNode = z.infer<typeof komariNodeSchema>;
type KomariNodeStatus = z.infer<typeof komariNodeStatusSchema>;

export interface KomariNodeOption {
  id: string;
  name: string;
}

export interface KomariNodeSummary extends KomariNodeOption {
  regionFlag?: string;
  online: boolean;
  updatedAt: string;
  uptimeSeconds?: number;
  cpuPercent?: number;
  memory?: { usedBytes: number; totalBytes: number; percent: number };
  disk?: { usedBytes: number; totalBytes: number; percent: number };
  network?: {
    rxBytesPerSecond: number;
    txBytesPerSecond: number;
    totalUpBytes?: number;
    totalDownBytes?: number;
    trafficLimitBytes?: number;
  };
}

export type KomariStatusResponse =
  | { state: 'ok'; sampledAt: string; node: KomariNodeSummary }
  | { state: 'unconfigured' | 'not_found' | 'unavailable'; nodes: [] };

export type KomariStatusesResponse =
  | {
      state: 'ok';
      sampledAt: string;
      nodes: Record<string, KomariNodeSummary>;
      missingNodeIds: string[];
    }
  | { state: 'unconfigured' | 'unavailable'; nodes: Record<string, never>; missingNodeIds: string[] };

export type KomariNodesResponse =
  | { state: 'ok'; nodes: KomariNodeOption[] }
  | { state: 'unconfigured' | 'unavailable'; nodes: [] };

class KomariRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KomariRequestError';
  }
}

let nodesCache: { expiresAt: number; nodes: KomariNode[] } | null = null;
let nodesRequest: Promise<KomariNode[]> | null = null;
const statusesCache = new Map<string, { expiresAt: number; value: KomariStatusesResponse }>();
const statusesRequests = new Map<string, Promise<KomariStatusesResponse>>();

function getKomariServerConfig() {
  const rawBaseUrl = process.env.KOMARI_BASE_URL?.trim();
  const apiKey = process.env.KOMARI_API_KEY?.trim() || undefined;
  if (!rawBaseUrl) return null;

  try {
    const url = new URL(rawBaseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.hash = '';
    url.search = '';
    return { baseUrl: url.toString().replace(/\/$/, ''), apiKey };
  } catch {
    return null;
  }
}

function clampPercent(value: number | undefined, used?: number, total?: number) {
  const raw = value ?? (used !== undefined && total ? (used / total) * 100 : undefined);
  return raw === undefined ? undefined : Math.min(100, Math.max(0, raw));
}

function uniqueNodeIds(nodeIds: string[]) {
  return Array.from(new Set(nodeIds)).sort();
}

function normalizeRegionFlag(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase().split('')
      .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
      .join('');
  }

  const symbols = Array.from(trimmed);
  return symbols.length === 2 && symbols.every((symbol) => {
    const codePoint = symbol.codePointAt(0) ?? 0;
    return codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
  })
    ? symbols.join('')
    : undefined;
}

async function callKomariRpc<T>(method: string, params: Record<string, unknown>, schema: z.ZodType<T>) {
  const config = getKomariServerConfig();
  if (!config) throw new KomariRequestError('Komari is not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const requestId = `navidash-${method}-${Date.now()}`;

  try {
    const response = await fetch(`${config.baseUrl}/api/rpc2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }),
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    });

    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) throw new KomariRequestError('Komari response is too large');
    const body = await response.arrayBuffer();
    if (body.byteLength > MAX_RESPONSE_BYTES) throw new KomariRequestError('Komari response is too large');
    if (!response.ok) throw new KomariRequestError(`Komari HTTP ${response.status}`);

    const envelope = rpcEnvelopeSchema.parse(JSON.parse(Buffer.from(body).toString('utf8')));
    if (envelope.id !== requestId || envelope.error || envelope.result === undefined) {
      throw new KomariRequestError('Komari RPC request failed');
    }
    return schema.parse(envelope.result);
  } catch (error) {
    if (error instanceof KomariRequestError) throw error;
    throw new KomariRequestError(error instanceof Error ? error.message : 'Komari request failed');
  } finally {
    clearTimeout(timeout);
  }
}

async function getKomariNodeMetadata(): Promise<KomariNode[]> {
  if (nodesCache && nodesCache.expiresAt > Date.now()) return nodesCache.nodes;
  if (nodesRequest) return nodesRequest;

  nodesRequest = callKomariRpc('public:getNodesInformation', {}, z.array(komariNodeSchema))
    .then((nodes) => {
      nodesCache = { nodes, expiresAt: Date.now() + METADATA_CACHE_TTL_MS };
      return nodes;
    })
    .finally(() => {
      nodesRequest = null;
    });
  return nodesRequest;
}

function toNodeSummary(node: KomariNode, status: KomariNodeStatus): KomariNodeSummary {
  const memoryPercent = clampPercent(undefined, status.ram, status.ram_total);
  const diskPercent = clampPercent(undefined, status.disk, status.disk_total);
  return {
    id: node.uuid,
    name: node.name,
    regionFlag: normalizeRegionFlag(node.region),
    online: status.online,
    updatedAt: status.time,
    uptimeSeconds: status.uptime,
    cpuPercent: clampPercent(status.cpu),
    ...(status.ram !== undefined && status.ram_total !== undefined && memoryPercent !== undefined
      ? { memory: { usedBytes: status.ram, totalBytes: status.ram_total, percent: memoryPercent } }
      : {}),
    ...(status.disk !== undefined && status.disk_total !== undefined && diskPercent !== undefined
      ? { disk: { usedBytes: status.disk, totalBytes: status.disk_total, percent: diskPercent } }
      : {}),
    ...(status.net_in !== undefined && status.net_out !== undefined
      ? {
          network: {
            rxBytesPerSecond: status.net_in,
            txBytesPerSecond: status.net_out,
            totalUpBytes: status.net_total_up,
            totalDownBytes: status.net_total_down,
            trafficLimitBytes: node.traffic_limit,
          },
        }
      : {}),
  };
}

export async function getKomariNodesResponse(): Promise<KomariNodesResponse> {
  if (!getKomariServerConfig()) return { state: 'unconfigured', nodes: [] };

  try {
    const nodes = await getKomariNodeMetadata();
    return { state: 'ok', nodes: nodes.map((node) => ({ id: node.uuid, name: node.name })) };
  } catch {
    return { state: 'unavailable', nodes: [] };
  }
}

export async function getKomariStatuses(nodeIds: string[]): Promise<KomariStatusesResponse> {
  if (!getKomariServerConfig()) return { state: 'unconfigured', nodes: {}, missingNodeIds: [] };
  const uniqueIds = uniqueNodeIds(nodeIds);
  if (uniqueIds.length === 0) {
    return { state: 'ok', sampledAt: new Date().toISOString(), nodes: {}, missingNodeIds: [] };
  }

  const cacheKey = uniqueIds.join(',');
  const cached = statusesCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const inFlight = statusesRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const request = getKomariStatusesUncached(uniqueIds);
  statusesRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    statusesRequests.delete(cacheKey);
  }
}

async function getKomariStatusesUncached(nodeIds: string[]): Promise<KomariStatusesResponse> {
  try {
    const [allNodes, statuses] = await Promise.all([
      getKomariNodeMetadata(),
      callKomariRpc(
        'common:getNodesLatestStatus',
        { uuids: nodeIds },
        z.record(z.string().uuid(), komariNodeStatusSchema)
      ),
    ]);
    const nodesById = new Map(allNodes.map((node) => [node.uuid, node]));
    const nodes: Record<string, KomariNodeSummary> = {};
    const missingNodeIds: string[] = [];

    for (const nodeId of nodeIds) {
      const node = nodesById.get(nodeId);
      const status = statuses[nodeId];
      if (!node || !status) {
        missingNodeIds.push(nodeId);
        continue;
      }
      nodes[nodeId] = toNodeSummary(node, status);
    }

    const sampledAt = Object.values(nodes).reduce(
      (latest, node) => (node.updatedAt > latest ? node.updatedAt : latest),
      new Date(0).toISOString()
    );
    const value: KomariStatusesResponse = { state: 'ok', sampledAt, nodes, missingNodeIds };
    statusesCache.set(nodeIds.join(','), { value, expiresAt: Date.now() + STATUS_CACHE_TTL_MS });
    return value;
  } catch {
    return { state: 'unavailable', nodes: {}, missingNodeIds: [] };
  }
}

export async function getKomariStatus(nodeId?: string): Promise<KomariStatusResponse> {
  if (!nodeId) return { state: 'not_found', nodes: [] };
  const response = await getKomariStatuses([nodeId]);
  if (response.state !== 'ok') return { state: response.state, nodes: [] };
  const node = response.nodes[nodeId];
  return node
    ? { state: 'ok', sampledAt: response.sampledAt, node }
    : { state: 'not_found', nodes: [] };
}
