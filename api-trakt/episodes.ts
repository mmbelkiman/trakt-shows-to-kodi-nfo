import {delay} from "../utils/delay";

export async function fetchExtendedEpisodeData(
    slug: string,
    season: number,
    episode: number
): Promise<any | null> {
    await delay();

    console.log(`📡 Fetching extended metadata for S${season}E${episode}...`);

    const traktApiKey = process.env.TRAKT_API_KEY;
    if (!traktApiKey) {
        console.error("❌ Missing TRAKT_API_KEY in environment variables.");
        return null;
    }

    const response = await fetch(
        `https://api.trakt.tv/shows/${slug}/seasons/${season}/episodes/${episode}?extended=full`,
        {
            headers: {
                "Content-Type": "application/json",
                "trakt-api-key": traktApiKey,
                "trakt-api-version": "2",
            },
        }
    );

    if (!response.ok) {
        console.warn(
            `⚠️ Failed to fetch extended data for S${season}E${episode}. HTTP Status: ${response.status}`
        );
        return null;
    }

    return response.json();
}

/** * Fetches the translated title and overview for a specific episode. */
export async function fetchEpisodeTranslation(
    slug: string,
    season: number,
    episode: number
): Promise<{ title: string; overview: string } | null> {
    const LANGUAGE = process.env.LANGUAGE || "en";
    const COUNTRY = process.env.COUNTRY || "us";
    const FETCH_EPISODES_TRANSLATION = process.env.FETCH_EPISODES_TRANSLATION === "true";

    if (!FETCH_EPISODES_TRANSLATION) {
        return null;
    }

    const traktApiKey = process.env.TRAKT_API_KEY;
    if (!traktApiKey) {
        console.error("❌ Missing TRAKT_API_KEY in environment variables.");
        return null;
    }

    console.log(`🌐 Fetching translation for episode S${season}E${episode} (${LANGUAGE}-${COUNTRY})...`);

    await delay();

    const res = await fetch(
        `https://api.trakt.tv/shows/${slug}/seasons/${season}/episodes/${episode}/translations/${LANGUAGE}`,
        {
            headers: {
                "Content-Type": "application/json",
                "trakt-api-version": "2",
                "trakt-api-key": traktApiKey,
            },
        }
    );

    if (!res.ok) {
        console.warn(`⚠️ Failed to fetch translation for S${season}E${episode}. HTTP Status: ${res.status}`);
        return null;
    }

    const translations = await res.json();
    const translation = translations.find((t: any) => t.country === COUNTRY || !t.country);

    return translation
        ? {
            title: translation.title,
            overview: translation.overview,
        }
        : null;
}
