# WhatsApp Automated Print Shop

🖨️ **WhatsApp-based automated print shop** with high-performance pipeline printing (4x faster).

## Features

- ✅ Auto-download PDFs from WhatsApp
- ✅ 24-hour file retention with auto-cleanup
- ✅ Numbered file list with page counts
- ✅ Selective file printing (**SKIP** feature)
- ✅ Automatic pricing (₹0.50/page)
- ✅ **High-performance pipeline printing** (4x faster - 100 pages in ~2-3 min)
- ✅ Print to Windows printer (Canon iR 7105 or similar)
- ✅ Owner notifications
- ✅ Multiple concurrent users supported

## Quick Start

### Prerequisites

- **Windows** (required for printer integration)
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Printer** configured in Windows
- **WhatsApp** number for the bot

### Installation

```bash
# Navigate to project directory
cd d:\FreshWhatsappAutomation\mvp

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

### Configuration

Edit `src/config.ts` before running:

```typescript
export const CONFIG = {
    // IMPORTANT: Update these values
    PRINTER_NAME: 'PSY_PSY_237_BW_CANON(2)',  // Your Windows printer name
    OWNER_PHONE: '917840957524',               // Owner WhatsApp (no + sign)
    
    // Optional: Adjust these
    PRICE_PER_PAGE: 0.50,      // Price per page (₹)
    PRINT_DPI: 300,            // 150/300/600
    PRINT_WORKERS: 4,          // 2/4/8 (based on CPU cores)
};
```

**To find printer name:**
1. Open: Control Panel → Devices and Printers
2. Copy exact printer name
3. Paste into `PRINTER_NAME`

### Running

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

**First run:**
1. Start bot: `npm run dev`
2. Scan QR code with your phone
3. Session saved - won't need QR again

## Usage

### Customer Workflow

1. **Send PDF(s)** to bot's WhatsApp number
2. **Wait 60 seconds** (or send any message to trigger)
3. **Review** file list with page counts and pricing
4. **Reply:**
   - `YES` - Print all files
   - `SKIP` - Remove unwanted files
5. If SKIP: Reply with file numbers (e.g., `1,3` or `2`)
6. **Confirm** with `YES`
7. **Collect** printed pages from shop

### Example Conversation

```
Customer: [Sends 3 PDFs]

Bot: 📄 Your Files

1. invoice.pdf
   Pages: 5

2. report.pdf
   Pages: 12

3. notes.pdf
   Pages: 3

━━━━━━━━━━━━━━━━━
Total Pages: 20
Total Cost: ₹10.00
━━━━━━━━━━━━━━━━━

Reply:
• YES - Print all files
• SKIP - Remove unwanted files

Customer: SKIP

Bot: 📝 Which files to remove?

1. invoice.pdf
2. report.pdf
3. notes.pdf

Reply with numbers to remove (comma-separated):
Example: 1,3 or 2

Customer: 3

Bot: ✅ Updated File List

1. invoice.pdf
   Pages: 5

2. report.pdf
   Pages: 12

━━━━━━━━━━━━━━━━━
Total Pages: 17
Total Cost: ₹8.50
━━━━━━━━━━━━━━━━━

Reply YES to confirm printing

Customer: YES

Bot: 🖨️ Sending to printer...
Your files will be ready shortly!

Bot: ✅ Printing complete!
Please collect your printed pages from the shop.
```

## Project Structure

```
mvp/
├── src/
│   ├── index.ts           # Entry point
│   ├── config.ts          # Configuration
│   ├── types.ts           # TypeScript interfaces
│   ├── logger.ts          # Logging
│   ├── bot.ts             # WhatsApp integration (Baileys)
│   ├── workflow.ts        # State machine
│   ├── job-manager.ts     # Job state & cleanup
│   ├── pdf-processor.ts   # Page counting, renaming
│   ├── printer.ts         # Printer integration
│   ├── print-pipeline.ts  # High-performance pipeline
│   └── messages.ts        # Message templates
├── dist/                  # Compiled JavaScript
├── downloads/             # User PDF files (auto-cleanup)
├── processed/             # Renamed files for printing
├── auth/                  # WhatsApp session
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

### State Machine

```
PENDING → Count pages, show list → AWAITING_CONFIRMATION
  ↓ (YES)
  → PROCESSING → PRINTING → COMPLETED
  ↓ (SKIP)
  → AWAITING_REMOVAL → AWAITING_FINAL_CONFIRMATION → PROCESSING → PRINTING → COMPLETED
```

### Pipeline Printing (4x Faster)

```
PDF → Job Queue → [4 Conversion Workers] → Priority Queue → Page Buffer → Print Worker → Printer
```

**Performance:**
- Sequential: 8-10 minutes for 100 pages
- Pipeline: 2-3 minutes for 100 pages (4x faster!)

## Configuration Options

### Pricing

```typescript
PRICE_PER_PAGE: 0.50  // ₹0.50 per page
```

### File Retention

```typescript
JOB_RETENTION_HOURS: 24  // Auto-delete after 24 hours
```

### Print Quality

```typescript
PRINT_DPI: 300  // 150 (fast), 300 (balanced), 600 (high quality)
```

### Performance

```typescript
PRINT_WORKERS: 4  // 2 (dual-core), 4 (quad-core), 8 (8+ cores)
```

## Troubleshooting

### QR Code Not Showing

- Check internet connection
- Restart bot: `npm run dev`
- Delete `auth/` folder and re-scan

### Files Not Printing

1. Verify printer is online: `Control Panel → Printers`
2. Check printer name matches: `CONFIG.PRINTER_NAME`
3. Test manual print from Windows Explorer

### Page Count Wrong

- Ensure PDF is not corrupted
- Check logs: Look for "Failed to count PDF pages"

### Pipeline Not Working

- Install dependencies: `npm install`
- Check if `print-pipeline.ts` compiled
- Fallback to sequential printing automatically

## Dependencies

**Core:**
- `@whiskeysockets/baileys` - WhatsApp Web API
- `pdf-parse` - PDF page counting
- `pino` - Structured logging

**Pipeline:**
- `pdf-poppler` - PDF → Image conversion
- `sharp` - Fast image processing
- `p-queue` / `js-priority-queue` - Queue management

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## License

MIT

## Support

For issues or questions, check logs in console or contact the developer.

---

**Built with ❤️ for automated printing**
