# Quick Start Guide

Get the WhatsApp Print Bot running in 5 minutes!

## Step 1: Install Node.js

**Download:** https://nodejs.org/ (v18 or higher)

**Verify installation:**
```bash
node --version
# Should show: v18.x.x or higher
```

## Step 2: Install Dependencies

```bash
cd d:\FreshWhatsappAutomation\mvp
npm install
```

**This installs:**
- WhatsApp library (Baileys)
- PDF processing tools
- Logging utilities
- TypeScript compiler

## Step 3: Configure Printer

**Find printer name:**
1. Press `Win + R`
2. Type: `control printers`
3. Copy exact printer name (e.g., `PSY_PSY_237_BW_CANON(2)`)

**Update config:**
Edit `src/config.ts`:
```typescript
PRINTER_NAME: 'YOUR_PRINTER_NAME_HERE',
OWNER_PHONE: '91YOUR_NUMBER',  // No + sign
```

## Step 4: Build and Run

```bash
# Compile TypeScript
npm run build

# Start bot
npm run dev
```

## Step 5: Authenticate WhatsApp

1. **QR code** will appear in terminal
2. **Scan** with your phone:
   - Open WhatsApp
   - Settings → Linked Devices
   - Link a Device
   - Scan QR code
3. **Done!** Session saved in `auth/` folder

## Step 6: Test

**From another phone:**
1. Send a PDF to the bot's WhatsApp number
2. Wait 60 seconds (or send any text)
3. Receive file list
4. Reply `YES`
5. Check printer!

## Common Issues

### "Cannot find module"
```bash
npm install
```

### "Printer not found"
- Check printer name in Control Panel
- Update `PRINTER_NAME` in `src/config.ts`
- Rebuild: `npm run build`

### QR code not showing
- Check internet connection
- Restart: `Ctrl+C`, then `npm run dev`

## Next Steps

- Read full [README.md](./README.md) for details
- Adjust pricing in `src/config.ts`
- Test with multiple PDFs
- Try SKIP feature

---

**You're all set!** 🎉

The bot is now running. Keep the terminal open while using the bot.
