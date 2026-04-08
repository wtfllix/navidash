# Deployment Guide

This document focuses on the deployment paths that best match NaviDash today.

Current recommendation:

- local Docker deployment first
- persistent host-mounted data directory
- environment variables for weather and demo mode

## Recommended: Docker Compose

This is the preferred way to run NaviDash for long-term personal use.

### 1. Clone the repository

```bash
git clone https://github.com/wtfllix/navidash.git
cd navidash
```

### 2. Prepare a persistent data directory

```bash
sudo mkdir -p /opt/navidash-data
```

By default, [`docker-compose.yml`](/Users/lx/projects/navidash/docker-compose.yml) mounts:

- host: `/opt/navidash-data`
- container: `/app/data`

Keeping runtime data outside the repository is strongly recommended.

If you want a different host path:

```bash
export NAVIDASH_DATA_DIR=/your/data/path
```

### 3. Copy environment variables

```bash
cp .env.example .env
```

### 4. Configure weather if needed

If you want the `Weather` widget, set:

```bash
QWEATHER_API_KEY=your_qweather_key
QWEATHER_API_HOST=your_qweather_host
QWEATHER_AUTH_TYPE=apikey
```

If your weather provider setup uses JWT:

```bash
QWEATHER_API_KEY=your_qweather_jwt
QWEATHER_API_HOST=your_qweather_host
QWEATHER_AUTH_TYPE=jwt
```

### 5. Start the container

```bash
docker-compose up -d
```

### 6. Open the app

Visit:

```text
http://localhost:3000
```

## Upgrade

For a normal Docker Compose deployment:

```bash
git pull
docker-compose pull
docker-compose up -d
```

As long as your host data directory stays mounted, your saved layout and settings remain intact.

## Runtime Data

NaviDash stores runtime data under `/app/data`.

Current persisted files include:

- `settings.json`
- `widget-layouts.json`
- `widget-configs.json`

These files use a versioned JSON envelope so future migrations can stay explicit, while legacy raw JSON is still readable for backward compatibility.

## Environment Variables

Start from:

```bash
cp .env.example .env
```

Most important variables:

- `NEXT_PUBLIC_DEMO_MODE`
  Enables read-only demo mode when set to `true`
- `QWEATHER_API_KEY`
  Weather API key or JWT used by the server-side weather proxy
- `QWEATHER_API_HOST`
  Optional custom host for weather requests
- `QWEATHER_AUTH_TYPE`
  Supported values: `apikey`, `jwt`
- `PORT`
  Server port, default `3000`

Notes:

- weather requests go through `/api/weather`
- weather credentials should live in environment variables, not widget config
- for local container deployment, `DEMO_MODE` and `NEXT_PUBLIC_DEMO_MODE` should normally stay `false`

## Alternative: Docker Run

If you prefer a single `docker run` command instead of Compose:

```bash
docker run -d \
  -p 3000:3000 \
  -v /opt/navidash-data:/app/data \
  -e NODE_ENV=production \
  -e DEMO_MODE=false \
  -e NEXT_PUBLIC_DEMO_MODE=false \
  -e DATA_DIR=/app/data \
  -e QWEATHER_API_KEY=your_qweather_key \
  -e QWEATHER_API_HOST=your_qweather_host \
  -e QWEATHER_AUTH_TYPE=apikey \
  --name navidash \
  --restart unless-stopped \
  ghcr.io/wtfllix/navidash:latest
```

This is fine for simple setups, but `docker-compose.yml` is easier to maintain over time.

## Alternative: Build Locally

If you want to build the image yourself:

```bash
docker build -t navidash .
docker run -d \
  -p 3000:3000 \
  -v /opt/navidash-data:/app/data \
  --name navidash \
  --restart unless-stopped \
  navidash
```

## Non-Docker Deployment

NaviDash can also run directly with Node.js, but this is not the primary recommendation.

Requirements:

- Node.js 18+
- npm

Basic flow:

```bash
npm install
cp .env.example .env
npm run build
npm start
```

If you run without Docker, make sure the process has write access to the runtime data directory.

## Demo Deployment

NaviDash supports a read-only demo mode.

Set:

```bash
NEXT_PUBLIC_DEMO_MODE=true
```

In demo mode:

- the UI remains interactive
- refresh restores curated demo content
- write requests are blocked

This is useful for preview environments such as Vercel, but not for long-term personal usage with persistent data.

## GitHub Actions Image Publishing

The repository includes a GitHub Actions workflow at:

- [`.github/workflows/docker-publish.yml`](/Users/lx/projects/navidash/.github/workflows/docker-publish.yml)

It builds and publishes Docker images to GHCR on `main`, `master`, and version tags.

For most users, this just means you can pull and run the published image directly instead of building your own.
