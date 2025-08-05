import fs from "fs";
import https from "https";
import path from "path";
import fsPromises from "fs/promises";
import {delay} from "../utils/delay";

export const imageMap: Record<string, string> = {
    poster: "poster.jpg",
    fanart: "fanart.jpg",
    clearlogo: "clearlogo.png",
    clearart: "clearart.png",
    banner: "banner.jpg",
    thumb: "thumb.jpg",
    landscape: "landscape.jpg",
    keyart: "keyart.jpg",
};

/**
 * Generic function to download and save an image.
 */
export async function downloadAndSaveImage(
    url: string,
    destPath: string,
    options: { stripWebp?: boolean } = {}
): Promise<void> {
    await delay();

    let finalUrl = url;
    if (options.stripWebp) {
        finalUrl = finalUrl.replace(/\.webp$/, "");
    }

    if (!finalUrl.startsWith("https")) {
        finalUrl = `https://${finalUrl}`;
    }

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);

        https
            .get(finalUrl, (response) => {
                if (response.statusCode !== 200) {
                    return reject(`❌ Error ${response.statusCode} while downloading ${finalUrl}`);
                }

                response.pipe(file);
                file.on("finish", () => {
                    file.close();
                    console.log(`✅ Image saved to ${destPath}`);
                    resolve();
                });
            })
            .on("error", (err) => {
                fs.unlink(destPath, () => reject(err.message));
            });
    });
}

export const downloadSeasonImage = async (url: string, destPath: string) => {
    const DOWNLOAD_SEASON_IMAGES = process.env.DOWNLOAD_SEASON_IMAGES === "true";
    if (!DOWNLOAD_SEASON_IMAGES) {
        return;
    }

    await downloadAndSaveImage(url, destPath, {stripWebp: true});
}
export const downloadEpisodesImage = async (url: string, destPath: string) => {
    await downloadAndSaveImage(url, destPath);
}

/**
 * Downloads all key images for a show and saves them to disk.
 */
export async function downloadShowImages(show: any, folderPath: string): Promise<void> {
    const DOWNLOAD_SHOW_IMAGES = process.env.DOWNLOAD_SHOW_IMAGES === "true";

    if (!DOWNLOAD_SHOW_IMAGES) {
        console.warn("!!! 🖼.DOWNLOAD_SHOW_IMAGES is disabled. Skipping image downloads.");
        return;
    }

    const images = show.images || {};

    for (const [key, filename] of Object.entries(imageMap)) {
        const imgArray = images[key];
        if (imgArray?.length) {
            const dest = path.join(folderPath, filename);
            try {
                await fsPromises.unlink(dest).catch(() => {
                });
                const url = imgArray[0];
                await downloadAndSaveImage(url, dest, {stripWebp: true})
            } catch (err) {
                console.warn(`⚠️ Failed to download image for "${key}":`, err);
            }
        }
    }
}
