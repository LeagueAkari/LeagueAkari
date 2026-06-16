---
name: league-akari-mcp-debug
description: Use the configured Playwright MCP CDP connection to debug League Akari dev windows directly, and troubleshoot only when the MCP target is unavailable.
---

# League Akari MCP Debugging

Use this skill when inspecting or debugging League Akari renderer windows through the Playwright MCP/CDP connection.

## Core Rule

Start from the configured MCP/CDP target. Do not manually discover the debug port first unless MCP fails to show League Akari targets.

Expected MCP behavior in this project:

- The active MCP host should configure Playwright MCP with `--cdp-endpoint=http://127.0.0.1:8944`.
- The MCP command may also pass `--init-page=./scripts/playwright-mcp-init-page.cjs`; today that script only neutralizes forced media color scheme and does not inject extra debug globals.
- League Akari dev startup sets Electron's `remote-debugging-port` to `8944`.
- If the app is already running in dev mode, MCP should expose League Akari webContents as browser tabs.

## Normal Workflow

1. Connect to the configured MCP/CDP target and select a League Akari renderer tab.
2. Identify the selected renderer with `window.akariWindowType`.
3. Use the project-specific globals, renderer shards, `akari://` protocol, and debug UI below.
4. If no League Akari target appears, use the troubleshooting section.

Do not restate generic MCP browser usage in this skill. The MCP server already exposes those tools; this skill exists to describe League Akari's own debug surface after the connection works.

## Renderer Console Entry Points

When running code in the selected renderer console/evaluate context, keep snippets small, return JSON-serializable values when possible, and use `console.log(...)` markers when a trace should be captured by the MCP console tool.

Useful first probes:

```js
window.akariWindowType
```

```js
window.akariManager?._getInitializationReport?.()
```

```js
Array.from(window.akariManager?._instances?.keys?.() ?? []).map(String)
```

The renderer console is not a Node.js console. Use exposed preload APIs and renderer shards instead of `require`, filesystem access, or main-process globals.

## In-Page Debug Globals

League Akari exposes several project-specific globals in renderer windows:

- `window.akariWindowType`: current window type, such as `main-window`, `aux-window`, `opgg-window`, `ongoing-game-window`, or `cd-timer-window`.
- `window.akariManager`: renderer shard manager. Use `window.akariManager.getInstance('<shard-id>')` to access instantiated renderer shards in the selected window.
- `window.electron`: limited preload bridge from `@electron-toolkit/preload`; use it only for low-level IPC when a renderer shard wrapper is unavailable.
- `window.lcuApi`: League Client HTTP helper, available in windows that register `LeagueClientRenderer`.
- `window.sgpApi`: SGP HTTP helper, available in windows that register `SgpRenderer`.
- `window.selfUpdateShard`: self-update renderer shard, available in the main window.

Window-specific availability:

| Window       | Always useful globals / shards                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Main         | `window.akariManager`, `window.lcuApi`, `window.sgpApi`, `window.selfUpdateShard`, `renderer-debug-renderer`, most feature shards |
| Aux          | `window.akariManager`, `window.lcuApi`, `window-manager-renderer`, automation shards                                              |
| OP.GG        | `window.akariManager`, `window.lcuApi`, `opgg-renderer`, `auto-champ-config-renderer`                                             |
| Ongoing Game | `window.akariManager`, `window.lcuApi`, `window.sgpApi`, `ongoing-game-renderer`                                                  |
| CD Timer     | `window.akariManager`, `window.lcuApi`, `window.sgpApi`, `additional-info` shard, `window-manager-renderer`                       |

Convenient console helper:

```js
const shard = (id) => window.akariManager.getInstance(id)
```

Common read-only probes:

```js
await shard('app-common-renderer').getRuntimeInfo()
```

```js
await window.lcuApi.gameflow.getGameflowPhase().then((r) => r.data)
```

```js
await window.lcuApi.summoner.getCurrentSummoner().then((r) => r.data)
```

