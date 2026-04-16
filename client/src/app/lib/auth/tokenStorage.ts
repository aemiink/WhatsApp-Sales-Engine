const ACCESS_TOKEN_KEY = 'wse.auth.accessToken';
const REFRESH_TOKEN_KEY = 'wse.auth.refreshToken';

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export const tokenStorage = {
  read(): StoredTokens | null {
    const storage = safeStorage();
    if (!storage) {
      return null;
    }
    const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
    if (!accessToken || !refreshToken) {
      return null;
    }
    return { accessToken, refreshToken };
  },

  write(tokens: StoredTokens): void {
    const storage = safeStorage();
    if (!storage) {
      return;
    }
    storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },

  clear(): void {
    const storage = safeStorage();
    if (!storage) {
      return;
    }
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  },
};
