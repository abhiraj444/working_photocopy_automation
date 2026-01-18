# N-up Layout Selection Feature

## Feature Overview

Users can now choose how to print their PDFs:
- **Normal (1-up)**: 1 page per sheet - Full price
- **2-on-1**: 2 pages per sheet - Half price (50% discount)
- **4-on-1**: 4 pages per sheet - Quarter price (75% discount)

## How It Works

### User Flow

1. User sends PDF via WhatsApp
2. Bot counts pages and shows file list
3. User replies `YES`
4. Bot asks: "Choose Print Layout: 1️⃣ Normal / 2️⃣ 2-on-1 / 4️⃣ 4-on-1"
5. Bot shows price for each option
6. User replies: `1`, `2`, or `4`
7. Bot uses correct printer configuration and prints

### Pricing

Base price: ₹0.50/page

- **Normal (1)**: 100 pages = ₹50.00
- **2-on-1 (2)**: 100 pages = ₹25.00 (50% off)
- **4-on-1 (4)**: 100 pages = ₹12.50 (75% off)

## Configuration

### Step 1: Create 3 Printer Configurations

You need to create **3 copies** of your printer in Windows with different N-up settings:

1. **Open:** Control Panel → Devices and Printers
2. **Right-click** your printer → "Printer properties"
3. **Add** the printer 3 times with different names:
   - `best` (Normal - 1 page per sheet)
   - `best_2on1` (2 pages per sheet)
   - `best_4on1` (4 pages per sheet)

4. **Configure each printer:**
   - Right-click → "Printing Preferences"
   - Find "Pages per sheet" or "N-up" setting
   - Set to 1, 2, or 4 respectively

### Step 2: Update config.ts

Edit `mvp\src\config.ts`:

```typescript
export const CONFIG = {
    // Printer Names for Different Layouts
    PRINTER_NORMAL: 'best',        // 1 page per sheet
    PRINTER_2ON1: 'best_2on1',     // 2 pages per sheet
    PRINTER_4ON1: 'best_4on1',     // 4 pages per sheet
    
    // Enable/disable layout selection
    ENABLE_LAYOUT_SELECTION: true,  // Set to false to disable
    
    // Other settings...
};
```

### Step 3: Rebuild

```bash
cd mvp
npm run build
```

### Step 4: Restart Services

```bash
# Terminal 1
python print_server.py

# Terminal 2
cd mvp
npm run dev
```

## Example Conversation

```
User: [Sends invoice.pdf - 20 pages]

Bot: 📄 Your Files

1. invoice.pdf
   Pages: 20

━━━━━━━━━━━━━━━━━
Total Pages: 20
Total Cost: ₹10.00
━━━━━━━━━━━━━━━━━

Reply:
• YES - Choose layout
• SKIP - Remove files

User: YES

Bot: 📄 Choose Print Layout

Total Pages: 20

━━━━━━━━━━━━━━━━━

1️⃣ Normal (1 page per sheet)
   Cost: ₹10.00

2️⃣ 2-on-1 (2 pages per sheet)
   Cost: ₹5.00

4️⃣ 4-on-1 (4 pages per sheet)
   Cost: ₹2.50

━━━━━━━━━━━━━━━━━

Reply: 1, 2, or 4

User: 2

Bot: ⚙️ Processing your files...

Bot: 🖨️ Sending to printer...

[Prints using best_2on1 printer with 2 pages per sheet]

Bot: ✅ Printing complete!
```

## Technical Details

### Workflow States

New state added:
- `AWAITING_LAYOUT` - Waiting for user to choose 1/2/4

### Printer Selection Logic

```typescript
let printerName = CONFIG.PRINTER_NORMAL;  // Default
if (layout === '2') {
    printerName = CONFIG.PRINTER_2ON1;
} else if (layout === '4') {
    printerName = CONFIG.PRINTER_4ON1;
}
```

### Price Calculation

```typescript
let priceMultiplier = 1;  // Normal
if (layout === '2') priceMultiplier = 0.5;   // Half price
if (layout === '4') priceMultiplier = 0.25;  // Quarter price

totalCost = totalPages * PRICE_PER_PAGE * priceMultiplier;
```

## Disable Feature

To disable layout selection and always use normal printing:

```typescript
// In config.ts
ENABLE_LAYOUT_SELECTION: false,
```

User will skip layout selection and go straight to printing.

## Troubleshooting

### "Printer not found" Error

- Verify all 3 printer names exist in Windows
- Check exact names match in `config.ts`
- Restart print server after config changes

### Wrong Layout Printing

- Check printer preferences are set correctly
- Right-click printer → Printing Preferences → Pages per sheet
- Test print from Windows to verify settings

### Price Not Calculating Correctly

- Check `PRICE_PER_PAGE` in `config.ts`
- Layout multiplier: 1=100%, 2=50%, 4=25%
- Owner notification shows correct price

## Benefits

✅ **Customer savings** - 50-75% off for 2-on-1/4-on-1  
✅ **Paper savings** - Use less paper  
✅ **Environmental** - Eco-friendly option  
✅ **Flexible** - Customer chooses what works for them  
✅ **Simple** - Uses Windows printer driver capabilities  
✅ **No PDF manipulation** - Just switch printer name

---

**Your printer driver does all the work!** 🎉
