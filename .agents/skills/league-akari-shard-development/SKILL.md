---
name: league-akari-shard-development
description: Use when creating, extending, refactoring, splitting, or reviewing League Akari main or renderer shards, including shard file organization, controller/loader/executor/handler boundaries, naming conventions, renderer TSX usage, platform guards, and public contract compatibility.
---

# League Akari Shard Development

Use this skill for any League Akari shard work: creating a new shard, adding a feature to an existing shard, splitting a large shard, normalizing names, or reviewing shard organization.

The goal is stable shard architecture: clear responsibilities, boring public contracts, platform-safe side effects, and minimal behavior drift.

## Enforcement Scope

These rules are hard requirements for any newly created shard and for any feature migration into a shard. Do not treat them as optional style guidance.

- Existing shards do not need retroactive cleanup just because they predate this skill.
- When creating a new shard, moving a feature into another shard, or consolidating several features under one shard, follow Create Mode / Refactor Mode structure from the start.
- Do not dump migrated feature logic directly into `index.ts`, even if the old shard was small. `index.ts` should stay an entrypoint for DI, settings registration, state sync, controller construction, lifecycle orchestration, and thin compatibility methods.
- For a local change inside an old shard that is not already organized this way, ask the user whether to:
  - make a narrow in-place change; or
  - first reorganize the touched area according to this skill, then apply the change.
- If the user explicitly requests a fast or narrow fix, keep the edit local but do not make the old structure worse. Add a controller/context split only when the requested change itself creates or migrates a functional module boundary.

## Core Rules

- Preserve public contracts unless the user explicitly asks to change them:
  - `@Shard(...)` id
  - renderer shard id
  - bootstrap registration identity
  - IPC namespace, call names, and event names
  - settings keys
  - propSync keys
  - renderer store data shape
  - persisted data shape
- For refactors, do not split files under 500 lines unless the user explicitly asks or there is a correctness reason.
- For new shards, do not start with a giant `index.ts`. Add structure only where it has a real boundary.
- Do not split a coherent flow just because it is long. A clear state-sync pipeline can stay together.
- Prefer mechanical extraction before behavior changes.
- Use full descriptive names:
  - `remoteConfig`, not `rc`
  - `leagueClient`, not `lc`
  - `savedPlayer`, not `sp`
  - `settingFactory`, not `setting`
  - `logger`, not `log`
  - `ipc`, not `ipcMain`
- In League Akari shard classes, private fields and methods use a leading `_` prefix.
  Keep injected constructor properties private and underscored unless they are intentionally public.
- Keep platform-specific side effects behind explicit platform guard helpers.
- Renderer VNode-heavy modules should be `.tsx`; avoid large `h(...)` chains.
- Use project loggers, not `console`.
- Never revert unrelated dirty files.

## Initial Workflow

1. Check the worktree:

```bash
git status --short
```

2. For refactor target discovery, use a Node-based scan instead of OS-specific shell utilities:

```bash
node -e "const fs=require('node:fs');const path=require('node:path');const roots=['src/main/shards','src/renderer-shared/shards','src/renderer'];const out=[];function walk(dir){if(!fs.existsSync(dir))return;for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile()&&ent.name==='index.ts'&&p.split(path.sep).includes('shards'))out.push(p)}}roots.forEach(walk);out.map(f=>[fs.readFileSync(f,'utf8').split(/\\r?\\n/).length,f]).sort((a,b)=>b[0]-a[0]).forEach(([n,f])=>console.log(String(n).padStart(5),f))"
```

3. Read enough code to identify:
   - shard ids and public calls
   - injected dependencies
   - settings/state persistence
   - propSync/store shape
   - IPC registration
   - lifecycle hooks
   - reactions or subscriptions that must be owned by a controller
   - side effects
   - platform assumptions
   - pure helpers worth testing

4. Decide whether the task touches a new/migrated feature or an old shard local edit:
   - New shard or feature migration: follow the hard structure rules without asking.
   - Old shard local edit: if the user did not specify architecture scope, ask whether to change in place or reorganize the touched area first.

5. Choose one of two modes:
   - **Create mode**: design the minimal shard shape before coding.
   - **Refactor mode**: preserve behavior first, then split by actual responsibilities.

## Create Mode

When creating a new main shard:

