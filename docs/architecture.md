# Architecture
Durable ingest writes source entities and checkpoints to `scripts/.cache/anime-atlas.sqlite`. Artifact build reads sqlite and emits binary + chunked JSON under `data/`. Frontend progressively loads points and lookup/index files from `app/public/data`.
