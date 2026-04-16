import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DEFAULT_WORKSPACE_ID } from '../common/constants/workspace.constants';
import { AnalyzeInstagramDto } from './dto/analyze-instagram.dto';
import { AnalyzeWebsiteDto } from './dto/analyze-website.dto';
import { GetBrandContextQueryDto } from './dto/get-brand-context-query.dto';
import { UpsertBrandContextDto } from './dto/upsert-brand-context.dto';
import { BrandContextService } from './brand-context.service';

@Controller('brand-context')
export class BrandContextController {
  constructor(private readonly brandContextService: BrandContextService) {}

  @Post()
  async upsert(@Body() body: UpsertBrandContextDto) {
    return this.brandContextService.upsertBrandContext(body);
  }

  @Get()
  async getBrandContext(@Query() query: GetBrandContextQueryDto) {
    const workspaceId = query.workspaceId ?? DEFAULT_WORKSPACE_ID;
    return this.brandContextService.getBrandContext(workspaceId);
  }

  @Get('workspace/:workspaceId')
  async findByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.brandContextService.getBrandContext(workspaceId);
  }

  @Post('website/analyze')
  async analyzeWebsite(@Body() body: AnalyzeWebsiteDto) {
    const workspaceId = body.workspaceId ?? DEFAULT_WORKSPACE_ID;
    return this.brandContextService.analyzeWebsite(
      workspaceId,
      body.websiteUrl,
    );
  }

  @Post('instagram/analyze')
  async analyzeInstagram(@Body() body: AnalyzeInstagramDto) {
    const workspaceId = body.workspaceId ?? DEFAULT_WORKSPACE_ID;
    return this.brandContextService.analyzeInstagram(
      workspaceId,
      body.instagramHandle,
    );
  }
}
