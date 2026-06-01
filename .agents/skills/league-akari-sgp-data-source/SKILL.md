---
name: league-akari-sgp-data-source
description: Use when implementing or reviewing League Akari SGP/LCU data-source selection, SGP API clients, League Servers remote config, Tencent cross-region queries, token handling, or per-feature SGP interoperability.
---

# League Akari SGP Data Source

Use this skill before changing logic that decides whether a feature uses LCU or SGP, touches
SGP server config, adds SGP endpoints, or reasons about cross-region access.

## Mental Model

- **LCU** is the local League Client HTTP/WebSocket abstraction: `Akari -> LeagueClient.exe`.
- **SGP** means Service Gateway Proxy, the private HTTP API used by the League Client to talk to
  Riot/Tencent backend services: `LeagueClient.exe -> server`.
- SGP is undocumented. Endpoint knowledge comes from observed client traffic and remote config, not
  from a stable public contract.
- League Akari can call SGP directly because the League Client exposes usable SGP auth material
  through LCU events.
- SGP can expose backend data that LCU hides or reshapes, but support is endpoint-specific.
- **SGP server ID** is a League Akari abstraction, not necessarily a backend region name.
- SGP endpoint URLs are packet-captured configuration. Do not infer URL patterns from server IDs.

Core tension: SGP is the direct backend path, but it is undocumented, config-sensitive, and more
fragile across networks. LCU is local and narrower, but more stable.

## Tokens And Access

- Keep token type boundaries in code unless deliberately changing the SGP auth layer.
- Current auth model has two token streams: league session and entitlements.
- Token readiness is only an auth precondition. It is not proof that the target server, endpoint, or
  cross-region request is valid.
- Do not design partial-token behavior unless the SGP auth layer changes.

## Region And Cross-Region Rules

Cross-region access is not a general SGP feature.

- Some Tencent endpoints may accept tokens from another Tencent sub-server; many endpoints still
  validate token region. Treat interoperability as endpoint-specific.
- Non-Tencent regions generally validate token region. Shared hosts or similar URL shapes do not
  imply cross-region support.
- LCU queries the current local client region. It is not a cross-region backend.

## Remote Config And Endpoint Fragility

SGP endpoint knowledge is configuration, not protocol truth.

- Missing server config means Akari does not know how to call that SGP server.
- Path variables and backend identifiers can differ from Akari's server IDs.
- Region identifiers and endpoints can change. LCU may keep working because it abstracts the local
  client, while SGP immediately breaks when configured addresses or path variables are stale.
- Legacy remote-config fields may exist for compatibility. Do not generalize new behavior from old
  config shape alone.

## Network And Proxy Caveats

SGP direct requests do not always follow the same network path as the League Client.

- In accelerator/VPN scenarios, the League Client may be accelerated while League Akari's direct SGP
  HTTP is not.
- LCU can remain healthy because it is local and the League Client owns its backend connectivity.
- Treat direct SGP network failures separately from "player/server not found" and from local LCU
  availability.

## Implementation Guardrails

- Search current call sites instead of relying on file paths or business examples in this skill.
- Before issuing an SGP request, distinguish server config availability, token readiness, endpoint
  capability, region compatibility, and network failure.
- Pass an explicit target server only for calls that intentionally target a specific SGP server.
- Do not infer support from shared hosts, similar URLs, or legacy interoperability arrays alone.
