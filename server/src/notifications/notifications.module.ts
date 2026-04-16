import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsController } from './notifications.controller';
import { EmailNotificationsService } from './services/email-notifications.service';
import { NotificationsService } from './services/notifications.service';
import { RealtimeNotificationsService } from './services/realtime-notifications.service';

@Module({
  imports: [AppConfigModule, DatabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    RealtimeNotificationsService,
    EmailNotificationsService,
  ],
  exports: [
    NotificationsService,
    RealtimeNotificationsService,
    EmailNotificationsService,
  ],
})
export class NotificationsModule {}
