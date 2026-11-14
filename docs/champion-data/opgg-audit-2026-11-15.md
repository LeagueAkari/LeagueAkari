# OP.GG API 与响应形状核对（2026-11-15）

## 证据和范围

读取本机安装的 OP.GG **3.3.0** `resources/app.asar`，检查当前 `react` 前端 bundle 和主进程资源，再请求对应公开接口核对响应。没有启动、修改或登录 OP.GG，也没有调用符文写入接口。

主要请求定义来自：

- `react-8377.d0cce38e.bundle.js`：对位详情、`target_champion` / `role` / `is_more` 参数。
- `react-ChampionRecommendation.ba97ffc7.bundle.js`：分路搭配、月度段位统计。
- `react-AIChatBot.76f63491.bundle.js`：单英雄概览。
- `react-3855.f539da1a.bundle.js`、`react-WebApp.6ac7487b.bundle.js`：元数据与版本。
- `react-JungleCampRanking.6ad46363.bundle.js`：清野用时排行。
- `react-BrawlTiers.5dd89513.bundle.js`、`react-GameMode.f294a811.bundle.js`：Brawl 榜单与模式区分。

本次扩展阶段保存了 34 份实时响应，涵盖新增接口、元数据、特殊英雄和灵活组排。工作区 `.playwright-mcp/opgg-api-audit-20261115/` 保留 URL、抓取时间和原始响应，仅作为本地核对记录，不参与运行时。

## 已扩充的 API 库

下表路径以 `https://lol-api-champion.op.gg` 为起点；`mode` 是 `ranked` 或 `flex`。已有方法继续保留，返回手写 TypeScript 类型的原始响应，不验证、修复或筛除字段。

| 方法                         | 路径或新增参数                                                               | 返回内容                                     |
| ---------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| `getRankedChampionSummary`   | `/api/{region}/champions/{mode}/{id}/summaries`                              | 单英雄总体与分路概览                         |
| `getRankedChampionMatchup`   | `/api/{region}/champions/{mode}/{id}/{position}/counters/{targetId}`         | 两名英雄各自的对位统计；样本不足可以为空数组 |
| `getRankedChampionSynergies` | `/api/{region}/champions/{mode}/{id}/{position}/synergies/{partnerPosition}` | 搭档英雄、胜率、场数、搭配排名               |
| `getRankedTierStatistics`    | `/api/{region}/champions/ranked/tier-statistics?period=month`                | 各段位的累计表现数据                         |
| `getRankedChampion`          | 新增 `targetChampionId` → `target_champion`、`role`                          | 按对手或玩法类别筛选配置                     |
| `getBrawlTiers`              | `/api/contents/tiers`，不传 `type`                                           | Brawl 榜单，和 `type=aram_mayhem` 不同       |
| `getMetaChampionNames`       | `/api/meta/champion-names`                                                   | 轻量英雄名称列表                             |
| `getMetaRunePages`           | `/api/meta/rune-pages`                                                       | 符文系名称、说明和图标                       |
| `getMetaAramAugments`        | `/api/meta/aram-augments`                                                    | Mayhem 强化符文名称、描述、图标和品质        |
| `getMetaVersions`            | `/api/meta/versions`                                                         | 元数据版本列表                               |

原有英雄、装备、符文、属性碎片四个元数据方法也补齐了响应类型。类型位于 `src/shared/types/opgg/`，关键处注明最后实测日期。

另有独立的 `OpggDesktopHttpApiAxiosHelper.getJungleFullCamps`：

- 服务地址是 `https://desktop-api.op.gg`，路径 `/timer/jungle-fullcamps`。
- 它是 OP.GG 桌面产品使用的**远端服务**，不是本机客户端端口。此次无需账号或客户端运行即可读取。
- 支持客户端所使用的分页、队列、英雄、地区、段位、PUUID、时间下界参数。
- `fullCampTime` 以毫秒计，返回完成时间排行，不包含逐营地路线。客户端使用 `timeFrom=171000`。
- 尚未接入 Akari 页面或 renderer 代理；不能复用指向 champion 服务的 `akari://opgg`。新增封装本身不会发起日常请求。

