import { Widget } from '@/types';

export interface LauncherLinkItem {
  id: string;
  title: string;
  url: string;
  hostname: string;
  keywords: string;
  sourceWidgetId: string;
  sourceType: 'quick-link' | 'links';
}

function normalizeUrl(url: string): string {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function getHostname(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function isValidLinkCandidate(url?: string): url is string {
  if (!url?.trim()) {
    return false;
  }

  try {
    new URL(normalizeUrl(url.trim()));
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
    if (widget.type === 'quick-link') {
      const url = widget.config.url?.trim();

      if (!isValidLinkCandidate(url)) {
        return;
      }

      const hostname = getHostname(url);
      const title = widget.config.title?.trim() || hostname || url;

      items.push({
        id: `${widget.id}:quick-link`,
        title,
        url: normalizeUrl(url),
        hostname,
        keywords: createKeywords([title, hostname, url]),
        sourceWidgetId: widget.id,
        sourceType: 'quick-link',
      });
      return;
    }

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
          url: normalizeUrl(url),
          hostname,
          keywords: createKeywords([title, hostname, url]),
          sourceWidgetId: widget.id,
          sourceType: 'links',
        });
      });
    }
  });

  return items;
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
  limit = 8
): LauncherLinkItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return links.slice(0, limit);
  }

  return [...links]
    .map((link) => ({ link, score: getMatchScore(link, normalizedQuery) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.link.title.localeCompare(b.link.title);
    })
    .slice(0, limit)
    .map((item) => item.link);
}
