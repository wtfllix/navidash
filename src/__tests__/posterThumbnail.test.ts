import sharp from 'sharp';
import {
  getPosterThumbnailWidth,
  POSTER_THUMBNAIL_WIDTHS,
} from '@/lib/posterThumbnail';
import {
  createPinnedPosterLookup,
  isBlockedPosterAddress,
  parsePosterSourceUrl,
  resizePosterImage,
} from '@/lib/server/posterThumbnail';

describe('poster thumbnail sizing', () => {
  it('selects the nearest supported physical width', () => {
    expect(getPosterThumbnailWidth(390, 1)).toBe(640);
    expect(getPosterThumbnailWidth(390, 2)).toBe(960);
    expect(getPosterThumbnailWidth(700, 2)).toBe(1920);
  });

  it('caps very large displays at the largest cache width', () => {
    expect(getPosterThumbnailWidth(2000, 2)).toBe(
      POSTER_THUMBNAIL_WIDTHS[POSTER_THUMBNAIL_WIDTHS.length - 1]
    );
  });
});

describe('poster thumbnail source protection', () => {
  it('accepts ordinary public HTTP(S) URLs', () => {
    expect(parsePosterSourceUrl('https://images.example.com/poster.jpg').hostname).toBe(
      'images.example.com'
    );
  });

  it.each([
    'file:///tmp/poster.jpg',
    'https://user:password@example.com/poster.jpg',
    'https://localhost/poster.jpg',
    'http://127.0.0.1/poster.jpg',
    'http://192.168.1.20/poster.jpg',
    'http://example.com:8080/poster.jpg',
  ])('rejects unsafe source URL %s', (source) => {
    expect(() => parsePosterSourceUrl(source)).toThrow();
  });

  it.each(['0.0.0.0', '10.1.2.3', '169.254.169.254', '172.20.0.1', '::1', 'fe80::1'])(
    'blocks non-public address %s',
    (address) => {
      expect(isBlockedPosterAddress(address)).toBe(true);
    }
  );

  it('pins both scalar and all-address DNS lookup modes', async () => {
    const pinnedAddress = { address: '203.0.114.10', family: 4 };
    const pinnedLookup = createPinnedPosterLookup(pinnedAddress);

    await new Promise<void>((resolve, reject) => {
      pinnedLookup('images.example.com', { all: true }, (error, addresses) => {
        if (error) {
          reject(error);
          return;
        }
        expect(addresses).toEqual([pinnedAddress]);
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      pinnedLookup('images.example.com', { all: false }, (error, address, family) => {
        if (error) {
          reject(error);
          return;
        }
        expect(address).toBe(pinnedAddress.address);
        expect(family).toBe(pinnedAddress.family);
        resolve();
      });
    });
  });
});

describe('poster thumbnail processing', () => {
  it('uses a bounded WebP output at the requested width', async () => {
    const source = await sharp({
      create: {
        width: 2000,
        height: 1000,
        channels: 3,
        background: '#335577',
      },
    })
      .png()
      .toBuffer();

    const thumbnail = await resizePosterImage(source, 640);
    const metadata = await sharp(thumbnail).metadata();

    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(640);
    expect(metadata.height).toBe(320);
  });

  it('does not enlarge a source smaller than the cache target', async () => {
    const source = await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 3,
        background: '#664422',
      },
    })
      .jpeg()
      .toBuffer();

    const thumbnail = await resizePosterImage(source, 640);
    expect((await sharp(thumbnail).metadata()).width).toBe(300);
  });
});
