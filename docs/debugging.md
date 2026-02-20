# Debugging
- `npm run db:status` shows checkpoint and ingested counts.
- If ingest stalls due to lease, wait for expiry or clear checkpoint lease columns.
- Run `npm run sanity:artifacts` to quickly verify generated files.
