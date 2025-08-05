import { delay } from "../utils/delay";

/**
 * Fetches translated metadata for a TV show from Trakt.
 *
 * @param slug - The Trakt slug for the show
 * @param language - The desired language (e.g., "pt")
 * @param country - Optional country code to refine the translation (e.g., "br")
 * @returns An object containing the translation data or an empty object if not found
 */
export async function fetchShowTranslation(slug: string, language?: string, country?: string) {
    if (!language) {
        console.log("🌐 No LANGUAGE defined. Skipping translation and using the original title.");
        return {};
    }

    const apiKey = process.env.TRAKT_API_KEY;
    if (!apiKey) {
        console.error("❌ TRAKT_API_KEY is not defined in environment variables.");
        return {};
    }

    const url = `https://api.trakt.tv/shows/${slug}/translations/${language}`;

    try {
        await delay();

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                "trakt-api-version": "2",
                "trakt-api-key": apiKey,
            },
        });

        if (!response.ok) {
            console.warn(`⚠️ Failed to fetch translations: ${response.status} ${response.statusText}`);
            return {};
        }

        const translations = await response.json();

        // 1. Try to match both language and country
        const matchLangCountry = translations.find(
            (t: any) => t.language === language && t.country === country
        );

        // 2. Fallback: match only language
        const matchLangOnly = translations.find(
            (t: any) => t.language === language
        );

        return matchLangCountry || matchLangOnly || {};
    } catch (err) {
        console.warn("⚠️ Error while fetching translation:", err);
        return {};
    }
}
