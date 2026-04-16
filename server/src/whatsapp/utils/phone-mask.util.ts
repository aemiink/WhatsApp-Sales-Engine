export function maskPhoneNumber(value: string | null | undefined): string {
  if (!value || value.length < 4) {
    return '***';
  }

  const visible = value.slice(-4);
  return `${'*'.repeat(Math.max(value.length - 4, 3))}${visible}`;
}
