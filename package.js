#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const platformBinMap = {
    'win32-386': 'windows-386.exe',
    'win32-amd64': 'windows-amd64.exe',
    'win32-arm64': 'windows-arm64.exe',
    'linux-amd64': 'linux-amd64',
    'linux-arm64': 'linux-arm64',
    'linux-armv7': 'linux-armv7',
    'darwin-amd64': 'darwin-amd64',
    'darwin-arm64': 'darwin-arm64',
};

function normalizeArch(arch) {
    if (arch === 'x64') return 'amd64';
    if (arch === 'ia32') return '386';
    return arch;
}

const __filename = fileURLToPath(import.meta.url);
const __system = `${process.platform}-${normalizeArch(process.arch)}`;
const __binfile = platformBinMap[__system];
const __diroot = path.resolve(__filename, '..');
const __dirsrc = path.resolve(__diroot, 'source');
const __dirbin = path.resolve(__dirsrc, 'bin');
if (!__binfile) { console.error(`Unsupported platform or architecture: ${__system}`); process.exit(1); }

const soure_repo = "https://github.com/yshelldev/xcss-package"
const packageJsonPath = path.join(__diroot, 'package.json');
const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentAssetUrl = `${soure_repo}/releases/download/v${packageData.version}/${__binfile}`;
const latestAssetUrl = `${soure_repo}/releases/download/latest/${__binfile}`;

const devMode = fs.existsSync(path.resolve(__dirsrc, "scripts"));
const devPath = path.resolve(__dirsrc, "scripts", "live.sh");
const binPath = path.resolve(__dirbin, __binfile);
// console.log({ __filename, __dirname, __system, __binfile, assetUrl, binPath });

function syncMarkdown() {
    let readme = fs.readFileSync(path.resolve(__diroot, "scaffold", "intro.md")).toString().trim();
    readme += "\n\n---\n\n" + fs.readFileSync(path.resolve(__dirsrc, "README.md")).toString().trim();
    readme += "\n\n---\n\n" + fs.readFileSync(path.resolve(__dirsrc, "FLAVOUR.md")).toString().trim();
    fs.writeFileSync(path.resolve(__diroot, "README.md"), readme)
}

function downloadBinary(url, dests = []) {
    console.log("Source: " + url);
    return new Promise((resolve, reject) => {
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (err) {
            reject(new Error("Invalid URL: " + url));
            return;
        }

        https.get(parsedUrl, (res) => {
            const { statusCode, headers } = res;
            if ([301, 302, 307, 308].includes(statusCode) && headers.location) {
                // Follow redirect
                downloadBinary(headers.location, dests).then(resolve).catch(reject);
                res.destroy();
                return;
            }

            if (statusCode !== 200) {
                res.resume(); // Consume response data to free up memory
                reject(new Error(`Request Failed. Status Code: ${statusCode}`));
                return;
            }

            const dataChunks = [];
            res.on('error', reject);
            res.on('data', chunk => dataChunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(dataChunks);
                try {
                    for (const dest of dests) {
                        fs.writeFileSync(dest, buffer);
                        if (process.platform !== 'win32') {
                            fs.chmodSync(dest, 0o755);
                        }
                    }
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

async function binUpgrade(args = []) {
    const fallbackAssetUrl = latestAssetUrl
    if (!fs.existsSync(binPath) || args[0] === "reinstall") {
        console.error('Reinstalling binary.');
        if (!fs.existsSync(__dirbin)) {
            fs.mkdirSync(__dirbin, { recursive: true });
        }
        try {
            await downloadBinary(currentAssetUrl, [binPath]);
        } catch (error) {
            console.error(`Failed to download from first URL: ${error.message}`);
            console.error('Trying second binary URL...');
            // Attempt to download from a fallback URL (assumed here as fallbackAssetUrl)
            await downloadBinary(fallbackAssetUrl, [binPath]);
        }
        if (process.platform !== 'win32') {
            fs.chmodSync(binPath, 0o755);
        }
    }
    if (!fs.existsSync(binPath) || args[0] === "upgrade") {
        console.error('Upgrading to latest binary.');
        if (!fs.existsSync(__dirbin)) {
            fs.mkdirSync(__dirbin, { recursive: true });
        }
        await downloadBinary(latestAssetUrl, [binPath]);
        if (process.platform !== 'win32') {
            fs.chmodSync(binPath, 0o755);
        }
    }
}

(async () => {
    try {
        const args = process.argv.slice(2);
        await binUpgrade();

        if (!fs.existsSync(binPath)) {
            console.error('Binary file not found after download.');
            process.exit(1);
        }

        const child = spawnSync(binPath, args, { stdio: 'inherit' });

        if (child.error) {
            console.error(`Failed to execute ${__binfile} at ${binPath}: ${child.error.message}`);
        } else {
            syncMarkdown()
        }
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
})();

export default function getBinPath() {
    return devMode ? devPath : binPath;
}