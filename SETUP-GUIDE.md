# Productivity Hub: Setup Guide

Two ways to run it, and two starting points. Pick one row from each.

| | New (empty) | You already have data |
|---|---|---|
| **Local single file** | Section 1A | Section 1B |
| **Server** | Section 2A | Section 2B |

**Your data is** every Project, Task and Note, plus your saved searches. Everything else (pages, styles, scripts) is the template.

**Rule of thumb:** pick one place to be the "real" copy (the local file *or* the server) and don't edit both at once. TiddlyWiki cannot merge changes.

---

## 1. Local single file

You have one file: `Productivity-Hub.html`. Double-click it to open it in your browser. It needs no internet and no server.

### 1A. New (empty)

1. Open `Productivity-Hub.html`. On Home, press **Load a sample project** to explore, or **＋ New project** to start fresh.
2. **Saving:** browsers can't overwrite the file they opened. Choose one:
   - **TiddlyDesktop** (free app from tiddlywiki.com): open the HTML file in it and it saves back to the same file automatically. This is the easiest option.
   - **Browser only:** click the ✓ save button (sidebar, top right; press the `»` at the top right of the page to open the sidebar). It downloads a new copy. Replace your old file with it and keep only that one.
3. **Backups:** copy the file somewhere safe (date it), and once a month use **Import and Export → Download .md** with *Everything*.
4. If you delete the sample project, delete its tasks and notes too.

### 1B. You already have data

**Keep your data and move to a newer version of the template:**
1. In the OLD file open **Import and Export**, choose *Everything*, keep all three boxes ticked, and press **Download .md**. Keep that file.
2. Open the NEW `Productivity-Hub.html`.
3. Open **Import and Export**, drag the `.md` file into the drop zone, and set *If a title already exists* to **Keep both (rename)** (or **Skip** if you're re-importing).
4. Check Home, Projects and Notes. Your projects, tasks, notes, dates, priorities and repeat settings should all be there.

**Bring in notes from other apps (Obsidian, VS Code, etc.):** use the same drop zone with `.md` files. Tick *Turn - [ ] checklist items into tasks* if you want checklists to become tasks, and pick a project to put them in.

---

## 2. Server

Run TiddlyWiki on a machine you control (your computer, a home server or a VPS). Every change saves automatically as a file. Open it from any browser on any device.

### 2A. New (empty)

**Step 1.** Install Node.js (version 18 or newer), then TiddlyWiki:

```bash
npm install -g tiddlywiki
```

**Step 2.** Create the wiki folder and add the template files from the `productivity-hub-source/tiddlers` folder. You must create the `tiddlers` folder yourself, because TiddlyWiki doesn't make it until the first save.

```bash
tiddlywiki mywiki --init server
mkdir -p mywiki/tiddlers
cp productivity-hub-source/tiddlers/* mywiki/tiddlers/
```

**Step 3 (optional).** Open `mywiki/tiddlywiki.info` and delete the line `"tiddlywiki/highlight",`. The wiki doesn't use it. Keep `tiddlyweb` and `filesystem`; the server needs them.

**Step 4.** Start it with a password:

```bash
tiddlywiki mywiki --listen host=127.0.0.1 port=8080 username=you password=pick-a-long-one
```

**Step 5.** Open `http://localhost:8080`. Anything you add appears as a `.tid` file in `mywiki/tiddlers/`.

**Putting it on the internet:**
- Use `host=0.0.0.0` only behind HTTPS. The login is sent in clear text over plain HTTP.
- Put Caddy or nginx in front for HTTPS and forward to port 8080.
- Keep it running with `systemd`, `pm2` or Docker.
- Back up the `mywiki` folder regularly. It holds everything.

### 2B. You already have data

You have data in a local `.html` file (or a Markdown export) and want it on the server. Do 2A first, then use one of these:

**Method 1 (recommended): Markdown**
1. In the old file: **Import and Export → Everything → Download .md**.
2. Open the server wiki → **Import and Export** → drop the `.md` file into the drop zone.
3. Check the results panel (it lists what was created). Then check Projects, Tasks and Notes.

**Method 2: Import the whole HTML file**
1. In the server wiki, open the sidebar (`»` at the top right), go to the **Tools** tab, press the import button and choose your old `.html` file.
2. TiddlyWiki shows a list. Items marked "already exists" are template files, so you can leave them or untick them. Your tasks, notes and projects will be listed as new.
3. Press **Import**. The tiddlers are saved to the server's `tiddlers` folder immediately.

### Going from server back to a single file

To get a portable snapshot with all the data:
```bash
tiddlywiki mywiki --output out --build index
```
This writes `out/index.html`. Open it like any local file (section 1). It is a copy and not linked to the server, so edits there don't go back.

---

## Updating the template later (any setup)

- Pages and code are the tiddlers whose names start with `$:/prod/` plus Home, Dashboard, Task Board, Agenda, Calendar, Projects, Notes, Review, Search, Import and Export, and New Project.
- **Server:** copy the new template files over `mywiki/tiddlers/`. This replaces the pages and code. Your own data files (named after your tasks and notes) are not touched. Back up the folder first.
- **Local file:** use the Markdown route in 1B.
- Don't rename or edit the code tiddlers unless you mean to.

## Troubleshooting

| Problem | Fix |
|---|---|
| Changes disappear after closing the local file | You didn't save. Use TiddlyDesktop, or the ✓ save button, and replace the old file. |
| Server shows an empty wiki | Check you copied the files into `mywiki/tiddlers/`, and that the folder exists. |
| `401 Unauthorized` on the server | Log in with the username and password you passed to `--listen`. |
| Import shows "already exists" | Choose *Keep both*, *Skip* or *Overwrite* in the Import panel. |
| A task or note lost its project after import | Check the project exists. A project named in the file is created automatically, but a project you deleted before importing won't come back on its own. |
| Two copies are out of sync | Pick the one you trust, export it as Markdown, and import it into the other. |
