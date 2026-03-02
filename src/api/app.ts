import cors from 'cors';
import express, { type Express } from 'express';
import { ZodError } from 'zod';
import { createHttpLogger } from '../logger';
import router from './routes/index';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(createHttpLogger()); // HTTP request logger middleware
  app.use(router);
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      // Handle zod validation errors
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'validation_error', issues: err.issues });
        return;
      }

      // Handle server errors
      res.status(500).json({ error: 'internal_error' });
    },
  );

  return app;
}
