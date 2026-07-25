import { render, screen } from '@testing-library/react';
import LinksWidget from '@/components/widgets/LinksWidget';
import { useWidgetStore } from '@/store/useWidgetStore';
import { WidgetOfType } from '@/types';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('LinksWidget bookmark references', () => {
  beforeEach(() => {
    useWidgetStore.setState({
      bookmarks: Array.from({ length: 5 }, (_, index) => ({
        id: `bookmark-${index + 1}`,
        title: `Bookmark ${index + 1}`,
        url: `https://example.com/${index + 1}`,
      })),
    });
  });

  it('keeps overflow bookmarks in vertically scrollable pages without a More button', () => {
    const widget: WidgetOfType<'links'> = {
      id: 'links',
      type: 'links',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        title: 'Work',
        bookmarkIds: [
          'bookmark-1',
          'bookmark-2',
          'bookmark-3',
          'bookmark-4',
          'bookmark-5',
        ],
      },
    };

    render(<LinksWidget widget={widget} />);

    expect(screen.getByText('Bookmark 1')).toBeInTheDocument();
    expect(screen.getByText('Bookmark 5')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /more|更多|\+1/i })).not.toBeInTheDocument();
  });

  it('resolves links from the library instead of inline widget data', () => {
    const widget: WidgetOfType<'links'> = {
      id: 'single',
      type: 'links',
      size: { w: 1, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        bookmarkIds: ['bookmark-3'],
      },
    };

    render(<LinksWidget widget={widget} />);
    expect(screen.getByText('Bookmark 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bookmark 3' })).toHaveAttribute(
      'href',
      'https://example.com/3'
    );
  });
});
