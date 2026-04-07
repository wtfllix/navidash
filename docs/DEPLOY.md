# Deployment Guide

This guide covers multiple ways to deploy NaviDash, including Docker, manual deployment, and CI/CD pipelines.

## 1. Docker Deployment (Recommended)

### Method A: Use Pre-built Image (GHCR)

If you have configured the GitHub Actions workflow, you can pull the image directly:

```bash
# Pull the image
docker pull ghcr.io/your-username/navidash:latest

# Run the container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name navidash \
  --restart unless-stopped \
  ghcr.io/your-username/navidash:latest
```

### Method B: Build Manually

You can build the Docker image locally:

```bash
# Build the image
docker build -t navidash .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name navidash \
  --restart unless-stopped \
  navidash
```

### Method C: Docker Compose

Using the included `docker-compose.yml`:

```bash
docker-compose up -d
```

## 2. Manual Deployment (VPS/Node.js)

If you prefer not to use Docker, you can deploy using Node.js directly.

### Prerequisites
- Node.js 18+
- NPM or Yarn
- PM2 (recommended for process management)

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/wtfllix/navidash.git
   cd navidash
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

   **Using PM2 (Production):**
   ```bash
   npm install -g pm2
   pm2 start npm --name "navidash" -- start
   pm2 save
   ```

## 3. GitHub Actions (Automated Docker Build)

This repository includes a GitHub Actions workflow (`.github/workflows/docker-publish.yml`) that automatically builds and pushes a Docker image to GitHub Container Registry (GHCR) whenever you push to the `main` or `master` branch.

### Setup for GHCR (Default)
No additional setup is required. The workflow uses the `GITHUB_TOKEN` to authenticate with GHCR.

### Setup for Docker Hub (Optional)
If you prefer to push to Docker Hub instead of GHCR:

1. Go to your repository settings on GitHub.
2. Navigate to **Secrets and variables** > **Actions**.
3. Create the following secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username.
   - `DOCKERHUB_TOKEN`: Your Docker Hub Access Token.
4. Modify `.github/workflows/docker-publish.yml`:
   - Change `REGISTRY: ghcr.io` to `REGISTRY: docker.io` (or remove it to default to Docker Hub).
   - Update the login step to use your secrets.

## 4. Environment Variables

- `NEXT_PUBLIC_DEMO_MODE`: Set to `true` to enable demo mode (read-only).
- `NEXT_PUBLIC_QWEATHER_API_KEY`: API key used by weather widgets.
- `NEXT_PUBLIC_QWEATHER_API_HOST`: Optional custom host for weather widgets. When set, it takes priority over the widget-level host field.
- `NEXT_PUBLIC_QWEATHER_AUTH_TYPE`: Optional weather auth mode. Supported values: `apikey`, `jwt`. Legacy values `param` and `bearer` are still read for backward compatibility.
- `PORT`: Port to run the server on (default: 3000).

## 5. Persistence

The application stores runtime data under `/app/data`:

- `settings.json`: user settings, including weather-related preferences.
- `widget-layouts.json`: widget size and position data.
- `widget-configs.json`: widget-specific configuration data.

New files are written with a versioned envelope so future migrations can be handled explicitly, while legacy raw JSON files are still readable for backward compatibility.

`bookmarks.json` is a legacy sample file in the repository root and is not part of the current runtime persistence model.

In Docker, map the `/app/data` volume to persist these files. Runtime data should still stay out of version control, but weather API keys now belong in environment variables instead of `settings.json`.
