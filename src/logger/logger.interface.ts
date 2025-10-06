
import { pino } from 'pino';

// We are re-exporting the Logger type from pino, but wrapping it in our own interface
// This allows us to depend on our own abstraction (`ILogger`) throughout the app.
// If we ever decide to switch from pino to another library, we would only
// need to change the implementation in `logger.service.ts` and this type export.
export type ILogger = pino.Logger;
