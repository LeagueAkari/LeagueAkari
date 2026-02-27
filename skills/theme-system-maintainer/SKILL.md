---
name: theme-system-maintainer
description: 维护和扩展 League Akari 主题系统。用于新增主题、调整主题分组、修复主题不一致、排查 light/dark 与主题样式映射问题，或统一 Naive UI/CSS token/多窗口主题行为时使用。
---

# Theme System Maintainer

维护目标：
- 保持主题系统在五个窗口行为一致。
- 新主题走统一接入路径，不在业务页面散落硬编码。
- 保持 `light`/`dark` 基线稳定，增量主题通过系统层覆盖。

## 1. 当前架构速览

主题系统是“两层解析，一层渲染”：

1. 设置层（持久化值）
- 类型：`AppThemeSetting`
- 文件：`src/shared/types/app-theme.ts`
- 作用：保存用户选择（`default`、`light`、`dark`、`graphite`、`sakura`、`mint`、`aurora`、`butter`）

2. 解析层（运行时）
- 输出：
  - `colorTheme`: `'light' | 'dark'`（决定 Naive 基底与 `dark:` 语义）
  - `themeId`: 具体主题 ID（决定 token 和 override）
- 文件：`src/shared/types/app-theme.ts`（`resolveThemeSetting`）

3. 渲染层（全局属性）
- 文件：`src/renderer-shared/composables/useColorThemeAttr.ts`
- 写入：
  - `data-theme=<light|dark>`
  - `data-theme-id=<themeId>`
  - `color-scheme=<light|dark>`

## 2. 必改文件清单（新增主题）

新增主题时，按顺序改下面文件。不要跳步。

1. 主题类型与解析
- `src/shared/types/app-theme.ts`
- 操作：
  - 在 `APP_THEME_VALUES` 增加新值
  - 在 `APP_THEME_IDS` 增加新 ID（若可选）
  - 在 `resolveThemeSetting` 增加 `case`
  - 为主题指定 `colorTheme`（亮色归 `light`，暗色归 `dark`）

2. 主进程原生主题映射
- `src/main/shards/app-common/index.ts`
- 操作：
  - 在 `settings.theme` 的 `switch` 中加入新主题
  - 只映射到 Electron 支持的 `light|dark|system`

3. Naive UI 覆盖
- `src/renderer-shared/theme/naive-ui.ts`
- 操作：
  - 新增 `const XXX_OVERRIDES: GlobalThemeOverrides`
  - 在 `THEME_OVERRIDES` 注册 `{ themeId: XXX_OVERRIDES }`
  - 关键字段至少覆盖 `common`、`Card`、`Message`、`Popover`、`InternalSelectMenu`

4. CSS 主题 token
- `src/renderer-shared/assets/css/theme-system.css`
- 操作：
  - 新增 `:root[data-theme-id='xxx']` token 块
  - 必填 token 见“Token 合同”
  - 若需要，补充该主题的 switch/checkbox/radio glow 与 tooltip 色块

5. 主窗口系统层背景
- `src/renderer/src-main-window/App.vue`
- 操作：
  - 增加 `[data-theme-id='xxx']` 的 sidebar 背景/边框
  - 增加 `[data-theme-id='xxx'] .background-wallpaper::before` 的渐变覆盖

6. 标题栏主题选择器
- `src/renderer/src-main-window/components/titlebar/CommonButtons.vue`
- 操作：
  - 将主题加入分组（`system / bright / dark`）
  - 增加 `[data-theme-id='xxx']` 的选择面板样式

7. 设置页主题选择器
- `src/renderer/src-main-window/components/settings-modal/AppSettings.vue`
- 操作：
  - 把主题加到对应 `group` 的 `children`

8. i18n
- `src/shared/i18n/zh-CN/renderer.yaml`
- `src/shared/i18n/en/renderer.yaml`
- 操作：
  - 同步补齐：
    - `CommonButtons.themeSelector.presets.xxx`
    - `AppSettings.basic.theme.options.xxx`

## 3. Token 合同（必须齐全）

每个 `:root[data-theme-id='xxx']` 至少提供：

- 基础色：
  - `--la-color-bg-primary`
  - `--la-color-text-primary`
  - `--la-color-link`
- 浮层与控件：
  - `--la-color-scrollbar-thumb`
  - `--la-color-scrollbar-thumb-hover`
  - `--la-color-select-menu-bg`
  - `--la-color-message-bg`
  - `--la-color-popconfirm-bg`
  - `--la-color-popover-border`
- 主窗口结构：
  - `--la-sidebar-bg`
  - `--la-sidebar-border`
  - `--la-wallpaper-overlay-start`
  - `--la-wallpaper-overlay-mid`
  - `--la-wallpaper-overlay-end`
- 卡片桥接：
  - `--la-card-tint-rgb`
  - `--la-card-border-rgb`
  - `--la-card-surface-95`
  - `--la-card-surface-90`
  - `--la-card-muted-surface`
- 战绩卡片：
  - `--la-match-win-solid`
  - `--la-match-win-grad-start`
  - `--la-match-win-grad-end`
  - `--la-match-loss-solid`
  - `--la-match-loss-grad-start`
  - `--la-match-loss-grad-end`
  - `--la-match-neutral-solid`
  - `--la-match-neutral-grad-start`
  - `--la-match-neutral-grad-end`

## 4. 明亮/深色分组规则

分组规则必须和 `resolveThemeSetting` 对齐：

- `bright` 组：`colorTheme` 必须是 `light`
- `dark` 组：`colorTheme` 必须是 `dark`

否则会出现：
- 主题项显示在“明亮”但 `dark:` 样式生效
- 或显示在“深色”但弹层/文字按亮色渲染

## 5. 回归验证清单

最小验证：

1. 类型检查
- `yarn typecheck:web`

2. 功能验证
- 设置页能切换新主题并持久化
- 标题栏主题选择器分组与设置页一致
- `default` 不受影响（仍跟随系统）

3. 多窗口一致性
- Main / Aux / OP.GG / Ongoing / CD Timer
- 检查：背景、卡片、消息、通知、下拉、Popover

4. 重点视觉点
- 战绩卡片胜负色对比是否清晰
- 开关、单选、复选“选中态”是否可辨识
- 小弹窗 tooltip 文本是否可读

## 6. 维护约束

- 优先改系统层：`theme-system.css` + `naive-ui.ts` + Provider。
- 尽量不在业务页面增加主题硬编码。
- 不要无意改动 `light` 与 `dark` 旧基线；如需变更，单独提交。
- 主题 key 涉及持久化兼容，改名需评估迁移。

## 7. 常用检索命令

```bash
rg -n "AppThemeSetting|resolveThemeSetting|APP_THEME_VALUES|APP_THEME_IDS" src/shared/types
rg -n "data-theme-id='|data-theme-id=\\\"" src/renderer
rg -n "THEME_OVERRIDES|GlobalThemeOverrides" src/renderer-shared/theme/naive-ui.ts
rg -n "themeSelector\\.presets|theme\\.options" src/shared/i18n
```
