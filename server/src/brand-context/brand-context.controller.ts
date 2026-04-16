import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UpsertBrandContextDto } from './dto/upsert-brand-context.dto';
import { BrandContextService } from './brand-context.service';

@Controller('brand-context')
export class BrandContextController {
  constructor(private readonly brandContextService: BrandContextService) {}

  @Post()
  async upsert(@Body() body: UpsertBrandContextDto) {
    return this.brandContextService.upsertBrandContext(body);
  }

  @Get('workspace/:workspaceId')
  async findByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.brandContextService.getBrandContext(workspaceId);
  }
}
