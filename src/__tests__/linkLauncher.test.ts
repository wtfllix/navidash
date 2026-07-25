import {
  collectLauncherBookmarks,
  collectLauncherLinks,
  searchLauncherLinks,
} from '@/lib/linkLauncher';
import { LauncherUsageStore } from '@/lib/linkLauncherUsage';
import { Widget } from '@/types';

describe('linkLauncher', () => {
  it('collects the global bookmark library independently from canvas widgets', () => {
    expect(
      collectLauncherBookmarks([
        {
          id: 'docs',
          title: 'Product Docs',
          url: 'docs.example.com',
          folder: 'Work',
        },
      ])
    ).toEqual([
      expect.objectContaining({
        id: 'docs',
        title: 'Product Docs',
        url: 'https://docs.example.com',
        sourceWidgetId: 'bookmark-library',
        keywords: expect.stringContaining('work'),
      }),
    ]);
  });

  it('collects links widget entries', () => {
    const widgets: Widget[] = [
      {
        id: 'links-1',
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
        config: {
          links: [
            { id: 'github', title: 'GitHub', url: 'github.com' },
            { id: 'notion', title: 'Notion', url: 'https://notion.so' },
            { id: 'docs', title: 'Docs', url: 'docs.example.com' },
          ],
        },
      },
    ];

    expect(collectLauncherLinks(widgets)).toEqual([
      expect.objectContaining({
        id: 'links-1:github',
        title: 'GitHub',
        url: 'https://github.com',
        hostname: 'github.com',
      }),
      expect.objectContaining({
        id: 'links-1:notion',
        title: 'Notion',
        url: 'https://notion.so',
        hostname: 'notion.so',
      }),
      expect.objectContaining({
        id: 'links-1:docs',
        title: 'Docs',
        url: 'https://docs.example.com',
        hostname: 'docs.example.com',
      }),
    ]);
  });

  it('ignores empty or invalid urls', () => {
    const widgets: Widget[] = [
      {
        id: 'links-1',
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
        config: {
          links: [{ id: 'bad', title: 'Bad', url: 'http://' }],
        },
      },
    ];

    expect(collectLauncherLinks(widgets)).toEqual([]);
  });

  it('ranks exact and prefix matches before loose matches', () => {
    const results = searchLauncherLinks(
      [
        {
          id: '1',
          title: 'GitHub',
          url: 'https://github.com',
          hostname: 'github.com',
          keywords: 'github github.com https://github.com',
          sourceWidgetId: 'w1',
        },
        {
          id: '2',
          title: 'GitHub Docs',
          url: 'https://docs.github.com',
          hostname: 'docs.github.com',
          keywords: 'github docs docs.github.com https://docs.github.com',
          sourceWidgetId: 'w2',
        },
        {
          id: '3',
          title: 'My Company',
          url: 'https://company.example.com/github-mirror',
          hostname: 'company.example.com',
          keywords: 'my company company.example.com github mirror',
          sourceWidgetId: 'w3',
        },
      ],
      'github'
    );

    expect(results.map((item) => item.id)).toEqual(['1', '2', '3']);
  });

  it('learns a query-to-link association without including irrelevant popular links', () => {
    const now = Date.UTC(2026, 6, 24);
    const usage: LauncherUsageStore = {
      version: 1,
      links: {
        'https://github.com/': {
          canonicalUrl: 'https://github.com/',
          totalCount: 3,
          globalScore: 3,
          globalScoreUpdatedAt: now,
          lastOpenedAt: now,
          queryStats: {
            g: {
              count: 3,
              score: 3,
              scoreUpdatedAt: now,
              lastUsedAt: now,
            },
          },
        },
        'https://unrelated.example.com/': {
          canonicalUrl: 'https://unrelated.example.com/',
          totalCount: 100,
          globalScore: 100,
          globalScoreUpdatedAt: now,
          lastOpenedAt: now,
          queryStats: {},
        },
      },
    };
    const links = [
      {
        id: 'google',
        title: 'Google',
        url: 'https://google.com',
        hostname: 'google.com',
        keywords: 'google google.com',
        sourceWidgetId: 'w1',
      },
      {
        id: 'github',
        title: 'GitHub',
        url: 'https://github.com',
        hostname: 'github.com',
        keywords: 'github github.com',
        sourceWidgetId: 'w2',
      },
      {
        id: 'unrelated',
        title: 'Unrelated',
        url: 'https://unrelated.example.com',
        hostname: 'unrelated.example.com',
        keywords: 'unrelated',
        sourceWidgetId: 'w3',
      },
    ];

    const results = searchLauncherLinks(links, 'g', 8, usage, now);

    expect(results.map((item) => item.id)).toEqual(['github', 'google']);
    expect(results[0].rankingReason).toBe('learned');
  });

  it('shows globally frequent links first for an empty query', () => {
    const now = Date.UTC(2026, 6, 24);
    const usage: LauncherUsageStore = {
      version: 1,
      links: {
        'https://notion.so/': {
          canonicalUrl: 'https://notion.so/',
          totalCount: 5,
          globalScore: 5,
          globalScoreUpdatedAt: now,
          lastOpenedAt: now,
          queryStats: {},
        },
      },
    };
    const links = [
      {
        id: 'github',
        title: 'GitHub',
        url: 'https://github.com',
        hostname: 'github.com',
        keywords: 'github',
        sourceWidgetId: 'w1',
      },
      {
        id: 'notion',
        title: 'Notion',
        url: 'https://notion.so',
        hostname: 'notion.so',
        keywords: 'notion',
        sourceWidgetId: 'w2',
      },
    ];

    expect(searchLauncherLinks(links, '', 8, usage, now).map((item) => item.id)).toEqual([
      'notion',
      'github',
    ]);
  });
});
