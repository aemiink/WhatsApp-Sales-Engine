import { applyBaseTestEnv } from './env.helper';

applyBaseTestEnv({
  AUTH_BYPASS_IN_TEST: 'true',
  AUTH_ALLOW_DEV_BOOTSTRAP: 'false',
  WHATSAPP_WEBHOOK_SIGNATURE_REQUIRED: 'false',
});
