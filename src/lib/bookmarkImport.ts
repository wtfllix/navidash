import { Bookmark } from '@/types';

const MAX_BOOKMARKS = 200;

export interface BookmarkImportData {
  bookmarks: Bookmark[];
  count: number;
}

export interface BookmarkTextImportData extends BookmarkImportData {
  duplicateCount: number;
  invalidCount: number;
}

function parseSupportedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

export function createBookmarkImportData(
  html: string,
  idPrefix = `bookmarks-${Date.now()}`
): BookmarkImportData {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const seen = new Set<string>();
  const links = Array.from(document.querySelectorAll('a'))
    .flatMap((anchor, index) => {
      try {
        const url = new URL(anchor.getAttribute('href') ?? '');
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return [];
        url.hash = '';
        const canonical = url.toString();
        if (seen.has(canonical)) return [];
        seen.add(canonical);
        return [
          {
            id: `${idPrefix}-link-${index}`,
            title: anchor.textContent?.trim() || url.hostname,
            url: canonical,
          },
        ];
      } catch {
        return [];
      }
    })
    .slice(0, MAX_BOOKMARKS);

  return {
    bookmarks: links,
    count: links.length,
  };
}

export function createBookmarkTextImportData(
  text: string,
  idPrefix = `bookmarks-${Date.now()}`
): BookmarkTextImportData {
  const bookmarks: Bookmark[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;
  let invalidCount = 0;
  let sourceIndex = 0;

  const addBookmark = (title: string, rawUrl: string) => {
    const url = parseSupportedUrl(rawUrl);
    if (!url) return false;
    const canonical = url.toString();
    if (seen.has(canonical)) {
      duplicateCount += 1;
      return true;
    }
    if (bookmarks.length >= MAX_BOOKMARKS) return true;

    seen.add(canonical);
    bookmarks.push({
      id: `${idPrefix}-link-${sourceIndex}`,
      title: title.trim() || url.hostname,
      url: canonical,
    });
    sourceIndex += 1;
    return true;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    let matched = false;
    let remaining = line;

    const markdownPattern = /\[([^\]]+)\]\(\s*(https?:\/\/[^\s)]+)\s*\)/gi;
    remaining = remaining.replace(markdownPattern, (_match, title: string, url: string) => {
      matched = addBookmark(title, url) || matched;
      return ' ';
    });

    const titledUrlMatch = remaining.match(
      /^(?:[-*+]\s*)?(.+?)\s*\|\s*(https?:\/\/\S+)\s*$/
    );
    if (titledUrlMatch) {
      matched = addBookmark(titledUrlMatch[1], titledUrlMatch[2]) || matched;
      remaining = '';
    }

    const plainUrlPattern = /https?:\/\/[^\s<>\])]+/gi;
    remaining.replace(plainUrlPattern, (url) => {
      matched = addBookmark('', url.replace(/[.,;!?，。；！？]+$/, '')) || matched;
      return url;
    });

    if (!matched) invalidCount += 1;
  }

  return {
    bookmarks,
    count: bookmarks.length,
    duplicateCount,
    invalidCount,
  };
}
