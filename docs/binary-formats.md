# Artifact formats (JSON-only)

This repository is configured in **JSON artifact mode** because binary artifacts are not supported in the current delivery constraints.

- `data/points.json`: array of point records
  - `{ id, x, y, kind, subtype, clusterId, sizeHint }`
- `data/graph_media_relations.json`: array of `{ src, dst, weight }`
- `data/graph_media_staff.json`: array of `{ src, dst, weight }`
- `data/graph_people_collab.json`: array of `{ src, dst, weight }`

`data/manifest.json` includes `"format": "json"`.