```js
await fetch('akari://league-client/lol-gameflow/v1/gameflow-phase').then((r) => r.json())
```

## Practical Debug Patterns

When a bug report says two UI surfaces show different data, first prove whether the formatter or the data source differs. Compare the direct LCU response against renderer/main cached state for the same key:

```js
const shard = (id) => window.akariManager.getInstance(id)
const all = await shard('ongoing-game-renderer').getAll()
const puuid = Object.keys(all.rankedStats ?? {})[0]
const cached = all.rankedStats?.[puuid]
const direct = await window.lcuApi.ranked.getRankedStats(puuid).then((r) => r.data)
JSON.stringify(cached?.queues) === JSON.stringify(direct?.queues)
```

For large structures, write evaluation output to a file when the MCP tool supports it instead of printing huge JSON into the chat. Keep the returned value summarized and preserve the full shape in `.playwright-mcp/*.json` or another ignored scratch path.

When a renderer error appears immediately after editing a Vue component, reload the selected tab once before concluding the code is broken. Vite HMR can briefly run a half-updated module; a reload distinguishes stale HMR state from a real runtime error.

Prefer serializable, normalized comparisons for API shape checks:

```js
const compactRanked = (stats) =>
  stats?.queues?.map((q) => ({
    queueType: q.queueType,
    tier: q.tier,
    division: q.division,
    leaguePoints: q.leaguePoints,
    wins: q.wins,
    losses: q.losses
  }))
```

Useful renderer logging probes:

```js
shard('logger-renderer').debugRenderer('mcp', 'debug marker', {
  windowType: window.akariWindowType
})
```

```js
shard('logger-renderer').setLogLevel('debug')
```

```js
await shard('logger-renderer').openLogsDir()
```

`logger-renderer` methods without the `Renderer` suffix also forward to the main log file. The `Renderer` suffix variants write only to the selected renderer console.

## Internal Debug Shards

Main-window-only debug helpers:

- `renderer-debug-renderer`: add LCU event rules, mirror native LCU events into the renderer, or ask main to log all LCU events.
- `main-window-ui-renderer`: controls main-window UI/debug page state.
- `self-update-renderer` and `window.selfUpdateShard`: update workflow diagnostics.

Examples:

```js
const rd = shard('renderer-debug-renderer')
rd.addRule('/lol-gameflow/v1/**')
```

```js
await shard('renderer-debug-renderer').setLogAllLcuEvents(true)
```

Turn noisy logging back off when done:

```js
await shard('renderer-debug-renderer').setLogAllLcuEvents(false)
```

Direct subscription from any window with `LeagueClientRenderer`:

```js
const stop = shard('league-client-renderer').onLcuEventVue(
  '/lol-gameflow/v1/**',
  (event, params) => {
    console.log('[LCU]', event.uri, event.eventType, params, event.data)
  }
)
// Later:
stop()
```

## Window And DevTools Controls

Every renderer window registers `window-manager-renderer`. It can show, hide, move, resize, pin, or open DevTools for League Akari windows through IPC.

Examples:

```js
await shard('window-manager-renderer').mainWindow.toggleDevtools()
```

```js
await shard('window-manager-renderer').auxWindow.show(true)
```

```js
await shard('window-manager-renderer').ongoingGameWindow.setPinned(true)
```

```js
await shard('window-manager-renderer').cdTimerWindow.setIgnoreMouseEvents(false)
```

These commands mutate window state. Use them intentionally and restore settings when the debug session is done.

## Cross-Window Evaluation

If MCP is attached to one renderer but a snippet must run in another League Akari target, use the internal `akari://renderer-link/evaluate` protocol. This calls main-process `AppCommonMain.evaluate(...)`.

Targets:

- `main-window`
- `aux-window`
- `cd-timer-window`
- `ongoing-game-window`
- `opgg-window`
- `main`: dev-only main process eval. The snippet runs inside an async function with `app`, `manager`, `shared`, `logger`, and `process` parameters available.

Example:

