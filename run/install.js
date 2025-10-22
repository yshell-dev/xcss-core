#!/usr/bin/env node

// import https from 'https';
// import fs from 'fs';
// import path from 'path';

import { detectCompatibleBinary } from "./detect.js";

function getDeviceInfo() {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;

    let os = "-";
    if (platform.startsWith("Win")) os = "Windows";
    else if (platform.startsWith("Mac")) os = "MacOS";
    else if (platform.startsWith("Linux")) os = "Linux";
    else if (/Android/.test(userAgent)) os = "Android";
    else if (/iPhone|iPad|iPod/.test(userAgent)) os = "iOS";

    // Architecture guess (very rough, relies on userAgent)
    let arch = "-";
    if (/arm|aarch64/i.test(userAgent)) arch = "ARM";
    else if (/x86_64|Win64|WOW64|amd64/i.test(userAgent)) arch = "x64";
    else if (/i[3-6]86|x86/i.test(userAgent)) arch = "x86";

    return { os, arch, platform, userAgent };
}


// // Parameters: replace as needed
// const assetUrl = 'https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}';
// const targetPath = path.resolve(__dirname, 'downloads', 'your-local-filename.zip');

// // Download and save
// https.get(assetUrl, (res) => {
//     if (res.statusCode === 302 && res.headers.location) {
//         // Handle GitHub's redirect to actual file location
//         https.get(res.headers.location, (fileRes) => {
//             fileRes.pipe(fs.createWriteStream(targetPath));
//             fileRes.on('end', () => console.log('Download complete.'));
//         });
//     } else {
//         res.pipe(fs.createWriteStream(targetPath));
//         res.on('end', () => console.log('Download complete.'));
//     }
// }).on('error', (e) => {
//     console.error(`Download error: ${e.message}`);
// });

detectCompatibleBinary();