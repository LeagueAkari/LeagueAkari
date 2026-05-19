# League Akari v1.4.3 到当前开发阶段阶段性总结

生成时间：2026-05-18  
调研区间：`4dffce03` -> `13c95f38`  
起点说明：仓库本地没有 `v1.4.3` tag。根据 `package.json` 与 `CHANGELOG.md`，`4dffce03` 是进入 `1.4.3-rabi.1` 的提交，并包含 `v1.4.3` 的 changelog 修订，因此本文以它作为 v1.4.3 基线。  
终点说明：当前分支 `hw-dev-wip` 的最新提交是 `13c95f38 WIP`，日期为 2026-05-18。当前分支比 `private/hw-dev-wip` ahead 1。

## 1. 总览

从 v1.4.3 基线到当前开发阶段，项目经历了明显的 1.5.0 开发周期转向。变更不只是小修小补，而是围绕以下几个方向展开：

1. 战绩页与玩家页重构：战绩加载、分页、筛选、挑战、英雄熟练度、段位展示等玩家页能力持续增强。
2. 高级战绩筛选系统：从简单筛选演进为可组合的规则树/谓词系统，并进一步增加了普通用户可理解的简易筛选层。
3. 对局分析与打野路线分析：新增玩家级聚合分析模块，并在 ongoing game 面板和战绩详情中展示打野开野、gank、控图、资源控制等信息。
4. OP.GG 小窗口增强：补充海克斯乱斗、ARAM、Kiwi/特殊强化等数据展示，并改善装备方案导入和版本/模式过滤。
5. 主题与跨平台工作：加入新主题系统、Naive UI 主题抽象、macOS 窗口与托盘适配、原生能力跨平台封装。
6. 自动更新与远程配置：迁移到新的 updater，增强 release 获取兜底、远程配置 schema、公告/更新通知和中国大陆更新逻辑。
7. 构建、测试与 CI：加入 Windows/macOS 构建 workflow、macOS codesign 脚本、Vitest、API fixture 测试快照。
8. 类型和架构整理：shard 类型集中化，ongoing-game、analysis、player-tab 等模块被拆分为更细粒度文件。

区间统计：

- 提交数：184 个提交。
- 文件变更：512 个文件。
- 净行数：约 241678 行新增、10915 行删除。
- 注意：新增行数主要受 `src/shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/` 下大量 LCU/SGP 快照影响；功能代码的真实规模远小于净新增行数。

当前版本号：

- 起点附近：`1.4.3-rabi.1`。
- 当前：`1.5.0-rabi.1`。

## 2. v1.4.3 本身的发布内容

`CHANGELOG.md` 中 v1.4.3 的内容是这段调研的基线：

### 2.1 新增

- OP.GG 小窗口添加海克斯乱斗英雄的海克斯强度数据。

### 2.2 修复

- 修复自动英雄选择/禁用中的时间计算错误，确保时间被限定在当前阶段可用时间内。
- 修复对局页面某些情况下无法正常展示胜率的问题。
- 修复开黑判断错误，避免错误地把部分曾一起游玩的玩家判定为预组队。
- 修复“忽略此版本更新”功能失效。

### 2.3 调整

- 自动更新解压流程改由自动更新器接管。
- 公告会弹出小型 popover 以预览核心内容。
- 战绩卡片在斗魂竞技场模式中显示金币列。
- 增加更多方式保证自动更新系统可用。

## 3. 版本与提交阶段

### 3.1 2026-01：v1.4.3 后的修复与基础增强

主要集中在自动更新、OP.GG、自动选择、战绩卡片体验和玩家页基础能力。

关键变化：

- 修复 `ignoreVersion`，让忽略特定更新版本重新生效。
- 自动选择组增加位置维度，支持按位置配置。
- 自动选择阶段时间修正回归，修补 v1.4.1/1.4.3 期间为了规避边界问题而暂时移除的逻辑。
- 加入 Akari API axios helper，为统计/更新等 Akari 自有服务调用提供统一封装。
- OP.GG 增强：
  - 增加海克斯/ARAM 相关强化数据。
  - 修复英雄分路 tier 与实际位置不一致。
  - 导入装备方案、版本过滤、模式过滤逐步完善。
- 自更新增强：
  - 迁移到新的 `akari-updater.exe`。
  - 处理 updater 路径问题。
  - 增加中国大陆特定更新逻辑。
  - 增加 release 获取兜底路径。
  - 自动下载失败时提示用户。
- 公告体验：
  - 增加 tooltip/popover 预览。
  - 修复公告弹出条件。