1. Pick a stable shard id. Main-facing ids normally end with `-main`.
2. Create `src/main/shards/<name>/index.ts`.
3. Add `state.ts` only if the shard owns observable state/settings.
4. Add `context.ts` if more than one internal module needs the same dependencies.
5. Add `ipc-handlers.ts` if renderer calls into it.
6. Register the shard in `src/main/bootstrap/index.ts`.
7. If renderer-facing, create the renderer shard/store under `src/renderer-shared/shards/<name>/`.
8. Use `SettingFactoryMain` for persisted settings and `MobxUtilsMain.propSync(...)` for synced state.
9. Keep side effects behind clearly named methods or controller/executor modules.
10. Add focused tests for pure helpers, platform guards, config migration, or race-prone executors.

Minimal new shard shape:

- Main `index.ts`: `@Shard`, injected shards, logger/settings setup, `applyToState()`, `propSync(...)`, lifecycle, and thin public methods.
- Renderer `index.ts`: `@Shard`, `@Dep(...)` injections, Pinia/MobX sync, and thin IPC wrapper methods.
- Keep feature logic out of the entry file once it grows beyond one obvious responsibility.

## Refactor Mode

After splitting, `index.ts` should usually contain only:

- `@Shard(...)` class and compatibility constants
- dependency injection
- settings registration
- state initialization and propSync
- construction of controllers/loaders/handlers
- lifecycle orchestration
- thin public methods that existing callers use

Move feature logic into internal modules. Pass a typed context object rather than long constructor parameter lists.

Good entry file after extraction:

```ts
@Shard(SelfUpdateMain.id)
export class SelfUpdateMain implements IAkariShardInitDispose {
  static id = SELF_UPDATE_MAIN_NAMESPACE

  public readonly settings = new SelfUpdateSettings()
  public readonly state = new SelfUpdateState()

  private readonly context: SelfUpdateMainContext
  private readonly executor: SelfUpdateExecutor
  private readonly ipcHandlers: SelfUpdateIpcHandlers

  constructor(/* injected shards */) {
    this.context = {
      namespace: SelfUpdateMain.id,
      settings: this.settings,
      state: this.state /* ... */
    }
    this.executor = new SelfUpdateExecutor(this.context)
    this.ipcHandlers = new SelfUpdateIpcHandlers(this.context, this.executor)
  }

  async onInit() {
    await this.setupState()
    this.ipcHandlers.register()
  }
}
```

Bad extraction:

```ts
private _rc: RemoteConfigMain
private _ipcMain: AkariIpcMain
private _doEverything() { /* still owns IPC, watchers, fetching, cache, side effects */ }
```

## Allowed Shard Modules

Use a deliberately small set of module shapes for shard feature organization. For newly created
shards and migrated feature code, choose from this list when a file owns shard lifecycle, IPC,
state/store wiring, feature coordination, data loading, command-like side effects, platform guards,
or renderer UI tied to the shard.

- `index.ts`: the shard entrypoint. Owns `@Shard`, DI, settings registration, state sync, lifecycle
  orchestration, internal module construction, and thin compatibility methods.
- `context.ts`: shared internal dependencies, namespace/id constants, settings keys, loading
  priorities, and shard-local result types. Add it only when more than one internal module needs the
  same dependencies or constants.
- `state.ts`: MobX state/settings classes.
- `store.ts`: Pinia store for renderer shards.
- `ipc-handlers.ts`: IPC `onCall` / `onEvent` registration and thin delegation.
- `platform.ts`: pure platform guard helpers.
- `*-controller.ts`: feature flow coordination. Use this for lifecycle, reactions, watchers,
  subscriptions, routing, registries, configuration collections, derived UI options, settings
  resolution, and any glue code that does not fit `loader` or `executor`.
- `*-loader.ts`: data loading and refresh. Use this for remote/local fetches, cache reads/writes,
  queue tags, reload methods, and normalizing loaded data before handing it to a controller.
- `*-executor.ts`: one imperative operation that may fail, be canceled, or need a structured result.
  Use this for process launches, filesystem writes, downloads, apply/uninstall actions, and other
  command-like side effects.
- `*-component.tsx` or a descriptive `.vue` file: renderer component colocated with a shard. Do not
  use `comp.tsx`.
- `*-notification.tsx`, `*-modal.tsx`, `*-dialogs.tsx`: renderer notification/modal/dialog modules
  that compose VNodes or JSX.
- `*.test.ts`: focused tests for pure helpers, guards, races, migrations, and normalization.

