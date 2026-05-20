---
name: league-akari-shard-development
description: Use when creating, extending, refactoring, splitting, or reviewing League Akari main or renderer shards, including shard file organization, controller/loader/handler boundaries, naming conventions, renderer TSX usage, platform guards, and public contract compatibility.
---

# League Akari Shard Development

Use this skill for any League Akari shard work: creating a new shard, adding a feature to an existing shard, splitting a large shard, normalizing names, or reviewing shard organization.

The goal is stable shard architecture: clear responsibilities, boring public contracts, platform-safe side effects, and minimal behavior drift.

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
  - `settingService`, not `setting`
  - `logger`, not `log`
  - `ipc`, not `ipcMain`
- Avoid leading underscores in new code unless matching an unavoidable local convention.
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
   - watchers/reactions
   - side effects
   - platform assumptions
   - pure helpers worth testing

4. Choose one of two modes:
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
    this.context = { namespace: SelfUpdateMain.id, settings: this.settings, state: this.state /* ... */ }
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

## Standard Files

- `context.ts`: namespace/id constants, settings keys, loading priorities, context interface, shared result types.
- `state.ts`: MobX state/settings classes.
- `ipc-handlers.ts`: IPC `onCall` / `onEvent` registration and thin delegation.
- `platform.ts`: pure platform guard helpers.
- `*-controller.ts`: feature coordination, lifecycle, watchers.
- `*-loader.ts`: data loading, caching, queue tags, reload methods.
- `*-executor.ts`: imperative operation that may fail or be canceled.
- `*-watcher.ts`: reactive observers without owning the core action.
- `*-manager.ts`: registry/config collection ownership.
- `*.test.ts`: pure helpers, guards, races, migrations.
- `*.tsx`: renderer modules that return JSX or compose VNodes.

Avoid vague names like `utils.ts`, `helpers.ts`, or `misc.ts` unless the code is genuinely generic and small.

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
- `settingService`
- `logger`
- `ipc`

Stable suffix meanings:

- `Loader`: loads remote/local data and may cache.
- `Controller`: coordinates one feature area.
- `Executor`: performs one imperative side effect.
- `Watcher`: registers reactive observers.
- `Handlers`: registers IPC/event handlers.
- `Manager`: owns a registry or configuration collection.

Do not rename public contracts only for style. `ongoing-game-main` is a contract, not a naming cleanup target.

## Renderer Rules

Renderer shard entries follow the same orchestration rules.

- Keep composables (`useDialog`, `useNotification`, `useTranslation`, Pinia stores) inside setup functions or functions called from `setupInAppScope.addSetupFn(...)`, not at module top level.
- Render-heavy notification/modal modules should be `.tsx`.
- Pure watcher modules without JSX can stay `.ts`.
- Preserve store fields and modal state shape.

Good TSX:

