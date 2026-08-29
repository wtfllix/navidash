# NaviDash User Guide

This guide reflects the current product shape of NaviDash and focuses on the real interaction model in the app today.

## Layout Overview

NaviDash currently has three main areas:

1. Main canvas
   Your homepage area where widgets are placed and used daily.
2. Floating bottom toolbar
   Provides quick launcher, widget store, edit mode, and global settings entry points.
3. Bottom widget shelf
   Opens above the floating toolbar for horizontal browsing, searching, and adding widgets.

## Basic Usage

### Quick Launcher

- While not editing and with no input focused, start typing, press `Ctrl/⌘ + K`, or use the bottom search button
- Use the arrow keys to change selection, `Enter` to open, and `Escape` to close
- When no link matches, press `Enter` to search the web with the engine selected in the launcher
- The launcher learns the relationship between what you type and the link you ultimately open
- Frequently selected results gradually move ahead of other links matching the same query
- Learning data never moves canvas widgets and is not uploaded by default
- Inspect or clear learning data under Settings and Data Tools

### Edit Mode

- Use the bottom toolbar to switch between customize and done states
- In edit mode, you can move widgets, open widget settings, and remove widgets

### Open the Widget Store

- Click the widget store button in the bottom toolbar
- Browse horizontally or search; clicking a widget adds it and closes the shelf
- You can also drag a widget upward onto the canvas; the shelf moves away when dragging starts
- Some widgets open their settings right after creation for first-time setup

## Widget Actions

### Add a Widget

1. Open the widget store
2. Find the widget you want
3. Click to add it, or drag it onto the canvas where supported

The widget store currently lets you add:

- `Links`: frequent destinations
- `Today`: a combined time, date, and weather panel
- `Memo`: quick pasted information
- `Poster`: frameless visual decoration
- `F1`: the next session, race weekend, or driver standings
- `Komari`: personal server node status

Legacy `Clock`, `Weather`, `Date`, `Quick Link`, `Todo`, and `Calendar` widgets have been retired. When older layouts or backups are read, those entries are filtered while currently supported widgets are preserved.

### Move a Widget

1. Enter edit mode
2. Drag the handle on the top-left of a widget
3. Drop it in the desired position

If the target area is already occupied, NaviDash automatically reflows nearby widgets.

### Edit Widget Content

Different widgets support different editing flows:

- `Memo` can be edited directly inside the widget and saves automatically
- `Today`, `Links`, `Poster`, `F1`, and `Komari` are configured through the settings modal

### Open Widget Settings

1. Enter edit mode
2. Click the settings button on the widget
3. Update size or widget-specific configuration in the modal

## Common Widget Notes

### Today

- Combines time, English date labels, and live weather in a `2×2` information panel
- Uses the server-side `/api/weather` proxy
- Shows weather configuration status and connection testing under global Settings
- Stores only the selected city or coordinates in Today
- Reads API keys, hosts, and authentication modes only from server-side environment variables

If weather does not appear, check:

- whether `QWEATHER_API_KEY` is set in `.env`
- whether the container or dev server has been restarted
- whether the connection test in global Settings succeeds
- whether the city or coordinates in Today are valid

### Memo

- Supports direct writing inside the widget
- Supports lightweight Markdown-like formatting such as headings, lists, links, and quotes
- Saves automatically

### Links

- `1×1` is suitable for one frequent destination
- Wider sizes work for a grouped collection of sites or services
- The launcher records actual opens and gradually improves result ordering

### Poster

- Supports one or multiple images
- Is frameless and static by default, with optional autoplay and interval settings

### F1

- Uses the built-in 2026 season schedule without requiring an ICS URL or external account
- Hides practice by default and highlights the next qualifying, sprint, or race session
- Automatically displays every session in the current device's time zone
- Can include practice sessions or hide the countdown through widget settings
- Can switch to driver standings, fetched server-side from Jolpica and cached for 24 hours
- Keeps tentative races visibly marked instead of presenting them as confirmed

### Komari

- Each widget follows one Komari node and displays availability, resource use, network, and traffic data
- The Komari URL and optional API key stay in the deployment host's `.env`; they are not stored in widgets or backups
- Add multiple widgets to monitor multiple personal servers

## Global Settings

Use the settings button in the bottom toolbar to open the global settings modal.

The main sections are:

- Appearance
- Language
- Data tools

### Appearance

You can customize:

- background presets
- custom background image
- blur
- overlay opacity
- page title and favicon under advanced options

### Language

- Switch the current interface language

### Data Tools

Available actions include:

- apply the Blank, Focused, or Personal Wall homepage template
- import bookmarks from a browser-exported HTML file
- export current configuration as JSON
- import configuration from JSON
- restore settings and widgets to defaults

Applying a template or restoring a backup replaces the current widgets and layouts after
confirmation. Exporting a backup first is recommended.

Bookmarks in the Dock manages the complete link library, which is searched by the quick launcher.
Frequent Links widgets reference only the bookmarks pinned to the homepage. Removing a bookmark
from a widget or deleting the widget does not delete it from the library. Browser HTML imports add
bookmarks without changing the canvas.

## Data Persistence

NaviDash is designed primarily for personal LAN deployment. Runtime data is usually stored in the host-mounted data directory.

This includes:

- global settings
- widget layouts
- widget configuration

For Docker deployments, it is recommended to mount the data directory outside the repository, such as `/opt/navidash-data`.

## Demo Mode

If demo mode is enabled:

- the UI remains fully explorable
- front-end interactions still work
- a refresh restores the default demo content
- writes are not persisted

This is useful for public previews, not long-term usage.

## FAQ

### Why do my changes disappear after refresh?

Usually one of these is true:

- the app is running in demo mode
- the persistence directory is not mounted correctly or is not writable

### Why does Today show no weather data?

Check:

- whether `QWEATHER_API_KEY` is configured
- whether the container has been restarted
- whether the weather connection test in global Settings succeeds
- whether the city or coordinates in Today are valid
- whether the weather service is reachable from your environment

### How do I back up my homepage completely?

Open the settings modal and export a JSON backup from the data tools section.  
If you use Docker, backing up the mounted host data directory is also recommended.

### How do I return to a clean state?

Use the reset action in the settings modal.  
For a full reset, you can also remove the runtime data from the mounted directory and restart the container.
