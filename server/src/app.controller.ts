import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';
import type { HealthResponse } from './app.service';
import type { VersionResponse } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }

  @Public()
  @Get('version')
  getVersion(): VersionResponse {
    return this.appService.getVersion();
  }
}
