/**
 * TypeScript type definitions
 */

// Job states (9 total now - added AWAITING_LAYOUT)
export type JobState =
    | 'PENDING'                      // Files uploaded, waiting for user message
    | 'AWAITING_CONFIRMATION'        // Showing file list, waiting for YES/SKIP
    | 'AWAITING_LAYOUT'              // Waiting for layout choice (1/2/4)
    | 'AWAITING_REMOVAL'             // User said SKIP, waiting for file numbers
    | 'AWAITING_FINAL_CONFIRMATION'  // After removal, waiting for YES
    | 'PROCESSING'                   // Processing files
    | 'PRINTING'                     // Sending to printer
    | 'COMPLETED'                    // Job done
    | 'CANCELLED';                   // User cancelled or timeout

// Print layout options
export type PrintLayout = '1' | '2' | '4';  // 1=Normal, 2=2-on-1, 4=4-on-1

// PDF file info
export interface JobFile {
    fileName: string;
    filePath: string;
    pageCount: number | undefined;
}

// User job data
export interface UserJob {
    phoneNumber: string;
    files: JobFile[];
    filesExcluded: string[];
    state: JobState;
    createdAt: Date;
    expiresAt: Date;
    layout?: PrintLayout;  // User's selected layout (1/2/4)
}

// Pipeline options
export interface PipelineOptions {
    workerCount: number;
    dpi: number;
    bufferSize: number;
    printerName: string;
}

// Page job for pipeline
export interface PageJob {
    pdfPath: string;
    pageNumber: number;
    totalPages: number;
}

// Converted page image
export interface PageImage {
    pageNumber: number;
    imageBuffer: Buffer;
}

// Print performance metrics
export interface PrintMetrics {
    startTime: number;
    endTime?: number;
    totalPages: number;
    convertedPages: number;
    printedPages: number;
}