- 战绩卡片：
  - overview UI 微调。
  - 录像下载按钮展示下载状态。
  - TeamTable 数字格式修复。
- 玩家页：
  - 添加玩家属性视图。
  - 增加从 player tab 快速跳到第一页战绩的入口。
  - 修复 GamePreviewer 导航到其他召唤师时的行为。
- 客户端辅助：
  - mini skin selector 与 LCU 状态同步。
  - 额外资源下载能力加入。
- 工程：
  - Yarn 升级。
  - `shared/types/shards` 开始集中承载 shard 的跨进程类型。

代表提交：

- `4dffce03`：修复 ignoreVersion，并把版本推进到 `1.4.3-rabi.1`。
- `b62f1e42`：auto-select group 支持 position。
- `6f1b2ef1`：auto select 时间修正。
- `84c736a1`：迁移到新 updater。
- `322195e5`：中国大陆自更新逻辑。
- `07f83d07`：OP.GG 海克斯乱斗强化推荐。
- `5048ea56`：shard 类型集中化。
- `e03a009a`：玩家属性视图，并把版本推进到 `1.4.4-rabi.1`。

### 3.2 2026-02 上旬：战绩卡片时间线、玩家页数据加载和 macOS 初步适配

关键变化：

- 战绩详情增加 timeline 小地图显示。
- 战绩卡片增加基于时间线的统计视图。
- 玩家挑战数据刷新修复。
- 引入 StickyBox，用于改进复杂布局中的吸附/滚动体验。
- Session token 获取重试次数增加，提高连接鲁棒性。
- ongoing-game panel 开始拆分，为后续打野分析和组件化铺路。
- macOS：
  - 添加原生 addon fallback。
  - 保护 Windows-only 逻辑，避免 macOS 上调用无效事件或 API。
  - 调整日志目录、签名流程。
  - 增加 zh-CN Windows-only 提示。

代表提交：

- `d3336cc1`：match card stats by timeline。
- `fd1b5a97`：timeline tab 显示小地图。
- `84d30d3b`：引入 StickyBox。
- `9d3d52fa`：拆分 ongoing-game-panel。
- `0f5933f3`：macOS 构建 native addon fallback。
- `b6fc1940`：保护 Windows-only 代码。
- `15f0b0a0`：macOS re-sign 与日志目录修复。

### 3.3 2026-02 中旬：打野路线分析与 ongoing game 面板重构

这是 1.5.0 开发阶段最核心的功能推进之一。

新增能力：

- ongoing game 面板加入打野路线偏好分析。
- 对玩家战绩中的打野行为进行聚合：
  - 首轮开野偏好。
  - buff/营地起手方向。
  - 入侵开局识别。
  - Lv3/Lv4 时间点和路线判断。
  - gank 侧重边、分路偏好和 easy-gank 标签。
  - 小龙/峡谷先锋/巢虫/大龙等中立资源统计。
  - 单人偷龙/solo dragon 识别。
  - 基于地图区域的权重汇总。
- 战绩详情增加打野路线展示。
- 提供 match-history / ongoing-game 两侧的显示开关，默认开启。
- TeamTagsArea 修正为只过滤指定队伍成员，避免跨队伍混淆。
- ongoing-game panel 被进一步组件化，拆成 team、player info card、tags、champion list 等部件。

主要代码变化：

- 新增 `src/shared/data-adapter/analysis/player/` 分层分析目录。
- 删除旧的 `src/shared/data-adapter/analysis/players.ts`，改为 single/aggregate/types/utils 的结构。
- 新增 `src/main/shards/ongoing-game/computed-state.ts`，将 ongoing-game 的派生状态抽出来。
- `src/main/shards/ongoing-game/index.ts` 与 `state.ts` 大幅调整，用于承载新增分析数据。
- 删除旧的单体 `src/renderer-shared/components/ongoing-game-panel/PlayerInfoCard.vue`。
- 新增 `src/renderer-shared/components/ongoing-game-panel/widgets/player-info-card/` 组件族：
  - `PlayerInfoCard.vue`
  - `PlayerInfoCardHeader.vue`
  - `PlayerInfoCardStats.vue`
  - `PlayerInfoCardMatchHistory.vue`
  - `PlayerInfoCardChampionUsage.vue`
  - `PlayerInfoCardJunglePathing.vue`
