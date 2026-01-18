/**
 * PDF processing operations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { JobFile } from './types';
import { logger } from './logger';

/**
 * Count pages in a PDF file
 */
export async function countPDFPages(filePath: string): Promise<number> {
    try {
        const buffer = await fs.readFile(filePath);
        const data = await pdfParse(buffer);
        return data.numpages;
    } catch (error) {
        logger.error({ error, filePath }, 'Failed to count PDF pages');
        return 0;  // Return 0 if corrupted/invalid
    }
}

/**
 * Process all files in a job - count pages for each
 */
export async function processJobFiles(files: JobFile[]): Promise<void> {
    for (const file of files) {
        if (!file.pageCount) {
            file.pageCount = await countPDFPages(file.filePath);
            logger.info({ fileName: file.fileName, pageCount: file.pageCount }, 'Counted pages');
        }
    }
}

/**
 * Get total pages across all files
 */
export function getTotalPages(files: JobFile[], filesExcluded: string[] = []): number {
    const activeFiles = files.filter(f => !filesExcluded.includes(f.fileName));
    return activeFiles.reduce((sum, file) => sum + (file.pageCount || 0), 0);
}

/**
 * Rename files with phone number prefix and copy to processed folder
 * Format: {phoneNumber}_{originalFileName}.pdf
 * 
 * This helps identify mailbox on printer and prevents filename conflicts
 */
export async function renameFilesWithPhone(
    phoneNumber: string,
    files: JobFile[],
    filesExcluded: string[],
    outputDir: string
): Promise<string[]> {
    // Create output directory if doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    const activeFiles = files.filter(f => !filesExcluded.includes(f.fileName));
    const renamedPaths: string[] = [];

    for (const file of activeFiles) {
        const newFileName = `${phoneNumber}_${file.fileName}`;
        const newPath = path.join(outputDir, newFileName);

        // Copy file with new name
        await fs.copyFile(file.filePath, newPath);
        renamedPaths.push(newPath);

        logger.info({
            original: file.fileName,
            renamed: newFileName
        }, 'Renamed file for printing');
    }

    return renamedPaths;
}
