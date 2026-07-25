<p align="center">
  <img width="144" height="144" alt="NaviDash logo" src="https://github.com/user-attachments/assets/19ebe243-3f0c-4c48-b512-c9a98f23a0c3" />
</p>

# NaviDash

> 把每天打开的首页，布置成自己的样子。

**中文** | [English](./README_EN.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.7.3-green.svg)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed.svg)

[在线体验](https://navidash.vercel.app/zh) · [开始部署](./docs/DEPLOY.md) ·
[使用指南](./docs/USER_GUIDE.md)

每天打开浏览器时，你真正需要的通常只有几件事：进入最常用的网站、搜索一个内容、看一眼
时间和天气，或者临时记下一段信息。NaviDash 把它们放在一张安静、自由、属于你的首页上。

## 它能带来什么

- **少找一步**：输入一个字母，就能快速命中经常打开的网站。
- **越用越顺手**：主页会在当前浏览器中记住你的使用习惯，把更可能需要的入口排在前面。
- **信息刚刚好**：时间、天气和临时内容随手可见，但不会把首页变成拥挤的信息面板。
- **布置自己的空间**：像整理一面墙一样摆放入口、便签和海报，桌面与手机各有自己的布局。
- **数据留在手中**：可以部署在自己的电脑、NAS 或服务器上，也可以随时备份和迁移。

## 一面墙，四种内容

| | |
| --- | --- |
| **常用入口** | 把每天都会打开的网站固定在熟悉的位置 |
| **今日信息** | 安静地展示时间、日期和天气 |
| **随手贴** | 临时保存文本、链接或稍后要用的信息 |
| **海报** | 用喜欢的图片建立属于自己的主页氛围 |

## 快速开始

```bash
git clone https://github.com/wtfllix/navidash.git
cd navidash
cp .env.example .env
sudo mkdir -p /opt/navidash-data
docker compose up -d
```

打开 [http://localhost:3000](http://localhost:3000)，然后从底部 Dock 添加书签和内容。

天气、访问保护、局域网、HTTPS、升级和备份说明见
[部署指南](./docs/DEPLOY.md)。

## 本地开发

```bash
npm install
npm run dev
```

## 了解更多

- [部署指南](./docs/DEPLOY.md)
- [使用指南](./docs/USER_GUIDE.md)
- [更新记录](./changelog.md)
- [English README](./README_EN.md)

## 字体与致谢

Today 的手写日期使用 [Yellowtail](https://fonts.google.com/specimen/Yellowtail)，由
Astigmatic 设计，并依据 Apache License 2.0 随项目分发。许可证全文见
[`public/fonts/Yellowtail-LICENSE.txt`](./public/fonts/Yellowtail-LICENSE.txt)。

## License

MIT
