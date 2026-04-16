import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
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
  app: INestApplication<App>;
  moduleFixture: TestingModule;
}> {
  applyBaseTestEnv(options?.env);
  // `import()` is not available under current ts-jest runtime options.
  const { AppModule } = require('../../src/app.module') as {
    AppModule: any;
  };

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
