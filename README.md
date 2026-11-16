# Steady

A calm, personal fitness and nutrition checklist. It is a static web app that installs to the iPhone home screen and works offline. There is no backend and no account; all data stays on the phone.

Plain HTML, CSS and JavaScript. No build step and nothing to install.

## Run it locally

Any static file server works. From this folder:

```
python -m http.server 8000
```

Then open <http://localhost:8000>. (Opening `index.html` directly from disk will not work, because browsers block JavaScript modules on `file://`.)

## Deploy to GitHub Pages

Every push to `main` deploys automatically through `.github/workflows/deploy.yml`.

```
git add -A
git commit -m "Update plan"
git push
```

The site is live a minute or so later. One-time setup, already done for this repo: **Settings → Pages → Source: GitHub Actions**.

## Install on the iPhone

1. Open the site in **Safari**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.
3. Open it from the home screen icon once while online. After that it works offline.

Data belongs to the home-screen app, separately from Safari. Use **Settings → Export** now and then to keep a backup file; **Import** restores it, for example on a new phone.

## Edit the plan

| What | Where |
| --- | --- |
| Checklists, weekly workout plan, workouts and exercises, office days, weigh-in day, target | In the app, under **Settings** |
| Starting values for all of the above | `SEED` in `data/seed.js` |
| Dinner rotation, Sunday prep list, psyllium rules, protein cheat sheet, daily targets | `PLAN` in `data/seed.js` |
| Calendar reminders (titles and times) | `REMINDERS` in `data/seed.js` |
| Quotes and scripture verses | `data/motivation.js` |

`PLAN`, `REMINDERS` and the motivation list are read live, so a push is all it takes. `SEED` is copied onto the phone on first run; after changing it, tap **Settings → Reload plan from seed file** to apply it. That replaces your in-app settings and keeps everything you have logged.

## Reminders

**Settings → Reminders** builds a calendar file of repeating events with alerts. On the iPhone it opens the share sheet; choose Calendar, then Add All. The app itself sends no notifications.

## Layout

```
index.html              app shell and tab bar
css/app.css             styles, light and dark
data/seed.js            the plan (edit this)
data/motivation.js      quotes and verses (edit this)
js/store.js             saving, export, import
js/logic.js             day type, streak, badges, pace
js/ui-*.js              one file per tab
js/ics.js               calendar file for reminders
sw.js                   offline cache
```

Each day record has an empty `food` list reserved for food logging in a later version.
