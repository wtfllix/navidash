import fs from 'fs/promises';
import path from 'path';
import { createHash, randomUUID } from 'crypto';
import { lookup as lookupDns } from 'dns/promises';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { BlockList, isIP, type LookupFunction } from 'net';
import sharp from 'sharp';
import { DATA_DIR } from '@/lib/server/dataDirectory';
import { POSTER_THUMBNAIL_WIDTHS } from '@/lib/posterThumbnail';

const CACHE_DIR = path.join(DATA_DIR, 'poster-thumbnails');
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_FILES = 256;
const MAX_REDIRECTS = 3;
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 40_000_000;
const REQUEST_TIMEOUT_MS = 10_000;
const ALLOWED_CONTENT_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const blockedAddresses = new BlockList();
[
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
].forEach(([address, prefix]) => {
  blockedAddresses.addSubnet(address as string, prefix as number, 'ipv4');
});
blockedAddresses.addAddress('::', 'ipv6');
blockedAddresses.addAddress('::1', 'ipv6');
blockedAddresses.addSubnet('fc00::', 7, 'ipv6');
blockedAddresses.addSubnet('fe80::', 10, 'ipv6');
blockedAddresses.addSubnet('ff00::', 8, 'ipv6');
blockedAddresses.addSubnet('2001:db8::', 32, 'ipv6');

export class PosterThumbnailError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'PosterThumbnailError';
  }
}

export function isBlockedPosterAddress(address: string): boolean {
  const normalizedAddress = address.replace(/^\[|\]$/g, '');
  const family = isIP(normalizedAddress);
  if (!family || normalizedAddress.includes('%')) return true;
  if (family === 6 && normalizedAddress.toLowerCase().startsWith('::ffff:')) return true;
  return blockedAddresses.check(normalizedAddress, family === 4 ? 'ipv4' : 'ipv6');
}

export function parsePosterSourceUrl(source: string): URL {
  let url: URL;

  try {
    url = new URL(source);
  } catch {
    throw new PosterThumbnailError('Invalid poster image URL', 400);
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new PosterThumbnailError('Unsupported poster image URL', 400);
  }

  const expectedPort = url.protocol === 'https:' ? '443' : '80';
  if (url.port && url.port !== expectedPort) {
    throw new PosterThumbnailError('Unsupported poster image port', 400);
  }

  if (url.hostname.toLowerCase() === 'localhost') {
    throw new PosterThumbnailError('Private poster image host', 403);
  }

  const directAddress = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(directAddress) && isBlockedPosterAddress(directAddress)) {
    throw new PosterThumbnailError('Private poster image address', 403);
  }

  return url;
}

async function resolvePublicAddress(url: URL) {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const directFamily = isIP(hostname);
  if (directFamily) {
    return { address: hostname, family: directFamily };
  }

  const addresses = await lookupDns(hostname, { all: true, verbatim: true }).catch(() => []);
  if (!addresses.length || addresses.some(({ address }) => isBlockedPosterAddress(address))) {
    throw new PosterThumbnailError('Poster image host did not resolve publicly', 403);
  }

  return addresses[0];
}

type UpstreamResult =
  | { type: 'image'; buffer: Buffer }
  | { type: 'redirect'; location: string };

export function createPinnedPosterLookup(resolvedAddress: {
  address: string;
  family: number;
}): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all) {
      callback(null, [resolvedAddress]);
      return;
    }
    callback(null, resolvedAddress.address, resolvedAddress.family);
  };
}

