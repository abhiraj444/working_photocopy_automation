/**
 * Printer integration - HTTP client for Python Print Server
 * 
 * Sends print requests to local Python server which uses the
 * proven pdf_printer.py implementation with multi-threading
 */

import axios from 'axios';
import { logger } from './logger';
import { CONFIG } from './config';

// Print server configuration
const PRINT_SERVER_URL = 'http://127.0.0.1:5000';

/**
 * Print PDF files via Python Print Server
 * @param filePaths - Array of PDF file paths to print
 * @param printerName - Specific printer to use (for layout selection)
 */
export async function printToPrinter(filePaths: string[], printerName?: string): Promise<void> {
    // Use provided printer name or default from config
    const selectedPrinter = printerName || CONFIG.PRINTER_NAME;

    logger.info({
        fileCount: filePaths.length,
        serverUrl: PRINT_SERVER_URL,
        printer: selectedPrinter
    }, 'Sending print request to Python server');

    // Check if server is running
    try {
        await axios.get(`${PRINT_SERVER_URL}/health`, { timeout: 2000 });
    } catch (error) {
        logger.error({ error }, 'Print server is not running');
        throw new Error(
            'Print server is not running. Please start it with: python print_server.py'
        );
    }

    // Print each file
    for (const filePath of filePaths) {
        try {
            await printSinglePDF(filePath, selectedPrinter);
        } catch (error) {
            logger.error({ error, filePath }, 'Failed to print PDF');
            throw error;
        }
    }

    logger.info({ fileCount: filePaths.length }, 'All files sent to print server');
}

/**
 * Print a single PDF via HTTP request to Python server
 */
async function printSinglePDF(filePath: string, printerName: string): Promise<void> {
    logger.info({ filePath, printer: printerName }, 'Sending to print server');

    try {
        const response = await axios.post(`${PRINT_SERVER_URL}/print`, {
            file_path: filePath,
            dpi: CONFIG.PRINT_DPI,
            threads: CONFIG.PRINT_WORKERS,
            printer: printerName,
            margin_mm: CONFIG.PRINT_MARGIN_MM
        }, {
            timeout: 600000  // 10 minutes timeout for large PDFs
        });

        if (response.data.success) {
            logger.info({ filePath }, 'Print server completed successfully');
        } else {
            throw new Error(response.data.error || 'Print failed');
        }

    } catch (error: any) {
        if (error.response) {
            logger.error({
                status: error.response.status,
                data: error.response.data
            }, 'Print server error');
            throw new Error(error.response.data.error || 'Print server error');
        } else if (error.request) {
            logger.error('No response from print server');
            throw new Error('Print server not responding');
        } else {
            throw error;
        }
    }
}

/**
 * Async version - queues print job and returns immediately
 */
export async function printToPrinterAsync(filePaths: string[]): Promise<string[]> {
    const jobIds: string[] = [];

    for (const filePath of filePaths) {
        try {
            const response = await axios.post(`${PRINT_SERVER_URL}/print-async`, {
                file_path: filePath,
                dpi: CONFIG.PRINT_DPI,
                threads: CONFIG.PRINT_WORKERS,
                printer: CONFIG.PRINTER_NAME
            });

            if (response.data.success) {
                jobIds.push(response.data.job_id);
                logger.info({
                    filePath,
                    jobId: response.data.job_id
                }, 'Print job queued');
            }

        } catch (error) {
            logger.error({ error, filePath }, 'Failed to queue print job');
        }
    }

    return jobIds;
}

/**
 * Check status of a print job
 */
export async function getJobStatus(jobId: string): Promise<any> {
    try {
        const response = await axios.get(`${PRINT_SERVER_URL}/job/${jobId}`);
        return response.data.job;
    } catch (error) {
        logger.error({ error, jobId }, 'Failed to get job status');
        return null;
    }
}
