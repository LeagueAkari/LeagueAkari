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
- SGP is undocumented and currently depends on packet-captured endpoint knowledge plus remote config.
- League Akari can call SGP directly because the League Client exposes usable tokens through LCU
  events: league session token and entitlements token.
- SGP is always richer and faster than LCU for supported Akari data flows:
  - LCU often returns a cropped abstraction, subset, or summary of backend data.
  - SGP exposes useful fields that LCU does not, especially in match-history and analysis data.
  - SGP direct HTTP is not limited by the local League Client's request throttling/concurrency, so
    high-volume match-history queries can be several times faster.
- **SGP server ID** is a League Akari abstraction, not a backend name. Tencent's LC region is always
  `TENCENT`, so Akari combines region plus `rsoPlatformId` into IDs such as `TENCENT_HN10`.
- SGP endpoint URLs are packet-captured configuration. Do not infer URL patterns from server IDs.

Core tension: SGP is the richer direct backend path, but it is undocumented, config-sensitive, and
less reliable across networks. LCU is local and narrower, but more stable.

## Tokens And Access

- Keep token type boundaries in code unless deliberately changing the SGP auth layer.
- Current routing rule:
  - `entitlements` token uses the configured `matchHistory` base URL.
  - `league-session` token uses the configured `common` base URL.
- `isTokenReady` means both token streams are ready. In practice they arrive together or shortly
  apart, so do not design partial-token behavior unless the auth layer changes.
- Token readiness is only an auth precondition. It is not proof that the target SGP server, feature,
  or cross-region request is valid.

## Region And Cross-Region Rules

Cross-region support is a Tencent-only loophole, not a general SGP feature.

- Tencent SGP often does not validate token home region for some APIs, so one Tencent sub-server's
  token may query another Tencent sub-server's data.
- This is incomplete. Some APIs, especially ranked-related APIs, do validate region and cannot be
  treated as cross-region capable.
- Non-Tencent regions generally validate the JWT token's region. Even when several regions share an
  SGP host or cluster, do not mix tokens across regions.
- Never infer "Tencent server" means "all Tencent SGP APIs interoperate". Decide by capability.
- Keep stable exceptions in mind: ranked-related SGP APIs do not cross-region; replay is LCU/current
  region only; spectator-related SGP behavior is legacy/unavailable unless intentionally revived.

When a target is cross-region and the target SGP server is not in Akari's config, report the failure
explicitly or close the unsupported tab. LCU is not a valid fallback for a cross-region target because
LCU queries the current local client region.

## Remote Config And Endpoint Fragility

SGP endpoint knowledge is configuration, not protocol truth.

- A known SGP server config is expected to provide both `matchHistory` and `common`; partial support
  is not a current product model. Missing server config means Akari does not know that SGP server.
- Most regions map directly to SGP path variables, but exceptions exist. For example, PBE needs
  explicit `regionPathParam` because SGP paths use `PBE1`.
- Region identifiers and endpoints can change. LCU may keep working because it abstracts the local
  client, while SGP immediately breaks when configured addresses or path variables are stale.
- When SGP config breaks, update the League Akari config repository/cloud config and keep built-in
  defaults coherent when needed.
- `tencentServerMatchHistoryInteroperability`, `tencentServerSpectatorInteroperability`, and
  `tencentServerSummonerInteroperability` are legacy config-shape fields. Keep them valid for older
  config/app versions, but do not design a generic non-Tencent interoperability system from them.

## Network And Proxy Caveats

SGP direct requests do not always follow the same network path as the League Client.

- In accelerator/VPN scenarios, especially China users playing overseas regions, the League Client
  may be accelerated while League Akari's direct SGP HTTP is not.
- LCU can remain healthy because it is local and the League Client owns its backend connectivity.
- Treat direct SGP network failures separately from "player/server not found" and from local LCU
  availability.
- Bad SGP network quality may show a warning, but must not silently switch the data source.

## Implementation Guardrails

- Do not preserve business-specific anchors in this skill. For current call sites, search the repo
  at implementation time instead of relying on stale file lists.
- Centralize data-source decisions around the effective capability being requested, not around broad
  checks such as "user prefers SGP" or "the tab is cross-region".
- Model at least these inputs before issuing an SGP request:
  - current SGP server ID from the connected client
  - target SGP server ID for the tab/query
  - whether the target is Tencent cross-region or same-region
  - whether the target SGP server exists in `leagueServers.servers`
  - token readiness as a separate request precondition
- Pass `__sgpServerId` only for SGP calls that intentionally target a specific SGP server.
- Do not infer cross-region support from shared hosts, similar URLs, or legacy interoperability
  arrays alone.
- Add focused tests when changing capability/source behavior. Cover Tencent cross-region,
  non-Tencent cross-region, missing SGP config, ranked exception, and token-not-ready cases.