## 特殊数据核对

| 对象                                                 | 实测结果与类型约定                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 卡兹克（121）                                        | 加点序列包含 `R-Q`、`R-W`、`R-E`、`R-R`。保留原码，页面可以显示进化目标；已加入投影回归测试并在实际窗口验证 |
| 维克托（112）                                        | `skill_evolves` 提供独立进化顺序，常规技能序列仍使用 Q/W/E/R                                                |
| 杰斯（126）                                          | 加点序列可以只有 Q/W/E；不要求每种技能都出现                                                                |
| 伊莉丝（60）、奈德丽（76）                           | 变身英雄仍返回基础技能字母；元数据有自己的 `evolve` 字段，不把两者强制合并                                  |
| 厄斐琉斯（523）、彗（910）、尼菈（895）、凯隐（141） | 当前加点接口仍使用基础技能字母。样本的 `order` 长度为 15，不假设必须是 18 级                                |
| 多分路英雄                                           | 保留同英雄的多个 `positions`；彗样本包括 MID/SUPPORT/ADC                                                    |
| 对位接口                                             | 上单、打野、辅助样本结构相同；罕见组合返回 `data: []`，不制造双方零统计                                     |
| 灵活组排                                             | 单英雄概览、对位、搭配均实测返回与单排相同的结构                                                            |
| 元数据                                               | 扫描完整列表，保留空描述、nullable 价格/视频，以及仅部分英雄/装备具备的 `availability`                      |

没有把这些差异处理成“异常恢复”。已知合法差异属于接口类型和正常业务转换；将来远端约定变化应更新代码。

## 响应形状与类型收窄

不把不同响应形态合成一堆可选字段：

- Ranked 详情是基础详情或扩展详情。`is_more=true` 一起增加 `single_items`、`combination_items`、`single_runes`。调用 API 时传入字面量 `isMore: true`，返回值直接具有扩展类型；动态参数返回两种详情的联合。
- Ranked、ARAM、Arena 等按接口和模式分别建模，不保留 `foo?: never` 来伪装另一种响应上的字段。
- 英雄元数据是普通英雄或 JADE 英雄的联合；JADE 分支具有完整的 `availability`，普通分支没有该属性。
- 装备元数据区分无作用域和有作用域记录；有作用域记录再按 `availability.provenance` 区分 DDragon 与 JADE 元数据，只有 JADE 分支具有 `metadata_scope`。
- `null` 保留其实际含义。Doom 详情的 `trends` 固定为 `null`；概览的 `average_stats` 可以为 `null`，且不一定伴随 `is_rip=true`，因此不能凭 `is_rip` 强行推导数据存在。
- QQ101 的版本列表响应具有 `baton`，策略响应具有 `message` 与编码数据对象，两类分别声明。各接口的内层字段通过 `Qq101Payloads` 分开，不使用一个全部可选的“大响应”。

本次用 **60 份 OP.GG 原始响应、42 份 QQ101 原始响应及 49 份解码后的内层对象**，直接生成带类型标注的字面量，再交给 TypeScript 编译。151 个样本赋值全部通过，包括完整的 257 条英雄目录和 905 条装备目录；不是只查看每个数组的第一条记录。

这一步找出并补齐了原来遗漏的 `single_runes`、`MARKSMAN|SLAYER`、Doom 空趋势，以及 QQ101 的 `rune_single_details` 和经典服其他排序榜单字段。QQ101 另核对了上述九名特殊英雄的排位加点，以及卡兹克、维克托、厄斐琉斯的 Mayhem 详情：技能编号仍按 1/2/3/4 编码，加点序列长度并非全部相同；不把 OP.GG 的进化编码规则套给 QQ101。

这份实测覆盖的是记录日期下的这些模式、版本、请求参数与英雄样本。类型检查用于开发阶段；运行时不重复验证远端响应，也不修补不符合约定的数据。新增字段尚未全部投影到页面，功能接入范围后续单独讨论。
