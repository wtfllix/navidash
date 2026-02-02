# 🧭 NaviDash

> A clean, efficient, and highly customizable personal dashboard.

[中文](./README.md) | **English**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.2.1-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed)

**NaviDash** is designed for users who seek ultimate efficiency and aesthetics. Abandoning clutter, it uses a classic "Pegboard" style foundation combined with a free-dragging grid layout to create a browser start page that is both beautiful and practical.

---

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

2.  **Start the container**
    ```bash
    docker-compose up -d
    ```

3.  **Access the app**
    Open your browser and visit `http://localhost:3000` to start using it.

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

For detailed usage instructions, please refer to the [User Guide](./docs/USER_GUIDE_EN.md).

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License
