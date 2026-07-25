export const LAUNCHER_USAGE_STORAGE_KEY = 'navidash-launcher-usage-v1';
export const LAUNCHER_USAGE_CHANGED_EVENT = 'launcher-usage-changed';
export const LAUNCHER_USAGE_VERSION = 1 as const;
export const LAUNCHER_SCORE_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000;

const LEGACY_OPENED_LINKS_KEY = 'link-launcher-opened-links';

export interface QueryUsageRecord {
  count: number;
  score: number;
  scoreUpdatedAt: number;
  lastUsedAt: number;
}

export interface LinkUsageRecord {
  canonicalUrl: string;
  totalCount: number;
  globalScore: number;
  globalScoreUpdatedAt: number;
  lastOpenedAt: number;
  queryStats: Record<string, QueryUsageRecord>;
}

export interface LauncherUsageStore {
  version: typeof LAUNCHER_USAGE_VERSION;
  links: Record<string, LinkUsageRecord>;
}

function createEmptyUsageStore(): LauncherUsageStore {
  return {
    version: LAUNCHER_USAGE_VERSION,
    links: {},
  };
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function normalizeQueryStats(value: unknown): Record<string, QueryUsageRecord> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([query, candidate]) => {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
          return null;
        }

        const record = candidate as Partial<QueryUsageRecord>;
        if (
          !isFiniteNonNegative(record.count) ||
          !isFiniteNonNegative(record.score) ||
          !isFiniteNonNegative(record.scoreUpdatedAt) ||
          !isFiniteNonNegative(record.lastUsedAt)
        ) {
          return null;
        }

        return [
          normalizeLauncherQuery(query),
          {
            count: record.count,
            score: record.score,
            scoreUpdatedAt: record.scoreUpdatedAt,
            lastUsedAt: record.lastUsedAt,
          },
        ] as const;
      })
      .filter(
        (
          entry
        ): entry is readonly [
          string,
          {
            count: number;
            score: number;
            scoreUpdatedAt: number;
            lastUsedAt: number;
          },
        ] => !!entry?.[0]
      )
  );
}

export function normalizeLauncherQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function canonicalizeLauncherUrl(value: string): string {
  const trimmed = value.trim();
  const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(normalized);

  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = '';

  if (
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  ) {
    url.port = '';
  }

  return url.toString();
}

export function parseLauncherUsageStore(value: unknown): LauncherUsageStore {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createEmptyUsageStore();
  }

  const candidate = value as {
    version?: unknown;
    links?: unknown;
  };

  if (
    candidate.version !== LAUNCHER_USAGE_VERSION ||
    !candidate.links ||
    typeof candidate.links !== 'object' ||
    Array.isArray(candidate.links)
  ) {
    return createEmptyUsageStore();
  }

  const links: Record<string, LinkUsageRecord> = {};

  Object.values(candidate.links).forEach((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return;
    }

    const record = value as Partial<LinkUsageRecord>;
    if (
      typeof record.canonicalUrl !== 'string' ||
      !isFiniteNonNegative(record.totalCount) ||
      !isFiniteNonNegative(record.globalScore) ||
      !isFiniteNonNegative(record.globalScoreUpdatedAt) ||
      !isFiniteNonNegative(record.lastOpenedAt)
    ) {
      return;
    }

    try {
      const canonicalUrl = canonicalizeLauncherUrl(record.canonicalUrl);
      links[canonicalUrl] = {
        canonicalUrl,
        totalCount: record.totalCount,
        globalScore: record.globalScore,
        globalScoreUpdatedAt: record.globalScoreUpdatedAt,
        lastOpenedAt: record.lastOpenedAt,
        queryStats: normalizeQueryStats(record.queryStats),
      };
    } catch {
      // Ignore malformed imported or persisted URLs.
    }
  });

  return {
    version: LAUNCHER_USAGE_VERSION,
    links,
  };
}

export function getDecayedLauncherScore(
  score: number,
  scoreUpdatedAt: number,
  now = Date.now()
): number {
  if (score <= 0 || scoreUpdatedAt <= 0 || now <= scoreUpdatedAt) {
    return Math.max(0, score);
  }

  return score * Math.pow(0.5, (now - scoreUpdatedAt) / LAUNCHER_SCORE_HALF_LIFE_MS);
}

function notifyUsageChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LAUNCHER_USAGE_CHANGED_EVENT));
}

function writeLauncherUsage(store: LauncherUsageStore, notify = true) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAUNCHER_USAGE_STORAGE_KEY, JSON.stringify(store));
    if (notify) notifyUsageChanged();
  } catch {
    // A full or unavailable localStorage must never block opening a link.
  }
}

