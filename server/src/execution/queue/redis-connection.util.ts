import IORedis from 'ioredis';

export function createRedisConnection(redisUrl: string): IORedis {
  return new IORedis(redisUrl, {
    lazyConnect: false,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
}
