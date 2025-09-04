import { fetchEpisodeTranslation, fetchExtendedEpisodeData } from "../api-trakt/episodes";
import fsPromises from "fs/promises";
import path from "path";
import { TraktEpisode, TraktShow } from "./types";
import fsSync from "fs";
import { downloadEpisodesImage, imageMap } from "../api-trakt/images";

/**
 * Generates <thumb> XML tags for Kodi using local image files.
 */
export function generateThumbTags(folderPath: string, imageMap: Record<string, string>): string {
    let result = "";
    for (const [aspect, filename] of Object.entries(imageMap)) {
        const imagePath = path.join(folderPath, filename);
        try {
            fsSync.accessSync(imagePath);
            result += `  <thumb aspect="${aspect}" preview="${filename}">${filename}</thumb>\n`;
        } catch {
            // File does not exist, skip this image
        }
    }
    return result.trim();
}

/**
 * Generates individual episode NFO files and downloads corresponding images.
 */
export async function generateEpisodeNFOs({
                                              episodesBySeason,
                                              filesToDownloadNFO,
                                              show
                                          }: {
    episodesBySeason: Record<any, TraktEpisode[]>;
    filesToDownloadNFO: Record<number, Record<number, { path: string; file: string }>>;
    show: TraktShow;
}) {
    const showSlug = show.ids.slug;
    const { genres } = show;

    for (const seasonKey of Object.keys(filesToDownloadNFO)) {
        const seasonData = filesToDownloadNFO[seasonKey as any];

        for (const episodeKey of Object.keys(seasonData)) {
            const { path: episodeDir, file } = seasonData[Number(episodeKey)];
            const fileWithPath = path.join(episodeDir, file);

            const seasonNum = Number(seasonKey);
            const episodeNum = Number(episodeKey);

            const episodeBasic = episodesBySeason[String(seasonNum).padStart(2, "0")]?.find(
                (ep) => ep.number === episodeNum
            );
            if (!episodeBasic) {
                console.warn(`⚠️ Trakt Episode metadata not found for ${file}`);
                continue;
            }

            const episode = await fetchExtendedEpisodeData(showSlug, seasonNum, episodeNum);
            if (!episode) continue;

            let translation;
            if (process.env.FETCH_EPISODES_TRANSLATION === "true") {
                translation = await fetchEpisodeTranslation(showSlug, seasonNum, episodeNum);
            }

            const title = translation?.title || episode.title || "";
            const plot = translation?.overview || episode.overview || "";
            const traktId = episode.ids.trakt;
            const localImageFilename = file.replace(path.extname(file), ".jpg");
            const screenshotUrl = episode.images?.screenshot?.[0];

            const episodeObj: Record<string, any> = {
                title,
                originaltitle: episode.original_title || title,
                showtitle: showSlug.replace(/-/g, " "),
                season: seasonNum,
                episode: episodeNum,
                id: traktId,
                uniqueid: [
                    { "@": { type: "trakt", default: "false" }, "#": traktId }
                ],
                userrating: episode.rating || 0,
                plot,
                runtime: episode.runtime || "",
                genre: genres?.join(" / ") || "",
                premiered: episode.first_aired ? new Date(episode.first_aired).toISOString().split("T")[0] : "",
                aired: episode.first_aired ? new Date(episode.first_aired).toISOString().split("T")[0] : "",
                studio: show.network || "",
                thumb: screenshotUrl ? localImageFilename : "",
                dateadded: new Date().toISOString().split("T")[0],

                watched: false,
                playcount: 0,
                fileinfo: {},
                episode_groups: [
                    { "@": { episode: episodeNum, season: seasonNum, id: "AIRED", name: "" } },
                ]
            };

            const js2xmlparser = require("js2xmlparser");
            const xml = js2xmlparser.parse("episodedetails", episodeObj, {
                declaration: { include: true, encoding: "UTF-8" }
            });

            const nfoPath = fileWithPath.replace(path.extname(fileWithPath), ".nfo");
            await fsPromises.writeFile(nfoPath, xml, "utf-8");

            // image download
            const DOWNLOAD_EPISODE_IMAGES = process.env.DOWNLOAD_EPISODE_IMAGES === "true";
            if (screenshotUrl && DOWNLOAD_EPISODE_IMAGES) {
                const imagePath = fileWithPath.replace(path.extname(fileWithPath), ".jpg");
                await downloadEpisodesImage(screenshotUrl, imagePath);
            }
        }
    }
}

