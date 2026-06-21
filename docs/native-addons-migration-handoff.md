# Native Addons Migration Handoff

> Date: 2026-06-21
>
> Source addon repo: `C:\projects\addons`
>
> Target app repo: `C:\projects\LeagueAkari`
>
> Purpose: document the current state, known defects, integration risks, and open migration questions before moving the addons into the LeagueAkari main repository. This document intentionally does not freeze the final migration design.

## Background

`C:\projects\addons` currently contains a small Windows-only native addon package for LeagueAkari. It exposes native input, process, elevation, and League Client window utilities through a TypeScript wrapper and two N-API binaries:

- `akari-input-win64.node`
- `akari-tools-win64.node`

LeagueAkari currently consumes the published package as:

```json
"@leagueakari/league-akari-addons": "^1.0.0"
```

The user has decided not to continue publishing this as a GitHub private package. The desired direction is to move the native addon source/build flow into the LeagueAkari main repository, with users/build scripts responsible for compiling native artifacts and placing outputs in a known location.

## Current Addon Repository Shape

Important files in `C:\projects\addons`:

- `package.json`
  - Current source name is `@hanxven/league-akari-addons`.
  - This does not match LeagueAkari's dependency name `@leagueakari/league-akari-addons`.
  - Only script is `"build": "node scripts/build.js"`.
  - No `prepack`, `prepare`, or publish-time guard exists.
- `binding.gyp`
  - Builds two targets:
    - `akari-input-win64`
    - `akari-tools-win64`
- `scripts/build.js`
  - Deletes `build/`, `addons/`, and `dist/`.
  - Runs `node-gyp rebuild`.
  - Copies `.node` files from `build/Release` into `addons/`.
  - Runs `tsc`.
- `lib/index.ts`
  - Exports `input` namespace and `tools` default object.
- `lib/input/index.ts`
  - Imports `../../addons/akari-input-win64.node`.
  - Exposes `AkariNativeInput`, singleton `instance`, key definitions, and keyboard state helpers.
- `lib/tools/index.ts`
  - Imports `../../addons/akari-tools-win64.node`.
  - Exposes process/window/elevation helpers under one `tools` object.
- `src/input/input.cc`
  - Global low-level keyboard hook.
  - Native input sending via `SendInput`.
  - ThreadSafeFunction callback bridge.
- `src/tools/tools.cc`
  - Process lookup.
  - Process command-line lookup.
  - Elevation check.
  - League Client window placement/fix helper.
  - Process termination and foreground/running checks.

Generated outputs are ignored by git:

- `build/`
- `addons/`
- `dist/`
- `node_modules/`

## Current LeagueAkari Integration Points

Current dependency declaration:

- `package.json`
  - `@leagueakari/league-akari-addons`

Native package loading:

- `src/main/native/addons-win32.ts`
  - Uses `require('@leagueakari/league-akari-addons')` at module top level when `process.platform === 'win32'`.
  - Immediately checks `addons.tools.isElevated()`.
  - If elevated, immediately calls `addons.input.instance.install()`.
  - Registers `process.on('exit', () => addons.input.instance.uninstall())`.

Main native facade:

- `src/main/native/index.ts`
  - Wraps native package APIs as app-level helpers:
    - `getPidsByName`
    - `getCommandLine`
    - `isElevated`
    - `isProcessForeground`
    - `terminateProcess`
    - `isProcessRunning`
    - `adjustLeagueClientWindowSize`
    - `getLeagueClientWindowPlacement`
    - `nativeInput`
    - `NATIVE_SUPPORT`

Main consumers found during review:

- `src/main/shards/in-game-send/send-executor.ts`
  - Game-internal sends use `nativeInput.instance.sendKey` and `sendString`.
  - Champ-select/lobby sends use LCU chat APIs instead of native input.
- `src/main/shards/window-manager/cd-timer-window/windows.ts`
  - Uses native input to send text in game.
- `src/main/shards/keyboard-shortcuts/index.ts`
  - Uses native key events and key states.
  - Imports `KeyEvent` from `@leagueakari/league-akari-addons/dist/input`.
- `src/main/shards/keyboard-shortcuts/shortcut-registry.ts`
  - Uses `nativeInput.VKEY_MAP`, modifier helpers, and support gates.
- `src/main/shards/game-client/index.ts`
  - Uses `getPidsByName`, `isProcessForeground`, `isProcessRunning`, and `terminateProcess`.
