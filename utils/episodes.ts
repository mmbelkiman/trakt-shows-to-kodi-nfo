import {TraktEpisode} from './types';

export function processEpisodesToCreateNFO(seasons: any[]): Record<string, TraktEpisode[]> {
    return seasons.reduce((acc: Record<string, TraktEpisode[]>, season: any) => {
        if (!season.episodes) return acc;
        const seasonKey = String(season.number).padStart(2, '0');
        acc[seasonKey] = season.episodes;
        return acc;
    }, {});
}
