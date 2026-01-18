/**
 * Message templates for WhatsApp bot
 */

import { JobFile } from './types';
import { CONFIG } from './config';

export const Messages = {
    /**
     * Welcome message when user first interacts
     */
    welcome(): string {
        return `👋 Welcome to Automated Print Shop!\n\nSend your PDF files and I'll handle the rest.\n\n📱 How it works:\n1. Send PDF file(s)\n2. Review file list with page counts & pricing\n3. Reply YES to print all or SKIP to remove files\n4. Collect printed pages from the shop\n\nPricing: ₹${CONFIG.PRICE_PER_PAGE}/page`;
    },

    /**
     * File list with page counts and pricing
     */
    fileList(files: JobFile[], filesExcluded: string[] = [], layout?: string): string {
        const activeFiles = files.filter(f => !filesExcluded.includes(f.fileName));

        let message = '📄 *Your Files*\n\n';

        activeFiles.forEach((file, index) => {
            const pages = file.pageCount || 0;
            message += `${index + 1}. ${file.fileName}\n   Pages: ${pages}\n\n`;
        });

        const totalPages = activeFiles.reduce((sum, f) => sum + (f.pageCount || 0), 0);
        const totalCost = totalPages * CONFIG.PRICE_PER_PAGE;

        message += `━━━━━━━━━━━━━━━━━\n`;
        message += `*Total Pages:* ${totalPages}\n`;
        message += `*Total Cost:* ₹${totalCost.toFixed(2)}\n`;
        message += `━━━━━━━━━━━━━━━━━\n\n`;

        if (CONFIG.ENABLE_LAYOUT_SELECTION) {
            message += `Reply:\n`;
            message += `• *YES* - Choose layout\n`;
            message += `• *SKIP* - Remove files`;
        } else {
            message += `Reply:\n`;
            message += `• *YES* - Print all files\n`;
            message += `• *SKIP* - Remove unwanted files`;
        }

        return message;
    },

    /**
     * Layout selection prompt (Normal / 2-on-1 / 4-on-1)
     */
    layoutPrompt(files: JobFile[], filesExcluded: string[]): string {
        const activeFiles = files.filter(f => !filesExcluded.includes(f.fileName));
        const totalPages = activeFiles.reduce((sum, f) => sum + (f.pageCount || 0), 0);

        let message = '📄 *Choose Print Layout*\n\n';
        message += `Total Pages: *${totalPages}*\n\n`;
        message += `━━━━━━━━━━━━━━━━━\n\n`;

        // Normal (1-up)
        const price1 = totalPages * CONFIG.PRICE_PER_PAGE;
        message += `1️⃣ *Normal* (1 page per sheet)\n`;
        message += `   Cost: ₹${price1.toFixed(2)}\n\n`;

        // 2-on-1
        const price2 = (totalPages * CONFIG.PRICE_PER_PAGE) / 2;
        message += `2️⃣ *2-on-1* (2 pages per sheet)\n`;
        message += `   Cost: ₹${price2.toFixed(2)}\n\n`;

        // 4-on-1
        const price4 = (totalPages * CONFIG.PRICE_PER_PAGE) / 4;
        message += `4️⃣ *4-on-1* (4 pages per sheet)\n`;
        message += `   Cost: ₹${price4.toFixed(2)}\n\n`;

        message += `━━━━━━━━━━━━━━━━━\n\n`;
        message += `Reply: *1*, *2*, or *4*`;

        return message;
    },

    /**
     * Request file numbers to skip
     */
    skipPrompt(files: JobFile[]): string {
        let message = '📝 *Which files to remove?*\n\n';

        files.forEach((file, index) => {
            message += `${index + 1}. ${file.fileName}\n`;
        });

        message += `\nReply with numbers to remove (comma-separated):\n`;
        message += `Example: *1,3* or *2*`;

        return message;
    },

    /**
     * Invalid file number format
     */
    invalidFileNumbers(): string {
        return '❌ Invalid format. Please send numbers separated by commas.\n\nExample: *1,3* or *2*';
    },

    /**
     * File numbers out of range
     */
    fileNumbersOutOfRange(max: number): string {
        return `❌ Invalid file numbers. Please choose between 1 and ${max}.`;
    },

    /**
     * Updated file list after removal
     */
    updatedFileList(files: JobFile[], filesExcluded: string[]): string {
        const activeFiles = files.filter(f => !filesExcluded.includes(f.fileName));

        let message = '✅ *Updated File List*\n\n';

        activeFiles.forEach((file, index) => {
            const pages = file.pageCount || 0;
            message += `${index + 1}. ${file.fileName}\n   Pages: ${pages}\n\n`;
        });

        const totalPages = activeFiles.reduce((sum, f) => sum + (f.pageCount || 0), 0);
        const totalCost = totalPages * CONFIG.PRICE_PER_PAGE;

        message += `━━━━━━━━━━━━━━━━━\n`;
        message += `*Total Pages:* ${totalPages}\n`;
        message += `*Total Cost:* ₹${totalCost.toFixed(2)}\n`;
        message += `━━━━━━━━━━━━━━━━━\n\n`;
        message += `Reply *YES* to confirm printing`;

        return message;
    },

    /**
     * Processing started
     */
    processing(): string {
        return '⚙️ Processing your files...';
    },

    /**
     * Printing started
     */
    printing(): string {
        return '🖨️ Sending to printer...\n\nYour files will be ready shortly!';
    },

    /**
     * Job completed
     */
    completed(): string {
        return '✅ *Printing complete!*\n\nPlease collect your printed pages from the shop.\n\nThank you for using our service! 🙏';
    },

    /**
     * Error message
     */
    error(message: string): string {
        return `❌ Error: ${message}\n\nPlease try again or contact support.`;
    },

    /**
     * Only PDFs allowed
     */
    pdfOnly(): string {
        return '❌ Please send only PDF files.\n\nOther file formats are not supported.';
    },

    /**
     * Files received notification (after 60s timer)
     */
    filesReceived(): string {
        return '✅ Files received!\n\nProcessing page counts...';
    },

    /**
     * Owner notification - files downloaded
     */
    ownerFileDownload(phoneNumber: string, fileCount: number, files: JobFile[]): string {
        let message = `📥 *New Files Received*\n\n`;
        message += `Customer: ${phoneNumber}\n`;
        message += `Files: ${fileCount}\n\n`;

        files.forEach((file, index) => {
            message += `${index + 1}. ${file.fileName}\n`;
        });

        return message;
    },

    /**
     * Owner notification - printing started
     */
    ownerPrintStart(phoneNumber: string, files: JobFile[], filesExcluded: string[], layout?: string): string {
        const activeFiles = files.filter(f => !filesExcluded.includes(f.fileName));
        const totalPages = activeFiles.reduce((sum, f) => sum + (f.pageCount || 0), 0);

        // Calculate cost based on layout
        let priceMultiplier = 1;
        let layoutName = 'Normal (1-up)';
        if (layout === '2') {
            priceMultiplier = 0.5;
            layoutName = '2-on-1';
        } else if (layout === '4') {
            priceMultiplier = 0.25;
            layoutName = '4-on-1';
        }
        const totalCost = totalPages * CONFIG.PRICE_PER_PAGE * priceMultiplier;

        let message = `🖨️ *Print Job Started*\n\n`;
        message += `Customer: ${phoneNumber}\n`;
        message += `Mailbox: ${phoneNumber}\n`;
        message += `Layout: ${layoutName}\n\n`;

        message += `*Files:*\n`;
        activeFiles.forEach((file, index) => {
            message += `${index + 1}. ${file.fileName} (${file.pageCount} pages)\n`;
        });

        message += `\n━━━━━━━━━━━━━━━━━\n`;
        message += `*Total Pages:* ${totalPages}\n`;
        message += `*Amount:* ₹${totalCost.toFixed(2)}\n`;
        message += `━━━━━━━━━━━━━━━━━`;

        return message;
    },
};
