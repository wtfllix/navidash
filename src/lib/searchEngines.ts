export interface SearchEngine {
  name: string;
  url: string;
  icon: string;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'G' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'B' },
  { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'du' },
  { name: 'GitHub', url: 'https://github.com/search?q=', icon: 'Gh' },
];

export const DEFAULT_SEARCH_ENGINE = SEARCH_ENGINES[0];

export function buildSearchUrl(query: string, engine: SearchEngine = DEFAULT_SEARCH_ENGINE): string {
  return `${engine.url}${encodeURIComponent(query)}`;
}
