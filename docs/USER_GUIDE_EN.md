# NaviDash User Guide

This guide reflects the current product shape of NaviDash and focuses on the real interaction model in the app today.

## Layout Overview

NaviDash currently has three main areas:

1. Top bar
   Includes search, widget store toggle, edit mode toggle, and global settings.
2. Left widget store
   Used to browse, search, and add widgets.
3. Main canvas
   Your homepage area where widgets are placed and used daily.

## Basic Usage

### Search

- Use the top search bar to search with the selected search engine
- You can switch between supported engines
- `Ctrl + K` focuses the search input

### Edit Mode

- Use the top bar button to switch between customize and done states
- In edit mode, you can move widgets, open widget settings, and remove widgets

### Open the Widget Store

- Click the widget store button in the top bar
- Search for widgets or add them directly
- Some widgets open their settings right after creation for first-time setup

## Widget Actions

### Add a Widget

1. Open the widget store
2. Find the widget you want
3. Click to add it, or drag it onto the canvas where supported

Built-in widgets currently include:

- `Clock`
- `Weather`
- `Date`
- `Calendar`
- `Todo`
- `Memo`
- `Quick Link`
- `Links`
- `Photo Frame`

### Move a Widget

1. Enter edit mode
2. Drag the handle on the top-left of a widget
3. Drop it in the desired position

If the target area is already occupied, NaviDash automatically reflows nearby widgets.

### Edit Widget Content

Different widgets support different editing flows:

- `Memo` can be edited directly inside the widget and saves automatically
- `Todo` supports adding, toggling, and deleting tasks directly inside the widget
- `Clock`, `Weather`, `Links`, `Quick Link`, and `Photo Frame` are mainly configured through the settings modal

### Open Widget Settings

1. Enter edit mode
2. Click the settings button on the widget
3. Update size or widget-specific configuration in the modal

## Common Widget Notes

### Clock

- Displays the current time
- Supports multiple visual styles
- Density and layout vary depending on widget size

### Weather

- Uses the server-side `/api/weather` proxy
- Weather service credentials are best configured through environment variables
- At the widget level, you usually only need a city or coordinates

If weather does not appear, check:

- whether `QWEATHER_API_KEY` is set in `.env`
- whether the container or dev server has been restarted
- whether the city or coordinates are valid

### Memo

- Supports direct writing inside the widget
- Supports lightweight Markdown-like formatting such as headings, lists, links, and quotes
- Saves automatically

### Todo

- Add items directly in the widget
- Mark items as completed
- Delete items or clear completed ones

### Links / Quick Link

- `Quick Link` is suitable for a single shortcut
- `Links` is better for a grouped collection of frequently used destinations

### Photo Frame

- Supports one or multiple images
- Supports autoplay and interval settings

## Global Settings

Use the settings button in the top bar to open the global settings modal.

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
- theme color
- page title
- favicon

### Language

- Switch the current interface language

### Data Tools

Available actions include:

- export current configuration as JSON
- import configuration from JSON
- reset local data

Importing overwrites the current state, so exporting a backup first is recommended.

## Data Persistence

NaviDash is currently designed primarily for local deployment. Runtime data is usually stored in the host-mounted data directory.

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

### Why does the Weather widget show no data?

Check:

- whether `QWEATHER_API_KEY` is configured
- whether the container has been restarted
- whether the city or coordinates are valid
- whether the weather service is reachable from your environment

### How do I back up my homepage completely?

Open the settings modal and export a JSON backup from the data tools section.  
If you use Docker, backing up the mounted host data directory is also recommended.

### How do I return to a clean state?

Use the reset action in the settings modal.  
For a full reset, you can also remove the runtime data from the mounted directory and restart the container.
