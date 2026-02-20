# Anime Atlas

Monorepo for durable AniList/Jikan ingest + static map frontend.

## Quickstart

```bash
npm install
npm run ingest:batched
npm run build:artifacts
npm run sanity:artifacts
npm run sync:data
npm run dev
```

## Pipelines
- **ingest.yml**: scheduled/manual durable batch ingest, rebuild artifacts, commit updated `data/`.
- **deploy.yml**: validates artifacts, syncs to app public folder, builds Vite app with `BASE_PATH`, deploys to GitHub Pages.

## Artifact format note
This repo currently uses **JSON artifacts only** (no committed binary `.bin` files).
Frontend runtime reads static files from `/public/data` and never calls AniList/Jikan directly.
