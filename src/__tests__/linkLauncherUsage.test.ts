import {
  canonicalizeLauncherUrl,
  clearLauncherQueryUsage,
  clearLauncherUsage,
  getDecayedLauncherScore,
  LAUNCHER_SCORE_HALF_LIFE_MS,
  LAUNCHER_USAGE_STORAGE_KEY,
  readLauncherUsage,
  recordLauncherLinkOpen,
  replaceLauncherUsage,
} from '@/lib/linkLauncherUsage';

describe('linkLauncherUsage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('canonicalizes equivalent URLs and removes fragments', () => {
    expect(canonicalizeLauncherUrl('EXAMPLE.com:443/docs#intro')).toBe(
      'https://example.com/docs'
    );
    expect(canonicalizeLauncherUrl('http://example.com:80/?tab=one#section')).toBe(
      'http://example.com/?tab=one'
    );
  });

  it('records global visits and normalized query associations', () => {
    const now = Date.UTC(2026, 6, 24);

    recordLauncherLinkOpen('github.com', '  G  ', now);
    const store = recordLauncherLinkOpen('https://github.com/', 'g', now + 1000);
    const record = store.links['https://github.com/'];

    expect(record.totalCount).toBe(2);
    expect(record.queryStats.g.count).toBe(2);
    expect(record.lastOpenedAt).toBe(now + 1000);
  });

  it('halves ranking scores after the configured half life', () => {
    const now = Date.UTC(2026, 6, 24);

    expect(getDecayedLauncherScore(8, now, now + LAUNCHER_SCORE_HALF_LIFE_MS)).toBeCloseTo(
      4
    );
  });

  it('clears one query association without clearing total usage', () => {
    const now = Date.UTC(2026, 6, 24);
    recordLauncherLinkOpen('https://github.com', 'g', now);
    recordLauncherLinkOpen('https://github.com', 'git', now + 1);

    const store = clearLauncherQueryUsage('github.com', 'g');
    const record = store.links['https://github.com/'];

    expect(record.totalCount).toBe(2);
    expect(record.queryStats.g).toBeUndefined();
    expect(record.queryStats.git.count).toBe(1);
  });

  it('migrates legacy recent links into initial usage records', () => {
    window.localStorage.setItem(
      'link-launcher-opened-links',
      JSON.stringify([
        {
          id: 'link:https://github.com',
          title: 'GitHub',
          url: 'https://github.com',
          hostname: 'github.com',
        },
      ])
    );

    const store = readLauncherUsage(Date.UTC(2026, 6, 24));

    expect(store.links['https://github.com/'].totalCount).toBe(1);
    expect(window.localStorage.getItem(LAUNCHER_USAGE_STORAGE_KEY)).not.toBeNull();
  });

  it('sanitizes malformed imported records and can clear all learning', () => {
    const store = replaceLauncherUsage({
      version: 1,
      links: {
        valid: {
          canonicalUrl: 'https://example.com',
          totalCount: 3,
          globalScore: 2,
          globalScoreUpdatedAt: 10,
          lastOpenedAt: 10,
          queryStats: {},
        },
        invalid: {
          canonicalUrl: 'not a valid url',
          totalCount: 'many',
        },
      },
    });

    expect(Object.keys(store.links)).toEqual(['https://example.com/']);
    expect(clearLauncherUsage().links).toEqual({});
  });
});
