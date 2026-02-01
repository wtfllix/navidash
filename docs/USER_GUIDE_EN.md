# 📖 NaviDash User Guide

Welcome to NaviDash! This guide will help you get started quickly and build your own personalized dashboard.

---

## 🎨 Interface Overview

The main interface of NaviDash consists of three parts:
1.  **Main Dashboard**: The central area for placing various widgets (Clock, Weather, Memo, etc.).
2.  **Sidebar**: Hover over the left edge of the screen to reveal the sidebar, used for managing bookmarks and navigation.
3.  **Top/Bottom Toolbar**: Contains the search bar, edit mode toggle, and global settings.

---

## 🧩 Widget Management

### Adding Widgets
1.  Click the **Edit Mode** icon at the bottom of the page (usually an unlock 🔓 icon, or a "+" button).
2.  Select a widget from the popup library (e.g., "Clock", "Weather", "Todo").
3.  The widget will be automatically added to an empty space at the bottom of the dashboard.

### Moving & Resizing
1.  Enter **Edit Mode**.
2.  **Move**: Click and hold the **Drag Handle** at the top-left of a widget to move it anywhere.
3.  **Resize**: Drag the **Resize Handle** at the bottom-right of a widget to adjust its aspect ratio.

### Configuring Widgets
In Edit Mode, click the **Settings (⚙️)** button on the top-right of a widget to customize it.

#### 🕰️ Clock Widget
- **Style Switching**: Select **Digital** or **Analog** in the settings.
  - *Tip: The Analog clock features a borderless design that blends perfectly with the Pegboard background.*

#### ☀️ Weather Widget
- **Location**: Enter your city name (Pinyin or English supported).
- **Display**: Shows current temperature, weather conditions, feels-like temperature, etc.

#### 📝 Memo & Todo
- **Memo**: Click directly on the memo area to type content; saves automatically.
- **Todo**: Click "+" to add tasks, click the checkbox to mark as done.

---

## 🖼️ Background & Visual Customization

Click the **Settings** button on the sidebar bottom or the main interface to enter global settings.

### Default Background (Pegboard)
NaviDash defaults to a classic **Pegboard** style, offering a clean, tangible texture.

### Custom Wallpaper
1.  Find the **Background Image URL** input in the settings panel.
2.  Paste a link to any web image (starting with `http` or `https`).
    - *Recommended sources: Unsplash, Bing Daily Wallpaper, etc.*
3.  **Visual Tuning**:
    - **Blur**: Drag the slider to blur the background, making foreground widgets pop.
    - **Opacity**: Add a black overlay to improve text readability on bright backgrounds.

---

## 📑 Bookmark Management (Sidebar)

### Quick Navigation
- Hover over the left edge of the screen to slide out the sidebar.
- Click category folders to expand/collapse, click links to navigate.

### Editing Bookmarks
1.  Click the **Manage** button at the bottom of the sidebar.
2.  **Add**: Click "New Category" or "New Link".
3.  **Sort**: Drag and drop bookmarks or folders to reorder them.
4.  **Icons**: Enter an icon name (e.g., `github`, `youtube`, `code`) to automatically match Lucide icons.

---

## 💾 Data Backup & Restore

NaviDash values your data security; all configurations are stored locally.

### Export Backup
1.  Open the **Settings** panel.
2.  Click the **Export** button.
3.  The system will generate a `.json` file containing all your layout, widget configs, and bookmark data.

### Restore Data
1.  Open the **Settings** panel.
2.  Click the **Import** button.
3.  Select your previously backed-up `.json` file. Upon confirmation, the page will refresh with your restored configuration.
4.  *Note: Importing will overwrite your current configuration. Please proceed with caution.*

---

## ❓ FAQ

**Q: Why isn't my weather showing?**
A: Please check your network connection and ensure the city name is correct. Some regions might need a more specific name (e.g., "Beijing, China").

**Q: How do I reset all settings?**
A: There is a red **Reset** button at the bottom of the settings panel. Clicking it will restore the app to its initial state (Note: This action is irreversible).

**Q: Why does the Analog Clock have no background frame?**
A: This is to simulate a real wall clock effect, "hanging" naturally on the background wall. If you switch back to Digital, you will see the standard card background.

---

Enjoy using NaviDash! If you have more questions, feel free to submit feedback on our [GitHub Repository](https://github.com/wtfllix/navidash).
