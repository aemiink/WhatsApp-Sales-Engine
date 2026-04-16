import { Injectable } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service';

export interface HealthResponse {
  service: string;
  status: 'ok';
}

export interface VersionResponse {
  service: string;
  version: string;
}

@Injectable()
export class AppService {
  constructor(private readonly appConfigService: AppConfigService) {}

  getHealth(): HealthResponse {
    return {
      service: 'whatsapp-sales-engine-backend',
      status: 'ok',
    };
  }

  getVersion(): VersionResponse {
    return {
      service: 'whatsapp-sales-engine-backend',
      version: this.appConfigService.appVersion,
    };
  }
}
