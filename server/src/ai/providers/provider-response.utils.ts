export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

export function asArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) {
    const normalized: unknown[] = [];
    for (const entry of value) {
      normalized.push(entry);
    }
    return normalized;
  }

  return null;
}

export function normalizeUnknownToString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return null;
}
