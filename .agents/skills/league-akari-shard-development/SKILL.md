---
name: league-akari-shard-development
description: Use when creating, extending, refactoring, splitting, or reviewing League Akari main or renderer shards, including shard file organization, controller/loader/handler boundaries, naming conventions, renderer TSX usage, platform guards, and public contract compatibility.
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
  - `settingService`, not `setting`
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
   - watchers/reactions
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
- `*-service.ts`: stable service boundary, local persistence, renderer IPC facade, file IO, or reusable capability.
- `*-registry.ts`: owns a map/set of registrations and lookup/unregister semantics.
- `*-router.ts`: routes protocol/IPC/domain requests by explicit keys.
- `*-parser.ts`: converts strings or untyped payloads into typed values.
- `*-reader.ts`: reads streams/files/process output and normalizes the result.
- `*-formatter.ts`: formats messages or display/log payloads without side effects.
- `*-emitter.ts`: wraps event emission/logging behavior.
- `*-detector.ts`: discovers external installations, processes, or environment facts.
- `*-launcher.ts`: starts external applications/processes.
- `*-resolver.ts`: maps setting/domain values to concrete runtime values.
- `*-factory.ts`: constructs response/client/helper objects without owning lifecycle.
- `*-provider.ts`: supplies derived option lists or data for UI consumption.
- `*-subscription.ts`: owns subscribe/unsubscribe flow around an external event source.
- `*-component.tsx`: renderer component colocated with a shard. Do not use `comp.tsx`.
- `*-notification.tsx`, `*-modal.tsx`, `*-dialogs.tsx`: renderer notification/modal modules.
- `*.test.ts`: pure helpers, guards, races, migrations.
- `*.tsx`: renderer modules that return JSX or compose VNodes.

Avoid vague names like `utils.ts`, `helpers.ts`, `misc.ts`, `actions.ts`, or `comp.tsx`.
In shard directories, prefer a concrete role even for small helpers: for example
`window-position-service.ts`, `game-data-assets.ts`, `node-stream-reader.ts`, or
`ux-command-line-parser.ts`.

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
- `Service`: exposes a focused reusable capability behind a stable boundary.
- `Detector`: discovers external state and writes the discovered result into state.
- `Launcher`: starts an external process/application.
- `Parser`: turns strings or untyped input into typed data.
- `Reader`: reads streams/files/process output into a normalized value.
- `Resolver`: maps app settings or domain identifiers to runtime values.
- `Factory`: creates response/client/helper objects and does not own lifecycle.
- `Provider`: supplies derived UI options or catalog-like data.
- `Subscription`: owns subscribe/unsubscribe lifecycle for external event streams.
- `Registry`: owns keyed registration/unregistration.
- `Router`: dispatches a request by domain/path/protocol key.
- `Formatter`: formats log/display strings without side effects.

Avoid `Actions` as a class or file suffix. Use `Executor` for direct side effects and
`Controller` when the module also schedules, cancels, or coordinates those side effects.

Do not rename public contracts only for style. `ongoing-game-main` is a contract, not a naming cleanup target.

## Renderer Rules

Renderer shard entries follow the same orchestration rules.

- Keep composables (`useDialog`, `useNotification`, `useTranslation`, Pinia stores) inside setup functions or functions called from `setupInAppScope.addSetupFn(...)`, not at module top level.
- Render-heavy notification/modal modules should be `.tsx`.
- Pure watcher modules without JSX can stay `.ts`.
- Colocated renderer components should use `*-component.tsx` or a descriptive `.vue` filename.
  Do not add vague files like `comp.tsx`.
- Preserve store fields and modal state shape.

Good TSX:

```tsx
export function watchUpdateDownloadFailed(context: SimpleNotificationsRendererContext) {
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
