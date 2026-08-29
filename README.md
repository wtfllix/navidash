<p align="center">
  <img width="128" height="128" alt="NaviDash Logo" src="https://github.com/user-attachments/assets/19ebe243-3f0c-4c48-b512-c9a98f23a0c3" />
</p>

<h1 align="center">NaviDash</h1>

<p align="center">
  <strong>把每天打开的首页，布置成自己的样子。</strong>
</p>

<p align="center">
  <strong>中文</strong> · <a href="./README_EN.md">English</a>
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="Version: 0.8.0" src="https://img.shields.io/badge/version-0.8.0-green.svg" />
  <img alt="Docker Ready" src="https://img.shields.io/badge/Docker-ready-2496ed.svg" />
</p>

<p align="center">
  <a href="https://navidash.vercel.app/zh"><strong>在线体验</strong></a>
  ·
  <a href="./docs/DEPLOY.md">局域网部署</a>
  ·
  <a href="./docs/USER_GUIDE.md">使用指南</a>
  ·
  <a href="https://t.me/+5iPcqd4_AvE0ZGY0">Telegram 群组</a>
</p>

<p align="center">
  <img width="820" alt="NaviDash 自托管个性化首页封面" src="./public/navidash-demo-cover.png" />
</p>

每天打开浏览器时，你真正需要的通常只有几件事：进入最常用的网站、搜索一个内容、
看一眼时间、天气和下一场比赛，或者临时记下一段信息。NaviDash 把它们放在一张安静、自由、
属于你的首页上。

## 实机界面

<p align="center">
  <a href="https://ibb.co/22gKLBP">
    <img width="49%" src="https://i.ibb.co/h5D8nvH/6e48bc7e-9b0b-4d62-8cbe-f52a3adbd3f5.png" alt="NaviDash 桌面端实际界面 1" />
  </a>
  <a href="https://ibb.co/nqHhnKBZ">
    <img width="49%" src="https://i.ibb.co/mrLQXP01/8a62daca-53a8-473b-a7a7-9fc1020f9435.png" alt="NaviDash 桌面端实际界面 2" />
  </a>
</p>

## 为什么选择 NaviDash

- **少找一步**：输入一个字母，就能快速命中经常打开的网站。
- **越用越顺手**：主页会在当前浏览器中记住使用习惯，把更可能需要的入口排在前面。
- **信息刚刚好**：时间、天气和临时内容随手可见，又不会让首页变成拥挤的信息面板。
- **布置自己的空间**：像整理一面墙一样摆放入口、便签和海报，桌面与手机各有自己的布局。
- **数据留在手中**：部署在自己的电脑、NAS 或服务器上，也可以随时备份和迁移。

## 一面墙，六种内容

| 内容 | 用途 |
| --- | --- |
| 🧭 **常用入口** | 把每天都会打开的网站固定在熟悉的位置 |
| ☀️ **今日信息** | 安静地展示时间、日期和天气 |
| 📝 **随手贴** | 临时保存文本、链接或稍后要用的信息 |
| 🖼️ **海报** | 用喜欢的图片建立属于自己的主页氛围 |
| 🏁 **F1 信息** | 按本地时间查看赛程，或切换到最新车手积分榜 |
| 🖥️ **Komari 节点** | 在首页查看个人服务器的实时状态 |

## 快速开始

### Docker Compose

```bash
git clone https://github.com/wtfllix/navidash.git
cd navidash
cp .env.example .env
sudo mkdir -p /opt/navidash-data
docker compose up -d
```

在部署主机上打开 [http://localhost:3000](http://localhost:3000)；同一局域网的手机或电脑使用
`http://部署主机IP:3000` 访问，然后从底部 Dock 添加书签和内容。

主机 IP、防火墙、天气、访问保护、升级和备份说明见
[部署指南](./docs/DEPLOY.md)。

### 本地开发

```bash
npm install
npm run dev
```

### 本地预览文档站

```bash
cd docs-site
npm ci
npm run dev
```

文档站会在 GitHub Pages 上由独立工作流发布；首次启用时，请在仓库 Settings → Pages 中将
发布源设置为 **GitHub Actions**。

## 项目文档

| 文档 | 内容 |
| --- | --- |
| [在线文档站](https://wtfllix.github.io/navidash/) | 中文优先的部署、使用、组件和排障指南 |
| [部署与使用 Wiki](./docs/WIKI.md) | 个人局域网部署、使用、备份与排障入口 |
| [部署指南](./docs/DEPLOY.md) | Docker、局域网访问、升级、备份和故障排查 |
| [使用指南](./docs/USER_GUIDE.md) | 首页组件、书签和日常使用 |
| [更新记录](./changelog.md) | 版本功能与重要变更 |
| [English README](./README_EN.md) | English project overview |

## 字体与许可证

Today 的手写日期使用 [Kaushan Script](https://fonts.google.com/specimen/Kaushan+Script)，
由 Impallari Type 设计，并依据 SIL Open Font License 1.1 随项目分发。
许可证全文见
[`public/fonts/KaushanScript-LICENSE.txt`](./public/fonts/KaushanScript-LICENSE.txt)。

NaviDash 基于 [MIT License](https://opensource.org/license/mit) 发布。
