# WhatsApp Print Bot - Installation Guide

Complete guide to install on a new Windows laptop from scratch.

## Prerequisites

- **Windows 10/11** (required for printer integration)
- **Administrator access** to install software
- **Internet connection**
- **WhatsApp phone number** for the bot

---

## Step 1: Install Required Software

### 1.1 Install Node.js

1. Download Node.js v18+ from: https://nodejs.org/
2. Run installer, accept defaults
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

### 1.2 Install Python 3.11+

1. Download Python from: https://www.python.org/downloads/
2. **IMPORTANT**: Check "Add Python to PATH" during installation
3. Verify installation:
   ```cmd
   python --version
   pip --version
   ```

### 1.3 Install Ghostscript

1. Download from: https://ghostscript.com/releases/gsdnld.html
2. Install 64-bit version (default location is fine)
3. Verify installation:
   ```cmd
   gswin64c --version
   ```

### 1.4 Install Git (Optional)

1. Download from: https://git-scm.com/download/win
2. Install with defaults

---

## Step 2: Download the Project

### Option A: Using Git
```cmd
cd C:\
git clone https://github.com/abhiraj444/working_photocopy_automation.git
cd working_photocopy_automation
```

### Option B: Download ZIP
1. Go to: https://github.com/abhiraj444/working_photocopy_automation
2. Click "Code" → "Download ZIP"
3. Extract to `C:\working_photocopy_automation`

---

## Step 3: Configure the Application

### 3.1 Find Your Printer Name

1. Press `Win + R`
2. Type: `control printers`
3. **Copy the exact printer name** (e.g., "Canon iR 7105", "HP LaserJet", "best")

### 3.2 Edit Configuration File

**Open:** `C:\working_photocopy_automation\mvp\src\config.ts`

**Update these values:**

```typescript
export const CONFIG = {
    // ====================================
    // REQUIRED: Update these values
    // ====================================
    
    // Your Windows printer name (from Step 3.1)
    PRINTER_NAME: 'YOUR_PRINTER_NAME_HERE',
    
    // Owner's WhatsApp number (format: 917840957524, no + sign)
    OWNER_PHONE: '91YOUR_NUMBER_HERE',
    
    // ====================================
    // OPTIONAL: Adjust if needed
    // ====================================
    
    // How long to wait after file upload before showing list (seconds)
    FILE_TIMER_SECONDS: 5,
    
    // Price per page (in rupees)
    PRICE_PER_PAGE: 0.50,
    
    // Print quality (150=fast, 300=balanced, 600=best quality)
    PRINT_DPI: 150,
    
    // Number of parallel workers (more = faster, but uses more RAM)
    PRINT_WORKERS: 16,
    
    // How long to keep files before auto-delete (hours)
    JOB_RETENTION_HOURS: 24,
    
    // Enable/disable owner notifications
    NOTIFY_OWNER: true,
};
```

**Save the file.**

---

## Step 4: Install Python Dependencies

```cmd
cd C:\working_photocopy_automation
pip install -r server_requirements.txt
```

This installs:
- pdf2image (PDF conversion)
- pillow (Image processing)
- pywin32 (Windows printer)
- flask (HTTP server)
- flask-cors (HTTP communication)

---

## Step 5: Install Node.js Dependencies

```cmd
cd C:\working_photocopy_automation\mvp
npm install
```

This installs WhatsApp library and other dependencies.

---

## Step 6: Build the Application

```cmd
npm run build
```

You should see: "✓ Build complete" (no errors)

---

## Step 7: Run the Application

### 7.1 Start Print Server (Terminal 1)

```cmd
cd C:\working_photocopy_automation
python print_server.py
```

You should see:
```
PDF Print Server Starting
Host: 127.0.0.1
Port: 5000
```

**Keep this terminal running!**

### 7.2 Start WhatsApp Bot (Terminal 2)

Open a **new terminal** window:

```cmd
cd C:\working_photocopy_automation\mvp
npm run dev
```

### 7.3 Scan QR Code

