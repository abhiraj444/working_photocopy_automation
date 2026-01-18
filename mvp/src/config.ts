/**
 * Configuration file for WhatsApp Print Bot
 * 
 * ============================================
 * INSTALLATION INSTRUCTIONS
 * ============================================
 * 
 * 1. Find your printer name:
 *    - Press Win+R → type "control printers"
 *    - Copy the exact printer name
 * 
 * 2. Update PRINTER_NAME below
 * 
 * 3. Update OWNER_PHONE with your WhatsApp number
 *    - Format: 917840957524 (no + sign)
 * 
 * 4. Adjust other settings if needed
 * 
 * 5. Rebuild: npm run build
 * 
 * ============================================
 */

export const CONFIG = {
    // ============================================
    // REQUIRED SETTINGS - Must update these!
    // ============================================

    /**
     * Windows Printer Name
     * Find it: Control Panel → Devices and Printers
     * Example: "Canon iR 7105", "HP LaserJet Pro", "best"
     */
    PRINTER_NAME: 'best',

    /**
     * Owner's WhatsApp Number
     * Format: 917840957524 (country code + number, no + sign)
     * This number receives notifications
     */
    OWNER_PHONE: '917840957524',

    // ============================================
    // OPTIONAL SETTINGS - Adjust if needed
    // ============================================

    /**
     * File Timer (seconds)
     * How long to wait after user sends files before showing list
     * Lower = faster response, but may miss multi-file uploads
     */
    FILE_TIMER_SECONDS: 5,

    /**
     * Price Per Page (rupees)
     * Cost charged per printed page
     */
    PRICE_PER_PAGE: 0.50,

    /**
     * Print DPI (Image Quality)
     * 150 = Fast, lower quality
     * 300 = Balanced (recommended)
     * 600 = Slow, high quality
     */
    PRINT_DPI: 150,

    /**
     * Print Workers (Parallel Threads)
     * More workers = faster printing, but more RAM usage
     * Recommended: 8-16 workers for multi-core systems
     */
    PRINT_WORKERS: 16,

    /**
     * Print Buffer Size
     * Maximum pages buffered in memory during printing
     */
    PRINT_BUFFER_SIZE: 5,

    /**
     * Job Retention (hours)
     * Files auto-delete after this time to free disk space
     */
    JOB_RETENTION_HOURS: 24,

    /**
     * Owner Notifications
     * true = Send notifications to OWNER_PHONE
     * false = Silent mode
     */
    NOTIFY_OWNER: true,

    // ============================================
    // SYSTEM PATHS - Usually don't need to change
    // ============================================

    /**
     * File Storage Paths
     * Leave as-is unless you want custom locations
     */
    DOWNLOAD_PATH: 'D:/FreshWhatsappAutomation/mvp/downloads',
    PROCESSED_PATH: 'D:/FreshWhatsappAutomation/mvp/processed',
    AUTH_PATH: 'D:/FreshWhatsappAutomation/mvp/auth',
};
