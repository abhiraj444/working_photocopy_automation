# Print Server + WhatsApp Bot Integration

## Architecture

```
WhatsApp → TypeScript Bot → HTTP Request → Python Print Server → pdf_printer.py → Windows Printer
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd d:\FreshWhatsappAutomation
pip install -r server_requirements.txt
```

This installs:
- pdf2image (PDF → Image conversion)
- pillow (Image processing)
- pywin32 (Windows GDI printing)
- flask (HTTP server)
- flask-cors (Allow requests from TypeScript)

### 2. Start Python Print Server

```bash
python print_server.py
```

Server will start on `http://127.0.0.1:5000`

You should see:
```
PDF Print Server Starting
Host: 127.0.0.1
Port: 5000

Endpoints:
  GET  http://127.0.0.1:5000/health
  POST http://127.0.0.1:5000/print
```

**Keep this running!**

### 3. Start WhatsApp Bot

In a new terminal:
```bash
cd d:\FreshWhatsappAutomation\mvp
npm run dev
```

## How It Works

1. **Customer sends PDF** via WhatsApp
2. **TypeScript bot** downloads file to `processed/` folder
3. **Bot sends HTTP request** to Python server:
   ```json
   POST http://127.0.0.1:5000/print
   {
     "file_path": "D:/FreshWhatsappAutomation/mvp/processed/919.../file.pdf",
     "dpi": 150,
     "threads": 16,
     "printer": "best"
   }
   ```
4. **Python server** uses your proven `pdf_printer.py` with those settings
5. **Multi-threaded printing** (16 workers, 150 DPI)
6. **TypeScript bot** gets success response and notifies customer

## Configuration

Settings from `src/config.ts`:
- **Printer**: "best"
- **DPI**: 150
- **Threads**: 16

The bot automatically passes these to the Python server.

## Testing

1. Start print server: `python print_server.py`
2. Start WhatsApp bot: `npm run dev`
3. Send PDF via WhatsApp
4. Confirm with YES
5. Watch both terminals for logs

## API Endpoints

### POST /print
Synchronous printing (waits until complete)

**Request:**
```json
{
  "file_path": "C:/path/to/file.pdf",
  "dpi": 150,
  "threads": 16,
  "printer": "best"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PDF printed successfully",
  "file": "C:/path/to/file.pdf"
}
```

### GET /health
Check if server is running

**Response:**
```json
{
  "status": "ok",
  "message": "Print server is running"
}
```

## Advantages of This Approach

✅ Uses your **proven Python printer** (pdf2image + pywin32)  
✅ **No code duplication** - one script handles everything  
✅ **Easy to update** - modify `pdf_printer.py` without touching TypeScript  
✅ **Independent services** - can restart either server separately  
✅ **Multi-threaded** - full 16-thread support from your Python script  
✅ **Reliable** - HTTP is simple and battle-tested

## Troubleshooting

**Print server not responding:**
- Check if `python print_server.py` is running
- Verify port 5000 is not in use

**Print jobs failing:**
- Check Python server terminal for error logs
- Verify Ghostscript is installed
- Check printer "best" exists in Windows

**Bot can't connect:**
- Ensure print server started before bot
- Check firewall isn't blocking port 5000
