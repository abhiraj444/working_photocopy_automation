/**
 * Configuration file for WhatsApp Print Bot
 * 
 * IMPORTANT: Update these values before running:
 * - PRINTER_NAME: Must match exact Windows printer name
 * - OWNER_PHONE: Owner's WhatsApp number (no + sign)
 * - Paths: Verify absolute paths match your system
 */

export const CONFIG = {
    // File paths (absolute Windows paths)
    DOWNLOAD_PATH: 'D:/FreshWhatsappAutomation/mvp/downloads',
    PROCESSED_PATH: 'D:/FreshWhatsappAutomation/mvp/processed',
    AUTH_PATH: 'D:/FreshWhatsappAutomation/mvp/auth',

    // Job retention (24 hours)
    JOB_RETENTION_HOURS: 24,
    // timer to notify the user
    FILE_TIMER_SECONDS: 5,
    // Pricing (₹0.50 per page)
    PRICE_PER_PAGE: 0.50,

    // Printer configuration
    // IMPORTANT: Update this to match your Windows printer name exactly
    // Check: Control Panel → Devices and Printers
    PRINTER_NAME: 'best',

    // High-performance printing pipeline
    PRINT_DPI: 150,              // Image quality: 150/300/600
    PRINT_WORKERS: 16,            // Parallel conversion threads: 2/4/8
    PRINT_BUFFER_SIZE: 5,        // Max buffered pages

    // Owner notifications
    // IMPORTANT: Update with owner's WhatsApp number (no + sign)
    OWNER_PHONE: '917840957524',
    NOTIFY_OWNER: true,          // Enable/disable owner notifications
};
