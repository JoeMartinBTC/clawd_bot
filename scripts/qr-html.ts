
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import path from 'path';
import os from 'os';
import fs from 'fs';

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

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("QR Code received.");
            const html = `
             <!DOCTYPE html>
             <html>
             <head>
                <title>WhatsApp Login QR Code</title>
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; font-family: sans-serif; }
                    .container { text-align: center; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    h1 { margin-bottom: 1rem; color: #128c7e; }
                </style>
                <meta http-equiv="refresh" content="20"> <!-- Reload every 20s as QR expires -->
             </head>
             <body>
                <div class="container">
                    <h1>Scan with WhatsApp</h1>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}" alt="QR Code" />
                    <p>Open <b>WhatsApp</b> > <b>Settings</b> > <b>Linked Devices</b> > <b>Link a Device</b></p>
                </div>
             </body>
             </html>
             `;
            const filePath = path.join(process.cwd(), 'qr-login.html');
            fs.writeFileSync(filePath, html);
            console.log(`\n\n================================`);
            console.log(`QR Code saved to: ${filePath}`);
            console.log(`Please open this file in your browser to scan the code.`);
            console.log(`================================\n\n`);
        }

        if (connection === 'open') {
            console.log('SUCCESS: WhatsApp connected!');
            process.exit(0);
        }
    });
}

start();
