import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { AppConfigService } from '../../config/app-config.service';
import {
  CryptoErrorCode,
  CryptoOperationException,
} from '../errors/crypto.errors';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTED_PAYLOAD_PREFIX = 'enc:v1';
const GCM_IV_LENGTH_BYTES = 12;
const GCM_TAG_LENGTH_BYTES = 16;
const AES_256_KEY_LENGTH_BYTES = 32;

@Injectable()
export class SecretCryptoService {
  private readonly key: Buffer;

  constructor(private readonly appConfigService: AppConfigService) {
    this.key = this.decodeKey(this.appConfigService.secretEncryptionKey);
  }

  encrypt(plaintext: string): string {
    try {
      const iv = randomBytes(GCM_IV_LENGTH_BYTES);
      const cipher = createCipheriv(ENCRYPTION_ALGORITHM, this.key, iv);

      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      return [
        ENCRYPTED_PAYLOAD_PREFIX,
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted.toString('base64'),
      ].join(':');
    } catch (error: unknown) {
      throw new CryptoOperationException(
        CryptoErrorCode.ENCRYPTION_FAILED,
        'Secret encryption failed.',
        error,
      );
    }
  }

  decrypt(payload: string): string {
    if (!this.isEncryptedPayload(payload)) {
      throw new CryptoOperationException(
        CryptoErrorCode.DECRYPTION_FAILED,
        'Encrypted payload format is invalid.',
      );
    }

    const parts = payload.split(':');
    if (parts.length !== 5) {
      throw new CryptoOperationException(
        CryptoErrorCode.DECRYPTION_FAILED,
        'Encrypted payload structure is invalid.',
      );
    }

    const [, , ivBase64, authTagBase64, encryptedBase64] = parts;

    try {
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      const encrypted = Buffer.from(encryptedBase64, 'base64');

      if (
        iv.length !== GCM_IV_LENGTH_BYTES ||
        authTag.length !== GCM_TAG_LENGTH_BYTES
      ) {
        throw new Error('Invalid iv/authTag length');
      }

      const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error: unknown) {
      throw new CryptoOperationException(
        CryptoErrorCode.DECRYPTION_FAILED,
        'Secret decryption failed.',
        error,
      );
    }
  }

  isEncryptedPayload(value: string): boolean {
    return value.startsWith(`${ENCRYPTED_PAYLOAD_PREFIX}:`);
  }

  private decodeKey(value: string): Buffer {
    let buffer: Buffer;

    try {
      buffer = Buffer.from(value, 'base64');
    } catch (error: unknown) {
      throw new CryptoOperationException(
        CryptoErrorCode.INVALID_SECRET_KEY,
        'SECRET_ENCRYPTION_KEY must be valid base64.',
        error,
      );
    }

    if (buffer.length !== AES_256_KEY_LENGTH_BYTES) {
      throw new CryptoOperationException(
        CryptoErrorCode.INVALID_SECRET_KEY,
        'SECRET_ENCRYPTION_KEY must decode to 32 bytes for AES-256-GCM.',
      );
    }

    return buffer;
  }
}
