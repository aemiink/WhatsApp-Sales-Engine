import { Module } from '@nestjs/common';
import { TemplatesController } from './controllers/templates.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TemplatesController],
})
export class TemplatesModule {}