/**
 * Application entry point
 */

import { startBot } from './bot';
import { startCleanupInterval } from './job-manager';
import { logger } from './logger';
import { CONFIG } from './config';

async function main() {
    logger.info('🚀 Starting WhatsApp Print Bot...');

    logger.info({
        printerName: CONFIG.PRINTER_NAME,
        ownerPhone: CONFIG.OWNER_PHONE,
        notifyOwner: CONFIG.NOTIFY_OWNER,
        retentionHours: CONFIG.JOB_RETENTION_HOURS,
        pricePerPage: CONFIG.PRICE_PER_PAGE,
        printDpi: CONFIG.PRINT_DPI,
        printWorkers: CONFIG.PRINT_WORKERS
    }, 'Configuration');

    // Start job cleanup interval
    startCleanupInterval();

    // Start WhatsApp bot
    try {
        await startBot();
    } catch (error) {
        logger.fatal({ error }, 'Failed to start bot');
        process.exit(1);
    }
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
    logger.error({ error }, 'Unhandled rejection');
});

process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    process.exit(1);
});

// Start application
main().catch((error) => {
    logger.fatal({ error }, 'Fatal error in main');
    process.exit(1);
});
