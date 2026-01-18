/**
 * User workflow - state machine handling user interactions
 */

import * as path from 'path';
import { getJob, updateJobState, deleteJob } from './job-manager';
import { processJobFiles, renameFilesWithPhone, getTotalPages } from './pdf-processor';
import { printToPrinter } from './printer';
import { Messages } from './messages';
import { CONFIG } from './config';
import { logger } from './logger';

/**
 * Handle user text message based on current job state
 */
export async function handleUserMessage(
    phoneNumber: string,
    messageText: string,
    sendMessage: (text: string) => Promise<void>,
    ownerNotify?: (text: string) => Promise<void>
): Promise<void> {
    const job = getJob(phoneNumber);

    if (!job) {
        // No active job, send welcome message
        await sendMessage(Messages.welcome());
        return;
    }

    const text = messageText.trim().toUpperCase();

    logger.info({ phoneNumber, state: job.state, text }, 'Handling user message');

    switch (job.state) {
        case 'PENDING':
            await handlePendingJob(phoneNumber, sendMessage);
            break;

        case 'AWAITING_CONFIRMATION':
            if (text === 'YES') {
                // Check if layout selection is enabled
                if (CONFIG.ENABLE_LAYOUT_SELECTION) {
                    await handleLayoutSelection(phoneNumber, sendMessage);
                } else {
                    await handleConfirmPrint(phoneNumber, sendMessage, ownerNotify);
                }
            } else if (text === 'SKIP') {
                await handleSkipRequest(phoneNumber, sendMessage);
            } else {
                await sendMessage('Please reply:\n• *YES* - Print all files\n• *SKIP* - Remove unwanted files');
            }
            break;

        case 'AWAITING_LAYOUT':
            if (text === '1' || text === '2' || text === '4') {
                await handleLayoutChoice(phoneNumber, text as '1' | '2' | '4', sendMessage, ownerNotify);
            } else {
                await sendMessage('Please reply with *1*, *2*, or *4*');
            }
            break;

        case 'AWAITING_REMOVAL':
            await handleFileRemoval(phoneNumber, messageText, sendMessage);
            break;

        case 'AWAITING_FINAL_CONFIRMATION':
            if (text === 'YES') {
                // Check if layout selection is enabled
                if (CONFIG.ENABLE_LAYOUT_SELECTION) {
                    await handleLayoutSelection(phoneNumber, sendMessage);
                } else {
                    await handleConfirmPrint(phoneNumber, sendMessage, ownerNotify);
                }
            } else {
                await sendMessage('Please reply *YES* to confirm printing');
            }
            break;

        default:
            await sendMessage('Please wait, processing your previous request...');
    }
}

/**
 * Handle PENDING state - count pages and show file list
 */
async function handlePendingJob(
    phoneNumber: string,
    sendMessage: (text: string) => Promise<void>
): Promise<void> {
    const job = getJob(phoneNumber);
    if (!job) return;

    // Count pages for all files
    await processJobFiles(job.files);

    // Update state
    updateJobState(phoneNumber, 'AWAITING_CONFIRMATION');

    // Send file list
    const message = Messages.fileList(job.files, job.filesExcluded);
    await sendMessage(message);
}

/**
 * Handle layout selection request
 */
async function handleLayoutSelection(
    phoneNumber: string,
    sendMessage: (text: string) => Promise<void>
): Promise<void> {
    const job = getJob(phoneNumber);
    if (!job) return;

    updateJobState(phoneNumber, 'AWAITING_LAYOUT');

    const message = Messages.layoutPrompt(job.files, job.filesExcluded);
    await sendMessage(message);
}

/**
 * Handle layout choice (1/2/4) and print
 */
async function handleLayoutChoice(
    phoneNumber: string,
    layout: '1' | '2' | '4',
    sendMessage: (text: string) => Promise<void>,
    ownerNotify?: (text: string) => Promise<void>
): Promise<void> {
    const job = getJob(phoneNumber);
    if (!job) return;

    // Store layout choice
    job.layout = layout;

    logger.info({ phoneNumber, layout }, 'Layout selected');

    // Proceed to print
    await handleConfirmPrint(phoneNumber, sendMessage, ownerNotify, layout);
}

/**
 * Handle YES confirmation - process and print
 */
