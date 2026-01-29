
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import path from 'path';
import os from 'os';

// Mock logger
const logger = {
    level: 'silent',
    trace: () => { },
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    child: () => logger,
} as any;

async function start() {
    const authDir = path.join(os.homedir(), ".clawdbot", "credentials", "whatsapp", "default");
    console.log(`Using auth dir: ${authDir}`);

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    // Custom browser to match clawdbot
    const browser = ["clawdbot", "cli", "2026.1.15"];

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        printQRInTerminal: false,
        browser: browser as any,
        syncFullHistory: false,
        markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    let pairingCodeRequested = false;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !pairingCodeRequested) {
            pairingCodeRequested = true;
            console.log("QR Code received, requesting pairing code...");
            try {
                // Number provided by user: +49 172 53 84 702
                // Normalized: 491725384702
                const phoneNumber = "491725384702";
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n\n================================`);
                console.log(`YOUR PAIRING CODE: ${code}`);
                console.log(`\nWaiting for you to enter this code on your phone...`);
                console.log(`================================\n\n`);

            } catch (err) {
                console.error("Failed to request pairing code:", err);
                pairingCodeRequested = false; // retry if failed
            }
        }

        if (connection === 'close') {
            // If we get logged out or restarting loop, we might want to reset pairingCodeRequested?
            // But usually Baileys reconnects.
            const reason = (lastDisconnect?.error as any)?.output?.statusCode;
            console.log('Connection closed. Reason:', reason);
        } else if (connection === 'open') {
            console.log('SUCCESS: WhatsApp connected!');
            process.exit(0);
        }
    });
}

start();
