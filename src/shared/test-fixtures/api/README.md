# API Test Fixtures

This directory stores raw API responses that can be reused by unit tests across
`src/shared`.

The layout is snapshot-based:

```text
snapshots/{captured-date}-{server}/
  manifest.json
  lcu/{api-group}/...
  sgp/{api-group}/...
```

Raw response files should stay as close as possible to the API payload. Snapshot
metadata, including server, capture date, source player, and known coverage gaps,
belongs in `manifest.json` instead of being wrapped around each response.

The current snapshot was captured from a Tencent server login, so it should be
used to validate Tencent-reachable LCU/SGP behavior. It should not be treated as
proof that the same API route works on every Riot region.
