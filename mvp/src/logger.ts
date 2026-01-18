/**
 * Structured logging with Pino
 */

import pino from 'pino';

export const logger = pino({
    level: 'info',  // Log levels: trace, debug, info, warn, error, fatal
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',  // Don't show these fields
            singleLine: false,
        }
    }
});
