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
 * 2. Update printer names below (PRINTER_NORMAL, PRINTER_2ON1, PRINTER_4ON1)
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
     * Windows Printer Names for Different Layouts
     * 
     * IMPORTANT: Create 3 printer configurations in Windows:
     * 1. PRINTER_NORMAL: 1 page per sheet (full price)
     * 2. PRINTER_2ON1: 2 pages per sheet (half price) 
     * 3. PRINTER_4ON1: 4 pages per sheet (quarter price)
     * 
     * How to create:
     * - Add printer 3 times with different names
     * - Configure each with different N-up settings in driver preferences
     * 
     * Example:
     * - "best" = Normal (1-up)
     * - "best_2on1" = 2 pages per sheet
     * - "best_4on1" = 4 pages per sheet
     */
    PRINTER_NORMAL: 'best',
    PRINTER_2ON1: 'best_2on1',
    PRINTER_4ON1: 'best_4on1',

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
     * Enable Layout Selection
     * true = Allow users to choose Normal/2-on-1/4-on-1
     * false = Always use normal printing (PRINTER_NORMAL)
     */
    ENABLE_LAYOUT_SELECTION: true,

    /**
     * File Timer (seconds)
     * How long to wait after user sends files before showing list
     * Lower = faster response, but may miss multi-file uploads
     */
    FILE_TIMER_SECONDS: 5,

    /**
     * Price Per Page (rupees)
     * Base cost per printed page (for normal 1-up printing)
     * - 2-on-1 = half price
     * - 4-on-1 = quarter price
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
     * Print Margins (millimeters)
     * White space around content on A4 page
     * 0 = No margins (full page)
     * 10 = 10mm margins on all sides
     * 20 = 20mm margins (recommended for professional look)
     */
    PRINT_MARGIN_MM: 15,

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

    // ============================================
    // LEGACY - Backward compatibility
    // ============================================

    /**
     * Legacy printer name (fallback)
     * Maps to PRINTER_NORMAL
     */
    get PRINTER_NAME() {
        return this.PRINTER_NORMAL;
    }
};
