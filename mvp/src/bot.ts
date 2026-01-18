/**
 * WhatsApp Bot Integration using Baileys
 * 
 * Handles:
 * - QR code authentication
 * - Message receiving and routing
 * - PDF file downloads
 * - 60-second notification timer
 * - Sending messages to users
 */

import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WASocket,
    downloadMediaMessage,
    proto,
    WAMessage
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Boom } from '@hapi/boom';
import { CONFIG } from './config';
import { logger } from './logger';
import { JobFile } from './types';
import { addFileToJob, getOrCreateJob } from './job-manager';
import { handleUserMessage } from './workflow';
import { Messages } from './messages';

// Store WhatsApp socket instance
let sock: WASocket | null = null;

// Store notification timers for each user
const notificationTimers = new Map<string, NodeJS.Timeout>();

/**
 * Start the WhatsApp bot
 */
export async function startBot(): Promise<WASocket> {
    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.AUTH_PATH);

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,  // We'll handle QR display ourselves
        logger: logger as any,
    });

    // Event: Connection updates (QR, connected, disconnected)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Display QR code in terminal
            logger.info('Scan QR code to authenticate:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

            logger.info({ shouldReconnect }, 'Connection closed');

            if (shouldReconnect) {
                // Reconnect after 5 seconds
                setTimeout(() => {
                    startBot();
                }, 5000);
            }
        } else if (connection === 'open') {
            logger.info('✅ WhatsApp connected successfully!');
        }
    });

    // Event: Save credentials
    sock.ev.on('creds.update', saveCreds);

    // Event: New messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            await handleIncomingMessage(msg);
        }
    });

    return sock;
}

/**
 * Handle incoming message (route by type)
 */
async function handleIncomingMessage(msg: WAMessage): Promise<void> {
    // Ignore messages from self
    if (msg.key.fromMe) return;

    // Ignore messages without content
    if (!msg.message) return;

    // Extract phone number (remove @s.whatsapp.net suffix)
    const phoneNumber = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
    if (!phoneNumber) return;

    logger.info({
        phoneNumber,
        messageType: Object.keys(msg.message)[0]
    }, 'Received message');

    // Handle document (PDF) messages
    if (msg.message.documentMessage) {
        await handleDocumentMessage(msg, phoneNumber);
    }
    // Handle text messages
    else if (msg.message.conversation || msg.message.extendedTextMessage) {
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        await handleTextMessage(phoneNumber, text, msg);
    }
}

/**
 * Handle document (PDF) message - download and save
 */
async function handleDocumentMessage(msg: WAMessage, phoneNumber: string): Promise<void> {
    const document = msg.message?.documentMessage;
    if (!document) return;

    const fileName = document.fileName || 'document.pdf';
    const mimeType = document.mimetype || '';

    // Only accept PDF files
    if (!mimeType.includes('pdf') && !fileName.toLowerCase().endsWith('.pdf')) {
        await sendMessageToUser(phoneNumber, Messages.pdfOnly());
        return;
    }

    try {
        // Download PDF
        logger.info({ phoneNumber, fileName }, 'Downloading PDF...');
        const buffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;

        // Save to user's download folder
        const userDir = path.join(CONFIG.DOWNLOAD_PATH, phoneNumber);
        await fs.mkdir(userDir, { recursive: true });

        const filePath = path.join(userDir, fileName);
        await fs.writeFile(filePath, buffer);

        logger.info({ phoneNumber, fileName, filePath }, 'PDF downloaded');

        // Add to job
        const file: JobFile = {
            fileName,
            filePath,
            pageCount: undefined  // Will be counted later
        };
        addFileToJob(phoneNumber, file);

        // Set/reset 60-second notification timer
        clearTimeout(notificationTimers.get(phoneNumber));

        const timer = setTimeout(async () => {
            await sendFileReceivedNotification(phoneNumber);
            notificationTimers.delete(phoneNumber);
        }, CONFIG.FILE_TIMER_SECONDS * 1000);  // 60 seconds

        notificationTimers.set(phoneNumber, timer);

        logger.info({ phoneNumber }, 'Set 60-second notification timer');

    } catch (error) {
        logger.error({ error, phoneNumber, fileName }, 'Failed to download PDF');
        await sendMessageToUser(phoneNumber, Messages.error('Failed to download file'));
    }
}

/**
 * Handle text message - route to workflow
 */
async function handleTextMessage(phoneNumber: string, text: string, msg: WAMessage): Promise<void> {
    // Cancel notification timer if user sends text
    const timer = notificationTimers.get(phoneNumber);
    if (timer) {
        clearTimeout(timer);
        notificationTimers.delete(phoneNumber);
        logger.info({ phoneNumber }, 'Cancelled notification timer (user sent message)');
    }

    // Send message callback
    const sendMessage = async (messageText: string) => {
        await sendMessageToUser(phoneNumber, messageText);
    };

    // Owner notification callback
    const ownerNotify = async (messageText: string) => {
        if (CONFIG.NOTIFY_OWNER && CONFIG.OWNER_PHONE) {
            await sendMessageToUser(CONFIG.OWNER_PHONE, messageText);
        }
    };

    // Route to workflow handler
    await handleUserMessage(phoneNumber, text, sendMessage, ownerNotify);
}

/**
 * Send file received notification (after 60s timer)
 */
async function sendFileReceivedNotification(phoneNumber: string): Promise<void> {
    const job = getOrCreateJob(phoneNumber);

    logger.info({
        phoneNumber,
        fileCount: job.files.length
    }, 'Sending file received notification');

    // Send to customer
    await sendMessageToUser(phoneNumber, Messages.filesReceived());

    // Notify owner
    if (CONFIG.NOTIFY_OWNER && CONFIG.OWNER_PHONE) {
        const ownerMsg = Messages.ownerFileDownload(
            phoneNumber,
            job.files.length,
            job.files
        );
        await sendMessageToUser(CONFIG.OWNER_PHONE, ownerMsg);
    }

    // Trigger workflow to show file list
    const sendMessage = async (text: string) => {
        await sendMessageToUser(phoneNumber, text);
    };
    await handleUserMessage(phoneNumber, '', sendMessage);
}

/**
 * Send message to user
 */
export async function sendMessageToUser(phoneNumber: string, text: string): Promise<void> {
    if (!sock) {
        logger.error('WhatsApp socket not initialized');
        return;
    }

    try {
        const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text });

        logger.info({ phoneNumber, textLength: text.length }, 'Message sent');

    } catch (error) {
        logger.error({ error, phoneNumber }, 'Failed to send message');
    }
}

/**
 * Get socket instance (for testing)
 */
export function getSocket(): WASocket | null {
    return sock;
}
