#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { FlavourModify } from './flavour.js';
import { DownloadBinary } from './binary.js';

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
const __package = path.resolve(__filename, '..', '..');
const __compiler = path.resolve(__package, 'compiler');
const __bindir = path.resolve(__compiler, 'bin');
if (!__binfile) { console.error(`Unsupported platform or architecture: ${__system}`); process.exit(1); }

const soure_repo = "https://github.com/yshelldev/xcss-package"
const packageJsonPath = path.join(__package, 'package.json');
const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const UpdateRootPackage = () => fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, " ", "  "))
let version = "";
if (packageData.name === "xcss-package") {
    version = packageData["version"].split(".").slice(0, 2).join(".")
    packageData["compilerVersion"] = version
    UpdateRootPackage();
} else {
    version = packageData["compilerVersion"]
}
const currentAssetUrl = `${soure_repo}/releases/download/v${version}/${__binfile}`;
const latestAssetUrl = `${soure_repo}/releases/download/latest/${__binfile}`;

const devMode = fs.existsSync(path.resolve(__compiler, "scripts"));
const devPath = path.resolve(__compiler, "scripts", "live.sh");
const binPath = path.resolve(__bindir, __binfile);
// console.log({ __filename, __dirname, __system, __binfile, assetUrl, binPath });

function syncMarkdown() {
    let readme = fs.readFileSync(path.resolve(__package, "execute", "index.md")).toString().trim();
    readme += "\n\n---\n\n" + fs.readFileSync(path.resolve(__compiler, "README.md")).toString().trim();
    readme += "\n\n---\n\n" + fs.readFileSync(path.resolve(__compiler, "FLAVOUR.md")).toString().trim();
    fs.writeFileSync(path.resolve(__package, "README.md"), readme)
}

async function binUpgrade(args = []) {
    const fallbackAssetUrl = latestAssetUrl
    if (!fs.existsSync(binPath) || args[0] === "reinstall") {
        console.error('Reinstalling binary.');
        if (!fs.existsSync(__bindir)) {
            fs.mkdirSync(__bindir, { recursive: true });
        }
        try {
            await DownloadBinary(currentAssetUrl, [binPath]);
        } catch (error) {
            console.error(`Failed to download from first URL: ${error.message}`);
            console.error('Trying second binary URL...');
            // Attempt to download from a fallback URL (assumed here as fallbackAssetUrl)
            await DownloadBinary(fallbackAssetUrl, [binPath]);
        }
        if (process.platform !== 'win32') {
            fs.chmodSync(binPath, 0o755);
        }
    }
    if (!fs.existsSync(binPath) || args[0] === "upgrade") {
        console.error('Upgrading to latest binary.');
        if (!fs.existsSync(__bindir)) {
            fs.mkdirSync(__bindir, { recursive: true });
        }
        await DownloadBinary(latestAssetUrl, [binPath]);
        if (process.platform !== 'win32') {
            fs.chmodSync(binPath, 0o755);
        }
    }
}

export async function RunCommand(args = []) {
    try {
        args = args.length ? args : process.argv.slice(2);
        await binUpgrade(args);
        if (args.length === 2 && args[0] === "flavourize") {
            FlavourModify(args[1])
        }
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
}
RunCommand();

export function GetBinPath() {
    return devMode ? devPath : binPath;
}