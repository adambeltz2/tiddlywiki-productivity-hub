# Productivity Hub

A single-file TiddlyWiki template for projects, tasks, due dates and notes.

## Use this template

1. Click **Use this template → Create a new repository** (top right of this page). Choose **Private** so your real projects and notes stay out of public view.
2. Pick how you want to run it:
   - **Quickest (single file):** download `Productivity-Hub.html` from your new repo, open it in a browser, and start with **＋ New project** (or **Load a sample project** to explore). To save changes automatically, open the file in the free TiddlyDesktop app. In a plain browser, use the ✓ save button, which downloads a new copy, and replace the old file.
   - **Server (auto-saves, any device):** copy `source/tiddlers/*` into a TiddlyWiki server folder. Steps are in [SETUP-GUIDE.md](SETUP-GUIDE.md), section 2.
3. Back up your work: **Import and Export → Everything → Download .md** gives you a Markdown copy of all projects, tasks and notes. Commit that file to your private repo if you want it versioned.
4. Never edit this template repo with real data. If you improve the template, change `source/` and rebuild (see below).

New to local vs server, or moving existing data? Read [SETUP-GUIDE.md](SETUP-GUIDE.md).

## What it does
Home and Dashboard views, task board, agenda, month calendar, weekly review, full search with saved searches, and Markdown import/export. Notes and tasks are tagged to their project automatically, and renaming a note or project updates links to it. Everything is custom code in this repo; no TiddlyWiki plugins are used.

## Repo layout
| Path | What |
|---|---|
| `Productivity-Hub.html` | The built template. Start from a copy of this file. |
| `source/` | The wiki as a TiddlyWiki folder (`tiddlers/*.tid`, `*.js`). Edit here. |
| `tests/` | Unit tests for the Markdown converter and the rename relinker. |
| `SETUP-GUIDE.md` | Local vs server, new vs existing data. |

## Rebuild after editing `source/`
```bash
npm install
npm test
npm run build      # writes dist/index.html
```

## Keep your own data out of the template
`Productivity-Hub.html` here is the empty template. Once you add real projects and notes, work in your own private copy (made with **Use this template**) and keep this repo for the template only.
