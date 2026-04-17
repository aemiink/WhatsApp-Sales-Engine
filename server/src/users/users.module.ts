import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [UsersController],
})
export class UsersModule {}