- 新增打野路线 UI 组件族：
  - `FirstClearAndGankSummary.vue`
  - `GankMap.vue`
  - `GankPreferenceSummary.vue`
  - `JunglePathingInfo.vue`
  - `MapPreferenceSummary.vue`
  - `ObjectivesSummary.vue`
  - `preference.ts`
  - `types.ts`

代表提交：

- `a6c708ae`：ongoing game 打野路线偏好分析。
- `80ecdd9c` / `cb55f1a8`：ongoing game panel 重构。
- `20d1c171`：目标资源统计、分析布局与版本推进。
- `3c0dff37`：区域权重和地图 marker。
- `e8fb843b`：入侵开局统计和 buff 标注。
- `903bc736`：边路 gank 拆分、入侵检测、四营开野。
- `fb84cb8c`：Lv3/Lv4 检测修复。
- `fac01456`：战绩详情接入打野路线，并添加显示开关。
- `7e6d054c`：首轮开野地图和 solo drake 分析增强。
- `e52ee9a6`：采样和 easy-gank 标签增强。
- `22d1942b`：打野路线信息 UI 更新。

### 3.4 2026-02 中下旬：玩家页、战绩加载与筛选系统演进

新增能力：

- 玩家页战绩加载改为流式/分批加载，改善长列表加载体验。
- 战绩筛选支持按获取时机、位置、模式、数量/时间范围等维度过滤。
- 增加互斥的战绩数量模式和时间模式。
- 练习模式/非正式对局默认隐藏或可独立控制。
- 战绩模式标签、筛选开关跨会话持久化。
- 段位面板展示胜场、负场和胜率。
- 排位模式下自动刷新 LP。
- Champion avatar 可作为 match card 内的快捷入口，跳转/筛选到对应英雄。
- 支持 champion usage history filter，用于 ongoing-game 分析里按英雄使用历史筛选。
- 添加 collection/progression 类展示，让收集战绩时的进度更明确。

主要代码变化：

- player-tab 文件位置重组到 `src/renderer/src-main-window/views/player-tabs/components/player-tab/`。
- 原 `views/player-tabs/player-tab/` 下大量文件被移动或拆分。
- 新增 player-tab 数据模块：
  - `data/match-history.ts`
  - `data/match-history-filters.ts`
  - `data/ranked-stats.ts`
  - `data/challenges.ts`
  - `data/champion-mastery.ts`
- 新增/重写 widgets：
  - `MatchHistoryList.vue`
  - `MatchHistoryPagination.vue`
  - `ChampionMasteryPane.vue`
  - `ChampionMasteryModal.vue`
  - `PlayerChallenges.vue`
- 删除旧的 `MatchHistoryFilter.vue`，后续替换为更完整的筛选系统。

代表提交：

- `34fc4b9d`：默认隐藏练习模式对局。
- `1e6e44c7`：可见性 backfill 和非标准对局开关。
- `a26f8084`：模式标签和筛选开关持久化。
- `9dfaa3ae`：排位 LP 自动刷新。
- `ddd364d2`：战绩数量/时间模式互斥。
- `a4a84b7a`：fetch-time filters 与英雄快捷入口统一。
- `63a74e46`：流式加载和 context 注入稳定化。
- `ac81bc32`：champion-avatar 快捷入口。
- `7bdb2aa1`：按位置过滤战绩。
- `84691962`：战绩收集进度展示。

### 3.5 2026-02 下旬到 2026-03：主题系统与 FTUE

新增能力：

- 主题系统重新设计：
  - 新增统一主题系统。
  - 预设调色板刷新。
  - Naive UI 主题统一抽象。
  - 添加 cyber neon 高科技黑/黄绿色主题。
  - 亮色/暗色默认 preset 重新调整。
- FTUE/onboarding：
  - 增加 hero/theme onboarding。
  - 增加 spotlight FTUE。
  - guide reset 统一。
  - 修复 FTUE completion 持久化。
- UI token 与 provider locale 绑定修正。

主要代码变化：

- 新增 `src/renderer-shared/assets/css/theme-system.css`。
- 新增 `src/renderer-shared/theme/naive-ui.ts`。
- `NaiveUIProviderApp.vue` 在多个窗口内改造，以统一主题接入。
- `src/renderer-shared/shards/guide/` 新增 guide shard：
  - `Guide.vue`
  - `composables.ts`
  - `index.ts`
  - `store.ts`
  - `types.ts`
- main window 中 titlebar/sidebar/common buttons 等多个 UI 组件配合主题/窗口风格调整。

代表提交：

