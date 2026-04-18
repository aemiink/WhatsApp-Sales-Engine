import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';
import { SecretCryptoService } from './services/secret-crypto.service';
import { SentryService } from './services/sentry.service';
import { WorkspaceAccessService } from './services/workspace-access.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    WorkspaceAccessService,
    SecretCryptoService,
    SentryService,
    SentryExceptionFilter,
  ],
  exports: [
    WorkspaceAccessService,
    SecretCryptoService,
    SentryService,
    SentryExceptionFilter,
  ],
})
export class CommonModule {}
