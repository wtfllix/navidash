# 🧭 NaviDash

> 一个极简、高效、高度可定制的个人导航仪表盘。
> A clean, efficient, and highly customizable personal dashboard.

**中文** | [English](./README_EN.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.2.1-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed)

**NaviDash** 专为追求极致效率与美学的用户设计。它摒弃了繁杂的装饰，以经典的“洞洞板”风格为基础，结合自由拖拽的网格布局，为您打造一个既美观又实用的浏览器起始页。

---

## ✨ v0.2.1 更新日志 (Changelog)

- 📏 **布局系统升级**：优化了网格响应式断点（10/8/6/4/2 列），收紧了布局边距，大幅提升空间利用率。
- ☀️ **天气组件优化**：重新设计了 1x2 和 1x3 尺寸的显示布局，彻底解决了城市名称截断问题，信息展示更合理。
- 🧩 **组件选择器增强**：新增组件分类（系统/效率/自定义），优化了选择界面 UI，查找组件更快捷。
- 🌍 **国际化完善**：补充了组件分类等缺失的翻译文本。

## ✨ v0.2.0 新特性 (New Features)

- 🕰️ **拟真时钟 (Analog Clock)**：新增高品质拟真时钟样式，无边框设计，完美融入背景。
- 🎨 **极简背景管理**：默认采用质感十足的“洞洞板”背景，支持自定义图片 + 模糊/透明度调节，文字永远清晰可见。
- ⚙️ **配置简化**：移除了冗余的预设，专注于核心体验；优化了设置面板的交互逻辑。

## 🌟 核心功能

- 🎨 **高度可定制 UI**
  - **自由布局**：基于 Grid 的拖拽式看板，随心所欲调整组件位置与大小。
  - **背景系统**：默认洞洞板 (Pegboard) 风格，支持 HTTP 图片链接作为壁纸。
  - **视觉微调**：内置背景模糊与遮罩透明度调节，确保任何壁纸下内容都清晰易读。

- 🧩 **实用小组件**
  - **时钟**：支持数字/拟真双模式切换。
  - **天气**：实时天气更新 (QWeather 驱动)。
  - **效率工具**：待办事项 (Todo)、便签 (Memo)、日历 (Calendar)。
  - **相框**：展示你喜爱的照片。

- 📑 **强大的书签管理**
  - **无限层级**：侧边栏支持书签文件夹无限嵌套。
  - **智能图标**：自动集成 Lucide 图标库。
  - **拖拽整理**：直观的拖拽排序体验。

- 💾 **数据安全与自托管**
  - **完全掌控**：所有数据均可导出为 JSON 备份，随时恢复。
  - **Docker 部署**：提供开箱即用的 Docker 镜像，数据存储在本地 JSON 文件中，迁移只需复制文件。

---

## 🚀 快速开始

### 🐳 使用 Docker 部署（推荐）

这是最简单的运行方式，无需配置本地 Node.js 环境。

1.  **克隆仓库**
    ```bash
    git clone https://github.com/wtfllix/navidash.git
    cd navidash
    ```

2.  **启动容器**
    ```bash
    docker-compose up -d
    ```

3.  **访问应用**
    打开浏览器访问 `http://localhost:3000` 即可开始使用。

### 🛠️ 本地开发

如果您想参与开发或进行二次修改：

1.  **环境准备**
    - Node.js 18+
    - npm / yarn / pnpm

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发服务器**
    ```bash
    npm run dev
    ```
    访问 `http://localhost:3000`。

4.  **构建生产版本**
    ```bash
    npm run build
    npm start
    ```

---

## 📖 用户指南

详细的使用说明请参考 [用户指南 (User Guide)](./docs/USER_GUIDE.md)。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