async function handleConfirmPrint(
    phoneNumber: string,
    sendMessage: (text: string) => Promise<void>,
    ownerNotify?: (text: string) => Promise<void>,
    layout?: '1' | '2' | '4'
): Promise<void> {
    const job = getJob(phoneNumber);
    if (!job) return;

    try {
        // Use job's layout if not passed directly
        const selectedLayout = layout || job.layout || '1';

        // Determine which printer to use based on layout
        let printerName = CONFIG.PRINTER_NORMAL;
        if (selectedLayout === '2') {
            printerName = CONFIG.PRINTER_2ON1;
        } else if (selectedLayout === '4') {
            printerName = CONFIG.PRINTER_4ON1;
        }

        logger.info({ phoneNumber, layout: selectedLayout, printerName }, 'Selected printer for layout');

        // Update state
        updateJobState(phoneNumber, 'PROCESSING');
        await sendMessage(Messages.processing());

        // Rename files with phone prefix
        const processedDir = path.join(CONFIG.PROCESSED_PATH, phoneNumber);
        const renamedPaths = await renameFilesWithPhone(
            phoneNumber,
            job.files,
            job.filesExcluded,
            processedDir
        );

        logger.info({
            phoneNumber,
            fileCount: renamedPaths.length
        }, 'Files renamed and ready for printing');

        // Update state
        updateJobState(phoneNumber, 'PRINTING');
        await sendMessage(Messages.printing());

        // Notify owner
        if (ownerNotify && CONFIG.NOTIFY_OWNER) {
            const ownerMsg = Messages.ownerPrintStart(
                phoneNumber,
                job.files,
                job.filesExcluded,
                selectedLayout
            );
            await ownerNotify(ownerMsg);
        }

        // Send to printer with selected layout/printer
        await printToPrinter(renamedPaths, printerName);

        logger.info({ phoneNumber }, 'Printing complete');

        // Update state
        updateJobState(phoneNumber, 'COMPLETED');
        await sendMessage(Messages.completed());

        // Schedule job deletion after 1 minute
        setTimeout(async () => {
            await deleteJob(phoneNumber);
        }, 60 * 1000);

    } catch (error) {
        logger.error({ error, phoneNumber }, 'Error during print workflow');
        await sendMessage(Messages.error('Failed to print files. Please try again.'));
        updateJobState(phoneNumber, 'CANCELLED');
    }
}

/**
 * Handle SKIP request - ask for file numbers
 */
async function handleSkipRequest(
    phoneNumber: string,
    sendMessage: (text: string) => Promise<void>
): Promise<void> {
    const job = getJob(phoneNumber);
    if (!job) return;

    updateJobState(phoneNumber, 'AWAITING_REMOVAL');

    const message = Messages.skipPrompt(job.files);
    await sendMessage(message);
}

/**
 * Handle file removal - parse numbers and exclude files
 */
async function handleFileRemoval(
    phoneNumber: string,
    messageText: string,
    sendMessage: (text: string) => Promise<void>
): Promise<void> {
    const job = getJob(phoneNumber);
    if (!job) return;

    // Parse numbers from text (e.g., "1,3" or "2")
    const numbersText = messageText.trim().replace(/\s+/g, '');
    const numberPattern = /^(\d+)(,\d+)*$/;

    if (!numberPattern.test(numbersText)) {
        await sendMessage(Messages.invalidFileNumbers());
        return;
    }

    const numbers = numbersText.split(',').map(n => parseInt(n, 10));

    // Validate numbers are within range
    if (numbers.some(n => n < 1 || n > job.files.length)) {
        await sendMessage(Messages.fileNumbersOutOfRange(job.files.length));
        return;
    }

    // Mark files as excluded (convert 1-based to 0-based index)
    for (const num of numbers) {
        const index = num - 1;
        const fileName = job.files[index].fileName;
        if (!job.filesExcluded.includes(fileName)) {
            job.filesExcluded.push(fileName);
        }
    }

    logger.info({
        phoneNumber,
        excluded: job.filesExcluded
    }, 'Files excluded');

    // Check if all files excluded
    if (job.filesExcluded.length === job.files.length) {
        await sendMessage('❌ All files removed. Please send new files to start over.');
        updateJobState(phoneNumber, 'CANCELLED');
        return;
    }

    // Update state
    updateJobState(phoneNumber, 'AWAITING_FINAL_CONFIRMATION');

    // Send updated list
    const message = Messages.updatedFileList(job.files, job.filesExcluded);
    await sendMessage(message);
}
