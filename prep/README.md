# Prep

A personal recipe planner backed by a Google Sheet. Plan the next two weeks on
a drag-and-drop timeline, keep a card grid of everything you cook, and get a
reminder of tonight's prep for tomorrow's meal.

## How it works

- **Data lives in a Google Sheet.** One row per recipe. The sheet is the
  database — you can edit rows directly in Sheets and the app reflects it.
- **A Google Apps Script** deployed as a web app is the tiny backend
  (`Code.gs`). The app reads and writes through its `/exec` URL.
- **This React app** (Vite) is the front end. It's fully static once built.

## Setup

### 1. The sheet

One tab, with this header row in row 1 (exact names, this order):

```
ID | Recipe Name | Scheduled For | Image URL | Night Before Task | Original Recipe | Cook Time (Minutes) | Ingredients | Instructions
```

- `Scheduled For` is a single `YYYY-MM-DD` date (or blank). Format the column
  as plain text so Sheets doesn't rewrite the date.
- `Ingredients` and `Instructions` hold one item per line inside the cell
  (Alt/Option+Enter for a line break).

### 2. The backend

In the sheet: Extensions → Apps Script. Paste in `Code.gs`, set `SECRET`, then
Deploy → New deployment → **Web app**, Execute as **Me**, Who has access
**Anyone**. Copy the `/exec` URL. Redeploy a **new version** every time you
edit `Code.gs`.

### 3. This app

Edit `src/config.js` with your `/exec` URL and the same secret.

```bash
npm install
npm run dev      # local dev at http://localhost:5173
npm run build    # production build into dist/
```

## Deploy on Netlify

Push this folder to GitHub, then in Netlify: New site → import the repo. The
included `netlify.toml` already sets the build command (`npm run build`) and
publish directory (`dist`). No other config needed.

## A note on the secret

`SECRET` and the API URL are visible in the built site's JavaScript. The secret
only deters random writes; reads are public to anyone with the URL. That's fine
for recipes — don't put anything private behind it.
