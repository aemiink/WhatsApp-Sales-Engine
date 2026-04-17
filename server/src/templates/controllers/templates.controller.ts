import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { RequestUser } from '../../auth/interfaces/request-user.interface';
import { PrismaService } from '../../database/prisma.service';

interface TemplateResponse {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

@Controller('templates')
export class TemplatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser): Promise<TemplateResponse[]> {
    const templates = await this.prisma.messageTemplate.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { usageCount: 'desc' },
    });

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      content: t.content,
      isActive: t.isActive,
      usageCount: t.usageCount,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() body: { name: string; content: string },
  ): Promise<TemplateResponse> {
    const template = await this.prisma.messageTemplate.create({
      data: {
        workspaceId: user.workspaceId,
        name: body.name,
        content: body.content,
        createdById: user.userId,
      },
    });

    return {
      id: template.id,
      name: template.name,
      content: template.content,
      isActive: template.isActive,
      usageCount: template.usageCount,
      createdAt: template.createdAt.toISOString(),
    };
  }

  @Patch(':templateId')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('templateId') templateId: string,
    @Body() body: { name?: string; content?: string; isActive?: boolean },
  ): Promise<TemplateResponse> {
    const template = await this.prisma.messageTemplate.update({
      where: { id: templateId, workspaceId: user.workspaceId },
      data: body,
    });

    return {
      id: template.id,
      name: template.name,
      content: template.content,
      isActive: template.isActive,
      usageCount: template.usageCount,
      createdAt: template.createdAt.toISOString(),
    };
  }

  @Delete(':templateId')
  async delete(
    @CurrentUser() user: RequestUser,
    @Param('templateId') templateId: string,
  ): Promise<{ ok: boolean; message: string }> {
    await this.prisma.messageTemplate.delete({
      where: { id: templateId, workspaceId: user.workspaceId },
    });

    return { ok: true, message: 'Şablon silindi' };
  }

  @Post(':templateId/use')
  async use(
    @CurrentUser() user: RequestUser,
    @Param('templateId') templateId: string,
  ): Promise<{ content: string }> {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id: templateId, workspaceId: user.workspaceId },
    });

    if (!template) {
      throw new Error('Şablon bulunamadı');
    }

    await this.prisma.messageTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return { content: template.content };
  }
}