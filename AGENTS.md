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

## Agent Workflow Requirements

Before touching project-specific architecture, use the relevant local skill and mention it in the
working update:

- **Shard work**: use `.agents/skills/league-akari-shard-development/SKILL.md` when creating,
  extending, refactoring, splitting, or reviewing any main or renderer shard.
- **Renderer UI work**: use `.agents/skills/league-akari-ui-components/SKILL.md` when implementing
  or reviewing renderer UI components, especially i18n interpolation, pluralization, Tailwind usage
  in SFC styles, or native semantic elements inside the Naive UI renderer.
- **SGP/LCU data-source work**: use `.agents/skills/league-akari-sgp-data-source/SKILL.md` when
  implementing or reviewing SGP API clients, LCU-vs-SGP source selection, League Servers remote
  config, Tencent cross-region behavior, token handling, or per-feature SGP interoperability.
- **Dev-window debugging**: use `.agents/skills/league-akari-mcp-debug/SKILL.md` when debugging
  League Akari dev windows through the configured Playwright MCP connection.

Do not rely on memory for these areas; read the skill first and follow its current rules.

---

## PR Workflow

When preparing or updating a pull request, follow the requirements in `PR_REQUIREMENTS.md` first.
This applies especially when the work was authored or reviewed with AI assistance.

---

## Git Attribution

When the user asks an agent to commit changes, add co-author attribution only if that agent
materially participated in the content of the commit.

- For Codex-authored or Codex-assisted commits, add
  `Co-authored-by: Codex <noreply@openai.com>`.
- For Claude-authored or Claude-assisted commits, add
  `Co-authored-by: Claude <noreply@anthropic.com>`.
- For other agents, attribution is optional and can be omitted unless the user or project policy
  asks for it.
- Do not add an agent co-author trailer when merely committing changes that were already fully
  authored by the user.

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

## File Organization

Prefer a single file for small, self-contained units. Once a component, feature, shard, composable,
or utility needs more than one dedicated source file, create a feature directory and keep its private
supporting files there.

- Do not leave pairs like `SomeComponent.vue` and `some-component.ts` side by side in a broad shared
  directory when the second file only serves that component.
- Use a directory such as `some-component/` with the component, local helpers, types, styles, and
  tests inside it. Export the public contract through `index.ts` when another module needs shared
  types or helpers.
- Apply this rule across the project, including renderer components, composables, shards, shared
  utilities, tests, and docs-adjacent implementation files.
- Keep broadly reusable primitives in the broad shared directory only when they are genuinely shared
  by multiple unrelated features.

---

## Core Architecture: Shards

Everything is organized as **shards** — dependency-injected, lifecycle-managed modules.

- Framework lives in `src/shared/akari-shard/`
- A shard is a class decorated with `@Shard('id')` and optionally implementing `onInit` / `onDispose`
- Dependencies are declared as constructor parameters and injected automatically via TypeScript reflection
- Shards are registered in `src/main/bootstrap/index.ts` using `manager.use(...)`

### Main Process Shards (`src/main/shards/`)

~30 shards, roughly grouped as:

| Group              | Examples                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Infrastructure     | `ipc`, `logger-factory`, `mobx-utils`, `setting-factory`, `storage`, `config-migrate`                                                                                                   |
| Client connections | `league-client`, `league-client-ux`, `riot-client`, `game-client`, `client-installation`                                                                                                |
| Windows & UI       | `window-manager`, `tray`, `keyboard-shortcuts`, `akari-protocol`                                                                                                                        |
| Features           | `auto-champ-config`, `auto-select`, `auto-gameflow`, `auto-reply`, `in-game-send`, `ongoing-game`, `respawn-timer`, `saved-player`, `statistics`, `sgp`, `remote-config`, `self-update` |
| Support/debug      | `app-common`, `extra-assets`, `renderer-debug`                                                                                                                                          |

### Renderer Shards (`src/renderer-shared/shards/`)

Mirror shards on the renderer side communicate with main via IPC and expose synced state to Vue
components. Some window-specific renderer shards live under that window's own `shards/` directory
such as `src/renderer/src-opgg-window/shards/`.

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

Each window has its own HTML entry, `main.ts`, `NaiveUIProviderApp.vue`, `App.vue`, and shard
manager. The main window uses Vue Router; the smaller windows usually compose their views directly.

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
- Tailwind is provided through `@tailwindcss/vite`, but the app does not use Tailwind's base/preflight
  as the renderer foundation. Native elements such as `button`, `input`, `ul`, `p`, and headings
  keep browser defaults unless styled or replaced with Naive UI components.
- Do not add or depend on a `.dark` class in Vue, CSS, tests, or debugging snippets.

Plain CSS / scoped CSS usage:

- Use `[data-theme='dark'] ...` when writing manual dark-mode selectors.
- When an SFC `<style>` block uses Tailwind-only syntax such as `@apply`, add
  `@reference '@renderer-shared/assets/css/tailwind.css';` before using it.
- For themed variants beyond classic light/dark, prefer the CSS variables in
  `src/renderer-shared/assets/css/theme-system.css`, especially for surfaces, borders, and text.

---

## State Management

| Layer                | Tool                       | Where                                                   |
| -------------------- | -------------------------- | ------------------------------------------------------- |
| Main process         | MobX (observable + action) | `src/main/shards/**`                                    |
| Renderer             | Pinia stores               | renderer shard `store.ts` files and window-local stores |
| Persistence          | SQLite via TypeORM         | `src/main/shards/storage/`                              |
| Main → Renderer sync | IPC + MobX reactions       | renderer shards                                         |

---

## IPC Pattern

- Main-side shards expose thin handlers with `AkariIpcMain.onCall(namespace, fnName, handler)`.
- Renderer-side shards call through `AkariIpcRenderer.call(...)`; callers receive the unwrapped
  return value or a thrown error.
- The internal IPC envelope is `{ success: true; data: T }` or `{ success: false; error: any }`.
  Do not hand-roll that envelope in feature shards; return real controller/service results and let
  the IPC router standardize the response.
- IPC handler names use camelCase. Renderer events sent through `sendEvent(...)` use kebab-case.
- IPC helper types are duplicated near the IPC shards (`src/main/shards/ipc/types.ts` and
  `src/renderer-shared/shards/ipc/types.ts`); shared domain payload types live under
  `src/shared/types/`.

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

Use the `league-akari-shard-development` skill first.

1. Create `src/main/shards/{name}/index.ts` with `@Shard('id')` class
2. Inject needed shards as constructor params
3. Implement `onInit` / `onDispose` as needed
4. Register in `src/main/bootstrap/index.ts`

### Add a renderer-facing feature

Use the `league-akari-shard-development` skill first.

- Mirror the main shard with a renderer shard in `src/renderer-shared/shards/`
- Expose data via IPC and consume in a Vue composable or Pinia store

### Change renderer UI

Use the `league-akari-ui-components` skill first. Prefer Naive UI primitives for interactive
controls, keep i18n sentence structure in YAML, and do not assume browser defaults are reset.

### Add a new window

Use the `league-akari-shard-development` skill first because new windows touch renderer shards,
window-manager contracts, and build entries.

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
yarn test         # Vitest test suite
yarn storybook    # Component/story preview
yarn format       # Prettier
```

Logs are written via Winston. On macOS they use Electron's `app.getPath('logs')`; on other packaged
builds they are written beside the executable under `logs/`. The SQLite database lives at
`<userData>/LeagueAkari.db`.