```js
const code = `console.log('[mcp cross-window]', window.akariWindowType)`
await fetch(`akari://renderer-link/evaluate?target=aux-window&code=${encodeURIComponent(code)}`)
```

This is powerful and intentionally dangerous. Prefer selecting the target tab through MCP when possible.

Dev-only main process example:

```js
const code = `logger.info('mcp', 'main process eval', process.type); return app.getVersion()`
await fetch(`akari://renderer-link/evaluate?target=main&code=${encodeURIComponent(code)}`)
```

## Built-In Debug UI

The main window has a Settings > Debug page. It can:

- Open the current logs directory.
- Open the app user data directory.
- Toggle logging for all native LCU events.
- Add LCU event filter rules.
- Show current LCU connection port, PID, auth token, region, and platform.
- Show current gameflow phase.
- Show runtime information from the main process.
- Toggle the test page.

Use the UI when the user needs a reproducible manual path; use console/evaluate when you need faster inspection or a one-off probe.

## Multiple Windows

League Akari has multiple Electron renderer windows. MCP can show several debug targets at once.

Common windows include:

- Main window, usually `main-window.html`.
- Aux window, usually `aux-window.html`.
- OP.GG window.
- Ongoing game window.
- Cooldown timer window.

Pick the target by URL, title, or visible page contents. If multiple tabs have the title `League Akari`, inspect the URL before acting.

## Requirements

MCP debugging works only when all of these are true:

- League Akari is running.
- League Akari is running in dev mode.
- The Electron app was started with the remote debugging port enabled.
- The active MCP host has the Playwright MCP server configured and enabled.

Do not expect this workflow to work against a stopped app or a production build unless the app was explicitly started with a CDP endpoint.

## If MCP Is Missing

If the user does not have the Playwright MCP server configured, guide them to configure the MCP host they are using or offer to configure it for them.

The equivalent Playwright MCP command should include the CDP endpoint and optional init page:

```bash
npx @playwright/mcp@latest --cdp-endpoint=http://127.0.0.1:8944 --init-page ./scripts/playwright-mcp-init-page.cjs
```

Prefer a project-local MCP configuration when the host supports it. Use a user/global MCP configuration only when the user wants the setup to apply across projects.

After configuration, the MCP host may need to reload or restart before the Playwright MCP tools appear.

## Troubleshooting Only After Direct MCP Fails

If MCP does not show League Akari renderer targets, check these in order:

1. Confirm the League Akari app is running in dev mode.
2. Confirm the active MCP host config starts Playwright MCP with `--cdp-endpoint=http://127.0.0.1:8944`.
3. Check the source of truth for the dev debug port in `src/main/bootstrap/index.ts`, inside `bootstrap()`. In dev mode, it appends Electron's `remote-debugging-port` switch.
4. If necessary, query `http://127.0.0.1:8944/json/version` or `http://127.0.0.1:8944/json/list` to verify the CDP endpoint. This is a fallback diagnostic step, not the normal workflow.
5. If the port does not respond, start or restart League Akari in dev mode.
6. If the port differs from `8944`, update the MCP `--cdp-endpoint` to match the app's configured debug port.

## Interpretation Notes

Renderer console errors can be normal depending on local League Client, SGP, or Riot service state. For example, `403`, `405`, or client-disconnected states are not necessarily MCP failures.

Separate MCP connectivity problems from application runtime problems:

- MCP connectivity problem: no League Akari tabs, cannot connect to CDP, or MCP tools unavailable.
- Application runtime problem: League Akari tab is visible, but UI, console, or network shows app-specific errors.

When using console/evaluate:

- Prefer read-only probes first.
- Treat `window.lcuApi` methods that `post`, `put`, `patch`, or `delete` as mutating League Client state.
- Treat renderer shard setters and `setting-utils-renderer.set(...)` as persistent configuration changes.
- Avoid `app-common-renderer.exit()` unless explicitly requested.
- If you enable noisy event logging, disable it before finishing the debug session.
