export enum CryptoErrorCode {
  INVALID_SECRET_KEY = 'CRYPTO_INVALID_SECRET_KEY',
  ENCRYPTION_FAILED = 'CRYPTO_ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'CRYPTO_DECRYPTION_FAILED',
}

export class CryptoOperationException extends Error {
  readonly code: CryptoErrorCode;

  constructor(code: CryptoErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'CryptoOperationException';
    this.code = code;

    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}
