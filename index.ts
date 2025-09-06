import dotenv from 'dotenv';
import fsPromises from 'fs/promises';
import path from 'path';
import {getValidFolderPath, processSeasons, shouldOverwriteFile} from './utils/file';
import {buildSeasonsXml} from './utils/xml';
import {searchShow} from './api-trakt/tv-show';
import {fetchStudios} from './api-trakt/studios';
import {fetchShowTranslation} from './api-trakt/tv-show-translation';
import {fetchSeasons} from './api-trakt/seasons';
import {buildTvShowNfo, generateEpisodeNFOs} from './utils/nfo';
import {processEpisodesToCreateNFO} from './utils/episodes';
import {downloadShowImages} from './api-trakt/images';
import {askForManualSlug, askInput, confirmShowFromSearchResults, showIntro} from "./utils/messages";

dotenv.config();

const LANGUAGE = process.env.LANGUAGE || 'en';
const COUNTRY = process.env.COUNTRY || 'us';

(async function main() {
    showIntro();

    const folderPath = await getValidFolderPath();
    const folderName = path.basename(folderPath);

    // Search show by name
    const showName = await askInput('Enter the TV show name to search on Trakt', folderName);
    const results = await searchShow(showName);

    if (!results.length) {
        console.error('❌ No TV show found with that name.');
        return;
    }

    let chosenShow = await confirmShowFromSearchResults(results);

    if (!chosenShow) {
        chosenShow = await askForManualSlug();
    }

    if (!chosenShow) {
        console.warn('❌ No show selected. Exiting.');
        return;
    }

    const slug = chosenShow.ids.slug;

    console.log(`----> ✅  Show confirmed: ${chosenShow.title} (${chosenShow.year})`);
    console.log(`----> 🆔  Slug: ${slug}`);

    // Create tvshow.nfo
    const nfoPath = path.join(folderPath, 'tvshow.nfo');
    const shouldWrite = await shouldOverwriteFile(nfoPath);

    if (shouldWrite) {
        await downloadShowImages(chosenShow, folderPath);

        const studios = await fetchStudios(slug);
        const translation = await fetchShowTranslation(slug, LANGUAGE, COUNTRY);
        const seasons = await fetchSeasons(slug);

        const {
            namedSeasonsXml,
            thumbsXml: seasonThumbsXml,
        } = await buildSeasonsXml(seasons, slug, folderPath);

        const xmlContent = buildTvShowNfo({
            show: chosenShow,
            translation,
            studios,
            folderPath,
            seasonThumbsXml,
            namedSeasonsXml,
        });

        await fsPromises.writeFile(nfoPath, xmlContent, 'utf-8');
        console.log(`✅ tvshow.nfo file created at: ${nfoPath}`);

        const filesToDownloadNFO = await processSeasons(folderPath);
        if (!Object.keys(filesToDownloadNFO).length) {
            console.warn('⚠️ No episode files found to generate NFOs.');
        } else {
            const FETCH_EPISODES_TRANSLATION = process.env.FETCH_EPISODES_TRANSLATION === "true";
            if (!FETCH_EPISODES_TRANSLATION) {
                console.warn("️!!! 🌐.FETCH_EPISODES_TRANSLATION is disabled. Skipping translations for episodes.");
            }

            const episodesBySeason = await processEpisodesToCreateNFO(seasons);
            await generateEpisodeNFOs({episodesBySeason, filesToDownloadNFO, show: chosenShow});
        }
    }

    console.log('🎉 Done! Enjoy your show!');
})();


