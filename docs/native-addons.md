# Native Addons (@leagueakari/league-akari-addons)

本项目依赖私有原生扩展包 `@leagueakari/league-akari-addons`，对外提供两个入口：`tools` 与 `input`。

- `tools`：进程/窗口相关的原生能力（Windows 为主）。
- `input`：全局键盘 hook 与按键/文本注入（Windows 为主）。

当前已知 `@leagueakari/league-akari-addons@1.0.0` 仅包含 `*-win64.node` 二进制，因此在 macOS/Linux 上不能直接加载。为避免应用在非 Windows 平台启动即崩溃，本仓库实现了非 Windows 的 fallback（见 `src/main/utils/addons.ts`），并在 UI 侧显式禁用相关功能（见 `src/renderer-shared/composables/usePlatform.ts`）。

## Windows vs macOS/Linux 行为差异

### tools

| API                                    | Windows(原生)               | macOS/Linux(fallback)         | 影响                                           |
| -------------------------------------- | --------------------------- | ----------------------------- | ---------------------------------------------- |
| `isElevated()`                         | 原生判断管理员              | 仅做 best-effort（uid==0）    | UI/逻辑中的“管理员功能”判断在非 Windows 不等价 |
| `getPidsByName(name)`                  | 原生枚举                    | 通过 `ps` 解析（best-effort） | 进程名/截断/权限可能导致漏检                   |
| `getCommandLine1(pid)`                 | 原生读取命令行              | `ps -p <pid> -o command= -ww` | 命令行可能仍不稳定；用于发现 LCU 参数          |
| `isProcessRunning(pid)`                | 原生                        | `process.kill(pid, 0)`        | 行为接近，但权限/僵尸进程等边界不同            |
| `isProcessForeground(pid)`             | 原生                        | **固定返回 `false`**          | 依赖“前台判断”的功能在非 Windows 基本失效      |
| `terminateProcess(pid)`                | 原生                        | `SIGTERM` best-effort         | 与 Windows 的 terminate 语义不完全一致         |
| `getLeagueClientWindowPlacementInfo()` | 原生读取 LoL 客户端窗口位置 | **返回 `null`**               | “对齐 LeagueClientUx 窗口”的能力失效           |
| `fixWindowMethodA(...)`                | 原生修复/调整 LoL 窗口      | **no-op**                     | 修复窗口相关功能失效                           |

### input

| API                                  | Windows(原生)     | macOS/Linux(fallback) | 影响                             |
| ------------------------------------ | ----------------- | --------------------- | -------------------------------- |
| `input.instance.install()`           | 安装全局键盘 hook | no-op                 | 全局快捷键捕获不可用             |
| `input.instance.on('keyEvent', ...)` | 触发按键事件      | 不会触发              | 所有依赖 hook 的快捷键体系不可用 |
| `input.instance.sendKey()`           | 注入按键          | no-op                 | 不能模拟按键                     |
| `input.instance.sendString()`        | 注入文本          | no-op                 | 不能游戏内自动输入               |

注：fallback 仍会尽量加载 `dist/input/definitions`（纯 JS），以提供 `VKEY_MAP` / `isModifierKey` 等“按键定义数据”，避免渲染层/逻辑层因缺少常量直接崩溃。

## 会受影响的具体功能（按模块定位）

1. 全局快捷键/快捷键编辑

- 依赖：`input.instance.install()` + 原生 key hook
- 主要位置：`src/main/shards/keyboard-shortcuts/index.ts`
- 表现：macOS/Linux 下无法捕获全局按键组合；快捷键选择器已在 UI 层禁用。

2. 游戏内发送/输入注入（In-Game Send）

- 依赖：`input.instance.sendKey()` / `input.instance.sendString()`
- 主要位置：`src/main/shards/in-game-send/index.ts`
- 表现：macOS/Linux 下无法自动发送文字到游戏；UI 已显示 Windows-only 提示并隐藏主体。

3. CD Timer 窗口的“发送到游戏”

- 依赖：`input.instance.sendKey()` / `input.instance.sendString()`
- 主要位置：`src/main/shards/window-manager/cd-timer-window/windows.ts`（`sendInGame` IPC）
- 表现：macOS/Linux 下无法执行发送；建议后续在窗口内进一步提示或禁用按钮（若存在）。

4. “仅在前台时”结束游戏进程

- 依赖：`tools.isProcessForeground(pid)`
- 主要位置：`src/main/shards/game-client/index.ts`（`_terminateGameClient()`）
- 表现：macOS/Linux 下由于前台判断恒为 `false`，基本不会真正执行 terminate。

5. 窗口对齐 LeagueClientUx

- 依赖：`tools.getLeagueClientWindowPlacementInfo()`
- 主要位置：`src/main/shards/window-manager/position-utils.ts`（`repositionToAlignLeagueClientUx()`）
- 表现：macOS/Linux 下对齐逻辑不会生效。

6. 修复 LeagueClientUx 窗口（fixWindowMethodA）

- 依赖：`tools.fixWindowMethodA(...)`
- 主要位置：`src/main/shards/league-client/index.ts`
- 表现：macOS/Linux 下为 no-op；UI 已禁用。

## UI 侧的“平台不支持”策略

为避免用户在 macOS/Linux 上配置了无法生效的功能：

- 平台识别：`src/renderer-shared/utils/platform-dataset.ts` 会设置 `document.documentElement.dataset.platform`。
- UI gating：`src/renderer-shared/composables/usePlatform.ts` 提供 `nativeAddonsSupported`（当前仅 Windows 为 true）。
- 已禁用/提示的页面：
  - `src/renderer/src-main-window/components/ShortcutSelector.vue`
  - `src/renderer/src-main-window/views/toolkit/in-game-send/InGameSend.vue`
  - `src/renderer/src-main-window/views/toolkit/client/Client.vue`（terminate shortcut / fix window）

## 可选的“更易落地”的跨平台替代方案（不依赖 .node）

1. 使用 Electron `globalShortcut` 实现“显示/隐藏窗口”等全局快捷键（跨平台）。

- 优点：不需要原生 hook / 输入注入。
- 代价：需要新增一套 fallback 注册/冲突检测/卸载逻辑，与现有 hook 体系并行。

2. In-Game Send 改为“复制到剪贴板”模式。

- 优点：保留模板管理价值。
- 代价：从“自动发送”降级为“用户手动粘贴”。

## 未来：要实现 macOS 版完整能力需要什么

若要在 macOS 上达到 Windows 同等能力，通常需要：

- 原生模块（darwin `.node`）实现：
  - Accessibility/Event Tap（全局键盘 hook/输入注入）
  - 读取/定位目标窗口（LeagueClientUx）与前台判断
- 或者维护单独的 macOS 原生实现/仓库，并通过 GitHub Packages 发布 darwin 预编译二进制。
