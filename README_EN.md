# 🧭 NaviDash

> A clean, efficient, and highly customizable personal dashboard.

[中文](./README.md) | **English**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.4.0-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed)

**NaviDash** is designed for users who seek ultimate efficiency and aesthetics. Abandoning clutter, it uses a classic "Pegboard" style foundation combined with a free-dragging grid layout to create a browser start page that is both beautiful and practical.

---

## ✨ v0.4.0 Changelog

- 🧩 **Widget Store Drag & Drop Upgrade**: Dragging from the widget store now auto-collapses the sidebar and returns focus to the main canvas.
- 📍 **Placement UX Improvements**: Improved placeholder feedback and drop positioning; removed the "fly-back" overlay effect.
- 🔁 **Conflict Reflow Enhancement**: Added chain-style downward reflow so conflicting widgets move in sequence with fewer cross-column jumps.
- ✨ **Edit-Mode Consistency**: Unified conflict detection and preview reflow behavior between edit-mode dragging and store-to-canvas dragging.
- 🧪 **Regression Coverage**: Added tests for placement and conflict scenarios, including tall-widget and mixed-height cases.

## ✨ v0.3.2 Changelog

- 🔗 **New Links Widget**: Added links collection widget with group title, icon size adjustment, label toggle, and bulk import functionality
- 🧠 **Smart Layout**: Improved WidgetPicker's intelligent occupancy detection algorithm to prevent widget overlap
- 🖱️ **Interaction Optimization**: Enhanced drag handle styling for better visual feedback and user experience
- 🔧 **Type Safety**: Updated Zod schema validation to support links widget type
- 🧪 **Test Coverage**: Added schema validation tests for links widget

## ✨ v0.3.1 Changelog

- 🐛 **Bug Fixes**: Fixed configuration sync issues for Quick Link and Memo widgets in certain scenarios.
- ✨ **Feature**: Quick Link widget now supports automatic website icon (Favicon) fetching.
- 🐳 **Docker**: Optimized `docker-compose.yml` configuration, defaulting to GHCR images.

## ✨ v0.3.0 Changelog

- 🔄 **Full Multi‑Device Sync**: Bookmarks, widget layouts, and personal settings now sync in real‑time across multiple devices.
- 🚀 **Smart Performance Optimization**: Introduced page visibility detection to pause synchronization when the page is in the background.
- 🐳 **Docker Deployment Upgrade**: Added `entrypoint` script to automatically fix permissions, resolving `EACCES` issues.

## ✨ v0.2.1 Changelog

- 📏 **Layout System Upgrade**: Optimized grid responsive breakpoints (10/8/6/4/2 columns) and reduced margins for better space utilization.
- ☀️ **Weather Widget Optimization**: Redesigned layouts for 1x2 and 1x3 sizes, resolving text truncation issues and improving information hierarchy.
- 🧩 **Widget Picker Enhancement**: Added widget categorization (System/Productivity/Custom) and improved selection UI.
- 🌍 **i18n Improvements**: Completed missing translations for widget categories.

## ✨ v0.2.0 New Features

- 🕰️ **Analog Clock**: New high-quality analog clock style with a borderless design that blends perfectly into the background.
- 🎨 **Minimalist Backgrounds**: Defaults to a textured "Pegboard" background; supports custom images with blur/opacity adjustments to keep text clear.
- ⚙️ **Simplified Config**: Removed redundant presets to focus on the core experience; optimized settings panel interaction.

## 🌟 Core Features

- 🎨 **Highly Customizable UI**
  - **Free Layout**: Grid-based drag-and-drop board; adjust widget position and size as you wish.
  - **Background System**: Default Pegboard style; supports HTTP image links as wallpapers.
  - **Visual Tuning**: Built-in background blur and overlay opacity adjustments ensure readability on any wallpaper.

- 🧩 **Useful Widgets**
  - **Clock**: Supports switching between Digital and Analog modes.
  - **Weather**: Real-time weather updates (powered by QWeather).
  - **Productivity**: Todo list, Memo, Calendar.
  - **Photo Frame**: Display your favorite photos.

- 📑 **Powerful Bookmark Management**
  - **Infinite Nesting**: Sidebar supports infinite nesting of bookmark folders.
  - **Smart Icons**: Automatically integrates Lucide icon library.
  - **Drag & Drop**: Intuitive sorting experience.

