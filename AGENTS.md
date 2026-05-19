# AGENTS.md — League Akari

AI agent onboarding guide. Describes the project layout and architecture at a high level.

---

## Overview

**League Akari** is an Electron + Vue 3 desktop companion for League of Legends, built around the LCU (League Client Update) API. It provides automation, player analytics, and in-game utilities.

- **Main process**: Electron + Node.js, MobX, TypeORM + SQLite
- **Renderer process**: Vue 3 + Pinia + Naive UI + Tailwind CSS
- **Build tool**: electron-vite (Vite under the hood)
- **Language**: TypeScript throughout
- **Package manager**: Yarn 4

---

## Repository Layout

```
/
├── src/
│   ├── main/               # Electron main process
│   ├── renderer/           # 5 independent renderer windows
│   ├── renderer-shared/    # Shared renderer components, composables, shards, assets
│   ├── shared/             # Code shared between main and renderer (types, HTTP clients, shard framework)
│   └── preload/            # Electron preload script (exposes limited API to renderer)
├── resources/              # Static app resources (icons, etc.)
├── scripts/                # Build & release scripts
├── docs/                   # Documentation
├── electron.vite.config.ts # Build configuration
├── electron-builder.yml    # Packaging configuration
└── package.json
```

---

## Core Architecture: Shards

Everything is organized as **shards** — dependency-injected, lifecycle-managed modules.

- Framework lives in `src/shared/akari-shard/`
- A shard is a class decorated with `@Shard('id')` and optionally implementing `onInit` / `onDispose`
- Dependencies are declared as constructor parameters and injected automatically via TypeScript reflection
- Shards are registered in `src/main/bootstrap/index.ts` using `manager.use(...)`

### Main Process Shards (`src/main/shards/`)

~30 shards, roughly grouped as:

| Group              | Examples                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Infrastructure     | `ipc`, `logger-factory`, `mobx-utils`, `setting-factory`, `storage`                                                               |
| Client connections | `league-client`, `riot-client`, `game-client`                                                                                     |
| Windows & UI       | `window-manager`, `tray`, `keyboard-shortcuts`                                                                                    |
| Features           | `auto-select`, `auto-gameflow`, `auto-reply`, `ongoing-game`, `saved-player`, `statistics`, `sgp`, `remote-config`, `self-update` |

### Renderer Shards (`src/renderer-shared/shards/`)

Mirror shards on the renderer side that communicate with main via IPC and expose state to Vue components.

---

## Windows

There are **5 renderer windows**, each an independent Vite entry:

| Window       | Entry                                   | Role                                           |
| ------------ | --------------------------------------- | ---------------------------------------------- |
| Main         | `src/renderer/src-main-window/`         | Primary UI: player lookup, automation, toolkit |
| Aux          | `src/renderer/src-aux-window/`          | Lightweight secondary window                   |
| OP.GG        | `src/renderer/src-opgg-window/`         | Embedded OP.GG champion stats                  |
| Ongoing Game | `src/renderer/src-ongoing-game-window/` | Real-time in-game display                      |
| CD Timer     | `src/renderer/src-cd-timer-window/`     | Floating cooldown tracker                      |

Each window follows the same pattern: `main.ts` → `App.vue` → Vue Router → views.

---

## Shared Code (`src/shared/`)

| Directory                | Contents                                                     |
| ------------------------ | ------------------------------------------------------------ |
| `akari-shard/`           | Shard framework (manager, decorators, interfaces)            |
| `types/`                 | TypeScript types for LCU, Riot, OP.GG, SGP, IPC, etc.        |
| `http-api-axios-helper/` | Axios-based API clients (LCU, Riot, OP.GG, SGP, game client) |
| `data-adapter/`          | Transforms raw API responses into app models                 |
| `data-sources/`          | External data providers (Fandom wiki, GTIMG CDN)             |
| `schemas/`               | Zod validation schemas                                       |
| `i18n/`                  | `en/` and `zh-CN/` translation YAML files                    |
| `utils/`                 | General-purpose helpers                                      |

