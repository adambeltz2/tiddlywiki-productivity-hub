# Productivity Hub

A single-file TiddlyWiki template for projects, tasks, due dates and notes.

- **Use it now:** open `Productivity-Hub.html` in a browser. No server or internet needed.
- **Setup and saving** (local file vs server, new vs existing data): see [SETUP-GUIDE.md](SETUP-GUIDE.md).

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

## Keep your own data out of this repo
`Productivity-Hub.html` is the empty template. Once you add real projects and notes, keep that working copy elsewhere (or export Markdown) and keep the repo for the template only.
