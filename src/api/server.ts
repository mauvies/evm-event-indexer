import { env } from '../config/env';
import { connectDatabase } from '../db/connection';
import { createLogger } from '../logger';
import { createApp } from './app';

const logger = createLogger('api');

async function main() {
  logger.info('Starting server...');

  await connectDatabase();
  const app = createApp();

  app.listen(env.API_PORT, () => {
    logger.info({ port: env.API_PORT }, '🚀 Server ready');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Server crashed');
  process.exitCode = 1;
});
