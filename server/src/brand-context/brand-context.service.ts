import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpsertBrandContextDto } from './dto/upsert-brand-context.dto';

@Injectable()
export class BrandContextService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertBrandContext(input: UpsertBrandContextDto) {
    return this.prisma.brandContext.upsert({
      where: {
        workspaceId: input.workspaceId,
      },
      create: {
        workspaceId: input.workspaceId,
        tone: input.tone,
        salesStyle: input.salesStyle,
        dataJson: input.dataJson as Prisma.InputJsonValue | undefined,
      },
      update: {
        tone: input.tone,
        salesStyle: input.salesStyle,
        dataJson: input.dataJson as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async getBrandContext(workspaceId: string) {
    return this.prisma.brandContext.findUnique({
      where: {
        workspaceId,
      },
    });
  }
}
