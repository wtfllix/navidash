<p align="center">
  <img width="144" height="144" alt="NaviDash logo" src="https://github.com/user-attachments/assets/19ebe243-3f0c-4c48-b512-c9a98f23a0c3" />
</p>

# NaviDash

> Make the homepage you open every day feel like your own.

[中文](./README.md) | **English**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.7.3-green.svg)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed.svg)

[Try the Demo](https://navidash.vercel.app/en) · [Deploy NaviDash](./docs/DEPLOY.md) ·
[User Guide](./docs/USER_GUIDE_EN.md)

When you open a browser, you usually need only a few things: visit a familiar site, search for
something, glance at the time and weather, or keep a temporary note. NaviDash brings them together
in a quiet, flexible homepage that belongs to you.

## What changes for you

- **One less step**: type a letter and quickly reach the sites you open most.
- **Better with use**: your current browser remembers your habits and brings likely destinations forward.
- **Just enough information**: time, weather, and temporary content stay visible without creating clutter.
- **A space of your own**: arrange links, notes, and posters like objects on a wall, separately on desktop and mobile.
- **Your data, your home**: run NaviDash on your computer, NAS, or server, then back it up whenever you want.

## One wall, four kinds of content

| | |
| --- | --- |
| **Frequent destinations** | Keep everyday sites in familiar positions |
| **Today at a glance** | See the time, date, and weather quietly |
| **Sticky note** | Hold temporary text, links, or information for later |
| **Poster** | Use images you love to give the homepage its own atmosphere |

## Quick start

```bash
git clone https://github.com/wtfllix/navidash.git
cd navidash
cp .env.example .env
sudo mkdir -p /opt/navidash-data
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000), then add bookmarks and content from the
bottom Dock.

See the [deployment guide](./docs/DEPLOY.md) for weather, access protection, LAN access, HTTPS,
upgrades, and backups.

## Local development

```bash
npm install
npm run dev
```

## Learn more

- [Deployment Guide](./docs/DEPLOY.md)
- [User Guide](./docs/USER_GUIDE_EN.md)
- [Changelog](./changelog.md)
- [Chinese README](./README.md)

## Typeface credit

The handwritten date in Today uses
[Kaushan Script](https://fonts.google.com/specimen/Kaushan+Script), designed by Impallari Type and
distributed with NaviDash under the SIL Open Font License 1.1. See
[`public/fonts/KaushanScript-LICENSE.txt`](./public/fonts/KaushanScript-LICENSE.txt) for the full
license.

## License

MIT
