import readline from 'readline';
import {prompt} from 'enquirer';
import {TraktShow} from './types';
import chalk from "chalk";
import boxen from "boxen";

/**
 * Prompts a basic CLI question using `readline`.
 */
export function ask(question: string, defaultValue?: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        const promptText = defaultValue
            ? `${question} [${defaultValue}]: `
            : `${question}: `;
        rl.question(promptText, answer => {
            rl.close();
            resolve((answer.trim() || defaultValue || '').trim());
        });
    });
}

/**
 * Prompts for single-line input using `enquirer`.
 */
export async function askInput(message: string, initial: string): Promise<string> {
    const response = await prompt<{ value: string }>({
        type: 'input',
        name: 'value',
        message,
        initial,
    });

    return response.value;
}

function isYesResponse(input: string): boolean {
    return ['y', 'yes'].includes(input.trim().toLowerCase());
}

/**
 * Asks the user to confirm the correct show from a list of search results.
 */
export async function confirmShowFromSearchResults(results: { show: TraktShow }[]): Promise<TraktShow | null> {
    for (const result of results) {
        const show = result.show;
        const title = `${show.title} (${show.year})`;
        const overview = show.overview
            ? show.overview.substring(0, 200) + '...'
            : 'No description available.';

        console.log('\n🔎 Potential match found:');
        console.log(`📺 Title: ${title}`);
        console.log(`🆔 Slug: ${show.ids.slug}`);
        console.log(`📝 Overview: ${overview}`);

        const confirm = await askInput('⚠️ Is this the correct show? (y/n)', 'y');
        if (isYesResponse(confirm)) {
            return show;
        }
    }

    return null;
}

export function showIntro() {
    const intro = `
    ${chalk.bold('📺  Trakt to Kodi Scraper — TV Show Metadata Generator')}
    
    ${chalk.cyan('This script will:')}
      • Fetch metadata from Trakt.tv about a TV show
      • Create Kodi-compatible .nfo files (tvshow.nfo + episodes)
      • Download season and show images (poster, fanart, etc.)
      • Translate titles and overviews (if configured)
    
    ${chalk.cyan('📁 Folder Requirements:')}
      • Folder name should match the show title
      • Season folders must follow: "Season 01", "Season 02", ...
        Use "Season 00" for specials
    
    ${chalk.cyan('⚙️ Configuration:')}
      • Edit your .env file to set language, country, image options, etc.
      • Check .env.template for reference
    
    ${chalk.cyan('🔐 Trakt API:')}
      • Requires a Trakt account + registered API app
        → https://trakt.tv/oauth/applications/new
    
    ${chalk.redBright.bold('⚠️ WARNING:')}
      This will overwrite existing .nfo files and images in the folder.
    
      ${chalk.bold('Proceed only if you have backups or know what you are doing!')}
    `;

    console.log(boxen(intro, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
    }));
}
