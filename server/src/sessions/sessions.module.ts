import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SessionsController } from './controllers/sessions.controller';

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
})
export class SessionsModule {}