- `src/main/shards/league-client/index.ts`
  - Uses `getPidsByName`.
  - Uses `adjustLeagueClientWindowSize` for the window fix path.
- `src/main/shards/window-manager/window-position-service.ts`
  - Uses `getLeagueClientWindowPlacement`.
- `src/main/shards/league-client-ux/ux-command-line-reader.ts`
  - Uses `getPidsByName` and `getCommandLine`.
- `src/main/shards/client-installation/live-streaming-detector.ts`
  - Uses `getPidsByName`.

Renderer-facing native support state:

- `src/renderer-shared/shards/app-common/store.ts`
  - Mirrors `nativeSupport` and `isElevated`.
- `src/renderer/src-main-window/views/toolkit/in-game-send/presets/composables/useNativeInputStatus.ts`
  - Distinguishes unsupported platform, needs admin, and other unavailable states.

Packaging context:

- `electron-builder.yml`
  - `asar: true`.
  - `asarUnpack` currently includes `resources/**`.
  - `npmRebuild: false`.
- `electron.vite.config.ts`
  - Main externals currently include:
    - `electron`
    - `typeorm`
    - `better-sqlite3`
  - No native addon resource path is currently configured here.

## Verification Performed During This Review

Commands run in `C:\projects\addons`:

```powershell
pnpm install --frozen-lockfile
pnpm build
node -e "const a=require('./'); console.log(Object.keys(a)); console.log(a.tools.isElevated()); console.log(a.tools.getCommandLine1(process.pid).includes('node'));"
npm pack --dry-run
```

Observed results:

- `pnpm install --frozen-lockfile` succeeded and triggered `node-gyp rebuild`.
- `pnpm build` succeeded.
- Local built output could be loaded with `require('./')`.
- `tools.isElevated()` returned `false` on the current non-elevated shell.
- `tools.getCommandLine1(process.pid)` returned a command line containing `node`.
- `npm pack --dry-run` produced package metadata for `@hanxven/league-akari-addons@1.0.0`, not `@leagueakari/league-akari-addons`.

Commands run against the currently installed package inside `C:\projects\LeagueAkari`:

```powershell
node -e "const a=require('@leagueakari/league-akari-addons'); console.log(Object.keys(a)); console.log(Object.keys(a.tools)); console.log('elevated', a.tools.isElevated()); console.log('pids', a.tools.getPidsByName('LeagueClientUx.exe').length);"
node -e "const a=require('@leagueakari/league-akari-addons'); console.log(a.tools.getCommandLine1(process.pid).slice(0,200));"
```

Observed results:

- The installed LeagueAkari package could be loaded.
- It exported `input` and `tools`.
- `tools` exported:
  - `fixWindowMethodA`
  - `isElevated`
  - `getLeagueClientWindowPlacementInfo`
  - `getCommandLine1`
  - `getPidsByName`
  - `terminateProcess`
  - `isProcessForeground`
  - `isProcessRunning`
- `isElevated()` returned `false`.
- `getPidsByName('LeagueClientUx.exe')` returned `0` on this machine at review time.
- `getCommandLine1(process.pid)` returned the current Node command line.

Important reproduced lifecycle issue:

```powershell
node -e "const a=require('./'); a.input.instance.install(); a.input.instance.uninstall(); console.log('done')"
```

Observed result:

- Command printed `done` but did not naturally exit before the shell command timeout.

The same natural-exit hang was observed for `install()` without `uninstall()`.

## Confirmed Or Likely Implementation Defects

### 1. Native input install/uninstall leaves Node unable to exit naturally

Relevant source:

- `src/input/input.cc`
  - `InstallHook`
  - `UninstallHook`
  - `KeyboardHookThread`
  - `SendTaskThread`
  - global `Napi::ThreadSafeFunction tsfn`

Problem:

- `InstallHook` starts detached threads.
- `UninstallHook` sets flags but does not reliably wake the Windows hook message loop.
- `KeyboardHookThread` blocks in `GetMessage`.
- The ThreadSafeFunction is not released/unrefed.
- There is no owned thread handle to join.

Impact in LeagueAkari:

- Elevated startup currently installs the native input hook at module load time.
- Main process exit, dev hot/restart behavior, tests, or child process lifecycle can hang.

### 2. Package identity is inconsistent with LeagueAkari dependency

Relevant files:

- Addon repo `package.json`
- Existing tarball `hanxven-league-akari-addons-1.0.0.tgz`
- LeagueAkari `package.json`
- LeagueAkari `yarn.lock`

