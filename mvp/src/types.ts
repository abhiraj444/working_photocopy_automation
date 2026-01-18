/**
 * TypeScript type definitions for WhatsApp Print Bot
 */

// Individual PDF file metadata
export interface JobFile {
    fileName: string;
    filePath: string;
    pageCount?: number;  // Undefined until counted
}

// Job states (8 total)
export type JobState =
    | 'PENDING'                      // Files uploaded, waiting for user message
    | 'AWAITING_CONFIRMATION'        // Showing file list, waiting for YES/SKIP
    | 'AWAITING_REMOVAL'             // User said SKIP, waiting for file numbers
    | 'AWAITING_FINAL_CONFIRMATION'  // After removal, waiting for YES
    | 'PROCESSING'                   // Processing files
    | 'PRINTING'                     // Sending to printer
    | 'COMPLETED'                    // Job done
    | 'CANCELLED';                   // User cancelled or timeout

// User job
export interface UserJob {
    phoneNumber: string;
    state: JobState;
    files: JobFile[];
    filesExcluded: string[];  // Files to skip
    createdAt: Date;
    lastActivityAt: Date;
    expiresAt: Date;  // createdAt + 24 hours
}

// Pipeline configuration
export interface PipelineOptions {
    workerCount: number;      // Number of conversion threads
    dpi: number;              // Image quality
    bufferSize: number;       // Max buffered pages
    printerName: string;      // Windows printer name
}

// Single page conversion job
export interface PageJob {
    pdfPath: string;
    pageNumber: number;
    totalPages: number;
}

// Converted image data
export interface PageImage {
    pageNumber: number;
    imageBuffer: Buffer;
}

// Performance tracking metrics
export interface PrintMetrics {
    totalPages: number;
    convertedPages: number;
    printedPages: number;
    conversionTimeAvg: number;
    printTimeAvg: number;
    startTime: Date;
}
