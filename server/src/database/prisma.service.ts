import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(appConfigService: AppConfigService) {
    super({
      datasources: {
        db: {
          url: appConfigService.databaseUrl,
        },
      },
    });
  }
}