Problem:

- Addon source and dry-run pack identify as `@hanxven/league-akari-addons`.
- LeagueAkari depends on `@leagueakari/league-akari-addons`.
- Installed package in LeagueAkari currently has name `@leagueakari/league-akari-addons`, so the installed artifact and source repository are already divergent.

Impact:

- Publishing again from this repo as-is would publish the wrong package identity.
- This is one reason migration into the main repo is preferable.

### 3. Build/publish lifecycle is easy to misuse

Relevant files:

- Addon repo `package.json`
- `scripts/build.js`
- `.gitignore`

Problem:

- No `prepack` or `prepare`.
- `addons/` and `dist/` are ignored.
- `npm pack --dry-run` only works correctly after someone manually runs `pnpm build`.
- The repo contains an old `.tgz`, which can be mistaken for current truth.

Impact:

- Easy to package stale or incorrectly named artifacts.
- Poor fit for future native APIs.

### 4. `getCommandLine1` copies command line using unsafe length assumptions

Relevant source:

- `src/tools/tools.cc`
  - `GetProcessCommandLine1`

Problem:

- Uses undocumented `ProcessCommandLineInformation`.
- Treats returned `UNICODE_STRING.Buffer` as NUL-terminated by calling `wcslen(tmp->Buffer)`.
- Correct handling should use `UNICODE_STRING.Length`.

Impact:

- Potential out-of-bounds read.
- Possible crash or corrupted command-line result for some processes.

### 5. `SendInput` return values are ignored

Relevant source:

- `src/input/input.cc`
  - `SendUnicodeString`
  - `PressKey`

Problem:

- `SendInput` returns the number of events inserted.
- Current implementation ignores the return value and does not check `GetLastError`.

Impact in LeagueAkari:

- `sendString` / `sendKey` promises resolve even if Windows rejects or partially accepts input.
- In-game send and CD timer send can report success while nothing was sent.

### 6. Empty string input has undefined C++ behavior

Relevant source:

- `src/input/input.cc`
  - `SendUnicodeString`

Problem:

- Empty string produces an empty `std::vector<INPUT>`.
- Code still calls `&inputs[0]`.

Observed:

- `sendString('')` did not crash on this machine, but the code is still undefined behavior.

Impact:

- Should be fixed defensively even if LeagueAkari usually filters empty text before sending.

### 7. Hook installation can be marked successful when native hook failed

Relevant source:

- `src/input/input.cc`
  - `KeyboardHookThread`
- `lib/input/index.ts`
  - `AkariNativeInput.install`

Problem:

- `SetWindowsHookEx` return value is not checked.
- JS wrapper sets `installed = true` after calling `addon.install()`.

Impact:

- Native input can appear available and installed when the OS hook was not actually registered.
- Keyboard shortcuts may silently fail.

### 8. Low-level hook callback uses `BlockingCall`

Relevant source:

- `src/input/input.cc`
  - `KeyboardEvent`

Problem:

- Low-level keyboard hook calls `tsfn.BlockingCall`.
- If JS is busy or blocked, the hook callback can block.

Impact:

- Potential input latency or system-wide keyboard hook performance problems.
- This should be treated carefully because low-level hook callbacks are timing-sensitive.

### 9. Native APIs have inconsistent error/return semantics

Examples:

- `getCommandLine1(pid)` returns string `"Failed to retrieve command line."` on failure.
- `fixWindowMethodA(...)` throws for some failures but TypeScript says it returns `void`.
- `getLeagueClientWindowPlacementInfo()` returns `null` on failure.
- `terminateProcess(pid)` returns `false` on failure.
- `sendString` and `sendKey` resolve even if native input failed.

Impact:

- Callers cannot reliably distinguish:
  - not found
  - permission denied
  - unsupported platform
  - native failure
  - invalid arguments
- LeagueAkari currently often has to infer failure indirectly.

### 10. Type definitions drift from native behavior

Relevant source:

- `lib/tools/index.ts`
- `src/tools/tools.cc`

Known drift:

- `fixWindowMethodA(clientZoom, config?)` is typed with optional `config`, but native implementation currently requires a second object argument.
- `fixWindowMethodA` native returns boolean/null or throws, but TypeScript says `void`.
- `getLeagueClientWindowPlacementInfo` native returns `isMinimized`, `isMaximized`, and `isNormal`, but TS type does not expose them.

Impact:

