# WhatsApp Print Bot - GUI Control Panel

## Overview

Simple graphical interface to start and stop the WhatsApp Print Bot with one click!

## Features

✅ **One-Click Start** - Start both servers with a single button  
✅ **One-Click Stop** - Stop everything at once  
✅ **Live Logs** - See real-time logs from both servers  
✅ **Status Indicator** - Visual status (Stopped/Starting/Running/Error)  
✅ **Background Mode** - Servers run in background (no terminal windows)  
✅ **Clean Exit** - Automatically stops servers when closing

## Usage

### Option 1: Double-Click (Simplest)

1. **Double-click** `START_GUI.bat`
2. GUI window opens
3. Click **"▶️ START SERVERS"**
4. Wait for both servers to start (green status)
5. Scan QR code in logs
6. Bot is running!
7. Click **"⏹️ STOP SERVERS"** when done

### Option 2: Command Line

```bash
cd D:\FreshWhatsappAutomation
python control_panel.py
```

## GUI Layout

```
┌─────────────────────────────────────────┐
│  📱 WhatsApp Print Bot Control Panel    │
├─────────────────────────────────────────┤
│                                         │
│     ⚪ Status: Stopped                  │
│                                         │
│  [▶️ START]  [⏹️ STOP]  [🗑️ Clear]    │
│                                         │
├─────────────────────────────────────────┤
│  📋 Logs:                               │
│  ┌─────────────────────────────────┐   │
│  │ [HH:MM:SS] Starting servers...  │   │
│  │ [HH:MM:SS] Print Server: OK     │   │
│  │ [HH:MM:SS] WhatsApp Bot: OK     │   │
│  │ [HH:MM:SS] Scan QR code...      │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  💡 Keep this window open               │
└─────────────────────────────────────────┘
```

## Status Indicators

- **⚪ Stopped** - Nothing running
- **🟡 Starting...** - Servers launching
- **🟢 Running** - All systems operational
- **🔴 Error** - Something went wrong

## What Happens When You Click START?

1. ✅ Checks configuration
2. 📡 Starts Python Print Server (port 5000)
3. ⏱️ Waits 2 seconds for server to initialize
4. 📱 Starts WhatsApp Bot
5. ⏱️ Waits 3 seconds for bot to connect
6. 🟢 Shows "Running" status
7. 📋 Displays live logs from both services

## What Happens When You Click STOP?

1. 🛑 Gracefully terminates Print Server
2. 🛑 Gracefully terminates WhatsApp Bot
3. ⏱️ Waits up to 5 seconds for clean shutdown
4. 💪 Force kills if needed
5. ⚪ Shows "Stopped" status

## Logs

The GUI shows color-coded logs:
- `[Print Server]` - Python print server messages
- `[WhatsApp Bot]` - TypeScript bot messages
- Timestamps for every event
- Auto-scrolls to latest

Click **"🗑️ Clear Logs"** to clean up the view.

## First-Time Setup

Before using the GUI:

1. **Install dependencies:**
   ```bash
   pip install -r server_requirements.txt
   cd mvp
   npm install
   npm run build
   ```

2. **Configure** `mvp\src\config.ts`:
   - Set printer names (PRINTER_NORMAL, PRINTER_2ON1, PRINTER_4ON1)
   - Set owner phone number
   - Adjust other settings

3. **Build** the TypeScript code:
   ```bash
   cd mvp
   npm run build
   ```

4. **Launch GUI** and click START!

## Troubleshooting

### "Print Server failed to start"

- Check Python is installed: `python --version`
- Install dependencies: `pip install -r server_requirements.txt`
- Check port 5000 is not in use

### "WhatsApp Bot failed to start"

- Check Node.js installed: `node --version`
- Install packages: `cd mvp && npm install`
- Build TypeScript: `npm run build`
- Check `mvp/dist/` folder exists

### GUI won't open

- Check Python/tkinter installed:
  ```bash
  python -c "import tkinter; print('OK')"
  ```
- If error, reinstall Python with tkinter support

### QR code not showing

- Check logs in GUI window
- Look for WhatsApp Bot messages
- May take 10-15 seconds to appear

## Production Use

For 24/7 operation:

1. **Start GUI** on Windows startup:
   - Press `Win+R`
   - Type: `shell:startup`
   - Copy `START_GUI.bat` to open folder

2. **Or use PM2** (advanced):
   ```bash
   npm install -g pm2
   pm2 start print_server.py --interpreter python
   cd mvp && pm2 start dist/index.js
   pm2 save
   ```

## Tips

💡 **Keep window open** - Closing GUI stops servers  
💡 **Check logs** - Most issues visible in log area  
💡 **One instance** - Don't run multiple GUIs  
💡 **Scan once** - QR code appears on first start  
💡 **Restart** - Stop/Start if connection lost

## Advanced

### Minimize to System Tray (Optional)

The GUI runs in a window. To minimize to tray, you can:
1. Minimize the window (servers keep running)
2. Or modify `control_panel.py` to add tray icon (requires `pystray` library)

### Background Service (Optional)

For truly background operation without GUI:
- Use PM2 (Node.js process manager)
- Or Windows Task Scheduler
- See `INSTALL.md` for details

---

**Enjoy your one-click WhatsApp Print Bot! 🎉**