1. QR code appears in Terminal 2
2. Open WhatsApp on your phone
3. Settings → Linked Devices → Link a Device
4. Scan the QR code
5. Wait for "connected to WA" message

**Done! Bot is now running.**

---

## Step 8: Test the Bot

1. From another phone, send a PDF to the bot's WhatsApp number
2. Wait 5 seconds (or send any text)
3. Bot shows file list with page count and price
4. Reply: `YES`
5. Files print to your configured printer!

---

## Configuration Reference

### All Settings in config.ts

| Setting | What It Does | Example |
|---------|--------------|---------|
| `PRINTER_NAME` | Windows printer to use | `"Canon iR 7105"` |
| `OWNER_PHONE` | Number for notifications | `"917840957524"` |
| `FILE_TIMER_SECONDS` | Wait time after upload | `5` (5 seconds) |
| `PRICE_PER_PAGE` | Cost per page | `0.50` (₹0.50) |
| `PRINT_DPI` | Image quality | `150`, `300`, or `600` |
| `PRINT_WORKERS` | Parallel threads | `16` (more = faster) |
| `JOB_RETENTION_HOURS` | Auto-delete time | `24` (24 hours) |
| `NOTIFY_OWNER` | Send notifications | `true` or `false` |

---

## Running as a Service (Always On)

### Option 1: Using PM2 (Recommended)

Install PM2:
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

Start services:
```cmd
# Print Server
cd C:\working_photocopy_automation
pm2 start print_server.py --name print-server --interpreter python

# WhatsApp Bot
cd C:\working_photocopy_automation\mvp
pm2 start dist/index.js --name whatsapp-bot

# Save and enable auto-start
pm2 save
```

Check status:
```cmd
pm2 status
pm2 logs
```

### Option 2: Windows Task Scheduler

Create two scheduled tasks to run on startup:
1. `python C:\working_photocopy_automation\print_server.py`
2. `node C:\working_photocopy_automation\mvp\dist\index.js`

---

## Troubleshooting

### QR Code Not Showing
- Check internet connection
- Restart bot: `Ctrl+C`, then `npm run dev`
- Delete `mvp/auth/` folder and scan again

### Printer Not Found Error
- Verify printer name in `config.ts` matches exactly
- Check printer is online in Control Panel → Printers
- Rebuild: `npm run build`

### Python Server Won't Start
- Check port 5000 not in use
- Install dependencies: `pip install -r server_requirements.txt`
- Verify Python in PATH: `python --version`

### Ghostscript Error
- Install from: https://ghostscript.com/releases/gsdnld.html
- Add to PATH: `C:\Program Files\gs\gs10.06.0\bin`
- Restart terminal

### WhatsApp Connection Lost
- Bot auto-reconnects in 5 seconds
- If stuck, restart: `Ctrl+C`, `npm run dev`

---

## File Structure

```
C:\working_photocopy_automation\
├── print_server.py          ← Python print server
├── pdf_printer.py           ← Core printing logic
├── server_requirements.txt  ← Python dependencies
├── INSTALL.md              ← This file
├── PRINT_SERVER_SETUP.md   ← Technical details
│
└── mvp\                     ← WhatsApp bot
    ├── src\
    │   ├── config.ts        ← ⭐ EDIT THIS FILE
    │   ├── bot.ts
    │   ├── workflow.ts
    │   └── ...
    ├── package.json
    ├── README.md
    └── dist\                ← Compiled code
```

---

## Updating Configuration

1. Edit: `mvp\src\config.ts`
2. Rebuild: `npm run build` (in mvp folder)
3. Restart both servers

---

## Support

For issues:
- Check logs in both terminals
- Verify all steps completed
- Check printer is online
- Ensure WhatsApp connected

---

**You're all set! The bot will now automatically:**
- ✅ Download PDFs from WhatsApp
- ✅ Count pages and calculate cost
- ✅ Allow file selection (SKIP feature)
- ✅ Print with 16 threads at high speed
- ✅ Notify owner
- ✅ Auto-delete files after 24 hours