- Callers and tests can compile while runtime behavior differs.

### 11. Process-name matching is byte/narrow-string based

Relevant source:

- `src/tools/tools.cc`
  - `GetPidsByName`

Problem:

- Uses `PROCESSENTRY32` and `strcmp((const char*)pe32.szExeFile, processName.c_str())`.
- Current League process names are ASCII, so this is not immediately blocking.

Impact:

- Future non-ASCII process names or Unicode-sensitive lookups may fail.
- If moving to main repo, consider using wide APIs explicitly and keeping platform boundaries clear.

### 12. Window helpers are hard-coded to League Client identifiers

Relevant source:

- `src/tools/tools.h`
  - `APPLICATION_CLASS_NAME`
  - `APPLICATION_NAME`
  - `CEF_WINDOW_NAME`
- `src/tools/tools.cc`
  - `FixWindowMethodA`
  - `GetLeagueClientWindowPlacementInfo`

Problem:

- These are not generic window utilities; they are League Client-specific APIs currently living in generic `tools`.

Impact:

- As APIs grow, generic naming will hide domain assumptions.

## Confirmed Organization Risks

### 1. `tools` is already a catch-all namespace

Current `tools` includes:

- elevation
- process lookup
- process command-line reading
- process termination
- foreground checks
- League Client window placement
- League Client window resizing/fixing

This will not scale well if more APIs are added.

### 2. Package import has heavy side effects through LeagueAkari integration

The addon package itself mostly exports wrappers, but LeagueAkari's current loading module immediately:

- requires the whole package,
- checks elevation,
- installs global input hook when elevated.

This makes startup fragile. A native input issue can affect unrelated tools like process lookup or elevation checks.

### 3. Native implementation shape leaks into business modules

Examples:

- `src/main/shards/keyboard-shortcuts/index.ts` imports `KeyEvent` from `@leagueakari/league-akari-addons/dist/input`.
- Several modules rely on `nativeInput.VKEY_MAP`, `UNIFIED_KEY_ID`, and `isModifierKey` through the native package shape.

If migrating into the main repo, this should be hidden behind LeagueAkari-owned modules/types where possible.

### 4. Capability support is currently easy to misuse

`NATIVE_SUPPORT` values are objects with:

- `available`
- `availableOnCurrentPlatform`
- `requiresElevation`

During review, some LeagueAkari call sites were found checking the object itself instead of `.available`, for example:

- `src/main/shards/window-manager/window-position-service.ts`
- `src/main/shards/game-client/index.ts`
- `src/main/shards/league-client/index.ts`

This is not caused by the addon repo directly, but the native support API shape allows this mistake.

### 5. There is no clear public/private API boundary

Current package effectively exposes:

- raw native wrappers,
- app-domain utilities,
- key definition tables,
- singleton lifecycle controls,
- native support behavior through the LeagueAkari facade.

Future APIs need a clearer boundary between:

- native raw binding,
- platform adapter,
- LeagueAkari business facade,
- renderer-facing capability/status model.

## Migration Constraints And Open Questions

The final plan is intentionally not fixed here. The following questions should be resolved in the LeagueAkari workflow.

### Where should native source live?

Candidate directions:

- `native/akari-native/`
- `packages/akari-native/`
- `src/native/`
- `src/main/native/binding/`

Factors:

- Keep C++/node-gyp files separate enough from TypeScript app source.
- Avoid making native build artifacts look like hand-edited source.
- Make it easy to run targeted native builds.

### Where should compiled `.node` artifacts be copied?

Candidate directions:

- `resources/native/win32-x64/`
- `resources/addons/win32-x64/`
- `build/native/win32-x64/`

Relevant existing fact:

- `electron-builder.yml` already unpacks `resources/**` from asar.

If using `resources/**`, verify:

- dev runtime path,
- production packaged path,
- `asarUnpack` behavior,
- update packaging behavior,
- whether generated `.node` files should be gitignored.

### Should there be one `.node` binary or multiple?

Current shape:

- `akari-input-win64.node`
- `akari-tools-win64.node`

Possible future shape:

- keep multiple binaries by domain,
- combine into one `akari-native-win64.node`,
- split by API risk/lifecycle:
  - input hook binary isolated from process/window utilities,
  - stable utilities separate from hook-heavy input.

Tradeoff:

- One binary simplifies loading and versioning.
- Multiple binaries isolate startup risk and allow lazy loading only the risky part.

### How should native APIs be named?

