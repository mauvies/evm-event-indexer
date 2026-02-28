import mongoose from 'mongoose';
import pRetry from 'p-retry';
import { env } from '../config/env.js';
import { createLogger } from '../logger.js';

const logger = createLogger('db');

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  await pRetry(
    async () => {
      await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5_000 });
    },
    {
      retries: 5,
      onFailedAttempt: (err) => {
        logger.warn(
          { attemptNumber: err.attemptNumber, retriesLeft: err.retriesLeft, err },
          'MongoDB connection attempt failed, retrying',
        );
      },
    },
  );

  logger.info(
    { host: mongoose.connection.host, db: mongoose.connection.name },
    'Database connected',
  );
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Database disconnected');
}
