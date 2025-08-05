import path from "path";
import { fetchSeasonTranslation } from "../api-trakt/seasons";
import { downloadSeasonImage } from "../api-trakt/images";

function getImageName(seasonNumber: number): string {
    return seasonNumber === 0
        ? "season-specials-poster.jpg"
        : `season${String(seasonNumber).padStart(2, "0")}-poster.jpg`;
}

/**
 * Builds XML blocks for named seasons and poster thumbs, with optional translations and image downloads.
 */
export async function buildSeasonsXml(
    seasons: any[],
    slug: string,
    basePath: string
): Promise<{
    namedSeasonsXml: string;
    thumbsXml: string;
}> {
    const namedSeasonsXmlList: string[] = [];
    const thumbsXmlList: string[] = [];

    const DOWNLOAD_SEASON_IMAGES = process.env.DOWNLOAD_SEASON_IMAGES === "true";
    const FETCH_SEASON_TRANSLATION = process.env.FETCH_SEASON_TRANSLATION === "true";

    if (!DOWNLOAD_SEASON_IMAGES) {
        console.warn("⚠️ Skipping season image download (DOWNLOAD_SEASON_IMAGES is disabled).");
    }

    if (!FETCH_SEASON_TRANSLATION) {
        console.warn("⚠️ Skipping season translations (FETCH_SEASON_TRANSLATION is disabled).");
    }

    const js2xmlparser = require("js2xmlparser");

    for (const season of seasons) {
        const seasonNumber = season.number;

        // Fetch translation (if enabled), fallback to default name
        const translatedTitle = FETCH_SEASON_TRANSLATION
            ? await fetchSeasonTranslation(slug, seasonNumber)
            : null;
        const name = translatedTitle || `Season ${seasonNumber}`;

        // Build <namedseason> XML block
        const namedSeasonXml = js2xmlparser.parse(
            "namedseason",
            {
                "#": name,
                "@": {
                    number: seasonNumber
                }
            },
            { declaration: { include: false } }
        );
        namedSeasonsXmlList.push(namedSeasonXml.trim());

        // Build <thumb> XML block (and optionally download image)
        const posterUrl = season.images?.poster?.[0];
        if (posterUrl) {
            const fileName = getImageName(seasonNumber);

            if (DOWNLOAD_SEASON_IMAGES) {
                try {
                    await downloadSeasonImage(posterUrl, path.join(basePath, fileName));
                } catch (err) {
                    console.warn(`⚠️ Failed to download season image for S${seasonNumber}:`, err);
                }
            }

            const thumbXml = js2xmlparser.parse(
                "thumb",
                {
                    "#": fileName,
                    "@": {
                        aspect: "poster",
                        season: String(seasonNumber),
                        type: "season"
                    }
                },
                { declaration: { include: false } }
            );
            thumbsXmlList.push(thumbXml.trim());
        }
    }

    return {
        namedSeasonsXml: namedSeasonsXmlList.join("\n"),
        thumbsXml: thumbsXmlList.join("\n")
    };
}