Utility modules are outside the shard-organization suffix rules. If a file is pure support code and
does not express a shard feature boundary, name it naturally for what it contains. Examples include
domain constants, schemas, mapping tables, parsers, formatters, tiny calculation helpers, and
test-only builders. These files must not own IPC, lifecycle, timers, reactions, IO, mutable state, or
feature coordination. If they start owning one of those responsibilities, move the behavior into one
of the fixed shard module shapes above.

Project-specific exceptions:

- `state.ts` and `store.ts` are fixed names for MobX state/settings and Pinia stores.
- TypeORM entities keep their entity names under `storage/entities/`.
- Storage upgrades and config migrations keep versioned names such as `version-15.ts` and `from-1-4-3.ts`.
- `league-client/lc-state/` may use LCU endpoint domain names such as `champ-select.ts` and `gameflow.ts`
  because that directory is a coherent state-sync pipeline.

## Context Pattern

Use context when multiple internal modules need shared dependencies.

```ts
export const SELF_UPDATE_MAIN_NAMESPACE = 'self-update-main'
export const PLATFORM_UNSUPPORTED_REASON = 'platform-unsupported'

export interface SelfUpdateMainContext {
  namespace: string
  settings: SelfUpdateSettings
  state: SelfUpdateState
  logger: AkariLogger
  appCommon: AppCommonMain
  ipc: AkariIpcMain
  mobxUtils: MobxUtilsMain
  remoteConfig: RemoteConfigMain
  httpClient: AxiosInstance
}
```

Keep original static class constants as aliases if existing code may reference them.

## Naming Rules

Use role-based, fully spelled names:

- `matchHistoryLoader`
- `playerDataLoader`
- `additionalInfoController`
- `sideEffectsController`
- `settingsController`
- `logger`
- `ipc`

Choose names in this order:

1. If it is the shard entry, use `index.ts`.
2. If it owns MobX state/settings or a Pinia store, use `state.ts` or `store.ts`.
3. If it only registers IPC, use `ipc-handlers.ts`.
4. If it only contains platform predicates, use `platform.ts`.
5. If it loads, refreshes, caches, or normalizes data, use `*-loader.ts`.
6. If it performs one command-like side effect, use `*-executor.ts`.
7. If it coordinates a feature flow, owns reactions/subscriptions, routes by domain keys, manages
   registrations, resolves settings into runtime choices, or prepares derived UI options, use
   `*-controller.ts`.
8. If it renders notification/modal/dialog/component UI, use the renderer UI suffixes above.
9. If it is pure utility/support code and does not express shard feature organization, use any clear
   descriptive file name.

When two role names seem plausible, choose the narrower allowed role first: `loader` for data
loading, `executor` for imperative commands, then `controller` for coordination. For example, a
module that "watches state and starts a reload" is a controller; the reload implementation itself
can live in a loader. A module that "resolves settings and launches a process" is usually a
controller plus an executor.

Do not rename public contracts only for style.

`ongoing-game-main` is a contract, not a naming cleanup target.

## Renderer Rules

Renderer shard entries follow the same orchestration rules.

- Keep composables (`useDialog`, `useNotification`, `useTranslation`, Pinia stores) inside setup functions or functions called from `setupInAppScope.addSetupFn(...)`, not at module top level.
- Render-heavy notification/modal modules should be `.tsx`.
- Reactive setup without JSX should live in a controller module.
- Colocated renderer components should use `*-component.tsx` or a descriptive `.vue` filename.
  Do not add vague files like `comp.tsx`.
- Preserve store fields and modal state shape.

Good TSX:

```tsx
export function registerUpdateDownloadFailedNotification(
  context: SimpleNotificationsRendererContext
) {
  const notification = useNotification()
  const { t } = useTranslation(undefined, {
    keyPrefix: 'simple-notifications-renderer.updateDownloadFailed'
  })

  context.ipc.onEventVue(SelfUpdateRenderer.id, 'error-download-update', (error) => {
    const item = notification.warning({
      title: () => t('title'),
      content: () => (
        <div>
          {t('content', { error: error.message })}
          <div class="flex justify-end gap-2">
            <NButton size="tiny" onClick={() => item.destroy()}>
              {t('negativeText')}
            </NButton>
          </div>
        </div>
      )
    })
  })
}
```

Avoid:

```ts
content: () => h('div', [h('span', text), h(NButton, { onClick }, () => label)])
```

For Vue model/update events in TSX, preserve exact event props with object spread:

