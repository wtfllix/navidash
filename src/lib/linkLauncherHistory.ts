import { LauncherLinkItem } from '@/lib/linkLauncher';

const SEARCH_HISTORY_KEY = 'link-launcher-search-history';
const OPENED_LINKS_KEY = 'link-launcher-opened-links';
const MAX_HISTORY_ITEMS = 5;

export interface LauncherSearchHistoryItem {
  id: string;
  query: string;
}

export interface LauncherOpenedLinkHistoryItem {
  id: string;
  title: string;
  url: string;
  hostname: string;
  sourceType: LauncherLinkItem['sourceType'];
}

function safeRead<T>(key: string): T[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readLauncherSearchHistory(): LauncherSearchHistoryItem[] {
  return safeRead<LauncherSearchHistoryItem>(SEARCH_HISTORY_KEY);
}

export function readLauncherOpenedLinks(): LauncherOpenedLinkHistoryItem[] {
  return safeRead<LauncherOpenedLinkHistoryItem>(OPENED_LINKS_KEY);
}

export function pushLauncherSearchHistory(query: string): LauncherSearchHistoryItem[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return readLauncherSearchHistory();
  }

  const nextItems = [
    { id: `search:${normalizedQuery.toLowerCase()}`, query: normalizedQuery },
    ...readLauncherSearchHistory().filter((item) => item.query.toLowerCase() !== normalizedQuery.toLowerCase()),
  ].slice(0, MAX_HISTORY_ITEMS);

  safeWrite(SEARCH_HISTORY_KEY, nextItems);
  return nextItems;
}

export function pushLauncherOpenedLink(link: LauncherLinkItem): LauncherOpenedLinkHistoryItem[] {
  const nextItems = [
    {
      id: `link:${link.url}`,
      title: link.title,
      url: link.url,
      hostname: link.hostname,
      sourceType: link.sourceType,
    },
    ...readLauncherOpenedLinks().filter((item) => item.url !== link.url),
  ].slice(0, MAX_HISTORY_ITEMS);

  safeWrite(OPENED_LINKS_KEY, nextItems);
  return nextItems;
}
