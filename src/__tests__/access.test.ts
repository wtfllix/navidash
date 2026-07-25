import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';

describe('optional access protection', () => {
  const originalPassword = process.env.NAVIDASH_ACCESS_PASSWORD;

  beforeAll(() => {
    Object.defineProperty(global, 'TextEncoder', { value: TextEncoder, configurable: true });
    Object.defineProperty(global, 'crypto', { value: webcrypto, configurable: true });
  });

  afterEach(() => {
    if (originalPassword === undefined) {
      delete process.env.NAVIDASH_ACCESS_PASSWORD;
    } else {
      process.env.NAVIDASH_ACCESS_PASSWORD = originalPassword;
    }
  });

  it('stays disabled when no password is configured', async () => {
    delete process.env.NAVIDASH_ACCESS_PASSWORD;
    const { isAccessProtectionEnabled, isValidAccessToken } = await import('@/lib/access');

    expect(isAccessProtectionEnabled()).toBe(false);
    await expect(isValidAccessToken()).resolves.toBe(true);
  });

  it('accepts only a token derived from the configured password', async () => {
    process.env.NAVIDASH_ACCESS_PASSWORD = 'private-home';
    const { createAccessToken, isAccessProtectionEnabled, isValidAccessToken } =
      await import('@/lib/access');

    expect(isAccessProtectionEnabled()).toBe(true);
    await expect(isValidAccessToken(await createAccessToken('private-home'))).resolves.toBe(true);
    await expect(isValidAccessToken(await createAccessToken('wrong'))).resolves.toBe(false);
  });
});
