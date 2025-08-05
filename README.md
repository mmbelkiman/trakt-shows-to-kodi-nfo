# trakt-shows-to-kodi-nfo

📺 A Node.js script to fetch TV show metadata from [Trakt.tv](https://trakt.tv) and generate `.nfo` files compatible with Kodi, along with artwork and optional translations.

This program is designed for **command-line use only** — it does **not** include a graphical interface.  
It works on **any OS** (Windows, macOS, Linux) as long as you have **Node.js** installed locally.

---

## 📖 About

This script processes a folder structure like this:

```
/Shows/The Office (US)/Season 01/
/Shows/The Office (US)/Season 02/
```

It will:

- Fetch metadata for the show and episodes from Trakt
- Generate `.nfo` files:
  - `tvshow.nfo` in the root show folder
  - One `.nfo` per episode (named to match your video files)
- Optionally download artwork:
  - Posters, fanart, and season thumbs
- Optionally translate episode/show titles and overviews based on your configuration

---

## ✨ Features

- ✅ Fetch full metadata from Trakt (title, plot, IDs, runtime, airdate, etc.)
- ✅ Generate **Kodi-compatible** `.nfo` files for shows and episodes
- ✅ Download images: show poster, fanart, season thumbs, and episode screenshots
- ✅ Optional **translations** (e.g. pt-br) for titles and descriptions
- ✅ Configurable via `.env` file
- ✅ Built-in delay between requests to avoid rate-limiting
- ✅ Can skip already-processed folders (based on existing `.nfo` files)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-user/trakt-shows-to-kodi-nfo.git
cd trakt-shows-to-kodi-nfo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the `.env.template` file to `.env` and edit the values as needed:

```bash
cp .env.template .env
```

You **must** provide a valid [Trakt.tv API key](https://trakt.tv/oauth/applications/new).  
You can use the free tier, just register an app and use the **client ID**.

### 4. Run the script

```bash
npm start
```

You will be prompted to enter the local folder path where your TV show is located., for example:

```
/Users/yourname/Videos/Breaking Bad
D:\Series\The Office (US)
```

The folder name should match the TV show title as recognized by Trakt.
Make sure your season folders are named correctly (Season 01, Season 02, etc.).

The script will then attempt to automatically determine the Trakt slug and fetch all metadata.

---

## ⚙️ Configuration

You can control various behaviors via the `.env` file:

| Variable                      | Description                                          |
|------------------------------|------------------------------------------------------|
| `TRAKT_API_KEY`              | Your Trakt API key (required)                        |
| `LANGUAGE`                   | Preferred language for translations (e.g. `pt`)      |
| `COUNTRY`                    | Preferred country for translations (e.g. `br`)       |
| `FETCH_SEASON_TRANSLATION`  | `true` to enable season title translations           |
| `FETCH_EPISODE_TRANSLATION` | `true` to enable episode title/plot translations     |
| `DOWNLOAD_IMAGES`           | `true` to enable image downloads                     |
| `IMAGE_BASE_URL`            | Optional custom URL/path for downloaded images       |
| `DOWNLOAD_DELAY`            | Delay (in ms) between API requests (default: 2000)   |

Use the `.env.template` file as a reference.

---

## 🧠 Folder Structure Requirements

Your folder structure **must follow** this pattern:

```
/YourShows/
└── Breaking Bad/
    ├── tvshow.nfo (generated)
    ├── Season 01/
    │   ├── S01E01.mkv
    │   ├── S01E01.nfo (generated)
    │   ├── S01E01.jpg (optional image)
    └── Season 02/
        ├── ...
```

- Season folders **must** be named like: `Season 01`, `Season 02`, `Season 00` (for specials)
- Episode files **must** follow a recognizable naming format like `S01E01`

---

## 🛠 Built With

- Node.js
- TypeScript
- `fs`, `path`, `fetch`, and `js2xmlparser`
- Trakt.tv API
- `dotenv`, `chalk`, `inquirer`

---

## 🔐 Trakt API Key

You need to [register an app](https://trakt.tv/oauth/applications/new) to get your free API key.

- Copy the **Client ID** into your `.env` as `TRAKT_API_KEY`

No authentication/login is required — just the client ID.

---

## ⚠️ Warning

This script will:

- Overwrite existing `.nfo` files
- Download and overwrite images in the target folders

**Use with caution.**  
Always back up your folders before testing!

---

## 📄 License

This project is open source and free to use under the MIT license.