- `5f84e1b1`：统一主题系统和 preset palettes。
- `0087b258`：主题系统大改和分组选择器。
- `384cd733`：hero/theme onboarding 和 guide reset。
- `dbc80414`：cyber neon 主题。
- `621f21ab`：恢复战绩筛选流程与内置主题颜色。
- `0f6c714e`：重置 Naive UI 默认亮/暗 preset。
- `14b8d3e9`：恢复 Mica 背景透明。

### 3.6 2026-02 下旬到 2026-03：高级战绩筛选系统

这是另一个重要架构点。原本的简单筛选逐渐演进为“组合条件 + 规则树 + 简易模式”的双层系统。

新增能力：

- 高级筛选支持逻辑组合：
  - AND / OR / NOT。
  - any/every。
  - player / members / team / opponent 等相对成员语义。
- 业务条件覆盖：
  - 胜负。
  - 队列。
  - 游戏类型。
  - 英雄。
  - 位置。
  - 召唤师技能。
  - 装备。
  - 强化符文/augment。
  - 数值区间。
  - 是否包含指定玩家。
- 简易筛选支持“普通用户路径”，避免用户必须直接编辑 AST。
- 添加筛选状态版本和序列化/反序列化。
- 添加内置筛选预设和示例。
- 添加选择召唤师搜索组件，便于筛选中引用玩家。

主要代码变化：

- 新增 `src/shared/data-adapter/predicates/combinators.ts`，把筛选运行时抽象到 shared 层。
- 新增 `src/renderer/src-main-window/views/player-tabs/components/player-tab/widgets/match-history-filters/`：
  - `AdvancedMatchHistoryFilter.vue`
  - `SimpleMatchHistoryFilter.vue`
  - `MatchHistoryFilters.vue`
  - `CombinatorComp.vue`
  - `NSelectWithSummonerSearching.vue`
  - `combinator-factories.ts`
  - `combinator-nodes.ts`
  - `combinator-runtime.ts`
  - `filter-state.ts`
  - `maps.ts`
- 新增多个组合条件组件：
  - `AndOr.vue`
  - `AnyOrEvery.vue`
  - `Game.vue`
  - `GameTypeCheck.vue`
  - `HasAugment.vue`
  - `HasItem.vue`
  - `HasPlayer.vue`
  - `HasSpell.vue`
  - `IsChampion.vue`
  - `IsPosition.vue`
  - `IsQueue.vue`
  - `Not.vue`
  - `NumberBetween.vue`
  - `OfMembers.vue`
  - `OfPlayer.vue`
  - `WinResult.vue`
- 新增预设：
  - `presets/filter-presets.ts`
  - `presets/FilterPresetExamples.vue`
- 新增讨论文档 `docs/match-history-filter-ui-discussion.md`，记录高级筛选 UI 的交互判断。

代表提交：

- `675146d7`：高级战绩筛选。
- `a1afe69e`：重建高级战绩筛选 UI。
- `43184c44`：combinators UI 调整。
- `13c95f38`：最近一次 WIP，重点继续推进 match-history filters，新增 `SimpleMatchHistoryFilter.vue`、filter-state、预设和 collect progress UI 调整。

### 3.7 2026-03 到 2026-04：跨平台原生能力与 macOS 窗口适配

新增能力：

- app-common store 增加 platform 状态字段，让渲染侧可根据平台做 UI/行为分支。
- Darwin/macOS 窗口：
  - 应用菜单。
  - 交通灯位置处理。
  - sidebar 顶部 padding 避让交通灯。
  - tray icon 尺寸/缩放修复。
  - CD timer 在 fullscreen spaces 可见。
- 原生能力抽象：
  - 将 Windows addon / process utils / macOS process utils 统一到 `src/main/native/`。
  - 非 Windows 平台提供 fallback，避免直接依赖 Windows-only addon。
- keyboard shortcut 在 macOS 下增加平台感知保护。

主要代码变化：

- 新增 `src/main/native/`：
  - `addons-win32.ts`
  - `errors.ts`
  - `index.ts`
  - `process-utils-darwin.ts`
  - `process-utils-win32.ts`
- `src/main/shards/window-manager/` 多个窗口改造：
  - `base-akari-window.ts`
  - `main-window/window.ts`
  - `ongoing-game-window/window.ts`
  - `opgg-window/window.ts`
  - `cd-timer-window/windows.ts`
  - `position-utils.ts`
- `src/main/shards/tray/index.ts` 做平台差异化处理。
- `src/renderer/src-main-window/components/titlebar/TrafficButtons.vue` 和 sidebar/titlebar 相关组件被大量调整。

代表提交：

