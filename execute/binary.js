#!/usr/bin/env node

import fs, { existsSync } from 'fs';
import https from 'https';
import path from 'path';

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

export async function TryDownloadingUrls(Destination, URLs = [], force = false) {
    if (!fs.existsSync(Destination)) {
        console.error('Reinstalling binary.');
        const dir = path.dirname(Destination)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        for (const url of URLs) {
            if (!force && existsSync(Destination)) { break; }
            try {
                console.error('\nAttempting Url: ' + url);
                await Download(url, [Destination]);
            } catch (error) {
                console.error(`Failed to download from URL: ${error.message}`);
                continue
            }
            if (process.platform !== 'win32') {
                fs.chmodSync(Destination, 0o755);
            }
            break;
        }
    }
}