
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

function run() {
    console.log("Running signal-cli link...");
    // note: signal-cli link prints to stdout, sometimes stderr.
    const child = exec('signal-cli link -n "Clawdbot"');

    let output = '';

    child.stdout?.on('data', (data) => {
        output += data.toString();
        // console.log("stdout:", data.toString());
        checkForUri(output);
    });

    child.stderr?.on('data', (data) => {
        output += data.toString();
        // console.log("stderr:", data.toString());
        checkForUri(output);
    });
}

let found = false;
function checkForUri(text: string) {
    if (found) return;
    const match = text.match(/(tsdevice|sgnl):\/\?[^\s\n]+/);
    if (match) {
        found = true;
        const uri = match[0];
        console.log("Found URI:", uri);
        generateHtml(uri);
        // The script should keep running to keep the signal-cli process alive until linked?
        // signal-cli link waits for the scan. If we exit, the child process (signal-cli) might die if not detached.
        // Actually, current implementation of `run` does NOT wait for child to exit. 
        // But if we call process.exit(0) here, node process ends, killing child exec?
        // Let's NOT exit immediately. Let's wait for signal-cli to finish (it outputs "Associated with...").
    }
}

function generateHtml(qrData: string) {
    const html = `
     <!DOCTYPE html>
     <html>
     <head>
        <title>Signal Link QR Code</title>
        <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; background: #3a76f0; font-family: sans-serif; }
            .container { text-align: center; background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
            h1 { margin-bottom: 1rem; color: #3a76f0; }
        </style>
     </head>
     <body>
        <div class="container">
            <h1>Link with Signal</h1>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}" alt="QR Code" />
            <p>Open <b>Signal</b> > <b>Settings</b> > <b>Linked Devices</b> > <b>+</b></p>
            <p>Scan this code to link Clawdbot.</p>
        </div>
     </body>
     </html>
     `;
    const filePath = path.join(process.cwd(), 'signal-qr.html');
    fs.writeFileSync(filePath, html);
    console.log(`\n\n================================`);
    console.log(`Signal QR Code saved to: ${filePath}`);
    console.log(`Please open this file in your browser to scan the code.`);

    // Auto-open
    // exec(`open "${filePath}"`);

    console.log(`================================\n\n`);
}

run();
