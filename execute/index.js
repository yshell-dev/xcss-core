#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { TryDownloadingUrls } from './binary.js';

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
const __scaffold = path.resolve(__package, 'scaffold');
const __bindir = path.resolve(__compiler, 'bin');
if (!__binfile) { console.error(`Unsupported platform or architecture: ${__system}`); process.exit(1); }

const soure_repo = "https://github.com/yshelldev/xcss-package"
const packageJsonPath = path.join(__package, 'package.json');
const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const UpdateRootPackage = () => fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, " ", "  "))

let version = "";
if (packageData.name === "xcss-package") {
    version = packageData["version"]
    packageData["compilerVersion"] = version
    UpdateRootPackage();
} else { version = packageData["compilerVersion"] }

const patchTag = version;
const minorTag = version.split(".").slice(0, 2).join(".");
const majorTag = version.split(".")[0];

const patchTagUrl = `${soure_repo}/releases/download/v${patchTag}/${__binfile}`;
const minorTagUrl = `${soure_repo}/releases/download/v${minorTag}/${__binfile}`;
const majorTagUrl = `${soure_repo}/releases/download/v${majorTag}/${__binfile}`;
const latestTagUrl = `${soure_repo}/releases/download/latest/${__binfile}`;
const DownloadUrls = [patchTagUrl, minorTagUrl, majorTagUrl, latestTagUrl]

const devMode = fs.existsSync(path.resolve(__compiler, "scripts"));
const devPath = path.resolve(__compiler, "scripts", "live.sh");
const binpath = path.resolve(__bindir, __binfile);

fs.writeFileSync(path.join(__package, "BINPATH"), binpath)
function syncMarkdown() {
    let readme = fs.readFileSync(path.resolve(__package, "execute", "index.md")).toString().trim();
    readme += "\n\n---\n\n" + fs.readFileSync(path.resolve(__compiler, "README.md")).toString().trim();
    readme += "\n\n---\n\n" + fs.readFileSync(path.resolve(__scaffold, "README.md")).toString().trim();
    fs.writeFileSync(path.resolve(__package, "README.md"), readme)
}

function FlavourModify(rootPackageJson, flavour) {
    try {
        if (!flavour || typeof flavour !== 'string') { return false; }

        const flavourPath = path.join(__package, '..', flavour);
        const flavourPackagePath = path.join(flavourPath, 'package.json');
        if (!fs.existsSync(flavourPackagePath)) { return false; }

        const data = fs.readFileSync(flavourPackagePath, 'utf8');
        let flavourData;
        try { flavourData = JSON.parse(data); } catch { return false; }
        if (!flavourData.configs) { return false; }

        if (!rootPackageJson.flavour) { rootPackageJson.flavour = {}; }
        const packageMeta = rootPackageJson.flavour;
        const flavourMeta = flavourData.configs;

        if (!(typeof packageMeta === "object" && typeof flavourMeta === "object")) {
            return false
        }

        Object.keys(packageMeta).forEach((k) => {
            if (typeof packageMeta[k] === typeof flavourMeta[k]) {
                switch (k) {
                    case "sandbox":
                    case "blueprint":
                    case "libraries":
                        packageMeta[k] = path.resolve(flavourPath, flavourMeta[k])
                        break;
                    default:
                        packageMeta[k] = flavourMeta[k];
                }
            }
        })

        try { UpdateRootPackage(); } catch { return false; }
        return true;
    } catch {
        return false;
    }
}

export async function RunCommand(args = []) {
    const bin = path.basename(process.argv[1]);
    args = args.length ? args : process.argv.slice(2);
    if (args[0] === "binpath") {
        console.log(binpath)
    } else {
        try {
            if (bin === "xpin" && args.length === 1) {
                FlavourModify(packageData, args[0])
                args = [args[0]]
            } else if (args.length === 2 && args[0] === "spin") {
                FlavourModify(packageData, args[1])
            }

            await TryDownloadingUrls(binpath, DownloadUrls);
            if (!fs.existsSync(binpath)) {
                console.error('Binary file not found after download.');
                process.exit(1);
            }

            const child = spawnSync(binpath, args, { stdio: 'inherit' });

            if (child.error) { console.error(`Failed to execute ${__binfile} at ${binpath}: ${child.error.message}`); }
            else { syncMarkdown() }
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }
    }
}
RunCommand();

export function GetMetadata() {
    return {
        DevMode: devMode,
        binPath: devMode ? devPath : binpath,
        PackageName: packageData.name
    };
}