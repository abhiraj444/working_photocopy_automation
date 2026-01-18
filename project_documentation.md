# WhatsApp Automated Print Shop - Complete Project Documentation

> **Purpose**: This document contains ALL information needed to understand and rebuild this project from scratch. Give this to any developer or product manager and they can recreate the entire system.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Business Problem & Solution](#business-problem--solution)
3. [System Architecture](#system-architecture)
4. [Technical Stack](#technical-stack)
5. [Core Features](#core-features)
6. [Project Structure](#project-structure)
7. [Component Deep Dive](#component-deep-dive)
8. [Data Flow](#data-flow)
9. [State Machine](#state-machine)
10. [Setup & Installation](#setup--installation)
11. [Configuration](#configuration)
12. [Deployment](#deployment)
13. [Testing Strategy](#testing-strategy)
14. [Future Roadmap](#future-roadmap)
15. [Rebuild Guide](#rebuild-guide)

---

## Project Overview

**Name**: WhatsApp Print Bot MVP  
**Type**: Automated print shop service via WhatsApp  
**Platform**: Windows (printer integration required)  
**Language**: TypeScript/Node.js  
**Primary Use Case**: Allow customers to send PDFs via WhatsApp, select/skip files, and print automatically

### Vision Statement

Build a fully automated print business platform where customers send PDFs on WhatsApp and receive printed pages without any manual handling from the shop owner. The system becomes the brain, the printer becomes a fast output device.

### Current Status

**MVP Phase** - Core functionality implemented:
- ✅ PDF download from WhatsApp
- ✅ Selective file printing (SKIP feature)
- ✅ Automatic page counting
- ✅ Automatic pricing (₹0.50/page)
- ✅ Windows printer integration
- ✅ 24-hour file retention with auto-cleanup
- ✅ Owner notifications
- ✅ Multi-user concurrent support

**Not Yet Implemented** (Planned):
- ❌ Payment verification (UPI integration)
- ❌ N-up layouts (2-on-1, 4-on-1)
- ❌ Automatic mailbox printing
- ❌ Admin dashboard
- ❌ Print queue management
- ❌ SNMP printer monitoring

---

## Business Problem & Solution

### The Problem

Traditional print shops face:
1. **Manual file handling** - Download PDFs manually from WhatsApp
2. **Manual counting** - Count pages manually for pricing
3. **Payment confusion** - Track which customer paid what amount
4. **Mailbox management** - Manual printer configuration for each job
5. **Queue chaos** - No prioritization for small vs large jobs
6. **Time waste** - Owner spending time on repetitive tasks

### The Solution

**WhatsApp Automated Print Shop** eliminates all manual steps:

```
Customer Flow:
1. Send PDF(s) to bot's WhatsApp number
2. Bot auto-downloads and saves files
3. Bot shows file list with page counts & price
4. Customer confirms (YES) or removes files (SKIP)
5. Bot sends to printer
6. Customer collects & pays

Owner Experience:
- Gets notifications when files arrive
- Gets notifications when jobs complete
- Zero manual intervention
- Files auto-delete after 24 hours
```

### Key Benefits

**For Owner**:
- Save 2-3 hours daily on file handling
- No manual page counting errors
- Digital record of all jobs (phone numbers as IDs)
- Scalable to multiple users simultaneously

**For Customers**:
- Simple WhatsApp interface (no apps to install)
- Clear pricing upfront
- Ability to skip unwanted files
- Fast turnaround

---

## System Architecture

### High-Level Architecture

```
┌─────────────┐
│  Customer   │
│  WhatsApp   │
└──────┬──────┘
       │ PDF files + text commands
       ▼
┌─────────────────────────────────┐
│   WhatsApp Bot (Baileys)        │
│   - Message handling            │
│   - File download               │
│   - QR authentication           │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   Core Application (Node.js)    │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Job Manager              │  │
│  │  (In-memory state)        │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Workflow Engine          │  │
│  │  (State machine)          │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  PDF Processor            │  │
│  │  (Page counting)          │  │
│  └───────────────────────────┘  │
│                                  │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Windows Printer (PowerShell)   │
│  Canon iR 7105 or similar       │
└─────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **WhatsApp Layer** | Message I/O, file download, authentication | Baileys (WhatsApp library) |
| **Job Manager** | User session management, expiration tracking | In-memory Map |
| **Workflow Engine** | User interaction, state transitions | State machine pattern |
| **PDF Processor** | Page counting, file operations | pdf-parse library |
| **Printer Module** | Send files to Windows printer | PowerShell commands |
| **Logger** | Structured logging | Pino |

---

## Technical Stack

### Core Dependencies

```json
{
  "runtime": "Node.js v18+",
  "language": "TypeScript 5.7.3",
  "buildTool": "tsc (TypeScript compiler)",
  "platform": "Windows (for printer integration)"
}
```

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@whiskeysockets/baileys` | ^7.0.0-rc.9 | WhatsApp Web API (unofficial) |
| `pdf-parse` | ^1.1.1 | Extract page count from PDFs |
| `pino` | ^8.21.0 | Structured logging |
| `pino-pretty` | ^13.1.3 | Readable log formatting |
| `qrcode-terminal` | ^0.12.0 | Display QR code in terminal |
| `@hapi/boom` | ^10.0.1 | Error handling utilities |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking and compilation |
| `ts-node` | Run TypeScript directly in dev mode |
| `@types/*` | Type definitions for libraries |

### System Requirements

- **OS**: Windows (required for PowerShell printer integration)
- **Node.js**: v18 or higher
- **RAM**: ~250-300 MB (with Chrome in background)
- **Disk**: ~500 MB for dependencies + user files
- **Printer**: Network or USB printer accessible via Windows

---

## Core Features

### 1. **WhatsApp Integration**

**Technology**: Baileys (unofficial WhatsApp Web library)

**Capabilities**:
- QR code authentication
- Send/receive messages
- Download document attachments
- Multi-device support
- Auto-reconnection on disconnect

**Authentication Flow**:
1. Bot starts → generates QR code
2. User scans QR with phone
3. Session saved to `auth/` folder
4. Sessions persist across restarts

### 2. **File Download & Management**

**File Acquisition**:
- Detect PDF documents automatically
- Download to `downloads/{phoneNumber}/` folder
- Reject non-PDF files with error message
- Support multiple files per user

**Timing Detection**:
- Use 60-second timer after last file
- Timer resets if user sends more files
- After 60s, send acknowledgment to customer

**File Organization**:
```
downloads/
├── 919876543210/
│   ├── invoice.pdf
│   └── report.pdf
└── 918123456789/
    └── contract.pdf
```

### 3. **Selective Printing (SKIP Feature)**

**User Workflow**:
1. User sends multiple PDFs
2. Bot shows numbered list
3. User can:
   - Say `YES` → Print all
   - Say `SKIP` → Choose files to remove
4. If SKIP:
   - User replies with numbers: `1,3` or `2`
   - Bot removes those files
   - Shows updated list
   - User confirms with `YES`

**Implementation**:
- Track excluded files in `job.filesExcluded` array
- Filter files before printing
- Recalculate pages & price after removal

### 4. **Automatic Page Counting**

**Technology**: `pdf-parse` library

**Process**:
1. Read PDF file buffer
2. Parse PDF structure
3. Extract `numpages` property
4. Store in `file.pageCount`

**Error Handling**:
- If PDF is corrupted → set pageCount = 0
- Log error but continue with other files

### 5. **Pricing Engine**

**Formula**: `Total Cost = Total Pages × Price Per Page`

**Configuration**:
```typescript
PRICE_PER_PAGE: 0.50  // ₹0.50 per page
```

**Display**:
- Show cost in file list
- Update after SKIP operation
- Display in final confirmation

### 6. **Printer Integration**

**Technology**: PowerShell `Start-Process -Verb Print`

**How It Works**:
1. Files renamed with phone prefix: `{phone}_{filename}.pdf`
2. Copied to `processed/{phone}/` folder
3. PowerShell command invokes default PDF handler
4. 2-second delay between files to avoid spooler overload

**Command**:
```powershell
Start-Process -FilePath "C:\path\to\919876543210_invoice.pdf" -Verb Print
```

**Why PowerShell**:
- Uses Windows default PDF application
- Respects printer settings
- More reliable than raw print commands
- Works with modern printers

### 7. **Job State Management**

**Storage**: In-memory `Map<phoneNumber, UserJob>`

**Job States**:
- `PENDING` - Files uploaded, waiting for user message
- `AWAITING_CONFIRMATION` - Showing file list, waiting for YES/SKIP
- `AWAITING_REMOVAL` - User said SKIP, waiting for file numbers
- `AWAITING_FINAL_CONFIRMATION` - After removal, waiting for YES
- `PROCESSING` - Processing files
- `PRINTING` - Sending to printer
- `COMPLETED` - Job done
- `CANCELLED` - User cancelled or timeout

**Job Properties**:
```typescript
interface UserJob {
    phoneNumber: string;
    state: JobState;
    files: JobFile[];
    filesExcluded: string[];  // Files to skip
    createdAt: Date;
    lastActivityAt: Date;
    expiresAt: Date;  // createdAt + 24 hours
}
```

### 8. **24-Hour Auto Cleanup**

**Purpose**: Prevent disk space bloat

**Mechanism**:
- Every hour, check all jobs for expiration
- If `now > job.expiresAt`:
  - Delete `downloads/{phone}/` folder
  - Delete `processed/{phone}/` folder
  - Remove job from memory

**Configuration**:
```typescript
JOB_RETENTION_HOURS: 24  // Configurable
```

**Cleanup Interval**: 60 minutes (configurable in code)

### 9. **Owner Notifications**

**Two Notification Types**:

**A. File Download Notification**:
- Sent after 60-second timer expires
- Includes: customer phone, file count, file list
- Helps owner know when files arrive

**B. Print Completion Notification**:
- Sent when job sent to printer
- Includes: customer phone, file list with pages, total cost
- Helps owner know mailbox ID and amount

**Configuration**:
```typescript
OWNER_PHONE: '917840957524',  // Owner's WhatsApp number
NOTIFY_OWNER: true,           // Enable/disable
```

---

## Project Structure

```
WhatsappAutomationForPrinting/
│
├── mvp/                           # Main application
│   │
│   ├── src/                       # TypeScript source code
│   │   ├── index.ts              # Entry point
│   │   ├── config.ts             # Configuration constants
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── logger.ts             # Pino logger setup
│   │   ├── bot.ts                # WhatsApp connection & events
│   │   ├── workflow.ts           # User interaction logic
│   │   ├── job-manager.ts        # Job state management
│   │   ├── pdf-processor.ts      # PDF operations
│   │   ├── printer.ts            # Printer integration
│   │   └── messages.ts           # Message templates
│   │
│   ├── dist/                      # Compiled JavaScript (generated)
│   ├── downloads/                 # User PDFs (runtime)
│   ├── processed/                 # Renamed PDFs (runtime)
│   ├── auth/                      # WhatsApp session (runtime)
│   │
│   ├── test-print.ts             # Test printer connection
│   ├── simple-test.ts            # Test WhatsApp basic echo
│   ├── test-send.ts              # Test message sending
│   │
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript config
│   ├── docker-compose.yml        # Evolution API setup (optional)
│   │
│   ├── README.md                 # Project overview
│   ├── QUICKSTART.md             # Fast setup guide
│   ├── DEPLOYMENT.md             # Production deployment
│   ├── BUILD_VS_DEV.md           # Build vs dev mode
│   ├── FILE_CLEANUP.md           # Cleanup feature docs
│   ├── OWNER_NOTIFICATIONS.md    # Notification feature docs
│   ├── MIGRATION_TO_WHATSAPP_WEB_JS.md  # Alternative library
│   └── EVOLUTION_API_SETUP.md    # Alternative API approach
│
└── whats_app_automated_print_shop_system_blueprint.md  # Future vision
```

---

## Component Deep Dive

### 1. `index.ts` - Entry Point

**Responsibilities**:
- Start the bot
- Handle fatal errors
- Log configuration

**Code Flow**:
```typescript
main() {
    logger.info('Starting bot...');
    await startBot();  // From bot.ts
}
```

**Size**: 18 lines (minimal entry point)

---

### 2. `config.ts` - Configuration

**All Configurable Values**:

```typescript
export const CONFIG = {
    // File paths
    DOWNLOAD_PATH: 'D:/WhatsappAutomationForPrinting/mvp/downloads',
    PROCESSED_PATH: 'D:/WhatsappAutomationForPrinting/mvp/processed',
    AUTH_PATH: 'D:/WhatsappAutomationForPrinting/mvp/auth',
    
    // Timing
    JOB_RETENTION_HOURS: 24,  // How long to keep files
    
    // Pricing
    PRICE_PER_PAGE: 0.50,  // ₹0.50 per page
    
    // Printer
    PRINTER_NAME: 'PSY_PSY_237_BW_CANON(2)',  // Exact Windows printer name
    
    // Owner notifications
    OWNER_PHONE: '917840957524',  // WhatsApp number (no +)
    NOTIFY_OWNER: true,           // true/false
};
```

**Important Notes**:
- All paths are absolute (Windows format)
- Printer name must match Windows exactly
- Owner phone format: `917840957524` (no `+` sign)

---

### 3. `types.ts` - TypeScript Interfaces

**Core Types**:

```typescript
// Individual file
interface JobFile {
    fileName: string;
    filePath: string;
    pageCount?: number;  // Undefined until counted
}

// Job states (8 total)
type JobState = 
    | 'PENDING'
    | 'AWAITING_CONFIRMATION'
    | 'AWAITING_REMOVAL'
    | 'AWAITING_FINAL_CONFIRMATION'
    | 'PROCESSING'
    | 'PRINTING'
    | 'COMPLETED'
    | 'CANCELLED';

// User job
interface UserJob {
    phoneNumber: string;
    state: JobState;
    files: JobFile[];
    filesExcluded: string[];
    createdAt: Date;
    lastActivityAt: Date;
    expiresAt: Date;
}
```

---

### 4. `logger.ts` - Logging

**Technology**: Pino (high-performance JSON logger)

**Configuration**:
```typescript
export const logger = pino({
    level: 'info',  // info, debug, error, warn
    transport: {
        target: 'pino-pretty',  // Human-readable format
        options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname'  // Don't show these fields
        }
    }
});
```

**Usage Throughout Code**:
```typescript
logger.info({ phoneNumber, fileName }, 'Downloaded PDF');
logger.error({ error }, 'Failed to print');
```

---

### 5. `bot.ts` - WhatsApp Connection (226 lines)

**Key Responsibilities**:
1. Initialize WhatsApp socket connection
2. Handle QR code display
3. Listen for incoming messages
4. Download PDF documents
5. Trigger user workflow
6. Send messages to users

**Important Functions**:

#### `startBot()`
- Creates WhatsApp socket using Baileys
- Loads authentication state
- Sets up event listeners
- Returns socket instance

#### `handleIncomingMessage(msg)`
- Routes messages based on type
- Extracts phone number
- Calls appropriate handler

#### `handleDocumentMessage(msg, phoneNumber)`
- Validates PDF file
- Downloads using `downloadMediaMessage()`
- Saves to user folder
- Adds to job
- Sets 60-second notification timer

**Timer Logic**:
```typescript
const notificationTimers = new Map<string, NodeJS.Timeout>();

// When PDF received:
clearTimeout(existingTimer);  // Reset if multiple files
const timer = setTimeout(() => {
    sendFileReceivedNotification();  // After 60s
}, 60000);
```

#### `handleTextMessage(phoneNumber, text, msg)`
- Cancels notification timer
- Calls workflow handler
- Passes send message callback

#### `sendMessageToUser(jid, text)`
- Wrapper for `sock.sendMessage()`
- Handles errors gracefully
- Logs all sent messages

**Event Handlers**:
- `connection.update` - QR display, reconnection
- `creds.update` - Save authentication
- `messages.upsert` - New messages

---

### 6. `workflow.ts` - State Machine (175 lines)

**Key Responsibilities**:
- Process user text commands
- Transition between states
- Handle YES/SKIP/numbers
- Coordinate PDF processing
- Trigger printing

**Main Handler**:

```typescript
async function handleUserMessage(
    phoneNumber: string,
    messageText: string,
    sendMessage: (text: string) => Promise<void>,
    ownerNotify?: (text: string) => Promise<void>
)
```

**State Transition Logic**:

```typescript
switch (job.state) {
    case 'PENDING':
        // Show file list
        break;
    
    case 'AWAITING_CONFIRMATION':
        if (text === 'YES') → handleConfirmPrint()
        if (text === 'SKIP') → handleSkipRequest()
        break;
    
    case 'AWAITING_REMOVAL':
        // Parse numbers like "1,3" or "2"
        → handleFileRemoval()
        break;
    
    case 'AWAITING_FINAL_CONFIRMATION':
        if (text === 'YES') → handleConfirmPrint()
        break;
}
```

**Helper Functions**:

#### `handlePendingJob()`
1. Count pages for all files
2. Calculate total cost
3. Update state to `AWAITING_CONFIRMATION`
4. Send file list

#### `handleConfirmPrint()`
1. Filter excluded files
2. Rename files with phone prefix
3. Send to printer
4. Notify customer & owner
5. Schedule job deletion (1 minute)

#### `handleSkipRequest()`
1. Update state to `AWAITING_REMOVAL`
2. Send prompt for file numbers

#### `handleFileRemoval()`
1. Parse numbers from text (regex: `/[,\s]+/`)
2. Validate numbers
3. Mark files as excluded
4. Show updated list
5. Request final confirmation

---

### 7. `job-manager.ts` - Job State (121 lines)

**Storage**:
```typescript
export const activeJobs = new Map<string, UserJob>();
```

**Key Functions**:

#### `createJob(phoneNumber)`
```typescript
const expiresAt = new Date(now + 24 hours);
const job = { phoneNumber, state: 'PENDING', files: [], ... };
activeJobs.set(phoneNumber, job);
```

#### `getJob(phoneNumber)` / `getOrCreateJob(phoneNumber)`
- Retrieve existing job
- Create if doesn't exist

#### `updateJobState(phoneNumber, newState)`
- Change state
- Update `lastActivityAt`

#### `addFileToJob(phoneNumber, file)`
- Add file to job's file array
- Reset job if was completed/cancelled

#### `deleteJob(phoneNumber)`
- Remove from Map

#### `cleanupExpiredJobs()` ⭐
**Automatic Cleanup**:
```typescript
for (const [phone, job] of activeJobs) {
    if (now > job.expiresAt) {
        // Delete downloads/{phone}/
        await fs.rm(path.join(DOWNLOAD_PATH, phone), { recursive: true });
        
        // Delete processed/{phone}/
        await fs.rm(path.join(PROCESSED_PATH, phone), { recursive: true });
        
        // Remove from memory
        activeJobs.delete(phone);
    }
}
```

**Runs Every 60 Minutes**:
```typescript
setInterval(cleanupExpiredJobs, 60 * 60 * 1000);
```

---

### 8. `pdf-processor.ts` - PDF Operations (51 lines)

**Key Functions**:

#### `countPDFPages(filePath)`
```typescript
const buffer = await fs.readFile(filePath);
const data = await pdfParse(buffer);
return data.numpages;
```

#### `processJobFiles(files)`
- Loop through all files
- Count pages for each
- Store in `file.pageCount`

#### `getTotalPages(files)`
```typescript
return files.reduce((sum, file) => sum + (file.pageCount || 0), 0);
```

#### `renameFilesWithPhone(phoneNumber, files, outputDir)`
```typescript
// Copy to processed folder with new name
const newName = `${phoneNumber}_${file.fileName}`;
const newPath = path.join(outputDir, newName);
await fs.copyFile(file.filePath, newPath);
```

**Why Rename**:
- Mailbox identification (files start with phone number)
- Easy to find customer files in printer queue
- Prevents filename conflicts

---

### 9. `printer.ts` - Printer Integration (44 lines)

**Main Function**:

```typescript
export async function printToPrinter(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
        const psCommand = `Start-Process -FilePath "${filePath}" -Verb Print`;
        await execAsync(`powershell -Command "${psCommand}"`);
        
        // 2-second delay to avoid overwhelming spooler
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
```

**Why PowerShell**:
- `Start-Process -Verb Print` = Same as right-clicking file → Print
- Uses default PDF application (Adobe, Edge, etc.)
- Respects Windows printer settings
- More reliable than raw print commands

**Alternative Method** (also in file):
```typescript
// Method 1: Raw print command (for text files)
const command = `print /D:"${printerName}" "${filePath}"`;
```

**Current Choice**: PowerShell method (better for PDFs)

---

### 10. `messages.ts` - Message Templates (90 lines)

**All User-Facing Messages**:

#### `formatFileList(files, totalPages, totalCost)`
```
📄 You have 3 PDFs ready to print:
     1️⃣ invoice.pdf (5 pages)
     2️⃣ report.pdf (12 pages)
     3️⃣ contract.pdf (8 pages)
     
📊 Total: 25 pages
💰 Cost: ₹12.50

Reply:
• YES - Print all files
• SKIP - Remove some files first
```

#### `formatFilesRemoved(removed, remaining, totalPages, totalCost)`
```
✅ Removed:
  ❌ report.pdf

📄 Printing these files:
     1️⃣ invoice.pdf (5 pages)
     2️⃣ contract.pdf (8 pages)

📊 Total: 13 pages
💰 Cost: ₹6.50

Confirm? Reply YES
```

#### `formatCompleted(fileCount, totalPages, totalCost, phoneNumber)`
```
✅ Print job sent to mailbox!

📄 Files: 2
📊 Total Pages: 13
💰 Total Cost: ₹6.50

🖨️ Files in mailbox: 919876543210
📍 Collect from shop & pay ₹6.50

Thank you! 🙏
```

**Helper Function**:
```typescript
export function calculatePrice(totalPages: number): number {
    return totalPages * CONFIG.PRICE_PER_PAGE;
}
```

---

## Data Flow

### Scenario 1: New PDF Upload

```
1. Customer sends invoice.pdf on WhatsApp
   ↓
2. bot.ts receives 'documentMessage' event
   ↓
3. handleDocumentMessage():
   - Validates it's a PDF
   - Downloads to downloads/919876543210/invoice.pdf
   - Calls addFileToJob(phone, {fileName, filePath})
   ↓
4. job-manager.ts:
   - Gets or creates job for this phone
   - Adds file to job.files[]
   - Sets state = 'PENDING'
   ↓
5. bot.ts sets 60-second timer
   ↓
6. [60 seconds pass]
   ↓
7. sendFileReceivedNotification():
   - Sends "Files Received" message to customer
   - Sends notification to owner (if enabled)
```

### Scenario 2: User Confirms Print (YES)

```
1. Customer sends "YES"
   ↓
2. bot.ts receives 'conversation' event
   ↓
3. handleTextMessage() → workflow.ts
   ↓
4. handleUserMessage():
   - Checks job.state = 'AWAITING_CONFIRMATION'
   - Detects text === 'YES'
   - Calls handleConfirmPrint()
   ↓
5. handleConfirmPrint():
   a. Updates state = 'PROCESSING'
   b. Sends "Processing..." message
   c. Filters excluded files
   d. Calls processJobFiles() to count pages
   e. Calls renameFilesWithPhone()
      → Creates processed/919876543210/919876543210_invoice.pdf
   f. Updates state = 'PRINTING'
   g. Calls printToPrinter(renamedPaths)
      ↓
6. printer.ts:
   - Executes PowerShell for each file
   - 2-second delay between files
   ↓
7. workflow.ts:
   - Updates state = 'COMPLETED'
   - Sends completion message to customer
   - Sends notification to owner
   - Schedules deleteJob() in 60 seconds
```

### Scenario 3: User Skips Files

```
1. Customer sends "SKIP"
   ↓
2. workflow.ts handleUserMessage()::
   - State = 'AWAITING_CONFIRMATION'
   - Calls handleSkipRequest()
   ↓
3. handleSkipRequest():
   - Updates state = 'AWAITING_REMOVAL'
   - Sends "Which files to skip?"
   ↓
4. Customer sends "1,3"
   ↓
5. handleFileRemoval():
   - Parses "1,3" → [1, 3]
   - Marks files[0] and files[2] as excluded
   - Adds to job.filesExcluded[]
   - Recalculates pages & cost for remaining files
   - Updates state = 'AWAITING_FINAL_CONFIRMATION'
   - Sends updated file list
   ↓
6. Customer sends "YES"
   ↓
7. → handleConfirmPrint() (same as Scenario 2)
```

---

## State Machine

### State Diagram

```
                    ┌─────────────┐
                    │   PENDING   │ ← Files uploaded
                    └──────┬──────┘
                           │ User sends any text
                           ▼
            ┌──────────────────────────┐
            │ AWAITING_CONFIRMATION    │ ← Shows file list
            └────┬─────────────────┬───┘
                 │                 │
           YES   │                 │ SKIP
                 │                 ▼
                 │      ┌──────────────────┐
                 │      │ AWAITING_REMOVAL │ ← Waiting for numbers
                 │      └────────┬─────────┘
                 │               │ User sends "1,3"
                 │               ▼
                 │    ┌──────────────────────────────┐
                 │    │ AWAITING_FINAL_CONFIRMATION  │ ← After removal
                 │    └────────┬─────────────────────┘
                 │             │ YES
                 └─────────────┴─────────┐
                                         ▼
                              ┌──────────────┐
                              │  PROCESSING  │ ← Counting pages
                              └──────┬───────┘
                                     ▼
                              ┌──────────────┐
                              │   PRINTING   │ ← Sending to printer
                              └──────┬───────┘
                                     ▼
                              ┌──────────────┐
                              │  COMPLETED   │ ← Done
                              └──────────────┘
```

### State Transitions Table

| From State | User Input | Action | Next State |
|------------|-----------|--------|------------|
| PENDING | Any text | Show file list | AWAITING_CONFIRMATION |
| AWAITING_CONFIRMATION | "YES" | Start printing | PROCESSING |
| AWAITING_CONFIRMATION | "SKIP" | Ask for numbers | AWAITING_REMOVAL |
| AWAITING_CONFIRMATION | Other | Re-show file list | (same) |
| AWAITING_REMOVAL | "1,3" | Remove files | AWAITING_FINAL_CONFIRMATION |
| AWAITING_REMOVAL | Invalid | Error message | (same) |
| AWAITING_FINAL_CONFIRMATION | "YES" | Start printing | PROCESSING |
| PROCESSING | Any | "Job in progress" | (same) |
| PRINTING | Any | "Job in progress" | (same) |

---

## Setup & Installation

### Prerequisites

1. **Windows OS** (required for printer integration)
2. **Node.js v18+**
3. **Canon iR 7105 or compatible printer** (connected to PC)
4. **WhatsApp phone** (for QR scan)

### Step-by-Step Setup

#### 1. Clone/Copy Project

```bash
git clone <repository-url>
cd WhatsappAutomationForPrinting/mvp
```

#### 2. Install Dependencies

```bash
npm install
```

This installs:
- @whiskeysockets/baileys
- pdf-parse
- pino, pino-pretty
- qrcode-terminal
- TypeScript & dev tools

#### 3. Configure Settings

Edit `src/config.ts`:

```typescript
export const CONFIG = {
    // Update these paths for your system
    DOWNLOAD_PATH: 'C:/YourPath/mvp/downloads',
    PROCESSED_PATH: 'C:/YourPath/mvp/processed',
    AUTH_PATH: 'C:/YourPath/mvp/auth',
    
    // Verify your printer name (Settings → Printers)
    PRINTER_NAME: 'Canon iR 7105',
    
    // Your WhatsApp number (no + sign)
    OWNER_PHONE: '919876543210',
};
```

**Find Printer Name**:
```powershell
Get-Printer | Select-Object Name
```

#### 4. Build TypeScript

```bash
npm run build
```

Compiles `src/*.ts` → `dist/*.js`

#### 5. Run in Dev Mode

```bash
npm run dev
```

You'll see:
```
🚀 Starting WhatsApp Print Bot MVP...
🔗 Scan this QR code with WhatsApp:
[QR CODE]
```

#### 6. Link WhatsApp

1. Open WhatsApp on phone
2. Go to Settings → Linked Devices
3. Tap "Link a Device"
4. Scan QR code

Wait for:
```
✅ WhatsApp connected!
```

#### 7. Test

From another phone, send a test PDF to the bot's number.

---

## Configuration

### All Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `DOWNLOAD_PATH` | `D:/...mvp/downloads` | Where PDFs are saved |
| `PROCESSED_PATH` | `D:/...mvp/processed` | Where renamed PDFs go |
| `AUTH_PATH` | `D:/...mvp/auth` | WhatsApp session storage |
| `JOB_RETENTION_HOURS` | `24` | How long to keep files |
| `PRICE_PER_PAGE` | `0.50` | Cost per page (₹) |
| `PRINTER_NAME` | `PSY_PSY_237_BW_CANON(2)` | Exact Windows printer name |
| `OWNER_PHONE` | `917840957524` | Owner's WhatsApp (no +) |
| `NOTIFY_OWNER` | `true` | Enable/disable owner notifications |

### Changing Pricing

```typescript
PRICE_PER_PAGE: 1.00  // ₹1 per page
```

Rebuild:
```bash
npm run build
```

### Changing Retention Period

```typescript
JOB_RETENTION_HOURS: 48  // 48 hours instead of 24
```

### Disabling Owner Notifications

```typescript
NOTIFY_OWNER: false
```

---

## Deployment

### Option 1: Run in Terminal (Simple)

```bash
npm run dev
```

Keep terminal open. Bot runs as long as terminal is open.

### Option 2: PM2 (Recommended for Production)

**Install PM2**:
```bash
npm install -g pm2
```

**Start Bot**:
```bash
npm run build
pm2 start dist/index.js --name whatsapp-print-bot
```

**Useful Commands**:
```bash
pm2 list                    # See running processes
pm2 logs whatsapp-print-bot # View logs
pm2 stop whatsapp-print-bot # Stop
pm2 restart whatsapp-print-bot # Restart
pm2 startup                 # Auto-start on boot
pm2 save                    # Save current process list
```

### Option 3: Windows Task Scheduler (Auto-start on boot)

1. Open Task Scheduler
2. Create Basic Task
3. Name: "WhatsApp Print Bot"
4. Trigger: "When computer starts"
5. Action: "Start a program"
6. Program: `C:\Program Files\nodejs\node.exe`
7. Arguments: `C:\WhatsappPrintBot\mvp\dist\index.js`
8. Start in: `C:\WhatsappPrintBot\mvp`

### Migration to New Laptop

**What to Copy**:
- ✅ `src/` folder
- ✅ `package.json`, `tsconfig.json`
- ✅ All `.md` documentation

**What NOT to Copy**:
- ❌ `auth/` (must re-authenticate)
- ❌ `downloads/`, `processed/` (old files)
- ❌ `node_modules/` (reinstall with `npm install`)
- ❌ `dist/` (rebuild with `npm run build`)

**Steps**:
1. Copy source files to new laptop
2. `npm install`
3. Update paths in `config.ts`
4. Update `PRINTER_NAME` in `config.ts`
5. `npm run build`
6. `npm run dev`
7. Scan QR code
8. Test with sample PDF

---

## Testing Strategy

### Test Files Included

#### 1. `test-print.ts` - Printer Connection Test

**Purpose**: Verify printer is accessible

**How to Run**:
```bash
npx ts-node test-print.ts
```

**What it Does**:
- Creates test text file
- Sends to printer using `print` command
- Sends to printer using PowerShell
- Checks for errors

#### 2. `simple-test.ts` - WhatsApp Echo Test

**Purpose**: Verify WhatsApp connection works

**How to Run**:
```bash
npx ts-node simple-test.ts
```

**What it Does**:
- Connects to WhatsApp
- Shows QR code
- Echoes any message received
- Tests reply functionality

#### 3. `test-send.ts` - Message Sending Test

**Purpose**: Verify outbound message sending

**How to Run**:
```bash
npx ts-node test-send.ts
```

**What it Does**:
- Tests 3 different message sending methods
- Sends to `TEST_PHONE` number
- Verifies each method works

### Manual Testing Checklist

**Setup Tests**:
- [ ] QR code appears in terminal
- [ ] WhatsApp connects successfully
- [ ] Logs show "WhatsApp connected!"

**File Download Tests**:
- [ ] Send PDF → Bot downloads to `downloads/{phone}/`
- [ ] Send non-PDF → Bot rejects with error
- [ ] Send multiple PDFs → All download correctly
- [ ] Owner receives notification (if enabled)

**Workflow Tests**:
- [ ] Send message after PDF → File list appears
- [ ] File list shows correct page counts
- [ ] Price calculated correctly
- [ ] Reply "YES" → Starts printing
- [ ] Reply "SKIP" → Asks for numbers
- [ ] Reply "1,3" → Removes files 1 and 3
- [ ] Updated list shows remaining files
- [ ] Reply "YES" → Prints remaining files

**Printer Tests**:
- [ ] Files appear in printer mailbox
- [ ] File names have phone prefix
- [ ] Actual printing works

**Cleanup Tests**:
- [ ] Files older than 24h are deleted
- [ ] Job removed from memory
- [ ] Both `downloads/` and `processed/` folders deleted

---

## Future Roadmap

### Phase 2: Payment Integration

**Goal**: Automatic payment verification

**Components**:
1. Generate UPI payment link
2. Send to customer after file list
3. Wait for payment confirmation (via SMS parser or API)
4. Only print after payment verified

**Technologies**:
- UPI Deep Link: `upi://pay?pa=shop@upi&am=12.50&tn=Print+Job`
- Payment Gateway API (Razorpay, Paytm, PhonePe)
- SMS parser for bank SMS

### Phase 3: N-up Layouts

**Goal**: Print multiple pages per sheet (2-on-1, 4-on-1)

**Approach**:
- Use PDF manipulation library (pdf-lib, PyPDF2)
- Rearrange pages before sending to printer
- User options: "Print 2 pages per sheet?"

### Phase 4: Automatic Mailbox Printing

**Goal**: No manual mailbox interaction needed

**Technologies**:
- SNMP to communicate with Canon printer
- Automatic mailbox detection
- Trigger print from mailbox programmatically

### Phase 5: Print Queue Management

**Goal**: Smart prioritization of jobs

**Features**:
- Small jobs (≤10 pages) get priority
- Large jobs split into chunks
- Between chunks, check for small jobs
- Owner dashboard to view queue

### Phase 6: Admin Dashboard

**Goal**: Web interface for owner

**Features**:
- View active jobs
- See historical jobs
- Download/delete user files
- Change pricing on the fly
- Pause/resume bot

**Technologies**:
- Express.js for backend
- React for frontend
- Real-time updates via WebSocket

### Phase 7: Printer Monitoring

**Goal**: Detect errors automatically

**Technologies**:
- SNMP for printer status
- Detect: paper jam, out of paper, door open
- Auto-notify owner
- Auto-pause queue on error

---

## Rebuild Guide

### Step-by-Step Rebuild from Scratch

If you have ZERO code and want to rebuild this project:

#### A. Setup Project Structure

```bash
mkdir whatsapp-print-bot
cd whatsapp-print-bot
npm init -y
```

#### B. Install Dependencies

```bash
npm install @whiskeysockets/baileys@^7.0.0-rc.9
npm install pdf-parse@^1.1.1
npm install pino@^8.21.0 pino-pretty@^13.1.3
npm install qrcode-terminal@^0.12.0
npm install @hapi/boom@^10.0.1

npm install -D typescript@^5.7.3 ts-node@^10.9.2
npm install -D @types/node @types/pdf-parse @types/qrcode-terminal
```

#### C. Setup TypeScript

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create `package.json` scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  }
}
```

#### D. Create Source Files

**1. `src/config.ts`**: Copy from documented config section above

**2. `src/types.ts`**: Copy interfaces from types section

**3. `src/logger.ts`**: Copy from logger section (6 lines)

**4. `src/messages.ts`**: Implement all message formatting functions

**5. `src/job-manager.ts`**: Implement:
- `activeJobs` Map
- `createJob()`, `getJob()`, `updateJobState()`
- `addFileToJob()`, `deleteJob()`
- `cleanupExpiredJobs()` with setInterval

**6. `src/pdf-processor.ts`**: Implement:
- `countPDFPages()` using pdf-parse
- `processJobFiles()`
- `getTotalPages()`
- `renameFilesWithPhone()`

**7. `src/printer.ts`**: Implement:
- `printToPrinter()` using PowerShell

**8. `src/workflow.ts`**: Implement:
- `handleUserMessage()` with state machine
- `handlePendingJob()`, `handleConfirmPrint()`
- `handleSkipRequest()`, `handleFileRemoval()`

**9. `src/bot.ts`**: Implement:
- `startBot()` with Baileys
- `handleIncomingMessage()` router
- `handleDocumentMessage()` with download
- `handleTextMessage()` → workflow
- 60-second timer logic
- Owner notifications

**10. `src/index.ts`**: Entry point calling `startBot()`

#### E. Create Folder Structure

```bash
mkdir downloads processed auth
```

#### F. Test

```bash
npm run dev
```

Scan QR, send PDF, test workflow.

---

## Key Design Decisions

### 1. **Why Baileys Instead of WhatsApp API?**

**Pros**:
- Free (no API costs)
- Full WhatsApp Web features
- Active community

**Cons**:
- Unofficial (can break if WhatsApp changes protocol)
- Requires QR scan
- Rate limits exist

**Alternative**: There's a `MIGRATION_TO_WHATSAPP_WEB_JS.md` doc for switching to whatsapp-web.js library (more stable but uses Chrome)

### 2. **Why In-Memory Storage?**

**Current**: Jobs stored in Map

**Pros**:
- Simple, fast
- No database setup

**Cons**:
- Lost on restart
- Not scalable to multiple servers

**Future**: Migrate to Redis or PostgreSQL

### 3. **Why PowerShell for Printing?**

**Alternatives Considered**:
- Direct Windows print command (unreliable for PDFs)
- Third-party printing libraries (complex)

**Why PowerShell**:
- Uses OS default PDF app
- Respects printer settings
- Most reliable on Windows

### 4. **Why 60-Second Timer?**

**Problem**: When does user finish uploading multiple files?

**Solution**: Wait 60s after last file. If no new files, assume done.

**Why 60s**: Balance between:
- Too short: User still uploading
- Too long: User waiting

**Trade-off**: Adjustable in code

### 5. **Why 24-Hour Retention?**

**Balance**:
- Too short: User might want to reprint
- Too long: Disk space waste

**Configurable**: Change `JOB_RETENTION_HOURS`

---

## Dependencies Explained

### @whiskeysockets/baileys

**What**: Unofficial WhatsApp Web library  
**Why**: Enables WhatsApp messaging without official API  
**Size**: ~5 MB  
**Alternatives**: whatsapp-web.js (more stable, uses Chrome), Evolution API (REST wrapper)

### pdf-parse

**What**: PDF parsing library  
**Why**: Extract page count from PDF files  
**Size**: ~1 MB  
**How It Works**: Parses PDF binary structure, extracts metadata

### pino / pino-pretty

**What**: High-performance JSON logger  
**Why**: Structured logging with timestamp, log levels  
**Size**: ~500 KB  
**Alternative**: Winston, Bunyan

### qrcode-terminal

**What**: Display QR codes in terminal  
**Why**: Show WhatsApp QR for scanning  
**Size**: ~100 KB

---

## FAQ for Developers

**Q: Can this run on Linux/Mac?**  
A: Partially. WhatsApp part works, but printer integration is Windows-specific (PowerShell). You'd need to rewrite `printer.ts` for CUPS (Linux) or lp (Mac).

**Q: Can I use a different WhatsApp library?**  
A: Yes. See `MIGRATION_TO_WHATSAPP_WEB_JS.md` for switching to whatsapp-web.js.

**Q: How many concurrent users can it handle?**  
A: Currently unlimited (in-memory Map). But printing is sequential (2s delay between files). Consider queue management for high volume.

**Q: What happens if bot crashes during printing?**  
A: Current jobs are lost (in-memory). User files remain on disk. Consider adding job persistence (database) for production.

**Q: Can I deploy on cloud?**  
A: WhatsApp part yes (server). Printer part needs to run on machine connected to printer. Consider hybrid: cloud for WhatsApp, local agent for printing.

**Q: How to scale to multiple printers?**  
A: Add printer selection in workflow. Route jobs to different printers based on load/location.

---

## Summary for Product Manager

**What This System Does**:
Turn WhatsApp into a print ordering portal. Customers send PDFs, bot handles everything automatically.

**Value Proposition**:
- **Time Saved**: 2-3 hours/day of manual work eliminated
- **Scalability**: Handle 10x more customers without hiring staff
- **Customer Experience**: Fast, simple, no app installation
- **Error Reduction**: No manual counting mistakes

**Current Limitations**:
- Manual payment collection (no online verification)
- No job prioritization
- No admin dashboard
- Windows-only

**Next Steps for Full Automation**:
1. Add UPI payment verification (Phase 2)
2. Add print queue management (Phase 5)
3. Build admin dashboard (Phase 6)
4. Add SNMP printer monitoring (Phase 7)

**Tech Stack**:
- Backend: TypeScript/Node.js
- WhatsApp: Baileys library
- PDF: pdf-parse
- Printing: Windows PowerShell
- Deployment: Windows laptop + PM2

**Go-Live Checklist**:
- ✅ Printer connected and tested
- ✅ WhatsApp linked and stable
- ✅ Owner notifications enabled
- ✅ Pricing configured
- ✅ 24-hour cleanup active
- ✅ Test with real customers