- `877d8957`：app-common 增加 platform state。
- `74558180`：Darwin 样式支持移到 Vue reactive system。
- `72bb345a`：统一跨平台原生能力开端。
- `cd6fd8b0`：macOS tray icon size。
- `547d32db`：Darwin application menu。
- `03601820`：sidebar 正确处理 macOS traffic lights。
- `6849a057`：主窗口 traffic light position。
- `a98ebcec`：tray icon scaling 和资源引用。

### 3.8 2026-04 到 2026-05：分析模块重构、测试快照和当前 WIP

关键变化：

- `analysis` 模块进一步重构，复用 single analysis 生成 aggregated map，减少重复分析。
- 选择“激进加载全部 game details”，为更完整的历史分析/筛选提供数据基础。
- 增加 loading state，改善大量详情加载时的反馈。
- 新增 API fixture 测试体系：
  - LCU match history games。
  - LCU timelines。
  - SGP match-history-query。
  - manifest。
- 添加 Vitest 配置和测试脚本。
- 最近 WIP 继续集中在战绩筛选、打野路线信息 UI、ongoing-game title、match card 小修。

主要代码变化：

- 新增 `vitest.config.ts`。
- `package.json` 新增：
  - `test`
  - `test:watch`
  - `build:mac`
- 新增 `src/shared/test-fixtures/api/`：
  - `README.md`
  - `api-fixtures.test.ts`
  - `index.ts`
  - `snapshots/2026-05-16-tencent-hn10/`
- 新增大量 snapshot JSON，覆盖多个 queue：
  - `q_420`
  - `q_430`
  - `q_440`
  - `q_450`
  - `q_480`
  - `q_900`
  - `q_1700`
  - `q_1750`
  - `q_2300`
  - `q_2400`
  - `q_4210`
  - `q_4220`
  - `q_4240`
  - `q_4250`
  - `q_4260`
- `src/shared/data-adapter/analysis/player/` 下增加测试：
  - `match-history-fixtures.test.ts`
  - `aggregate/win-loss.test.ts`
  - `utils/geometry.test.ts`
  - `utils/math.test.ts`

代表提交：

- `50d228df`：analysis 重构。
- `ee681303`：通过 aggregated map 复用 single analysis。
- `8ddf4be2`：激进加载全部 game details。
- `69275ecb`：loading state。
- `13c95f38`：当前最新 WIP。

## 4. 功能变更清单

### 4.1 自动更新与远程发布

- 自动更新流程从应用内解压进一步迁移到独立 updater。
- `resources/akari-updater.exe` 更新，旧 `resources/7za.exe` 被移除。
- 新增 updater 路径修复。
- 自更新 shard 支持：
  - 中国大陆更新逻辑。
  - release 获取兜底。
  - 更新失败通知。
  - 新 release 数据结构中的 description 和 publishAt 正确处理。
  - 忽略版本与通知状态修复。
- UI 上更新弹窗和通知适配新的 release/ignoreVersion 状态。
- 新增 `src/shared/http-api-axios-helper/akari/`，封装 Akari API 和 OSS 访问。

### 4.2 远程配置

- 远程配置 shard 支持更多数据类型。
- ongoing-game 主进程 shard 开始使用 remote config 提高鲁棒性。
- auto-select groups 从本地硬编码迁移到远程仓库。
- 内置配置从 `resources/builtin-config/` 迁移/删除部分旧 JSON：
  - 删除 `resources/builtin-config/ongoig-game/config.json`。
  - 删除 `resources/builtin-config/sgp/league-servers.json`。
  - 删除 `resources/builtin-config/sgp/supported-queues.json`。
- 新增 `src/shared/schemas/remote-config/index.ts`，替换旧 validator。
- `src/main/shards/remote-config/builtin.ts`、`index.ts`、`state.ts` 大幅调整。

### 4.3 自动选择与游戏流

- auto-select group 支持 position。
- auto-select 增加 computed-state，把计算逻辑从 state/index 中拆出。
- 自动选择时间修正重新加入。
- auto-gameflow 支持在 champion select dodge 回到匹配阶段时取消自动匹配/重新排队，避免误触发。
- 处理 champ select dodge return before requeue 的边界。
- 自动化页面 UI 与样式归并到新的布局体系。

### 4.4 OP.GG 小窗口

- 添加海克斯乱斗/ARAM Mayhem augment 推荐。
- 增加 Kiwi augment 组件 `OpggChampionKiwiAugments.vue`。
- augment description 在 zh-CN 下显示。
- champion tier 与 position 对齐修复。
- 版本、模式、region、tier 等过滤/上下文状态调整。
- 装备方案导入和清理逻辑修复。
- 小窗口样式接入主题系统。

