import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import {ask, askInput} from "./messages";

export async function folderExists(folderPath: string): Promise<boolean> {
    try {
        const stat = await fsPromises.stat(folderPath);
        return stat.isDirectory();
    } catch {
        return false;
    }
}

export async function processSeasons(
    basePath: string
): Promise<Record<string, Record<number, { path: string; file: string }>>> {
    const SKIP_EPISODES_WITH_NFO = process.env.SKIP_EPISODES_WITH_NFO === 'true';
    const IGNORE_FILES_SMALLER_THAN_KB = parseInt(process.env.IGNORE_FILES_SMALLER_THAN_KB || '0', 10);
    const EPISODE_REGEX = /s(\d{2})e(\d{2})/i;
    const IGNORE_FILES_EXTENSIONS = ['.nfo', '.jpg', '.png', '.gif', '.bmp'];

    if (SKIP_EPISODES_WITH_NFO) {
        console.log('⚠️ Skipping episodes with existing NFO files.');
    }
    if (IGNORE_FILES_SMALLER_THAN_KB > 0) {
        console.log(`⚠️ Ignoring files smaller than ${IGNORE_FILES_SMALLER_THAN_KB} KB.`);
    }

    console.log('🔍 Scanning seasons in folder:', basePath);

    const dirents = await fsPromises.readdir(basePath, {withFileTypes: true});
    const seasonDirs = dirents.filter(d => d.isDirectory() && /^season\s*\d+/i.test(d.name));

    const episodesBySeason: Record<string, Record<number, { path: string; file: string }>> = {};

    for (const seasonDir of seasonDirs) {
        const seasonPath = path.join(basePath, seasonDir.name);
        const seasonMatch = seasonDir.name.match(/season\s*(\d+)/i);
        if (!seasonMatch) continue;

        const seasonNumber = seasonMatch[1].padStart(2, '0');
        const episodes: Record<number, { path: string; file: string }> = {};

        const files = await fsPromises.readdir(seasonPath);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (IGNORE_FILES_EXTENSIONS.includes(ext)) continue;

            const filePath = path.join(seasonPath, file);

            if (IGNORE_FILES_SMALLER_THAN_KB > 0) {
                const stats = await fsPromises.stat(filePath);
                const fileSizeKB = stats.size / 1024;
                if (fileSizeKB < IGNORE_FILES_SMALLER_THAN_KB) continue;
            }

            const basename = path.basename(file, ext);
            const match = basename.match(EPISODE_REGEX);
            if (!match) continue;

            const fileSeason = match[1];
            const episode = match[2];
            if (fileSeason !== seasonNumber) continue;

            const nfoPath = path.join(seasonPath, `${basename}.nfo`);
            const nfoExists = SKIP_EPISODES_WITH_NFO && fs.existsSync(nfoPath);
            if (nfoExists) continue;

            episodes[parseInt(episode)] = { path: seasonPath, file };
        }

        if (Object.keys(episodes).length > 0) {
            episodesBySeason[seasonNumber] = episodes;
        }
    }

    return episodesBySeason;
}

export async function shouldOverwriteFile(filePath: string): Promise<boolean> {
    try {
        await fsPromises.access(filePath);
        const overwrite = await askInput(`⚠️ The file ${filePath} already exists. Overwrite it? (y/n)`, 'y');
        const normalized = overwrite.trim().toLowerCase();
        if (normalized !== 'y' && normalized !== 'yes') {
            return false;
        }
        await fsPromises.unlink(filePath);
        console.log('🗑️ Old file removed.');
    } catch {
        // File doesn't exist, proceed normally
    }

    return true;
}

export async function getValidFolderPath(): Promise<string> {
    const folderPath = await ask('Enter the full path to the show folder');
    const exists = await folderExists(folderPath);
    if (!exists) {
        throw new Error('❌ Folder not found. Exiting.');
    }
    return folderPath;
}
