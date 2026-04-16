import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  service: string;
  status: 'ok';
}

@Injectable()
export class AppService {
  getHealth(): HealthResponse {
    return {
      service: 'whatsapp-sales-engine-backend',
      status: 'ok',
    };
  }
}
