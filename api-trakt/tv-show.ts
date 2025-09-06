import { delay } from "../utils/delay";

export async function searchShow(query: string): Promise<any[]> {
    console.log(`🔍 Searching for "${query}" on Trakt...`);

    const apiKey = process.env.TRAKT_API_KEY;

    if (!apiKey) {
        console.error("❌ TRAKT_API_KEY is not defined in environment variables.");
        return [];
    }

    const url = `https://api.trakt.tv/search/show?query=${encodeURIComponent(query)}&extended=full%2Cimages`;

    await delay();

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "trakt-api-version": "2",
            "trakt-api-key": apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(`❌ Failed to search: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

/** * Fetch a TV show directly by slug from Trakt. */
export async function fetchShowBySlug(slug: string): Promise<any | null> {
    console.log(`🔍 Fetching show by slug "${slug}" on Trakt...`);

    const apiKey = process.env.TRAKT_API_KEY;

    if (!apiKey) {
        console.error("❌ TRAKT_API_KEY is not defined in environment variables.");
        return null;
    }

    const url = `https://api.trakt.tv/shows/${encodeURIComponent(slug)}?extended=full,images`;

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "trakt-api-version": "2",
            "trakt-api-key": apiKey,
        },
    });

    if (!response.ok) {
        console.error(`❌ Failed to fetch show with slug "${slug}": ${response.status} ${response.statusText}`);
        return null;
    }

    return await response.json();
}
