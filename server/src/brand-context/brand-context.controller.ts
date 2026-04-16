import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/interfaces/request-user.interface';
import { AnalyzeInstagramDto } from './dto/analyze-instagram.dto';
import { AnalyzeWebsiteDto } from './dto/analyze-website.dto';
import { UpsertBrandContextDto } from './dto/upsert-brand-context.dto';
import { BrandContextService } from './brand-context.service';

@Controller('brand-context')
export class BrandContextController {
  constructor(private readonly brandContextService: BrandContextService) {}

  @Roles('admin', 'agent')
  @Post()
  async upsert(
    @CurrentUser() user: RequestUser,
    @Body() body: UpsertBrandContextDto,
  ) {
    return this.brandContextService.upsertBrandContext({
      workspaceId: user.workspaceId,
      tone: body.tone,
      salesStyle: body.salesStyle,
      dataJson: body.dataJson,
    });
  }

  @Get()
  async getBrandContext(@CurrentUser() user: RequestUser) {
    return this.brandContextService.getBrandContext(user.workspaceId);
  }

  @Get('workspace/:workspaceId')
  async findByWorkspace(
    @CurrentUser() user: RequestUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    if (workspaceId !== user.workspaceId) {
      throw new ForbiddenException('Workspace mismatch');
    }

    return this.brandContextService.getBrandContext(user.workspaceId);
  }

  @Roles('admin', 'agent')
  @Post('website/analyze')
  async analyzeWebsite(
    @CurrentUser() user: RequestUser,
    @Body() body: AnalyzeWebsiteDto,
  ) {
    return this.brandContextService.analyzeWebsite(
      user.workspaceId,
      body.websiteUrl,
    );
  }

  @Roles('admin', 'agent')
  @Post('instagram/analyze')
  async analyzeInstagram(
    @CurrentUser() user: RequestUser,
    @Body() body: AnalyzeInstagramDto,
  ) {
    return this.brandContextService.analyzeInstagram(
      user.workspaceId,
      body.instagramHandle,
    );
  }
}
