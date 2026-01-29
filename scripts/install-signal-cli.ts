
import { installSignalCli } from '../src/commands/signal-install.js';
import { defaultRuntime } from '../src/runtime.js';

async function run() {
    console.log("Installing signal-cli...");
    const result = await installSignalCli(defaultRuntime);
    if (result.ok) {
        console.log(`SUCCESS: signal-cli installed at ${result.cliPath}`);
        console.log(`Version: ${result.version}`);
    } else {
        console.error(`FAILURE: ${result.error}`);
        process.exit(1);
    }
}

run();
