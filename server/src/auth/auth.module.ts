import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '../config/app-config.module';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenRevocationService } from './services/token-revocation.service';

@Module({
  imports: [AppConfigModule, DatabaseModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokenRevocationService],
  exports: [AuthService, JwtModule, TokenRevocationService],
})
export class AuthModule {}