function migrateLegacyOpenedLinks(now: number): LauncherUsageStore {
  if (typeof window === 'undefined') {
    return createEmptyUsageStore();
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_OPENED_LINKS_KEY);
    if (!raw) return createEmptyUsageStore();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return createEmptyUsageStore();

    const store = createEmptyUsageStore();
    parsed.forEach((item, index) => {
      if (!item || typeof item.url !== 'string') return;

      try {
        const canonicalUrl = canonicalizeLauncherUrl(item.url);
        const usedAt = Math.max(1, now - index);
        store.links[canonicalUrl] = {
          canonicalUrl,
          totalCount: 1,
          globalScore: 1,
          globalScoreUpdatedAt: usedAt,
          lastOpenedAt: usedAt,
          queryStats: {},
        };
      } catch {
        // Ignore invalid legacy URLs.
      }
    });

    if (Object.keys(store.links).length > 0) {
      writeLauncherUsage(store, false);
    }

    return store;
  } catch {
    return createEmptyUsageStore();
  }
}

export function readLauncherUsage(now = Date.now()): LauncherUsageStore {
  if (typeof window === 'undefined') {
    return createEmptyUsageStore();
  }

  try {
    const raw = window.localStorage.getItem(LAUNCHER_USAGE_STORAGE_KEY);
    if (!raw) return migrateLegacyOpenedLinks(now);
    return parseLauncherUsageStore(JSON.parse(raw));
  } catch {
    return createEmptyUsageStore();
  }
}

export function recordLauncherLinkOpen(
  url: string,
  query?: string,
  now = Date.now()
): LauncherUsageStore {
  const store = readLauncherUsage(now);
  const canonicalUrl = canonicalizeLauncherUrl(url);
  const current = store.links[canonicalUrl];
  const nextGlobalScore =
    getDecayedLauncherScore(
      current?.globalScore ?? 0,
      current?.globalScoreUpdatedAt ?? now,
      now
    ) + 1;
  const normalizedQuery = normalizeLauncherQuery(query ?? '');
  const queryStats = { ...(current?.queryStats ?? {}) };

  if (normalizedQuery) {
    const currentQuery = queryStats[normalizedQuery];
    queryStats[normalizedQuery] = {
      count: (currentQuery?.count ?? 0) + 1,
      score:
        getDecayedLauncherScore(
          currentQuery?.score ?? 0,
          currentQuery?.scoreUpdatedAt ?? now,
          now
        ) + 1,
      scoreUpdatedAt: now,
      lastUsedAt: now,
    };
  }

  const nextStore: LauncherUsageStore = {
    version: LAUNCHER_USAGE_VERSION,
    links: {
      ...store.links,
      [canonicalUrl]: {
        canonicalUrl,
        totalCount: (current?.totalCount ?? 0) + 1,
        globalScore: nextGlobalScore,
        globalScoreUpdatedAt: now,
        lastOpenedAt: now,
        queryStats,
      },
    },
  };

  writeLauncherUsage(nextStore);
  return nextStore;
}

export function replaceLauncherUsage(value: unknown): LauncherUsageStore {
  const store = parseLauncherUsageStore(value);
  writeLauncherUsage(store);
  return store;
}

export function clearLauncherUsage(): LauncherUsageStore {
  const store = createEmptyUsageStore();
  writeLauncherUsage(store);
  return store;
}

export function clearLauncherLinkUsage(url: string): LauncherUsageStore {
  const store = readLauncherUsage();
  const canonicalUrl = canonicalizeLauncherUrl(url);
  const links = { ...store.links };
  delete links[canonicalUrl];

  const nextStore = { ...store, links };
  writeLauncherUsage(nextStore);
  return nextStore;
}

export function clearLauncherQueryUsage(url: string, query: string): LauncherUsageStore {
  const store = readLauncherUsage();
  const canonicalUrl = canonicalizeLauncherUrl(url);
  const current = store.links[canonicalUrl];
  const normalizedQuery = normalizeLauncherQuery(query);

  if (!current || !normalizedQuery) {
    return store;
  }

  const queryStats = { ...current.queryStats };
  delete queryStats[normalizedQuery];

  const nextStore: LauncherUsageStore = {
    ...store,
    links: {
      ...store.links,
      [canonicalUrl]: {
        ...current,
        queryStats,
      },
    },
  };
  writeLauncherUsage(nextStore);
  return nextStore;
}