```tsx
export function watchUpdateDownloadFailed(context: SimpleNotificationsRendererContext) {
  const notification = useNotification()
  const { t } = useTranslation(undefined, { keyPrefix: 'simple-notifications-renderer.updateDownloadFailed' })

  context.ipc.onEventVue(SelfUpdateRenderer.id, 'error-download-update', (error) => {
    const item = notification.warning({
      title: () => t('title'),
      content: () => (
        <div>
          {t('content', { error: error.message })}
          <div class="flex justify-end gap-2">
            <NButton size="tiny" onClick={() => item.destroy()}>{t('negativeText')}</NButton>
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

## Few-Shot Examples

### Example 1: Create A Renderer-Facing Main Shard

User asks:

> 新增一个 feature toggle shard，renderer 能读状态并切换开关。

Good response:

- Add `src/main/shards/feature-toggle/index.ts` with `@Shard('feature-toggle-main')`.
- Add `state.ts` for observable settings/state.
- Register settings with `SettingFactoryMain`.
- Sync state/settings with `MobxUtilsMain.propSync(...)`.
- Add `ipc-handlers.ts` only if calls are more than trivial.
- Register main shard in bootstrap.
- Add renderer shard and Pinia store under `src/renderer-shared/shards/feature-toggle/`.
- Keep IPC namespace `feature-toggle-main` stable.

Bad response:

- Store settings only in a renderer store.
- Use `console.log`.
- Name dependencies `ipcMain`, `rc`, or `m`.
- Skip bootstrap registration.

### Example 2: Split A Large Main Feature Shard

User asks:

> 拆 `ongoing-game-main`，只做结构拆分，不改变 IPC 和 renderer 数据形状。

Good response:

- Keep `src/main/shards/ongoing-game/index.ts` as the only `@Shard('ongoing-game-main')`.
- Add `context.ts`, `match-history-loader.ts`, `player-data-loader.ts`, `analysis-controller.ts`, `additional-info-controller.ts`, `side-effects-controller.ts`, `ipc-handlers.ts`.
- Keep settings keys, IPC names, propSync shape, and renderer store shape unchanged.
- Extract pure team mapping and test it if mode-specific.

Bad response:

- Rename shard id to `ongoing-game`.
- Change renderer `getAll()` shape.
- Rewrite queue/cache policy while moving code.

### Example 3: Respect A Coherent Flow

User says:

> banpick 是一个流程，将它们放在一个文件里吧。

Good response:

- Keep ban and pick handling together in `ban-pick-controller.ts`.
- Split unrelated bench/trade/config/local-message code elsewhere.

Bad response:

- Create separate `ban-controller.ts` and `pick-controller.ts` just for symmetry.

### Example 4: Declarative Remote Config

User says:

> remote-config 不要硬编码每个配置，希望显式配置声明远端配置和刷新间隔。

Good response:

- Group resources by behavior:
  - cached and periodically fetched
  - volatile/realtime fetched
  - special update logic
- Put resource specs in `cached-resources.ts`.
- Put common sync orchestration in `cached-sync.ts`.
- Keep special release/announcement logic in dedicated controllers.
- Generate repetitive status messages from a fixed template.

Bad response:

- Replace many `if`s with one huge `switch`.
- Hide all behavior in untyped string maps.

### Example 5: Windows-Only Updater

User says:

> self-update 在 macOS 下下载更新并解压可以直接短路。

Good response:

- Add `platform.ts`.
- Guard lifecycle, IPC, download, apply, and uninstall.
- Split executor/watcher/IPC/uninstaller/checker.
- Test platform guards and cancellation/race behavior.
- Return executor results from IPC.

Bad response:

- Only guard `onInit()`.
- Leave `forceStartUpdate` able to copy `.exe` on macOS/Linux.
- Swallow update errors and leave UI state stuck.

### Example 6: Renderer Notification Center

User says:

> simple-notifications 已经变成常驻通知中心，拆它，并把 h 硬拼结构改成 vue-tsx。

Good response:

- Keep `SimpleNotificationsRenderer` as the entry.
- Add focused modules such as `announcement-modal.tsx`, `new-release-modal.tsx`, `system-warning-dialogs.tsx`, `update-download-failed.tsx`, `queueing-progress-task.ts`.
- Keep pure non-JSX modules as `.ts`.
- Preserve `lastAnnouncementUniqueId`, modal store fields, and setup order.

Bad response:

- Move all notification state into a new store shape.
- Keep huge `h(...)` trees in `.ts`.
- Call `useNotification()` at module top level.

### Example 7: Do Not Split Just Because It Is Long

Candidate:

> `league-client/lc-state/index.ts` is very long.

Good response:

- Recognize it is mostly a clear LCU state-sync pipeline.
- Split only if the user explicitly wants it or if endpoint domains become hard to maintain.
- Preserve initial fetch, websocket event update, disconnect cleanup, and MobX reactions per state group.

Bad response:

- Split every `_syncLcu*` method without checking whether lifecycle coupling becomes harder to reason about.

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
