# NaviDash

> A customizable personal start page with a pegboard-inspired layout.

[中文](./README.md) | **English**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.5.0-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed.svg)

NaviDash is a customizable personal homepage for people who want a cleaner and more intentional browser start page. It combines a pegboard-inspired visual style with a draggable widget canvas and local-first self-hosting, making it a good fit for long-term use on personal devices or home setups.

Live demo: [navidash.vercel.app/zh](https://navidash.vercel.app/zh)

## Who It's For

- People who want a personal start page with frequently used links and lightweight widgets
- Self-hosting users who prefer to keep data on their own machine or NAS
- Users who want a clean UI without giving up layout and appearance control

## Current Features

- Freely arranged widget canvas with drag, reflow, and size adjustment
- Pegboard-style background with custom wallpaper, blur, and overlay tuning
- Built-in `Clock`, `Weather`, `Date`, `Calendar`, `Todo`, `Memo`, `Quick Link`, `Links`, and `Photo Frame`
- Separate persistence for widget layout and widget configuration
- JSON import/export for backup and migration
- Docker-first self-hosting workflow for local container deployment
- Read-only demo mode for online preview

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

Recommended `apikey` mode:

```bash
QWEATHER_API_KEY=your_qweather_key
QWEATHER_API_HOST=your_qweather_host
QWEATHER_AUTH_TYPE=apikey
```

If you use JWT:

```bash
QWEATHER_API_KEY=your_qweather_jwt
QWEATHER_API_HOST=your_qweather_host
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
- `QWEATHER_API_KEY`: weather API key or JWT
- `QWEATHER_API_HOST`: optional custom weather host
- `QWEATHER_AUTH_TYPE`: `apikey` or `jwt`

Weather requests go through the server-side `/api/weather` proxy. In most cases, weather-related credentials should live in environment variables rather than widget config.

## Persistence

Runtime data is stored under `/app/data` and should be mounted to a host directory in Docker deployments.

The main persisted files are:

- `settings.json`
- `widget-layouts.json`
- `widget-configs.json`

These files use a versioned JSON envelope so future migrations remain explicit, while legacy raw JSON is still readable for backward compatibility.

## Documentation

- [Deployment Guide](./docs/DEPLOY.md)
- [User Guide](./docs/USER_GUIDE_EN.md)
- [Chinese README](./README.md)

## Demo Mode

NaviDash supports a read-only demo mode, which works well for Vercel deployments and public previews.

- Visitors can drag, edit, and explore the UI
- A refresh resets the page to curated demo content
- Write APIs return read-only errors and do not persist data

## Product Direction

The current direction is:

- a customizable personal start page
- a pegboard-inspired homepage experience
- local container deployment first
- gradual expansion toward widgets useful for home and self-hosted setups

## Contributing

Issues and pull requests are welcome.

## License

MIT
