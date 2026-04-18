import { beforeEach, describe, expect, it } from 'vitest';
import { tokenStorage } from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when tokens are missing', () => {
    expect(tokenStorage.read()).toBeNull();
  });

  it('writes and reads access/refresh tokens', () => {
    tokenStorage.write({
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
    });

    expect(tokenStorage.read()).toEqual({
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
    });
  });

  it('clears stored tokens', () => {
    tokenStorage.write({
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
    });

    tokenStorage.clear();

    expect(tokenStorage.read()).toBeNull();
  });
});
