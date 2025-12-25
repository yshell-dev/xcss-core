#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

// Repo for Bin download.
const REPONAME = "alchira";
const REPOLINK = "https://github.com/alchira/" + REPONAME

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

const __system = `${process.platform}-${normalizeArch(process.arch)}`;
const __filename = fileURLToPath(import.meta.url);

const __package = path.resolve(__filename, '..');
const __scaffold = path.resolve(__package, 'scaffold');
const __binarydir = path.resolve(__package, 'binary');

const __binfile = platformBinMap[__system];
if (!__binfile) { console.error(`Unsupported platform or architecture: ${__system}`); process.exit(1); }

const packageJsonPath = path.join(__package, 'package.json');
const compilerConfigPath = path.join(__binarydir, 'configs.json');

const packageData = fs.existsSync(packageJsonPath) ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) : {};
const compilerData = fs.existsSync(compilerConfigPath) ? JSON.parse(fs.readFileSync(compilerConfigPath, 'utf8')) : {};

const devMode = fs.existsSync(path.resolve(__package, ".gitignore"));
let binpath = path.resolve(__binarydir, __binfile);
if (devMode) {
    if (fs.existsSync(path.resolve(__package, ".git"))) {
        binpath = path.resolve(__package, "../source/scripts/live.sh");
    } else {
        binpath = path.resolve(__package, "../../source/scripts/live.sh");
    }
}
fs.mkdirSync(__binarydir, { recursive: true })
fs.writeFileSync(path.join(__binarydir, "abspath.txt"), binpath);

function savejson(dst, obj) {
    const dir = path.dirname(dst)
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
    fs.writeFileSync(dst, JSON.stringify(obj, " ", "  "));
}

const UpdatePackageJson = () => savejson(packageJsonPath, packageData)
const UpdateCompilerConfig = () => savejson(compilerConfigPath, compilerData)

let version = "";
if (packageData.name === REPONAME) {
    version = packageData["version"]
    packageData["compiler"] = version
    UpdatePackageJson();
} else { version = packageData["compiler"] }

const patchTag = version;
const minorTag = version.split(".").slice(0, 2).join(".");
const majorTag = version.split(".")[0];

const patchTagUrl = `${REPOLINK}/releases/download/v${patchTag}/${__binfile}`;
const minorTagUrl = `${REPOLINK}/releases/download/v${minorTag}/${__binfile}`;
const majorTagUrl = `${REPOLINK}/releases/download/v${majorTag}/${__binfile}`;
const latestTagUrl = `${REPOLINK}/releases/download/latest/${__binfile}`;
const DownloadUrls = [patchTagUrl, minorTagUrl, majorTagUrl, latestTagUrl]

function ReadFlavourConfigs(flavourdir) {
    const resolved = {
        "name": "unflavored",
        "version": "unversioned",
        "sketchpad": "sketchpad",
        "blueprint": "blueprint",
        "libraries": "libraries"
    };
    try {
        const flavourAlchiraPath = path.join(flavourdir, 'alconfig.json');
        const configs = { ...resolved };
        if (fs.existsSync(flavourAlchiraPath)) {
            const data = fs.readFileSync(flavourAlchiraPath, 'utf8');
            try {
                const flavourData = JSON.parse(data);
                Object.assign(configs, flavourData)
            } catch { }
        }

        Object.keys(resolved).forEach((k) => {
            if (typeof resolved[k] === typeof configs[k]) {
                switch (k) {
                    case "sketchpad":
                    case "blueprint":
                    case "libraries":
                        resolved[k] = path.resolve(flavourdir, configs[k])
                        break;
                    default:
                        resolved[k] = configs[k];
                }
            }
        })
    } finally {
        const libignore = path.join(resolved.blueprint, "libraries", ".gitignore")
        if (fs.existsSync(flavourdir) && !fs.existsSync(libignore)) {
            fs.mkdirSync(path.dirname(libignore), { recursive: true });
            fs.writeFileSync(libignore, "_scaffold_")
        }
    }
    return resolved;
}

compilerData["name"] = packageData["name"] || "";
compilerData["version"] = packageData["version"] || "";
const defaultFlavour = ReadFlavourConfigs(__scaffold);
if (typeof compilerData["flavour"] == "object") {
    compilerData["flavour"]["default"] = defaultFlavour;
} else {
    compilerData["flavour"] = { "default": defaultFlavour }
}
if (typeof compilerData["flavour"]["workspace"] !== "object") {
    compilerData["flavour"]["workspace"] = {}
}

export async function RunCommand(args = []) {
    function Download(url, dests = []) {
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
                    Download(headers.location, dests).then(resolve).catch(reject);
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

    async function TryDownloadingUrls(Destination, URLs = [], force = false) {
        let successfull = false;
        let failMessage = "";
        if (!fs.existsSync(Destination)) {
            console.log('Reinstalling binary.');
            const dir = path.dirname(Destination)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            for (const url of URLs) {
                if (!force && fs.existsSync(Destination)) { break; }
                try {
                    console.log('\nAttempting Url: ' + url);
                    await Download(url, [Destination]);
                    successfull = true;
                } catch (error) {
                    failMessage = `Failed to download from URL: ${error.message}`
                    continue
                }
                if (process.platform !== 'win32') {
                    fs.chmodSync(Destination, 0o755);
                }
                break;
            }
        }
        if (!successfull) {
            console.error(failMessage)
        }
    }

    /* === */

    args = args.length ? args : process.argv.slice(2);

    if (args[0] === "binpath") {
        console.log(binpath)
    } else {
        try {
            const to_paclist = [__package];
            (compilerData.name || "").replaceAll("\\", "/").split("/").filter(Boolean).forEach(() => to_paclist.push(".."));

            if (args[0] === "init" && args[1]) {
                to_paclist.push(args[1])
                compilerData["flavour"]["workspace"][process.env.PWD] = ReadFlavourConfigs(path.join(...to_paclist));
            } else if (args[0] === "deinit") {
                delete compilerData["flavour"]["workspace"][process.env.PWD]
                args[0] = "init"
            }

            UpdateCompilerConfig();
            await TryDownloadingUrls(binpath, DownloadUrls);
            if (!fs.existsSync(binpath)) {
                console.error('Binary file not found after download attempts.');
                process.exit(1);
            }

            const child = spawnSync(binpath, args, { stdio: 'inherit' });

            if (child.error) { console.error(`Failed to execute ${__binfile} at ${binpath}: ${child.error.message}`); }
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }
    }
}
RunCommand();

export function GetMetadata() {
    return {
        DevMode: devMode,
        binPath: binpath,
        Package: packageData.name
    };
}