import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { NotificationDto } from '../notifications.mapper';

export type RealtimeNotificationEvent =
  | {
      kind: 'created';
      workspaceId: string;
      userId: string | null;
      notification: NotificationDto;
    }
  | {
      kind: 'read';
      workspaceId: string;
      userId: string;
      notificationId: string;
    }
  | {
      kind: 'read_all';
      workspaceId: string;
      userId: string;
      updatedCount: number;
    };

@Injectable()
export class RealtimeNotificationsService {
  private readonly logger = new Logger(RealtimeNotificationsService.name);
  private readonly eventsSubject = new Subject<RealtimeNotificationEvent>();

  stream(): Observable<RealtimeNotificationEvent> {
    return this.eventsSubject.asObservable();
  }

  publish(event: RealtimeNotificationEvent): void {
    this.eventsSubject.next(event);
    this.logger.debug(
      `Realtime notification published kind=${event.kind} workspaceId=${event.workspaceId}`,
    );
  }
}
