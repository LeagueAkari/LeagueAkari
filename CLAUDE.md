# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

League Akari is a League of Legends client toolkit built with **Electron + Vue 3 + TypeScript**. It integrates with the LCU (League Client Update) API to provide automation and utility features. The app runs as a multi-window Electron desktop application targeting Windows.

## Build & Development Commands

```bash
yarn install            # Install dependencies (requires NODE_AUTH_TOKEN for private GitHub packages)
yarn dev                # Start dev mode with hot reload (electron-vite dev --watch --inspect)
yarn build              # Typecheck + production build
yarn build:win          # Full Windows build with electron-builder (7z + NSIS installer)
yarn format             # Prettier with import sorting (@trivago/prettier-plugin-sort-imports)
yarn typecheck          # Run both node and web type checks
yarn typecheck:node     # TypeScript check for main/preload/shared code
yarn typecheck:web      # Vue-TSC check for renderer code
```

Package manager is **Yarn 4.9.1** (with node-modules linker). Private packages from `@leagueakari` and `@leaguetavern` scopes require a GitHub PAT set as `NODE_AUTH_TOKEN`.

## Architecture

### Shard System (Custom Dependency Injection)

The core architectural pattern is a **shard-based module system** in `src/shared/akari-shard/`. Shards are classes decorated with metadata that get automatically resolved, instantiated, and lifecycle-managed by `AkariManager`.

- `@Shard(id, priority)` — registers a class as a module; higher priority initializes first among peers
- `@Dep(dependency)` — marks a constructor parameter as a dependency (by ID or constructor reference)
- `@Config()` — marks a constructor parameter as a config object
- `IAkariShardInitDispose` — lifecycle interface with `onInit()`, `onDispose()`, `onFinish()` hooks
- Dependencies are resolved via TypeScript `emitDecoratorMetadata` reflection or explicit `@Dep` overrides
- `AkariManager.setup()` performs topological sort, instantiates all shards, then calls lifecycle hooks in order

Both main process (`src/main/shards/`, ~30 shards) and renderer (`src/renderer-shared/shards/`, ~28 shards) use this system independently.

### Multi-Window Electron Architecture

Five separate renderer windows, each with its own Vite entry point:

| Window | Entry HTML | Source |
|--------|-----------|--------|
| Main | `src/renderer/main-window.html` | `src/renderer/src-main-window/` |
| Auxiliary | `src/renderer/aux-window.html` | `src/renderer/src-aux-window/` |
| OP.GG | `src/renderer/opgg-window.html` | `src/renderer/src-opgg-window/` |
| Ongoing Game | `src/renderer/ongoing-game-window.html` | `src/renderer/src-ongoing-game-window/` |
| CD Timer | `src/renderer/cd-timer-window.html` | `src/renderer/src-cd-timer-window/` |

### IPC Pattern

Custom namespace-based IPC system (`AkariIpcMain` / `AkariIpcRenderer`):

- **Main → Renderer**: `sendEvent(namespace, eventName, ...args)` broadcasts to all tracked renderer windows
- **Renderer → Main**: `call(namespace, fnName, ...args)` for RPC-style invocation
- Standardized response: `{ success: boolean, data?: T, error?: Error }`
- Vue-aware event subscription via `onEventVue()` for automatic cleanup

### State Management

Hybrid approach:
- **Pinia** for Vue component state in renderers
- **MobX** for shared observable state (bridged via `pinia-mobx-utils` shard in renderer-shared)
- `AkariSharedGlobal` interface for cross-shard global state (logger, events, config, version)

## Source Structure

```
src/
├── main/                     # Electron main process
│   ├── shards/              # ~30 feature modules (auto-select, league-client, window-manager, etc.)
│   ├── bootstrap/           # App initialization & AkariManager setup
│   └── main.ts              # Entry point
├── preload/                  # Electron preload scripts
├── shared/                   # Code shared between main & renderer
│   ├── akari-shard/         # DI framework (decorators, manager, interface)
│   ├── types/               # TypeScript type definitions
│   ├── data-sources/        # External API clients (OPGG, SGP, Fandom, Gtimg)
│   ├── http-api-axios-helper/ # LCU HTTP API helpers
│   ├── i18n/                # i18n YAML resources (zh-CN, en)
│   └── utils/               # Shared utilities
├── renderer/                 # 5 window entry points + per-window source folders
│   ├── src-main-window/     # Primary UI (Vue Router, full feature set)
│   ├── src-aux-window/      # Auxiliary window
│   ├── src-opgg-window/     # OP.GG integration
│   ├── src-ongoing-game-window/
│   └── src-cd-timer-window/
└── renderer-shared/          # Shared renderer code
    ├── shards/              # ~28 renderer-side shards
    ├── components/          # Reusable Vue components
    ├── compositions/        # Vue composables
    └── assets/              # CSS, images, fonts
```

Additional top-level directories:

- `resources/` — native helpers, bundled tools, and install/runtime assets
- `pictures/` — project branding assets used in docs/releases
- `docs/` — project notes and announcement-style documentation

## Path Aliases

Defined in `electron.vite.config.ts`:

- `@shared/*` → `src/shared`
- `@main/*` → `src/main`
- `@renderer-shared/*` → `src/renderer-shared`
- `@main-window/*` → `src/renderer/src-main-window`
- `@aux-window/*` → `src/renderer/src-aux-window`
- `@opgg-window/*` → `src/renderer/src-opgg-window`
- `@ongoing-game-window/*` → `src/renderer/src-ongoing-game-window`
- `@cd-timer-window/*` → `src/renderer/src-cd-timer-window`

## Key Technologies

- **Build**: electron-vite + Vite 6 + SWC transpiler
- **UI**: Naive UI component library + Less styling
- **i18n**: i18next with YAML resources (`zh-CN` default, `en`), integrated via i18next-vue
- **Database**: TypeORM + SQLite3 for local persistence
- **HTTP**: Axios with axios-retry for LCU/Riot API communication
- **Logging**: Winston with file transport and structured namespace logging

## Code Style

- Prettier: single quotes, no semicolons, 100-char width, LF line endings
- Import sorting via `@trivago/prettier-plugin-sort-imports` (reflect-metadata first, then third-party, then local)
- TypeScript with `experimentalDecorators` and `emitDecoratorMetadata` enabled
- `reflect-metadata` must be imported before any decorator usage
- Prefer `.ts` for application logic and `.vue` SFCs for UI/view composition
- Follow existing kebab-case naming patterns for files and folders

## Language

Code comments and commit messages are primarily in **Chinese (zh-CN)**, with some English. The codebase is bilingual (zh-CN/en) for user-facing strings via i18n.

## Testing Expectations

There is no dedicated unit/integration test runner configured today. Baseline validation is:

- `yarn typecheck` before opening a PR
- manual verification in affected windows/flows for UI or behavior changes

If you add automated tests, colocate them with the feature or introduce a `tests/` directory and document new commands in `package.json`.

## Commit & PR Guidelines

- Follow Conventional Commits used in history: `feat:`, `fix:`, `chore:`, `refactor:`, `style:` (optional scope is encouraged).
- Keep commits focused and avoid mixing refactors with behavior changes unless tightly related.
- PRs should include: what changed, why it changed, how it was tested, linked issues, and screenshots for UI updates.
- Call out persistence/schema/config impacts explicitly (for example TypeORM entity changes or settings migration effects).