- 💾 **Data Security & Self-Hosting**
  - **Full Control**: All data can be exported as JSON backups and restored anytime.
  - **Docker Ready**: Provides out-of-the-box Docker images; data is stored in local JSON files, making migration as simple as copying files.

---

## 🚀 Quick Start

### 🐳 Deploy with Docker (Recommended)

This is the simplest way to run NaviDash without configuring a local Node.js environment.

1.  **Clone the repository**
    ```bash
    git clone https://github.com/wtfllix/navidash.git
    cd navidash
    ```

2.  **Prepare a data directory outside the repository**
    ```bash
    sudo mkdir -p /opt/navidash-data
    ```

    The default `docker-compose.yml` mounts persistent data to `/opt/navidash-data`. This is recommended over using `./data` inside the git working tree, which is easier to lose during redeploys, repo replacement, or workspace cleanup.

    If you prefer a different path, set it before starting:
    ```bash
    export NAVIDASH_DATA_DIR=/your/data/path
    ```

3.  **Start the container**
    If you want to use the Weather widget, first copy the template and edit `.env`:

    ```bash
    cp .env.example .env
    ```

    Recommended: `apikey` (preferred)
    ```bash
    QWEATHER_API_KEY=your_qweather_key
    QWEATHER_API_HOST=your_qweather_host
    QWEATHER_AUTH_TYPE=apikey
    ```

    If you use JWT instead, update `.env` to:
    ```bash
    QWEATHER_API_KEY=your_qweather_jwt
    QWEATHER_API_HOST=your_qweather_host
    QWEATHER_AUTH_TYPE=jwt
    ```

    Then start the container:
    ```bash
    docker-compose up -d
    ```

4.  **Access the app**
    Open your browser and visit `http://localhost:3000` to start using it.

### 🔄 Upgrade Guide

If you deploy with Docker, update with:

1.  **Pull the latest code**
    ```bash
    git pull
    ```

2.  **Pull the latest image**
    ```bash
    docker-compose pull
    ```

3.  **Restart the container**
    ```bash
    docker-compose up -d
    ```

    *Your data will remain safe as long as it is mounted outside the repository directory, using the default `/opt/navidash-data` or your own `NAVIDASH_DATA_DIR`.*

4.  **If you previously stored data in `./data` inside the repo**
    migrate it before your next redeploy:
    ```bash
    docker-compose down
    sudo mkdir -p /opt/navidash-data
    sudo cp -a ./data/. /opt/navidash-data/
    docker-compose up -d
    ```

### 🛠️ Local Development

If you want to contribute or modify the code:

1.  **Prerequisites**
    - Node.js 18+
    - npm / yarn / pnpm

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start development server**
    If you want to use the Weather widget, first copy the template and edit `.env`:

    ```bash
    cp .env.example .env
    ```

    Recommended: `apikey` (preferred)
    ```bash
    QWEATHER_API_KEY=your_qweather_key
    QWEATHER_API_HOST=your_qweather_host
    QWEATHER_AUTH_TYPE=apikey
    ```

    If you use JWT instead, update `.env` to:
    ```bash
    QWEATHER_API_KEY=your_qweather_jwt
    QWEATHER_API_HOST=your_qweather_host
    QWEATHER_AUTH_TYPE=jwt
    ```

    Then start the development server:
    ```bash
    npm run dev
    ```
    Visit `http://localhost:3000`.

4.  **Build for production**
    ```bash
    npm run build
    npm start
    ```

---

## 📖 User Guide

### ☀️ How to use the Weather widget

1.  Run `cp .env.example .env` in the project root, then edit `.env`.
    We recommend `QWEATHER_AUTH_TYPE=apikey`.
2.  Start the app and add a `Weather` widget.
3.  Open that widget's settings and fill in a city name or exact coordinates.
4.  If your deployment uses a custom Host or JWT authentication, configure those through environment variables.

Notes:
- The weather key is no longer stored in app settings, backup exports, or `settings.json`.
- If `QWEATHER_API_HOST` is set, it overrides the widget-level Host field.
- If `QWEATHER_AUTH_TYPE` is set, it overrides the widget-level auth setting.
- `apikey` is the recommended default; `jwt` is supported as an alternative.
- The weather tab has been removed from the main settings panel. Weather configuration now lives in each Weather widget's own settings.
- Weather requests now go through the server-side `/api/weather` proxy, so runtime container environment variables take effect immediately.

For detailed usage instructions, please refer to the [User Guide](./docs/USER_GUIDE_EN.md).

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License