interface BuildTvShowNfoParams {
    show: TraktShow;
    translation: any;
    studios: string[];
    folderPath: string;
    seasonThumbsXml?: string;
    namedSeasonsXml?: string;
}

/**
 * Generates the TV show-level `tvshow.nfo` content (as a string) with translations, images and IDs.
 */
export function buildTvShowNfo({
                                   show,
                                   translation,
                                   studios,
                                   folderPath,
                                   seasonThumbsXml = "",
                                   namedSeasonsXml = ""
                               }: BuildTvShowNfoParams): string {
    const {
        title,
        overview,
        rating,
        certification,
        ids,
        genres,
        first_aired,
        status,
        language,
        network,
        original_title,
        year,
        votes,
        tagline,
        runtime,
        trailer,
        aired_episodes,
        country
    } = show;

    const thumbTags = generateThumbTags(folderPath, imageMap);

    const uniqueids = [
        { "@": { type: "trakt", default: "true" }, "#": ids.trakt },
        ...(ids.imdb ? [{ "@": { type: "imdb", default: "false" }, "#": ids.imdb }] : []),
        ...(ids.tmdb ? [{ "@": { type: "tmdb", default: "false" }, "#": ids.tmdb }] : []),
        ...(ids.tvdb ? [{ "@": { type: "tvdb", default: "false" }, "#": ids.tvdb }] : [])
    ];

    const tvshowObj: Record<string, any> = {
        title: translation.title || title,
        originaltitle: original_title || title,
        showtitle: translation.title || title,
        sorttitle: (translation.title || title).replace(/^(A |An |The )/i, ""),
        year,
        userrating: rating?.toFixed(1) || "",
        votes: votes || "",
        plot: translation.overview || overview || "",
        tagline: translation.tagline || tagline || "",
        runtime: runtime || "",
        genre: genres?.join(" / ") || "",
        premiered: first_aired ? new Date(first_aired).toISOString().split("T")[0] : "",
        status: status || "",
        mpaa: certification || "",
        certification: certification || "",
        trailer: trailer || "",
        country: country || "",
        episode: aired_episodes || "",
        language: language || "",
        uniqueid: uniqueids
    };

    if (studios.length > 0) {
        tvshowObj.studio = studios;
    } else if (network) {
        tvshowObj.studio = [network];
    }

    const js2xmlparser = require("js2xmlparser");


    let tvshowXml = js2xmlparser.parse("tvshow", tvshowObj, {
        declaration: { include: false },
        format: { doubleQuotes: true }
    });

    const customXmlBlocks = [thumbTags, seasonThumbsXml, namedSeasonsXml].filter(Boolean).join("\n");
    if (customXmlBlocks) {
        tvshowXml = injectInsideRoot(tvshowXml, "tvshow", customXmlBlocks);
    }

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!-- Created on ${new Date().toISOString()} by Trakt2Kodi Script -->\n${tvshowXml}`;
}

function injectInsideRoot(xml: string, rootTag: string, innerXml: string): string {
    const closing = `</${rootTag}>`;
    const idx = xml.lastIndexOf(closing);

    if (idx === -1) return xml; // fallback

    const before = xml.slice(0, idx).trimEnd();
    const after = xml.slice(idx); // include </rootTag>
    const block = innerXml.trim();

    return `${before}\n${block}\n${after}`;
}
