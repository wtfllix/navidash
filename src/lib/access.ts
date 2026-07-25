export const ACCESS_COOKIE_NAME = 'navidash_access';

export function getAccessPassword() {
  return process.env.NAVIDASH_ACCESS_PASSWORD?.trim() ?? '';
}

export function isAccessProtectionEnabled() {
  return getAccessPassword().length > 0;
}

export async function createAccessToken(password: string) {
  const bytes = new TextEncoder().encode(`navidash-access-v1:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function areAccessTokensEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function isValidAccessToken(value?: string) {
  const password = getAccessPassword();
  if (!password) return true;
  if (!value) return false;
  return areAccessTokensEqual(value, await createAccessToken(password));
}