Avoid growing a generic `tools` namespace.

Potential domains:

- `input`
- `process`
- `window`
- `elevation`
- `leagueClientWindow`

LeagueAkari-facing APIs should probably remain in `src/main/native/index.ts`, but raw native binding APIs should be grouped more explicitly.

### How should native loading work?

Open choices:

- direct `require(pathToNodeFile)`,
- `?asset&asarUnpack` path import from `resources`,
- small loader module that resolves dev vs packaged path,
- lazy loading per domain.

Important goal:

- Loading process utilities should not automatically install the keyboard hook.

### How should errors be modeled?

The migration should decide whether native methods:

- throw typed JS errors,
- return discriminated result objects,
- return `null` for not found,
- return booleans only for true/false checks,
- expose `GetLastError`-derived details for diagnostics.

At minimum, avoid success promises for failed `SendInput`.

### How should build scripts be wired?

Open choices:

- build native on every `build`,
- build native only on `build:win`,
- provide `native:build` and make `dev/build:win` call it,
- provide `native:ensure` that skips rebuild when artifacts are current.

Important existing fact:

- LeagueAkari has `npmRebuild: false` in `electron-builder.yml`.
- The migration cannot rely on electron-builder rebuilding native modules automatically.

### How should cross-platform behavior work?

Current addon is Windows-only.

Migration should preserve clear behavior for:

- Windows with admin,
- Windows without admin,
- macOS,
- other unsupported platforms.

Renderer status copy already distinguishes unsupported/current-platform/admin states for in-game-send. Avoid regressing that.

## Suggested Follow-Up Review Checklist

Before implementing the migration:

- Audit all direct imports from `@leagueakari/league-akari-addons`.
- Remove dependency from LeagueAkari `package.json` only after internal replacement exists.
- Decide artifact location and update ignore rules.
- Decide whether generated native artifacts should be committed. Current preference implied by user is that users/build scripts compile them, so generated artifacts likely should not be committed.
- Ensure dev runtime and packaged runtime both load the same native path abstraction.
- Fix `NATIVE_SUPPORT.xxx` object-as-boolean call sites or make the API harder to misuse.
- Add a smoke script for native load:
  - load native module,
  - call `isElevated`,
  - call `getPidsByName`,
  - call `getCommandLine` for current process,
  - do not install the hook unless explicitly requested.
- Add a separate smoke script for input hook lifecycle:
  - install,
  - uninstall,
  - process exits naturally.
- Add targeted tests around TypeScript facade behavior with mocked native bindings.

## Suggested Fix Checklist After Or During Migration

These are implementation fixes discovered during review. They do not need to be solved in the first file-move commit if the migration is staged, but they should not be forgotten.

- Replace detached hook/send threads with owned lifecycle.
- Ensure hook uninstall wakes the hook message loop.
- Release/unref ThreadSafeFunction correctly.
- Check `SetWindowsHookEx` result and surface failure.
- Avoid `BlockingCall` in the low-level keyboard hook path or at least bound/fail safely.
- Check `SendInput` return count and reject/report failure.
- Make `sendString('')` a no-op before allocating/accessing vector data.
- Use `UNICODE_STRING.Length` in command-line reading.
- Unify `fixWindowMethodA` TypeScript signature with native behavior.
- Decide consistent native error semantics.
- Update TS declarations to include actual returned fields.
- Consider using wide Windows process APIs intentionally.
- Separate League Client-specific window helpers from generic native process/window utilities.

## Risk Summary

High risk:

- Native input lifecycle can hang process exit.
- Current source package identity does not match LeagueAkari dependency identity.
- Publish/build lifecycle is manual and easy to misuse.
- `SendInput` failures are invisible to LeagueAkari callers.
- Command-line reading has unsafe length handling.

Medium risk:

- API/type drift.
- Heavy top-level native loading.
- Low-level hook uses blocking JS bridge.
- `tools` namespace will not scale.
- Native support capability objects are easy to misuse.

Low but worth fixing:

- Empty string undefined behavior.
- Generic names hide League-specific behavior.
- README and package metadata are too sparse for future maintainers.

## Current State To Hand Off

No migration implementation has been started in this handoff step.

The immediate next workflow can start in `C:\projects\LeagueAkari` and use this document as the source of truth for:

- what exists in the addon repo,
- how LeagueAkari currently consumes it,
- what was verified,
- which bugs were reproduced,
- which organization risks should guide the migration.
