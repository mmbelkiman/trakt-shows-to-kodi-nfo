export interface TraktEpisode {
    season: number;
    number: number;
    title: string;
    ids: {
        trakt: number;
        tvdb?: number;
        imdb?: string;
    };
    images?: {
        screenshot?: string[];
    };
}

export interface TraktShow {
    title: string;
    year: number;
    ids: {
        trakt: number;
        slug: string;
        imdb?: string;
        tmdb?: number;
        tvdb?: number;
    };
    overview?: string;
    rating?: number;
    certification?: string;
    genres?: string[];
    first_aired?: string;
    status?: string;
    language?: string;
    network?: string;
    original_title?: string;
    votes?: number;
    tagline?: string;
    runtime?: number;
    trailer?: string;
    aired_episodes?: number;
    country?: string;
}
