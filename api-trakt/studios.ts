import { delay } from "../utils/delay";

/**
 * Fetches a list of studios for a given show slug from the Trakt API.
 * @param slug - Trakt show slug (e.g., "breaking-bad")
 * @returns An array of studio names (strings).
 */
export async function fetchStudios(slug: string): Promise<string[]> {
    const apiKey = process.env.TRAKT_API_KEY || "";
    const url = `https://api.trakt.tv/shows/${slug}/studios`;

    await delay();

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "trakt-api-version": "2",
            "trakt-api-key": apiKey
        }
    });

    if (!response.ok) {
        console.warn(`⚠️ Failed to fetch studios for "${slug}": ${response.status} ${response.statusText}`);
        return [];
    }

    try {
        const studios = await response.json();
        return studios.map((studio: any) => studio.name).filter(Boolean);
    } catch (err) {
        console.error(`❌ Error parsing studios response for "${slug}":`, err);
        return [];
    }
}
