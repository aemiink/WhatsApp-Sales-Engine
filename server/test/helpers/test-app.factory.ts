import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createRequire } from 'module';
import { applyBaseTestEnv } from './env.helper';

interface ProviderOverride {
  token: unknown;
  useValue: unknown;
}

interface CreateTestAppOptions {
  env?: Record<string, string | undefined>;
  overrides?: ProviderOverride[];
}

export async function createTestApp(options?: CreateTestAppOptions): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
}> {
  applyBaseTestEnv(options?.env);
  const nodeRequire = createRequire(__filename);
  const appModuleImport = nodeRequire(
    '../../src/app.module',
  ) as typeof import('../../src/app.module');
  const { AppModule } = appModuleImport;

  let builder = Test.createTestingModule({
    imports: [AppModule],
  });

  for (const override of options?.overrides ?? []) {
    builder = builder
      .overrideProvider(override.token)
      .useValue(override.useValue);
  }

  const moduleFixture = await builder.compile();
  const app = moduleFixture.createNestApplication();
  await app.init();

  return {
    app,
    moduleFixture,
  };
}
