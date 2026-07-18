# macOS port status

League Akari currently targets Apple Silicon (`arm64`) on macOS. Intel and universal builds are not
part of the verified target. The packaged application declares macOS 12.0 as its minimum system
version.

## Develop and build

Use Node.js 24, matching `.github/workflows/ci-release.yml`, and the checked-in Yarn release:

```bash
corepack enable
yarn install --immutable
yarn dev
```

Run the complete verification and package build with:

```bash
yarn typecheck
yarn test
yarn build:mac
```

The macOS build always targets ARM64. Expected outputs are:

- `dist/mac-arm64/League Akari.app`
- `dist/League Akari-<version>-arm64-mac.zip`
- `dist/league-akari-<version>.dmg`

The dependency install rebuilds native Node modules for the repository's Electron version. Packaging
does not rebuild them again, which avoids trying to build the Windows-only native workspace on a Mac.

## Signing and notarization

For a local build without an Apple certificate, `yarn build:mac` selects ad-hoc signing and disables
the hardened runtime for that local signature. It then verifies the finished bundle with `codesign`.
This is suitable for local testing, not public distribution.

When `CSC_LINK` or `CSC_NAME` identifies a certificate, or a usable signing identity is present in the
login keychain, electron-builder performs normal certificate signing with the hardened runtime. Its
built-in notarization runs when one complete supported credential set is present:

