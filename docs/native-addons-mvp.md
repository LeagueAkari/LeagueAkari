# Native Addons 双平台（Win + macOS）MVP 方案（napi-rs）

本文档用于把 League Akari 的 native addons（目前偏 Windows）从根本上升级为 **Windows + macOS** 双平台可用，并在第一个 MVP 阶段实现“可用功能更多”的落地路径。

目标仓库：

- 主应用仓库：`league-akari-private`
- Addons 仓库：`addons`

## 1. 背景与问题陈述

当前主应用依赖 `@leagueakari/league-akari-addons`（或其 wrapper）提供两类能力：

- `tools`：进程/前台判断/命令行读取/窗口位置等
- `input`：全局键盘 hook、按键/文本注入

在 macOS 上，现状通常会出现：

- native `.node` 仅 win64，直接加载会崩；因此主应用侧不得不做平台 guard / fallback
- 一些 Windows-only API（例如 JumpList、注册表、powershell/wmic）在 macOS 触发运行时错误或闪退
- 快捷键体系目前紧耦合 Windows 的 VK/definitions，跨平台表达不统一

**核心目标**：把“平台能力”做成一等公民，通过跨平台 schema 与 native 层实现，达到 Win+mac 的同一套上层业务逻辑可用。

## 2. MVP 范围与成功标准

### 2.1 平台与架构

- Windows：支持 `win32-x64`
- macOS：MVP 仅支持 `darwin-arm64`（后续可扩展 `darwin-x64`）

### 2.2 MVP 功能范围（macOS）

包含：

1. 全局键盘 hook（监听 key down/up，产出事件给主进程）
2. 输入注入（`sendKey` + `sendText`/`sendString`）
3. tools 基础能力：
   - `getPidsByName`
   - `isProcessRunning`
   - `terminateProcess`
   - `isProcessForeground`
   - `getCommandLine1`（best-effort，失败返回空/稳定错误，不得崩）
4. 权限检测与引导（Accessibility / Input Monitoring）

不包含（MVP2 再做）：

- `getLeagueClientWindowPlacementInfo`
- `fixWindowMethodA`

### 2.3 验收标准（macOS）

1. `yarn dev` 启动稳定，不因 addons 加载/权限不足崩溃。
2. 未授权时：
   - UI/功能明确提示“需要权限”
   - hook/注入调用返回可识别错误（或被上层禁用），不产生未捕获异常
3. 授权后：
   - 全局快捷键可触发主进程回调（至少覆盖 normal + last-active）
   - in-game-send 能调用注入 API 并返回明确结果（成功/失败原因）

### 2.4 验收标准（Windows）

- 功能至少与现有等价：hook + 注入 + tools
- 新快捷键 schema 下，旧快捷键做 best-effort 迁移；迁移失败必须提示用户重绑

## 3. 关键设计：跨平台 KeyId Schema（替代 VK 模型）

### 3.1 Key 表示

使用 W3C `KeyboardEvent.code` 风格作为“物理键”标识（跨键盘布局更稳定）：

- 字母：`KeyA`..`KeyZ`
- 数字：`Digit0`..`Digit9`
- 常用控制：`Enter`、`Escape`、`Space`、`Backspace`、`Tab`
- 方向键：`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`
- 功能键：`F1`..`F24`（按需）
- 修饰键区分左右：`ControlLeft`/`ControlRight`、`ShiftLeft`/`ShiftRight`、`AltLeft`/`AltRight`、`MetaLeft`/`MetaRight`

### 3.2 ShortcutId 持久化格式

持久化使用单一字符串，格式固定、可规范化、可比较：

- 规范格式：`<Mod1>+<Mod2>+...+<KeyCode>`
- 修饰键集合：`Ctrl`、`Shift`、`Alt`、`Meta`
- `KeyCode` 为 `KeyboardEvent.code`（非修饰键）
- 示例：
  - `Ctrl+Shift+KeyK`
  - `Meta+Digit1`
  - `Alt+Enter`

规范化规则：

1. 修饰键顺序固定：`Ctrl` -> `Shift` -> `Alt` -> `Meta`
2. 修饰键去重
3. 最后一个 token 必须是非修饰键 `code`；仅修饰键组合视为非法

UI 展示规则：

- macOS 上可将 `Meta` 显示为 `Cmd`，`Alt` 显示为 `Option`（仅展示层）
- 但存储仍统一使用 `Meta/Alt`

## 4. Addons：用 napi-rs 重写（Win + macOS）

