import {
  createBookmarkImportData,
  createBookmarkTextImportData,
  mergeBookmarkImports,
} from '@/lib/bookmarkImport';

describe('bookmark import', () => {
  it('keeps supported links, removes fragments, and deduplicates deterministically', () => {
    const result = createBookmarkImportData(
      `
        <a href="https://example.com/docs#intro">Docs</a>
        <a href="https://example.com/docs#other">Duplicate</a>
        <a href="javascript:alert(1)">Unsafe</a>
        <a href="ftp://example.com/file">FTP</a>
        <a href="http://openai.com">OpenAI</a>
      `,
      'test'
    );

    expect(result.count).toBe(2);
    expect(result.bookmarks).toEqual([
      { id: 'test-link-0', title: 'Docs', url: 'https://example.com/docs' },
      { id: 'test-link-4', title: 'OpenAI', url: 'http://openai.com/' },
    ]);
  });

  it('imports into the library without creating canvas widgets and caps at 200', () => {
    const html = Array.from(
      { length: 220 },
      (_, index) => `<a href="https://example.com/${index}">Link ${index}</a>`
    ).join('');
    const result = createBookmarkImportData(html, 'bulk');

    expect(result.count).toBe(200);
    expect(result.bookmarks).toHaveLength(200);
    expect(result.bookmarks[199]).toMatchObject({
      id: 'bulk-link-199',
      title: 'Link 199',
    });
  });

  it('parses Markdown links, list items, titled URLs, and plain URLs', () => {
    const result = createBookmarkTextImportData(
      `
        [GitHub](https://github.com)
        - [OpenAI](https://openai.com/about#intro)
        少数派 | https://sspai.com
        https://www.bilibili.com
      `,
      'text'
    );

    expect(result).toEqual({
      bookmarks: [
        { id: 'text-link-0', title: 'GitHub', url: 'https://github.com/' },
        { id: 'text-link-1', title: 'OpenAI', url: 'https://openai.com/about' },
        { id: 'text-link-2', title: '少数派', url: 'https://sspai.com/' },
        {
          id: 'text-link-3',
          title: 'www.bilibili.com',
          url: 'https://www.bilibili.com/',
        },
      ],
      count: 4,
      duplicateCount: 0,
      invalidCount: 0,
    });
  });

  it('deduplicates canonical URLs and reports unrecognized lines', () => {
    const result = createBookmarkTextImportData(
      `
        [Docs](https://example.com/docs#one)
        [Duplicate](https://example.com/docs#two)
        just some text
        ftp://example.com/file
      `,
      'text'
    );

    expect(result.bookmarks).toEqual([
      { id: 'text-link-0', title: 'Docs', url: 'https://example.com/docs' },
    ]);
    expect(result.duplicateCount).toBe(1);
    expect(result.invalidCount).toBe(2);
  });

  it('accepts AI output wrapped in a plain-text code block', () => {
    expect(
      createBookmarkTextImportData(
        '```text\nGitHub | https://github.com\nYouTube | https://youtube.com\n```',
        'ai'
      )
    ).toEqual({
      bookmarks: [
        { id: 'ai-link-0', title: 'GitHub', url: 'https://github.com/' },
        { id: 'ai-link-1', title: 'YouTube', url: 'https://youtube.com/' },
      ],
      count: 2,
      duplicateCount: 0,
      invalidCount: 0,
    });
  });

  it('extracts multiple Markdown links from one line and caps at 200', () => {
    const links = Array.from(
      { length: 205 },
      (_, index) => `[Link ${index}](https://example.com/${index})`
    ).join(' ');
    const result = createBookmarkTextImportData(links, 'text');

    expect(result.count).toBe(200);
    expect(result.bookmarks[199]).toMatchObject({
      id: 'text-link-199',
      title: 'Link 199',
    });
  });

  it('merges multiple onboarding sources by URL and keeps the first title', () => {
    expect(
      mergeBookmarkImports(
        [{ id: 'first', title: 'Docs', url: 'https://example.com/' }],
        [
          { id: 'duplicate', title: 'Duplicate', url: 'https://example.com/' },
          { id: 'second', title: 'OpenAI', url: 'https://openai.com/' },
        ]
      )
    ).toEqual([
      { id: 'first', title: 'Docs', url: 'https://example.com/' },
      { id: 'second', title: 'OpenAI', url: 'https://openai.com/' },
    ]);
  });
});
