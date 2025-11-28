import fs from 'fs';
import path from 'path';

export function FlavourModify(flavour) {
    try {
        // Validate input silently
        if (!flavour || typeof flavour !== 'string') {
            return false;
        }

        // Build path
        const flavourPackagePath = path.join(__package, '..', flavour, 'package.json');

        // Check if file exists
        if (!fs.existsSync(flavourPackagePath)) {
            return false;
        }

        // Read file
        const data = fs.readFileSync(flavourPackagePath, 'utf8');

        // Parse JSON silently
        let flavourData;
        try {
            flavourData = JSON.parse(data);
        } catch {
            return false;
        }

        // Validate flavour field
        if (!flavourData.flavour) {
            return false;
        }

        // Merge flavours safely
        if (!packageData.flavour) {
            packageData.flavour = {};
        }
        packageData.flavour = { ...packageData.flavour, ...flavourData.flavour };

        // Update package silently
        try {
            UpdateRootPackage();
        } catch {
            return false;
        }

        return true;

    } catch {
        return false;
    }
}
