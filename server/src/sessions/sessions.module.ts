import { Module } from '@nestjs/common';
import { SessionsController } from './controllers/sessions.controller';
import { TokenRevocationService } from '../auth/services/token-revocation.service';

@Module({
  controllers: [SessionsController],
  providers: [TokenRevocationService],
  exports: [TokenRevocationService],
})
export class SessionsModule {}