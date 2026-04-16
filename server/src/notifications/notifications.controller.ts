import {
  Controller,
  Get,
  HttpCode,
  MessageEvent,
  Param,
  Patch,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, filter, map } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/request-user.interface';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './services/notifications.service';
import { RealtimeNotificationsService } from './services/realtime-notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly realtimeNotificationsService: RealtimeNotificationsService,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.listForUser({
      workspaceId: user.workspaceId,
      userId: user.userId,
      query,
    });
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: RequestUser) {
    const unreadCount = await this.notificationsService.getUnreadCount(
      user.workspaceId,
      user.userId,
    );

    return {
      unreadCount,
    };
  }

  @Patch('read-all')
  @HttpCode(200)
  async markAllAsRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllAsRead(
      user.workspaceId,
      user.userId,
    );
  }

  @Patch(':id/read')
  @HttpCode(200)
  async markAsRead(
    @CurrentUser() user: RequestUser,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(
      user.workspaceId,
      user.userId,
      notificationId,
    );
  }

  @Sse('stream')
  stream(@CurrentUser() user: RequestUser): Observable<MessageEvent> {
    return this.realtimeNotificationsService.stream().pipe(
      filter((event) => {
        if (event.workspaceId !== user.workspaceId) {
          return false;
        }

        if ('userId' in event && event.userId) {
          return event.userId === user.userId;
        }

        return true;
      }),
      map((event) => ({
        data: event,
      })),
    );
  }
}