### 4.5 战绩卡片

- 时间线 tab 增加小地图。
- 增加基于 timeline 的统计图。
- build/runes 详情默认折叠。
- build tab 不再 collapse 的回滚处理。
- TeamTable 数字格式修复。
- 斗魂竞技场/Cherry 模式金币列展示。
- 地图位置、伤害明细、击杀事件等组件继续微调。
- `match-card/tabs/timeline/` 下新增：
  - `MatchCardTimelineTab.vue`
  - `MatchCardStatsLine.vue`
  - `MatchCardDiffLineChart.vue`
- `match-card/utils/game-map.test.ts` 增加地图逻辑测试。

### 4.6 玩家页

- PlayerTab 被移动到 components 目录并拆分。
- 增加玩家属性、挑战、英雄熟练度、战绩筛选、分页等独立数据模块。
- 支持流式加载战绩，减少一次性加载压力。
- 支持战绩收集进度展示。
- 增加战绩数量/时间两种模式。
- 增加位置筛选、英雄快捷筛选、历史使用英雄筛选。
- 排位 pane 展示胜/负/胜率。
- 排位 LP 自动刷新。
- 修复普通模式无位置 preset。
- 修复分页/跳转/预览其他召唤师时的若干行为。

### 4.7 战绩高级筛选

- 新增 shared predicate combinator。
- 新增高级筛选 AST/规则树 UI。
- 新增简易筛选 UI。
- 新增筛选状态版本管理。
- 新增筛选预设和示例。
- 支持玩家搜索型选择器。
- 支持同类/跨类组合语义逐步向更自然的用户模型靠拢。

### 4.8 ongoing game 与对局分析

- ongoing-game 主进程状态拆分出 computed-state。
- ongoing-game panel 从单体组件拆成多个细组件。
- 加入房间/英雄选择/游戏中数据分析能力延展。
- 加入打野路线偏好、gank、资源目标、首轮开野等分析。
- 增加 champion usage history filter。
- 增加 easy-gank 标签。
- 修复 teamIdentifier 判断，确保参与者队伍检查使用正确字段。
- 修复预组队标签位置和插值显示。
- 修复 team tags 只过滤指定队伍成员。

### 4.9 数据分析层

- 旧分析入口 `players.ts`、`teams.ts`、`relationship.ts` 被拆分。
- 新结构：
  - `analysis/player/single/`
  - `analysis/player/aggregate/`
  - `analysis/player/types/`
  - `analysis/player/utils/`
  - `analysis/relationship/index.ts`
  - `analysis/team/index.ts`
- 新增维度：
  - akari 相关标签。
  - champion 使用。
  - details 聚合。
  - jungle 分析。
  - positions。
  - spells。
  - summary。
  - team-side。
  - win-loss。
  - early deaths。
  - objectives。
- 新增数学与几何工具测试。

### 4.10 主题、窗口和 UI

- 新主题系统覆盖多窗口：
  - main window。
  - aux window。
  - OP.GG window。
  - ongoing game window。
  - CD timer window。
- Naive UI provider 统一主题注入。
- titlebar/common buttons/sidebar/traffic buttons 大幅调整。
- 新增版本水印，对 `-rabi` 版本可见。
- 主窗口关闭确认 modal。
- TabbedPage 组件抽象。
- Toolkit/Automation 页面移除旧的局部 styles，改用新布局/主题机制。
- 背景材质和 Mica 透明修复。

### 4.11 macOS 与跨平台

- macOS build 脚本和 workflow。
- macOS codesign 兜底脚本。
- macOS 原生 addon fallback。
- macOS 应用菜单。
- macOS traffic lights/sidebar 避让。
- tray icon 尺寸和 scaling 修复。
- CD timer 在 fullscreen spaces 可见。
- Windows-only 代码加保护。
- 跨平台 process utils 抽象。

### 4.12 构建、CI、依赖

- 新增 `.github/workflows/build-win.yml`。
- 新增 `.github/workflows/build-mac.yml`。
- Windows 构建产物支持 nsis 和 7z。
- GitHub Releases 发布 win/mac build outputs。
- 构建 workflow 改为手动触发。
- CI 支持缓存 electron binaries。
- 使用 `NPM_AUTH_TOKEN` 安装私有包。
- `packageManager` 从 Yarn 4.10.3 升级到 4.14.1。
- Electron、Vue、Vite、Tailwind、TypeScript、Naive UI、Vitest 等依赖升级。
- 新增 `test` 和 `test:watch`。

