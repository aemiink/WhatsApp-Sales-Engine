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
  // Keep a single stream bus even if Nest ends up creating multiple instances.
  private static readonly sharedEventsSubject =
    new Subject<RealtimeNotificationEvent>();

  stream(): Observable<RealtimeNotificationEvent> {
    return RealtimeNotificationsService.sharedEventsSubject.asObservable();
  }

  publish(event: RealtimeNotificationEvent): void {
    RealtimeNotificationsService.sharedEventsSubject.next(event);
    this.logger.debug(
      `Realtime notification published kind=${event.kind} workspaceId=${event.workspaceId}`,
    );
  }
}
