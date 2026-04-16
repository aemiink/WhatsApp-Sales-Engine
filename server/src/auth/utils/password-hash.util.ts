import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_PREFIX = 'scrypt';

function toBase64(value: Buffer): string {
  return value.toString('base64');
}

function fromBase64(value: string): Buffer {
  return Buffer.from(value, 'base64');
}

export function createPasswordHash(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return [SCRYPT_PREFIX, toBase64(salt), toBase64(hash)].join('$');
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): boolean {
  const parts = passwordHash.split('$');
  if (parts.length !== 3 || parts[0] !== SCRYPT_PREFIX) {
    return false;
  }

  const salt = fromBase64(parts[1] ?? '');
  const expected = fromBase64(parts[2] ?? '');
  const computed = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, computed);
}