### 4.1 为什么选择 napi-rs（Rust + N-API）

目标是“可发布、可维护、可多平台预编译交付”：

- N-API ABI 相对稳定，适合预编译二进制随包发布
- Rust 工程化、错误处理与并发更可控
- 统一跨平台代码组织（同一 crate 分平台实现）

注意：napi-rs 不会自动提供跨平台能力，macOS 仍需要实现对应的系统 API（Event Tap / CGEvent / NSWorkspace / Accessibility 等）。

### 4.2 Addons 公共 JS/TS API（稳定对外接口）

对外仍提供 `tools` 与 `input`，并增加 `capabilities` 用于上层 gating：

```ts
export const capabilities: {
  platform: 'win32' | 'darwin'
  arch: 'x64' | 'arm64'
  input: {
    supported: boolean
    permission: 'granted' | 'denied' | 'unknown'
    reason?: string
  }
  tools: { supported: boolean }
}

export const tools: {
  isElevated(): boolean
  getPidsByName(name: string): number[]
  isProcessRunning(pid: number): boolean
  terminateProcess(pid: number): boolean
  isProcessForeground(pid: number): boolean
  getCommandLine1(pid: number): string

  // macOS 权限与引导（MVP 必做）
  macHasAccessibilityPermission?(): boolean
  macRequestAccessibilityPermission?(): boolean // prompt
  macOpenAccessibilitySettings?(): void
  macOpenInputMonitoringSettings?(): void
}

export type KeyEvent = {
  code: string
  isDown: boolean
  isModifier: boolean
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean }
}

export const input: {
  definitions: {
    modifiers: Array<{ id: 'Ctrl' | 'Shift' | 'Alt' | 'Meta'; display: string }>
    keys: Record<string, { display: string; category?: string }>
  }
  normalizeShortcutId(raw: string): string | null
  instance: {
    install(): void
    uninstall(): void
    on(event: 'keyEvent', cb: (ev: KeyEvent) => void): void
    sendKey(code: string, press: boolean): Promise<void>
    sendText(text: string): Promise<void>

    // 兼容旧调用（主仓库渐进迁移用）
    sendString?(text: string): Promise<void>
  }
}
```

### 4.3 Native 错误码约定（必须可观测）

native 层失败必须映射为可识别错误，避免上层“无效果”或崩溃：

- `E_ADDON_NOT_SUPPORTED`
- `E_PERMISSION_DENIED_ACCESSIBILITY`
- `E_PERMISSION_DENIED_INPUT_MONITORING`
- `E_INVALID_ARGUMENT`
- `E_INTERNAL`

### 4.4 Windows 实现（Rust）

input：

- hook：`SetWindowsHookExW(WH_KEYBOARD_LL)`，转成 `KeyboardEvent.code` + modifiers
- 注入：
  - `sendKey`：`SendInput`（优先用 scancode 避免布局差异）
  - `sendText`：`SendInput` Unicode（`KEYEVENTF_UNICODE`）

tools：

- `getPidsByName`：Toolhelp snapshot
- `getCommandLine1`：`NtQueryInformationProcess(ProcessCommandLineInformation)`
- `isProcessForeground`：`GetForegroundWindow` + PID compare
- `terminateProcess`：`TerminateProcess`

### 4.5 macOS (arm64) 实现（Rust）

#### 4.5.1 权限策略（MVP 必做）

需要处理两类权限：

- Accessibility（注入通常需要）
- Input Monitoring（全局键盘监听通常需要，系统版本差异存在）

实现要求：

- `tools.macRequestAccessibilityPermission()` 调用带 prompt 的信任检查（例如 `AXIsProcessTrustedWithOptions`）
- 提供打开系统设置入口（`open` 深链或 fallback 到设置页路径）
- `input.instance.install()` 在权限不足时必须抛 `E_PERMISSION_DENIED_*`

#### 4.5.2 input hook（Event Tap）

- 使用 `CGEventTapCreate` 监听：
  - `kCGEventKeyDown`
  - `kCGEventKeyUp`
  - `kCGEventFlagsChanged`
- 在 native 层维护 modifier state，输出统一 `KeyEvent`
- 线程模型：
  - install 启动 runloop 线程
  - 通过 N-API threadsafe function 回传事件

#### 4.5.3 注入（CGEventPost）

- `sendKey(code, press)`：`code -> CGKeyCode` 映射表，`CGEventCreateKeyboardEvent` + post
- `sendText(text)`：`CGEventKeyboardSetUnicodeString` 逐字符发送
- 权限不足直接抛 `E_PERMISSION_DENIED_ACCESSIBILITY`

