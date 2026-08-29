import { fireEvent, render } from '@testing-library/react';
import BookmarkFavicon from '@/components/bookmarks/BookmarkFavicon';

describe('BookmarkFavicon', () => {
  it('uses the Lucide globe when favicon loading fails', () => {
    const { container } = render(<BookmarkFavicon url="https://example.com" />);

    const image = container.querySelector('img')!;
    expect(image).toHaveAttribute('src', expect.stringContaining('faviconV2'));
    fireEvent.error(image);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('.lucide-globe')).toBeInTheDocument();
  });

  it('uses the Lucide globe for the provider’s 16 by 16 fallback image', () => {
    const { container } = render(<BookmarkFavicon url="https://123.com" />);
    const image = container.querySelector('img')!;
    Object.defineProperties(image, {
      naturalWidth: { configurable: true, value: 16 },
      naturalHeight: { configurable: true, value: 16 },
    });

    fireEvent.load(image);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('.lucide-globe')).toBeInTheDocument();
  });

  it('uses the Lucide globe when a favicon URL cannot be created', () => {
    const { container } = render(<BookmarkFavicon url="http://" />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('.lucide-globe')).toBeInTheDocument();
  });
});