### 4.13 测试与 fixture

- 引入 Vitest。
- 增加 match-history fixture 测试。
- 增加 API 快照读取工具。
- 增加真实 LCU/SGP 快照，覆盖多队列和 timeline。
- 增加 `game-map`、`geometry`、`math`、`win-loss` 等单元测试。

## 5. 主要添加项

### 5.1 新增目录/模块

- `.agents/skills/league-akari-mcp-debug/`
- `.github/workflows/build-mac.yml`
- `.github/workflows/build-win.yml`
- `docs/match-history-filter-ui-discussion.md`
- `src/main/native/`
- `src/main/shards/auto-select/computed-state.ts`
- `src/main/shards/ongoing-game/computed-state.ts`
- `src/renderer-shared/assets/css/theme-system.css`
- `src/renderer-shared/components/ongoing-game-panel/widgets/player-info-card/`
- `src/renderer-shared/components/sticky-box/`
- `src/renderer-shared/shards/guide/`
- `src/renderer-shared/theme/naive-ui.ts`
- `src/renderer/src-main-window/components/TabbedPage.vue`
- `src/renderer/src-main-window/components/MainWindowCloseConfirmModal.vue`
- `src/renderer/src-main-window/views/player-tabs/components/player-tab/widgets/match-history-filters/`
- `src/renderer/src-main-window/views/test/`
- `src/shared/data-adapter/analysis/player/`
- `src/shared/data-adapter/predicates/combinators.ts`
- `src/shared/http-api-axios-helper/akari/`
- `src/shared/http-api-axios-helper/sgp/challenges-client.ts`
- `src/shared/schemas/remote-config/index.ts`
- `src/shared/test-fixtures/api/`
- `src/shared/types/shards/`
- `vitest.config.ts`

### 5.2 新增测试/开发页面

- `GameDataTest.vue`
- `GuideTest.vue`
- `MarkdownTest.vue`
- `MatchHistoryFiltersTest.vue`
- `SelfUpdateTest.vue`
- `example-markdown.ts`

### 5.3 新增资源

- `build/icon.png`
- `resources/iconTemplate.png`
- 更新后的 `resources/akari-updater.exe`

## 6. 主要移除与迁移

### 6.1 移除

- `resources/7za.exe`：自更新解压不再依赖内置 7za。
- `resources/builtin-config/ongoig-game/config.json`
- `resources/builtin-config/sgp/league-servers.json`
- `resources/builtin-config/sgp/supported-queues.json`
- `src/main/shards/auto-select/groups.ts`
- `src/renderer-shared/components/ongoing-game-panel/PlayerInfoCard.vue`
- `src/renderer/src-main-window/components/PlayerTagEditModal.vue` 的旧位置/旧实现。
- `src/renderer/src-main-window/views/automation/automation-styles.css`
- `src/renderer/src-main-window/views/toolkit/toolkit-styles.css`
- `src/renderer/src-main-window/views/player-tabs/player-tab/widgets/MatchHistoryFilter.vue`
- `src/shared/data-adapter/analysis/players.ts`
- `src/shared/data-adapter/analysis/teams.ts`
- `src/shared/data-adapter/analysis/relationship.ts`
- `src/shared/validators/remote-config.ts`

### 6.2 迁移/重命名

- `src/main/utils/ux-cmd-utils.ts` -> `src/main/shards/league-client-ux/ux-cmd-utils.ts`
- `src/renderer-shared/components/ongoing-game-panel/ongoing-game-utils.ts` -> `constants.ts`
- `PlayerCardTagsArea.vue` 移动到 `widgets/player-info-card/` 下。
- `src/renderer/src-main-window/views/player-tabs/player-tab/` 大量内容移动到 `views/player-tabs/components/player-tab/`。
- `toIdentities.ts` -> `identities.ts`。
- Fandom schema 从 `json-def.ts` 迁移到 `schemas/fandom/index.ts`。

## 7. 当前最新提交 `13c95f38` 的重点

最新提交标题仍是 `WIP`，但 diff 显示它主要在推进战绩筛选与相关 UI：

