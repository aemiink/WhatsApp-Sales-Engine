import { BadRequestException } from '@nestjs/common';

export class InstagramSourceResolutionException extends BadRequestException {
  constructor(message: string) {
    super({
      code: 'INSTAGRAM_SOURCE_RESOLUTION_FAILED',
      message,
    });
  }
}