```tsx
<UpdateModal
  {...{
    show: store.showNewReleaseModal,
    'onUpdate:show': (value: boolean) => (store.showNewReleaseModal = value),
    onStartDownload: () => selfUpdate.startUpdate()
  }}
/>
```

## Platform Guards

When behavior is platform-specific, add pure guard helpers and use them at every side-effect boundary.

```ts
export function shouldRunSelfUpdateLifecycle(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32'
}

export function shouldDownloadUpdateArchive(platform: NodeJS.Platform = process.platform) {
  return shouldRunSelfUpdateLifecycle(platform)
}
```

Guard:

- lifecycle start
- IPC handlers
- filesystem writes
- process spawning
- download/unpack/apply
- uninstall
- Windows APIs such as JumpList, WMI, registry, `.exe` updater

In tests, do not hardcode Unix paths like `/tmp`. Use `os.tmpdir()` and `path.join(...)`.

## IPC Rules

Keep IPC handlers thin and return real controller results.

```ts
this.context.ipc.onCall(this.context.namespace, 'startUpdate', async () => {
  if (!shouldRunSelfUpdateLifecycle()) {
    return { result: 'failed', reason: PLATFORM_UNSUPPORTED_REASON }
  }

  const release = this.context.remoteConfig.state.latestRelease
  if (!release?.isNew) return { result: 'no-op' }

  return await this.executor.start(release)
})
```

Avoid swallowing results:

```ts
await this.executor.start(release)
return { result: 'ok' }
```

## Logging

Use `LoggerFactoryMain` / `LoggerRenderer`.

- `warn`: unexpected but recoverable.
- `error`: current flow cannot continue.
- Do not log auth secrets, Riot/LCU tokens, or credential-bearing command lines.
- Good log boundaries: lifecycle start/end, IPC registration/call, remote fetch start/end, connection state transitions, queue start/end, cancel/abort.

## Testing And Verification

Add focused tests for:

- pure mapping/extraction helpers
- platform guards
- cancellation/race-prone executors
- config migrations
- data normalization edge cases

Prefer cross-platform commands. Avoid examples that depend on GNU tools, Bash-only syntax, or macOS-only paths unless the task itself is platform-specific.

Normal verification:

```bash
yarn prettier --write <changed-files>
yarn typecheck:node
yarn typecheck:web
yarn test
git diff --check
```

If the repo supports a single aggregate command, `yarn typecheck` is also acceptable. Report exact commands that were actually run.

## Examples

- New renderer-facing shard: create the main `index.ts`, add `state.ts` only when it owns
  observable state/settings, register settings with `SettingFactoryMain`, sync with
  `MobxUtilsMain.propSync(...)`, register the shard in bootstrap, and add the renderer shard/store
  only when renderer access is required.
- Large feature split: keep the original shard id, IPC names, settings keys, propSync shape, and
  renderer store shape unchanged. Extract `context.ts`, loaders, controllers, executors, and
  `ipc-handlers.ts` only around actual responsibilities.
- Coherent flow: keep related steps such as ban and pick together in one controller when they form
  one business flow. Split unrelated bench, trade, config, or local-message behavior elsewhere.
- Declarative remote config: put resource declarations in a pure data file such as
  `cached-resources.ts`, put common sync orchestration in `cached-sync-controller.ts`, and keep
  special release or announcement behavior in dedicated controllers.
- Windows-only updater: add `platform.ts`, guard lifecycle, IPC, download, apply, and uninstall
  side-effect boundaries, and put download/apply work in executors that return structured results.
- Renderer notification center: keep the renderer shard entry as orchestration, use `.tsx` for
  VNode-heavy notification/modal/dialog modules, and keep composables inside setup functions or
  setup-registered functions.
- Long coherent state sync: do not split `league-client/lc-state/index.ts` just because it is long.
  Preserve initial fetch, websocket event updates, disconnect cleanup, and MobX reaction coupling
  unless the user explicitly asks for a split or the endpoint domains become hard to maintain.

## Final Checklist

- New shard is registered and renderer-facing pieces are wired.
- Refactored entry file is orchestration, not a hidden giant.
- Each moved module has one responsibility.
- Names are full and descriptive.
- Public ids, IPC names, settings keys, propSync keys, and store shapes are unchanged unless requested.
- Platform-specific side effects are guarded.
- Renderer JSX lives in `.tsx`.
- Commands and tests do not assume macOS-only paths.
- No unrelated dirty files were reverted or reformatted.
- Verification commands were run and reported.
