import {delay} from '../utils/delay';

const LANGUAGE = process.env.LANGUAGE || 'en';
const COUNTRY = process.env.COUNTRY || 'us';

export async function fetchSeasons(slug: string) {
    console.log('📥 Downloading seasons and episodes from Trakt...');
    await delay();

    const traktApiKey = process.env.TRAKT_API_KEY;
    if (!traktApiKey) {
        console.error("❌ Missing TRAKT_API_KEY in environment variables.");
        return null;
    }

    const res = await fetch(
        `https://api.trakt.tv/shows/${slug}/seasons?extended=episodes%2Cimages`,
        {
            headers: {
                'Content-Type': 'application/json',
                'trakt-api-version': '2',
                'trakt-api-key': traktApiKey,
            },
        }
    );

    if (!res.ok) {
        throw new Error(`❌ Failed to fetch seasons: ${res.statusText}`);
    }

    return res.json();
}

export async function fetchSeasonTranslation(slug: string, season: number) {
    const FETCH_SEASON_TRANSLATION = process.env.FETCH_SEASON_TRANSLATION === "true";

    if (!FETCH_SEASON_TRANSLATION) {
        return;
    }

    console.log(`🌐 Fetching translation for Season ${season}...`);

    const traktApiKey = process.env.TRAKT_API_KEY;
    if (!traktApiKey) {
        console.error("❌ Missing TRAKT_API_KEY in environment variables.");
        return null;
    }

    await delay();

    const res = await fetch(
        `https://api.trakt.tv/shows/${slug}/seasons/${season}/translations/${LANGUAGE}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'trakt-api-version': '2',
                'trakt-api-key': traktApiKey,
            },
        }
    );

    if (!res.ok) return null;

    const translations = await res.json();
    return translations.find((t: any) => t.country === COUNTRY || !t.country)?.title || null;
}