#### 4.5.4 tools（MVP）

- `getPidsByName`：`libproc`（`proc_listpids` + `proc_name`/`proc_pidpath`）
- `isProcessRunning`：`kill(pid, 0)`
- `terminateProcess`：`kill(SIGTERM)`
- `isProcessForeground`：`NSWorkspace.frontmostApplication.processIdentifier`
- `getCommandLine1`：优先 `sysctl(KERN_PROCARGS2, pid)`，失败返回空字符串或稳定错误

### 4.6 构建与发布（GitHub Actions）

产物矩阵：

- `win32-x64`
- `darwin-arm64`

要求：

- CI 构建 `.node` 并打包到 npm 包
- 发布到 GitHub Packages（需要 `NODE_AUTH_TOKEN`）
- 版本策略：建议从 `1.0.1` 或 `1.1.0` 起，避免与旧 win-only 实现混淆

## 5. 主仓库（league-akari-private）改造清单

### 5.1 addons 入口收敛

目标：上层只依赖 `capabilities` + 统一 API，不再散落 if/ps fallback。

- `src/main/utils/addons.ts`：
  - 改为 win/mac 都可加载（动态 require）
  - 加载失败提供 stub，但必须暴露清晰的 `capabilities.reason`

### 5.2 快捷键系统改造

受影响模块：

- `src/main/shards/keyboard-shortcuts/index.ts`
- `src/renderer/src-main-window/components/ShortcutSelector.vue`
- 以及所有引用 `shortcutId` 的设置项（例如 in-game-send、terminate shortcut）

主要改动：

1. 主进程快捷键按键集合从 “number(VK)” 改为 “string(code)”
2. `ShortcutDetails` 以 `shortcutId`（规范化后的字符串）为主键
3. renderer 录制快捷键不再依赖 VK 常量，改基于 `KeyboardEvent.code` + modifiers

### 5.3 设置项迁移（旧 shortcutId -> 新 schema）

策略（MVP 必做，best-effort）：

- 识别旧格式：
  - token 不符合 `Ctrl/Shift/Alt/Meta/Key*/Digit*/Enter...` 时判为旧
- 做有限映射：
  - 修饰键：旧 keyId -> `Ctrl/Shift/Alt/Meta`
  - 常用键：Enter/Escape/Space/Arrow/F1-F12/KeyA-Z/Digit0-9
- 迁移失败：置空，并在 UI 给出“需要重新绑定”的提示

### 5.4 权限 UI 与功能 gating

新增渲染端状态：

- `nativeAddonsSupported`
- `nativeInputSupported`
- `nativeInputPermission`（granted/denied/unknown）

UI 行为：

- macOS：在快捷键选择器与 in-game-send 页展示权限说明与按钮（打开设置/请求权限）
- Windows：保留管理员相关提示，但快捷键是否可用优先看 `capabilities`

## 6. 测试与验收

### 6.1 Rust 单测（addons）

- keycode -> `KeyboardEvent.code` 映射单测（Win/mac）
- `normalizeShortcutId` 单测（排序/去重/非法输入）

### 6.2 CI 冒烟

Node 脚本验证：

- `require()` 成功
- `tools.getPidsByName` 返回数组
- `input.normalizeShortcutId` 行为稳定

### 6.3 macOS 手工验收

- 未授权启动：不崩溃，提示权限
- 授权后重启：hook 触发日志；注入 API 返回明确结果

## 7. 里程碑拆分（建议按 PR/Commit 组织）

MVP-0（基础工程化）：

- addons repo 改为 napi-rs 工程骨架、定义 TS API、capabilities、错误码、CI build（win + darwin-arm64）

MVP-1（macOS input + tools）：

- mac Event Tap hook + CGEvent 注入 + 权限引导

MVP-2（Windows 等价实现）：

- Windows hook + 注入 + tools 迁移到 Rust

MVP-3（主仓库接入）：

- 主仓库改造快捷键 schema、迁移逻辑、UI 权限提示与 gating

## 8. 风险与回滚策略

- 增加配置开关：`nativeAddons.forceDisable`（紧急情况下直接禁用 native 功能）
- 所有 native 调用必须返回可控错误，不允许异常穿透到 mobx reaction / 主线程导致崩溃
- 注入在游戏内是否生效存在不确定性：必须在 UI 侧给出“注入可能被系统/游戏拦截”的明确提示，并提供降级方案（例如复制到剪贴板）