- `APPLE_API_KEY`, `APPLE_API_KEY_ID`, and `APPLE_API_ISSUER`
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`
- `APPLE_KEYCHAIN_PROFILE`, with optional `APPLE_KEYCHAIN`

Do not place certificates, private keys, or notarization credentials in the repository.

## Install and open

For a DMG, open it and copy **League Akari** to `/Applications`. For a ZIP, extract it and move
`League Akari.app` to `/Applications`. A locally ad-hoc-signed build can be opened from Finder with
**Open** in the context menu, or directly during development:

```bash
open "dist/mac-arm64/League Akari.app"
```

The packaged app registers the `league-akari` URL scheme. Development builds use
`league-akari-dev` when started through Electron.

## Logs and credential safety

macOS logs are written to:

```text
~/Library/Logs/league-akari/LA_<timestamp>.log
```

Open the directory with:

```bash
open "$HOME/Library/Logs/league-akari"
```

Current builds redact Riot Client and LCU authentication values before writing log messages. Tokens
remain secrets: inspect a log before sharing it, share only the smallest relevant section, and never
publish logs made by an older build unless credential-bearing command-line arguments and HTTP
authorization values have been removed. Tests and bug reports must use synthetic credentials.

## Feature matrix

The statuses below describe checks performed on an Apple Silicon Mac for this port. “Untested” means
the code may be present but the interaction was not manually demonstrated.

The final bundle passed signature, architecture, native-module, ZIP, DMG mount, and packaged GUI
launch checks. The live smoke check used the real running Riot and League clients without printing
their credentials.

| Feature                                                                 | Status            | Verification or limitation                                                                                                                                                                                               |
| ----------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ARM64 application bundle                                                | working           | Packaged executable and Electron framework inspected as ARM64 Mach-O files.                                                                                                                                              |
| Electron native SQLite module                                           | working           | Packaged `better-sqlite3` loaded in Electron 41 on ARM64 and executed an in-memory query.                                                                                                                                |
| Packaged startup and main renderer                                      | working           | The final packaged app launched through LaunchServices; its renderer completed loading without a missing-module, Win32-addon, registry, or PowerShell error.                                                             |
| Running Riot Client and League Client detection                         | working           | The final packaged app discovered the real `RiotClientServices`, `LeagueClient`, and `LeagueClientUx` processes.                                                                                                         |
| Riot Client and LCU HTTPS connections                                   | working           | Authenticated Riot and LCU renderer probes both returned HTTP 200. TLS exceptions remain scoped to their local clients.                                                                                                  |
| Core player and match data                                              | working           | The packaged renderer loaded the active summoner, SGP profile, and match-history UI. A cold EUW reload resolved the platform route as `EUW1`, returned the profile, and produced no HTTP 400 response.                   |
| Filesystem installation discovery                                       | partially working | Default and discovered application paths are supported; non-default installation coverage is fixture-tested rather than exhaustively tested on real installations.                                                       |
| Riot/League launch from League Akari                                    | partially working | Shell-free bundle/executable selection and argument forwarding pass automated tests. A live already-running invocation did not create duplicate Riot or League processes; a fully closed-client launch remains untested. |
| Client close/restart reconnection matrix                                | partially working | Startup with both clients already running and the reconnect polling behavior were checked; each requested close/start ordering was not manually exercised.                                                               |
| Dock activation and reopen                                              | working           | The packaged window was minimized, restored, hidden by close, and reopened through the real app activation handler while the process remained ready.                                                                     |
| macOS application menu and tray                                         | partially working | A Command-based application menu and template tray icon are implemented; packaged visual behavior was not exhaustively tested.                                                                                           |
| Single-instance handling                                                | working           | A second packaged invocation was handed to the running instance, restored the main window, and exited without creating duplicate clients.                                                                                |
| Deep links                                                              | working           | The packaged URL scheme, startup/queued delivery, and a live second-instance `league-akari://` invocation were verified.                                                                                                 |
| DMG                                                                     | working           | `yarn build:mac` produced the DMG; `hdiutil` verified and mounted it, and the mounted signed ARM64 app plus `/Applications` link were inspected.                                                                         |
| ZIP                                                                     | working           | ARM64 ZIP produced and inspected; it contains the signed application bundle.                                                                                                                                             |
| Local ad-hoc signing                                                    | working           | The application bundle passes strict deep `codesign` verification.                                                                                                                                                       |
| Developer ID signing and notarization                                   | untested          | Credential-aware electron-builder paths are preserved; no signing identity or notarization credentials were available for a live submission.                                                                             |
| Activation-only global shortcuts                                        | partially working | Electron `globalShortcut` registration and focused-window configuration capture are automated and tested for OP.GG window toggle and cooldown-timer toggle. A physical global-key activation pass remains untested.      |
| Foreground-only game termination shortcut                               | unsupported       | Safe termination requires foreground-process detection. The control and persisted registration are disabled on macOS rather than terminating every matching background process.                                          |
| Stateful, last-active, and native shortcut capture                      | unsupported       | Electron cannot preserve the native hook's key-release and active-key-state contracts. Only those affected controls remain gated.                                                                                        |
| Native global input hook                                                | unsupported       | The Win32 hook is not loaded or packaged on macOS, and dependent controls are capability-gated.                                                                                                                          |
| Foreground-process detection                                            | unsupported       | The native implementation is Win32-only; dependent behavior is capability-gated.                                                                                                                                         |
| League Client window placement and resizing                             | unsupported       | The native implementations are Win32-only; only the affected features are capability-gated.                                                                                                                              |
| Cooldown timer core                                                     | partially working | The timer, supported LCU-driven behavior, and activation-only show/hide shortcut are available. Simulated in-game chat input remains gated because it requires native input.                                             |
| Hold-key ongoing-game overlay                                           | unsupported       | The overlay's native foreground and held-key contract is unavailable on macOS, so the feature is disabled with a platform explanation.                                                                                   |
| Windows updater/uninstaller                                             | unsupported       | The Windows executable updater is not started on macOS. Manual replacement with a newer app bundle is required.                                                                                                          |
| Existing Windows build/runtime                                          | untested          | Windows resources and the native addon are preserved only in Windows packages, and shared TypeScript checks pass. A real Windows package/runtime pass was not possible on this Mac.                                      |
| Transparent overlays, fullscreen Spaces, and click-through combinations | untested          | No claim is made without a complete manual multi-Space/fullscreen interaction pass.                                                                                                                                      |
