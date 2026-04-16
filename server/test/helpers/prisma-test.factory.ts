import { PrismaService } from '../../src/database/prisma.service';

type PartialDeep<T> = {
  [K in keyof T]?: T[K] extends object ? PartialDeep<T[K]> : T[K];
};

export function createPrismaMock(
  overrides?: PartialDeep<PrismaService>,
): PrismaService {
  const base: PartialDeep<PrismaService> = {
    conversation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    analyticsEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    handoffSession: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workspace: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    workspaceMember: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  return {
    ...base,
    ...overrides,
  } as unknown as PrismaService;
}
