import { collectLauncherLinks, searchLauncherLinks } from '@/lib/linkLauncher';
import { Widget } from '@/types';

describe('linkLauncher', () => {
  it('collects quick-link and links widget entries', () => {
    const widgets: Widget[] = [
      {
        id: 'quick-1',
        type: 'quick-link',
        size: { w: 1, h: 1 },
        position: { x: 0, y: 0 },
        config: {
          title: 'GitHub',
          url: 'github.com',
        },
      },
      {
        id: 'links-1',
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 1, y: 0 },
        config: {
          links: [
            { id: 'notion', title: 'Notion', url: 'https://notion.so' },
            { id: 'docs', title: 'Docs', url: 'docs.example.com' },
          ],
        },
      },
    ];

    expect(collectLauncherLinks(widgets)).toEqual([
      expect.objectContaining({
        id: 'quick-1:quick-link',
        title: 'GitHub',
        url: 'https://github.com',
        hostname: 'github.com',
        sourceType: 'quick-link',
      }),
      expect.objectContaining({
        id: 'links-1:notion',
        title: 'Notion',
        url: 'https://notion.so',
        hostname: 'notion.so',
        sourceType: 'links',
      }),
      expect.objectContaining({
        id: 'links-1:docs',
        title: 'Docs',
        url: 'https://docs.example.com',
        hostname: 'docs.example.com',
        sourceType: 'links',
      }),
    ]);
  });

  it('ignores empty or invalid urls', () => {
    const widgets: Widget[] = [
      {
        id: 'quick-1',
        type: 'quick-link',
        size: { w: 1, h: 1 },
        position: { x: 0, y: 0 },
        config: {
          title: 'Broken',
          url: '',
        },
      },
      {
        id: 'links-1',
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 1, y: 0 },
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
          sourceType: 'quick-link',
        },
        {
          id: '2',
          title: 'GitHub Docs',
          url: 'https://docs.github.com',
          hostname: 'docs.github.com',
          keywords: 'github docs docs.github.com https://docs.github.com',
          sourceWidgetId: 'w2',
          sourceType: 'links',
        },
        {
          id: '3',
          title: 'My Company',
          url: 'https://company.example.com/github-mirror',
          hostname: 'company.example.com',
          keywords: 'my company company.example.com github mirror',
          sourceWidgetId: 'w3',
          sourceType: 'links',
        },
      ],
      'github'
    );

    expect(results.map((item) => item.id)).toEqual(['1', '2', '3']);
  });
});
