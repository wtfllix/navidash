import { Bookmark, Widget } from '@/types';
import {
  canonicalizeLauncherUrl,
  getDecayedLauncherScore,
  LauncherUsageStore,
  normalizeLauncherQuery,
} from '@/lib/linkLauncherUsage';

export interface LauncherLinkItem {
  id: string;
  title: string;
  url: string;
  hostname: string;
  keywords: string;
  sourceWidgetId: string;
  rankingReason?: 'learned' | 'frequent' | 'recent' | 'match';
}

export function normalizeLauncherUrl(url: string): string {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function getHostname(url: string): string {
  try {
    return new URL(normalizeLauncherUrl(url)).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function isValidLinkCandidate(url?: string): url is string {
  if (!url?.trim()) {
    return false;
  }

  try {
    new URL(normalizeLauncherUrl(url.trim()));
    return true;
  } catch {
    return false;
  }
}

function createKeywords(parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
}

export function collectLauncherLinks(widgets: Widget[]): LauncherLinkItem[] {
  const items: LauncherLinkItem[] = [];

  widgets.forEach((widget) => {
    if (widget.type === 'links') {
      (widget.config.links ?? []).forEach((link) => {
        const url = link.url?.trim();

        if (!isValidLinkCandidate(url)) {
          return;
        }

        const hostname = getHostname(url);
        const title = link.title.trim() || hostname || url;

        items.push({
          id: `${widget.id}:${link.id}`,
          title,
          url: normalizeLauncherUrl(url),
          hostname,
          keywords: createKeywords([title, hostname, url]),
          sourceWidgetId: widget.id,
        });
      });
    }
  });

  return items;
}

export function collectLauncherBookmarks(bookmarks: Bookmark[]): LauncherLinkItem[] {
  return bookmarks.flatMap((bookmark) => {
    const url = bookmark.url?.trim();
    if (!isValidLinkCandidate(url)) return [];
    const hostname = getHostname(url);
    const title = bookmark.title.trim() || hostname || url;

    return [
      {
        id: bookmark.id,
        title,
        url: normalizeLauncherUrl(url),
        hostname,
        keywords: createKeywords([title, hostname, url, bookmark.folder]),
        sourceWidgetId: 'bookmark-library',
      },
    ];
  });
}

function getMatchScore(link: LauncherLinkItem, query: string): number {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return 0;
  }

  const title = link.title.toLowerCase();
  const hostname = link.hostname.toLowerCase();
  const url = link.url.toLowerCase();

  if (title === normalizedQuery || hostname === normalizedQuery) {
    return 400;
  }

  if (title.startsWith(normalizedQuery)) {
    return 300;
  }

  if (hostname.startsWith(normalizedQuery)) {
    return 260;
  }

  if (url.startsWith(normalizedQuery)) {
    return 220;
  }

  if (title.includes(normalizedQuery)) {
    return 180;
  }

  if (hostname.includes(normalizedQuery)) {
    return 140;
  }

  if (link.keywords.includes(normalizedQuery)) {
    return 100;
  }

  return -1;
}

export function searchLauncherLinks(
  links: LauncherLinkItem[],
  query: string,
  limit = 8,
  usage?: LauncherUsageStore,
  now = Date.now()
): LauncherLinkItem[] {
  const normalizedQuery = normalizeLauncherQuery(query);

  return [...links]
    .map((link) => {
      let usageRecord;
      try {
        usageRecord = usage?.links[canonicalizeLauncherUrl(link.url)];
      } catch {
        usageRecord = undefined;
      }

      const queryRecord = normalizedQuery ? usageRecord?.queryStats[normalizedQuery] : undefined;
      const queryScore = queryRecord
        ? getDecayedLauncherScore(queryRecord.score, queryRecord.scoreUpdatedAt, now)
        : 0;
      const globalScore = usageRecord
        ? getDecayedLauncherScore(
            usageRecord.globalScore,
            usageRecord.globalScoreUpdatedAt,
            now
          )
        : 0;
      const matchScore = normalizedQuery ? getMatchScore(link, normalizedQuery) : 0;
      const rankingReason: LauncherLinkItem['rankingReason'] =
        queryScore > 0
          ? 'learned'
          : globalScore > 0
            ? 'frequent'
            : usageRecord?.lastOpenedAt
              ? 'recent'
              : 'match';

      return {
        link: { ...link, rankingReason },
        matchScore,
        queryScore,
        globalScore,
        lastOpenedAt: usageRecord?.lastOpenedAt ?? 0,
      };
    })
    .filter((item) => !normalizedQuery || item.matchScore >= 0)
    .sort((a, b) => {
      if (normalizedQuery && b.queryScore !== a.queryScore) {
        return b.queryScore - a.queryScore;
      }

      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      if (b.globalScore !== a.globalScore) {
        return b.globalScore - a.globalScore;
      }

      if (b.lastOpenedAt !== a.lastOpenedAt) {
        return b.lastOpenedAt - a.lastOpenedAt;
      }

      return a.link.title.localeCompare(b.link.title);
    })
    .slice(0, limit)
    .map((item) => item.link);
}
