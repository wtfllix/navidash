<p align="center">
  <img width="160" height="160" alt="NaviDash logo" src="https://github.com/user-attachments/assets/19ebe243-3f0c-4c48-b512-c9a98f23a0c3" />
</p>

# NaviDash

> A lightweight, self-hostable start page for your links, searches, notes, and developer services.

[中文](./README.md) | **English**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.6.0-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed.svg)

[Live Demo](https://navidash.vercel.app/en) · [Deployment Guide](./docs/DEPLOY.md) · [User Guide](./docs/USER_GUIDE_EN.md) · [中文](./README.md)

NaviDash is a personal browser start page. It puts a few everyday things in one place: links you open often, quick search, temporary notes, and small bits of status from local development or self-hosted services.

It is not trying to become a full monitoring platform, RSS reader, or project management tool. There are already good tools for those jobs. NaviDash is meant to stay closer to a lightweight entry page.

## Why NaviDash

The original problem was simple: a browser homepage is often either empty, or just a pile of bookmarks. Once you start adding notes, todos, weather, project links, or service shortcuts, it can quickly turn into a heavy dashboard.

NaviDash keeps some layout freedom and personal style, but the core stays around everyday use. It is not meant to collect every possible widget.

- Keep common links and project entry points in one place.
- Search directly from the homepage and match saved links quickly.
- Drop temporary notes without opening a full document tool.
- Self-host with Docker and keep data on your own machine or NAS.
- Keep the scope small enough that it does not become another heavy all-in-one panel.

## Who It's For

| User type | What you may care about | What NaviDash provides |
| --- | --- | --- |
| Productivity users | Fast access, clear entry points, low setup cost | Links, search, notes, quick open |
| Visual users | A polished personal homepage with your own style | Wallpaper, pegboard layout, themes, visual configuration |
| Developers and self-hosters | Deployability, control, extensibility, service visibility | Docker deployment, persisted data, developer-oriented widget direction |

## Core Capabilities

### Core: Daily Entry Points

- Freely arranged widget canvas with drag, reflow, and size adjustment
- Separate desktop and mobile layouts with shared widget data
- Built-in `Quick Link`, `Links`, `Memo`, `Todo`, and other high-frequency widgets
- Canvas-level quick open and search for saved links and recent activity
- JSON import/export for backup and migration

### Theme: Personal Homepage

- Pegboard-inspired background
- Custom wallpaper, blur, and overlay tuning
- Built-in `Clock`, `Weather`, `Date`, `Calendar`, and `Photo Frame`
- Works well as a browser start page, personal homepage, or home-device dashboard

### Dev Pack: Developers and Self-Hosting

These are technical extensions I would like to explore next. They are meant to be quick-glance information on the homepage, not a full operations system.

- Local / LAN IP, public IP, and one-click copy
- Service status checks for `localhost:3000`, VPS targets, and API health endpoints
- Port shortcuts such as `3000`, `5432`, `6379`, and `8080`
- Lightweight Docker service status and port links

## Recent Updates

Current version: `0.6.0`

- Separate desktop and mobile layouts now share the same widget data
- Mobile layout editing supports undo and restore-to-session-start
- A canvas-level quick open and search panel makes saved links faster to access
- Demo mode is now part of the mainline build and can be enabled with environment flags
- `Todo` and `Memo` now show bottom scroll hints for long content

See [changelog.md](./changelog.md) for the full change history.

## Roadmap

This is the current direction, without fixed dates. Since this is a personal project, priorities may change based on real usage and feedback.

| Stage | Direction |
| --- | --- |
| Current focus | Links, search, notes, mobile layout, template experience |
| Next | Dev Pack: IP, service status, port shortcuts, lightweight Docker service visibility |
| Later | RSS recent updates, read-only iCal calendar, GitHub repository status |
| Not planned | Full monitoring and alerting platform, full RSS reader, two-way calendar sync, project management system |

## Quick Start

### Docker Deployment (Recommended)

1. Clone the repository

```bash
git clone https://github.com/wtfllix/navidash.git
cd navidash
```

2. Prepare a data directory

```bash
sudo mkdir -p /opt/navidash-data
```

By default, `docker-compose.yml` mounts runtime data to `/opt/navidash-data`. Keeping runtime data outside the git working tree is recommended so it is safer across upgrades and redeploys.

If you want a different location:

```bash
export NAVIDASH_DATA_DIR=/your/data/path
```

3. Copy the environment template

```bash
cp .env.example .env
```

4. Add weather configuration if you want the Weather widget

The current weather integration uses QWeather (HeWeather). Recommended `apikey` mode:

```bash
QWEATHER_API_KEY=your_qweather_key
QWEATHER_API_HOST=https://devapi.qweather.com
QWEATHER_AUTH_TYPE=apikey
```

If you use JWT:

```bash
QWEATHER_API_KEY=your_qweather_jwt
QWEATHER_API_HOST=https://devapi.qweather.com
QWEATHER_AUTH_TYPE=jwt
```

5. Start the container

```bash
docker-compose up -d
```

6. Open `http://localhost:3000`

### Upgrade

```bash
git pull
docker-compose pull
docker-compose up -d
```

As long as your data directory stays mounted outside the repository, your saved data remains intact during upgrades.

### Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

Useful commands:

```bash
npm run lint
npm test
npm run build
```

## Configuration

The most important environment variables in `.env.example` are:

- `NEXT_PUBLIC_DEMO_MODE`: enables read-only demo mode when set to `true`
- `DEMO_MODE`: enables demo data and read-only write protection on the server
- `QWEATHER_API_KEY`: QWeather (HeWeather) API key or JWT
- `QWEATHER_API_HOST`: optional custom QWeather-compatible host
- `QWEATHER_AUTH_TYPE`: `apikey` or `jwt`

Weather requests go through the server-side `/api/weather` proxy and currently target QWeather (HeWeather) by default. In most cases, weather-related credentials should live in environment variables rather than widget config.

## Persistence

Runtime data is stored under `/app/data` and should be mounted to a host directory in Docker deployments.

The main persisted files are:

- `settings.json`
- `widget-layouts.json`
- `widget-configs.json`

These files use a versioned JSON envelope so future migrations remain explicit, while legacy raw JSON is still readable for backward compatibility.

## Demo Mode

NaviDash supports a read-only demo mode, which works well for Vercel deployments and public previews.

- Visitors can drag, edit, and explore the UI
- A refresh resets the page to curated demo content
- Write APIs return read-only errors and do not persist data
- Recommended setup: enable both `DEMO_MODE=true` and `NEXT_PUBLIC_DEMO_MODE=true`

## Documentation

- [Deployment Guide](./docs/DEPLOY.md)
- [User Guide](./docs/USER_GUIDE_EN.md)
- [Changelog](./changelog.md)
- [Chinese README](./README.md)

## Contributing

Issues and pull requests are welcome. Feedback is especially useful when it is tied to a real workflow: link organization, search habits, note-taking, templates, or self-hosted usage.

## License

MIT
