import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { RequestUser } from '../../auth/interfaces/request-user.interface';
import { WorkspaceRole, User, WorkspaceMember } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { WorkspaceAccessService } from '../../common/services/workspace-access.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { createPasswordHash } from '../../auth/utils/password-hash.util';

type MemberWithUser = WorkspaceMember & { user: User };

interface WorkspaceMemberResponse {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  role: string;
  createdAt: string;
}

@Controller('users')
@Roles('admin')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
  ): Promise<WorkspaceMemberResponse[]> {
    const members = await this.workspaceAccessService.getWorkspaceMembers(
      user.workspaceId,
    );

    return members.map((member: MemberWithUser) => ({
      id: member.id,
      userId: member.userId,
      userEmail: member.user.email,
      userDisplayName: member.user.displayName,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    }));
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateUserDto,
  ): Promise<{ userId: string; message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      const existingMembership = await this.prisma.workspaceMember.findFirst({
        where: { userId: existing.id, workspaceId: user.workspaceId },
      });

      if (existingMembership) {
        throw new Error("Kullanıcı zaten bu workspace'de mevcut");
      }

      await this.prisma.workspaceMember.create({
        data: {
          userId: existing.id,
          workspaceId: user.workspaceId,
          role: this.mapRole(dto.role ?? 'agent'),
        },
      });

      return { userId: existing.id, message: "Kullanıcı workspace'e eklendi" };
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash: createPasswordHash(dto.password),
        displayName: dto.displayName ?? dto.email.split('@')[0],
      },
    });

    await this.prisma.workspaceMember.create({
      data: {
        userId: newUser.id,
        workspaceId: user.workspaceId,
        role: this.mapRole(dto.role ?? 'agent'),
      },
    });

    return { userId: newUser.id, message: 'Kullanıcı başarıyla oluşturuldu' };
  }

  @Patch(':userId/role')
  async updateRole(
    @CurrentUser() user: RequestUser,
    @Param('userId') targetUserId: string,
    @Body() body: { role: 'admin' | 'agent' | 'viewer' },
  ): Promise<{ ok: boolean; message: string }> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId: user.workspaceId, userId: targetUserId },
    });

    if (!membership) {
      return { ok: false, message: "Kullanıcı bu workspace'de bulunamadı" };
    }

    await this.prisma.workspaceMember.update({
      where: { id: membership.id },
      data: { role: this.mapRole(body.role) },
    });

    return { ok: true, message: 'Rol başarıyla güncellendi' };
  }

  @Delete(':userId')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('userId') targetUserId: string,
  ): Promise<{ ok: boolean; message: string }> {
    if (user.userId === targetUserId) {
      return { ok: false, message: 'Kendinizi kaldıramazsınız' };
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId: user.workspaceId, userId: targetUserId },
    });

    if (!membership) {
      return { ok: false, message: "Kullanıcı bu workspace'de bulunamadı" };
    }

    await this.prisma.workspaceMember.delete({
      where: { id: membership.id },
    });

    const otherMemberships = await this.prisma.workspaceMember.count({
      where: { userId: targetUserId },
    });

    if (otherMemberships === 0) {
      await this.prisma.user.delete({
        where: { id: targetUserId },
      });
    }

    return { ok: true, message: 'Kullanıcı başarıyla kaldırıldı' };
  }

  private mapRole(role: string): WorkspaceRole {
    switch (role) {
      case 'admin':
        return WorkspaceRole.ADMIN;
      case 'viewer':
        return WorkspaceRole.VIEWER;
      default:
        return WorkspaceRole.AGENT;
    }
  }
}