---

## Renderer-Shared Code (`src/renderer-shared/`)

Shared across all 5 windows:

| Directory      | Contents                                                     |
| -------------- | ------------------------------------------------------------ |
| `components/`  | Reusable Vue components (match cards, icons, overlays, etc.) |
| `composables/` | Vue 3 composables for data fetching and UI logic             |
| `shards/`      | Renderer-side shard implementations                          |
| `assets/`      | Fonts, CSS, champion images, rank icons, logos               |
| `theme/`       | Theme configuration and CSS variables                        |
| `utils/`       | Renderer-specific helpers                                    |

---

## Renderer Theme System

The app does **not** use a `.dark` class for dark mode. Renderer windows set theme state on
`document.documentElement` through `useColorThemeAttr(...)`:

- `data-theme`: current color mode, usually `light` or `dark`
- `data-theme-id`: concrete theme id, such as `light`, `dark`, `graphite`, `cyber`, etc.
- `color-scheme`: kept in sync with the current color mode

Tailwind usage:

- `dark:*` utilities are allowed in templates because `src/renderer-shared/assets/css/tailwind.css`
  defines the `dark` variant as `[data-theme=dark]`.
- Do not add or depend on a `.dark` class in Vue, CSS, tests, or debugging snippets.

Plain CSS / scoped CSS usage:

- Use `[data-theme='dark'] ...` when writing manual dark-mode selectors.
- For themed variants beyond classic light/dark, prefer the CSS variables in
  `src/renderer-shared/assets/css/theme-system.css`, especially for surfaces, borders, and text.

---

## State Management

| Layer                | Tool                       | Where                        |
| -------------------- | -------------------------- | ---------------------------- |
| Main process         | MobX (observable + action) | `src/main/shards/**`         |
| Renderer             | Pinia stores               | per-window `stores/` folders |
| Persistence          | SQLite via TypeORM         | `src/main/shards/storage/`   |
| Main → Renderer sync | IPC + MobX reactions       | renderer shards              |

---

## IPC Pattern

- Main-side shard exposes handlers; renderer-side shard calls them
- Standard response envelope: `{ success: boolean; data?: T; error?: string }`
- Types defined in `src/shared/types/ipc/`

---

## Key Entry Points

| File                                | Purpose                                   |
| ----------------------------------- | ----------------------------------------- |
| `src/main/index.ts`                 | Electron main entry, single-instance lock |
| `src/main/bootstrap/index.ts`       | Shard registration and app initialization |
| `src/shared/akari-shard/manager.ts` | Shard lifecycle engine                    |
| `src/main/shards/window-manager/`   | Window creation and lifecycle             |
| `src/main/shards/league-client/`    | LCU WebSocket + REST connection           |
| `src/main/shards/storage/`          | Database setup and entities               |
| `electron.vite.config.ts`           | All build entry points                    |

---

## Common Tasks

### Add a main-process feature

1. Create `src/main/shards/{name}/index.ts` with `@Shard('id')` class
2. Inject needed shards as constructor params
3. Implement `onInit` / `onDispose` as needed
4. Register in `src/main/bootstrap/index.ts`

### Add a renderer-facing feature

- Mirror the main shard with a renderer shard in `src/renderer-shared/shards/`
- Expose data via IPC and consume in a Vue composable or Pinia store

### Add a new window

1. Add HTML file under `src/renderer/`
2. Create `src/renderer/src-{name}/` with Vue 3 app
3. Add entry to `electron.vite.config.ts` renderer inputs
4. Instantiate in `window-manager`
5. Add path alias to `tsconfig.web.json`

---

## Development

```bash
yarn dev          # Dev mode with hot reload
yarn build        # Production build (current platform)
yarn build:win    # Windows build
yarn build:mac    # macOS build
yarn typecheck    # Type check (Node + Web)
yarn format       # Prettier
```

Logs are written to `./logs/` via Winston. The SQLite database lives at `<userData>/LeagueAkari.db`.