- 新增 `SimpleMatchHistoryFilter.vue`，说明筛选系统开始提供简易模式。
- 新增/完善 `filter-state.ts`，管理筛选状态版本、序列化和状态转换。
- 新增 `FilterPresetExamples.vue` 与 `filter-presets.ts`，提供筛选预设。
- 调整 `MatchHistoryFilters.vue`、`CombinatorComp.vue`、多个 combinator components。
- 调整 `CollectModeProgress.vue`，改善收集进度 UI。
- 调整 `MatchHistoryList.vue` 与 `MatchHistoryPagination.vue`。
- 删除 player-tabs shard/store 中部分旧筛选状态。
- ongoing-game 侧增加少量状态字段。
- ongoing-game titlebar UI 继续调整。
- match-card overview/builds/runes 等做小修。
- 打野路线 PlayerInfoCard UI 做局部调整。

这意味着当前开发阶段的重心仍然在“战绩筛选产品化”和“分析结果展示整理”上。

## 8. 风险与待确认点

- 许多提交标题为 `WIP`，实际内容需要以 diff 为准；本文已按文件变更和模块结构归纳，但仍可能存在未命名的小修没有被单独列出。
- 仓库没有本地 `v1.4.3` tag，基线通过版本号和 changelog 推断为 `4dffce03`。
- `CHANGELOG.md` 顶部已有 `v1.4.4`，但当前 `package.json` 是 `1.5.0-rabi.1`，说明正式 changelog 尚未覆盖 1.5.0 开发阶段。
- 新增 API 快照极大抬高新增行数，统计时不应把它等同于业务代码膨胀。
- `resources/builtin-config/ongoig-game` 路径中 `ongoig` 拼写历史遗留，当前已经删除对应内置配置文件，但如果远程配置仍依赖旧路径，需要确认迁移完整性。
- `src/shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/` 包含真实样例数据，发布前应确认不包含敏感账号信息或不应公开的召唤师标识。
- TypeScript 已升级到 `~6.0.3`，Vue Router 升到 `5.0.6`，需要关注生态兼容性。
- 当前分支 ahead 1，最近提交未推送到 `private/hw-dev-wip`。

## 9. 建议补充到正式 CHANGELOG 的草案

以下是面向用户的简化版，可作为后续正式 changelog 的起点：

### 新增

- 新增战绩高级筛选，支持胜负、队列、英雄、位置、召唤师技能、装备、强化符文、玩家和数值区间等条件组合。
- 新增战绩简易筛选和筛选预设。
- 新增战绩收集进度展示。
- 新增玩家挑战和英雄熟练度展示。
- 新增打野路线分析，包括首轮开野、gank 偏好、资源控制和地图区域倾向。
- 对局分析页面新增打野路线卡片和更多玩家历史表现统计。
- 战绩详情新增时间线小地图和时间线统计图。
- OP.GG 小窗口新增海克斯乱斗/ARAM 相关强化推荐数据。
- 新增主题系统和多套主题预设。
- 新增 macOS 初步支持、macOS 应用菜单和窗口交通灯适配。
- 新增 Windows/macOS 构建工作流。
- 新增 Vitest 测试与 LCU/SGP API 快照测试体系。

### 调整

- 玩家页、战绩列表、分页和筛选模块重构。
- ongoing-game 面板组件化重构。
- 数据分析层拆分为 single / aggregate / types / utils。
- 自动更新迁移到新版 updater，并移除内置 7za。
- 远程配置 schema 和内置配置机制调整。
- auto-select 配置迁移到远程组，并支持位置维度。
- Naive UI provider 与主题 token 统一。
- 多窗口标题栏、侧边栏和工具页样式统一。
- 依赖、Yarn、TypeScript、Vue、Vite、Tailwind 等升级。

### 修复

- 修复忽略更新版本失效。
- 修复 OP.GG tier 与位置不一致。
- 修复公告弹出条件。
- 修复玩家挑战刷新。
- 修复 TeamTable 数字格式。
- 修复 teamIdentifier 队伍判断。
- 修复预组队标签显示和 team tags 过滤。
- 修复 champion select dodge 后自动匹配误触发。
- 修复 macOS 下 Windows-only API 和窗口/托盘相关问题。

## 10. 调研命令记录

主要使用的命令：

```bash
git status --short --branch
git tag --list
git log -1 --decorate --oneline
git log --all --decorate --date=short --pretty=format:"%h %ad %d %s"
git log --all -S"1.4.3" --date=short --pretty=format:"%h %ad %s" -- package.json CHANGELOG.md electron-builder.yml
git diff --shortstat 4dffce03..HEAD
git diff --dirstat=files,0 4dffce03..HEAD
git diff --stat --compact-summary 4dffce03..HEAD
git diff --name-status 4dffce03..HEAD
git rev-list --count 4dffce03..HEAD
```
