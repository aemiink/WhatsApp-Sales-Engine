import {
  UnauthorizedException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { RequestUser } from '../interfaces/request-user.interface';

interface AuthenticatedRequest {
  user?: RequestUser;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): RequestUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException(
        'Authenticated user is not available on request',
      );
    }

    return request.user;
  },
);