async function requestPinnedImage(
  url: URL,
  resolvedAddress: { address: string; family: number }
): Promise<UpstreamResult> {
  return new Promise((resolve, reject) => {
    const pinnedLookup = createPinnedPosterLookup(resolvedAddress);
    const makeRequest = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const request = makeRequest(
      url,
      {
        method: 'GET',
        lookup: pinnedLookup,
        headers: {
          Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif',
          'Accept-Encoding': 'identity',
          'User-Agent': 'NaviDash-Poster-Thumbnail/1.0',
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const location = response.headers.location;

        if (status >= 300 && status < 400 && location) {
          response.resume();
          resolve({ type: 'redirect', location });
          return;
        }

        if (status !== 200) {
          response.resume();
          reject(new PosterThumbnailError(`Poster source returned HTTP ${status}`, 502));
          return;
        }

        const contentType = response.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase();
        if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
          response.resume();
          reject(new PosterThumbnailError('Poster source is not a supported image', 415));
          return;
        }

        const contentLength = Number(response.headers['content-length'] ?? 0);
        if (contentLength > MAX_SOURCE_BYTES) {
          response.resume();
          reject(new PosterThumbnailError('Poster source is too large', 413));
          return;
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;

        response.on('data', (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_SOURCE_BYTES) {
            request.destroy(new PosterThumbnailError('Poster source is too large', 413));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => {
          if (totalBytes <= MAX_SOURCE_BYTES) {
            resolve({ type: 'image', buffer: Buffer.concat(chunks) });
          }
        });
        response.on('error', reject);
      }
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new PosterThumbnailError('Poster source timed out', 504));
    });
    request.on('error', reject);
    request.end();
  });
}

export async function downloadPosterSource(source: string): Promise<Buffer> {
  let currentUrl = parsePosterSourceUrl(source);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const resolvedAddress = await resolvePublicAddress(currentUrl);
    const result = await requestPinnedImage(currentUrl, resolvedAddress);
    if (result.type === 'image') return result.buffer;

    if (redirectCount === MAX_REDIRECTS) {
      throw new PosterThumbnailError('Poster source redirected too many times', 502);
    }

    currentUrl = parsePosterSourceUrl(new URL(result.location, currentUrl).toString());
  }

  throw new PosterThumbnailError('Poster source could not be downloaded', 502);
}

export async function resizePosterImage(source: Buffer, width: number): Promise<Buffer> {
  return sharp(source, {
    failOn: 'error',
    limitInputPixels: MAX_SOURCE_PIXELS,
  })
    .rotate()
    .resize({
      width,
      withoutEnlargement: true,
      kernel: sharp.kernel.mitchell,
    })
    .webp({
      quality: 88,
      smartSubsample: true,
    })
    .toBuffer();
}

function getCachePath(source: string, width: number) {
  const key = createHash('sha256')
    .update(`${CACHE_VERSION}:${width}:${source}`)
    .digest('hex');
  return path.join(CACHE_DIR, `${key}.webp`);
}

async function readCachedThumbnail(cachePath: string, requireFresh: boolean) {
  try {
    const stat = await fs.stat(cachePath);
    if (requireFresh && Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
    return await fs.readFile(cachePath);
  } catch {
    return null;
  }
}

async function trimThumbnailCache() {
  const entries = await fs.readdir(CACHE_DIR, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.webp'))
      .map(async (entry) => {
        const filePath = path.join(CACHE_DIR, entry.name);
        return { filePath, mtimeMs: (await fs.stat(filePath)).mtimeMs };
      })
  );

  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  await Promise.all(
    files.slice(MAX_CACHE_FILES).map(({ filePath }) => fs.rm(filePath, { force: true }))
  );
}

const thumbnailJobs = new Map<string, Promise<Buffer>>();

export async function getPosterThumbnail(source: string, width: number): Promise<Buffer> {
  if (!POSTER_THUMBNAIL_WIDTHS.includes(width as (typeof POSTER_THUMBNAIL_WIDTHS)[number])) {
    throw new PosterThumbnailError('Unsupported poster thumbnail width', 400);
  }

  const cachePath = getCachePath(source, width);
  const freshCache = await readCachedThumbnail(cachePath, true);
  if (freshCache) return freshCache;

  const existingJob = thumbnailJobs.get(cachePath);
  if (existingJob) return existingJob;

  const job = (async () => {
    const staleCache = await readCachedThumbnail(cachePath, false);

    try {
      const sourceBuffer = await downloadPosterSource(source);
      const thumbnail = await resizePosterImage(sourceBuffer, width);
      await fs.mkdir(CACHE_DIR, { recursive: true });
      const tempPath = `${cachePath}.${process.pid}.${randomUUID()}.tmp`;
      await fs.writeFile(tempPath, thumbnail);
      await fs.rename(tempPath, cachePath);
      await trimThumbnailCache().catch(() => undefined);
      return thumbnail;
    } catch (error) {
      if (staleCache) return staleCache;
      throw error;
    }
  })();

  thumbnailJobs.set(cachePath, job);
  return job.finally(() => thumbnailJobs.delete(cachePath));
}
