# OP.GG 2026-10-18 抓包核对

## 结论

现有页面使用的 OP.GG 解析结构与这份抓包一致。发现的缺口主要在请求能力：
排位详情的 `is_more` 参数、独立 counters 接口、`doom` 模式，以及四类 metadata 接口。
这些已补进共享 HTTP helper；独立 counters 已接入现有的降级解析方式。

这次只补 API 和原始响应类型，没有增加页面入口、替换资源来源或调整自动化。
`doom` 进入 API 模式列表，但不进入页面的 `OpggChampionDataMode`。

## 原始文件与提取范围

- 输入：`C:\Users\hanxven\Desktop\opgg2.chls`，323,542,409 字节，Charles 会话格式。
- SHA-256：`bccd1e1c0731c3a35d55fabc49194ceb0d696892d9824f9d115ba7ed04dfa3d7`。
- 会话共 2,645 条记录。筛选 OP.GG 域名并排除图片、网页、脚本、样式与字体后保留 187 条。
- 另做一次仅按主机筛选、不排除 MIME 类型的检查：`lol-api-champion.op.gg` 恰好 165 条，全部 HTTP 200。
- 165 份主 API 响应包含 79 个不同的响应体 SHA-256；验证按全部记录进行，没有将重复请求算作独立接口。

使用本机 Charles 5.2 的 `filter`、`convert` 命令提取。命令格式见
[Charles 官方命令行文档](https://www.charlesproxy.com/documentation/tools/command-line-tools/)。
直接转换整个会话曾因 URL 解码和某条 Brotli 响应失败，产生的残缺导出没有作为完整性依据。
最终使用筛选后成功转换的 `.chlz`，读取其中的元信息和响应体。

可复用文件位于仓库的 `.playwright-mcp/opgg2-audit/`，属于本地忽略目录：

- `opgg-api-extract.zip`：主 API 的精简提取包，包含接口清单、165 份 JSON、请求对照结果、解析结果和本报告。
- `api-inventory.json`：按路径归并的接口目录，包含观察到的参数、响应字段和样本引用。
- `api-manifest.json`：165 条请求的路径、参数、状态、响应体文件名和 SHA-256。
- `responses/`：提取后的响应体；文件编号与 manifest 一致。
- `request-coverage.json`、`replay-before.json`、`replay-after.json`：对照与解析结果。

精简包只含公开英雄数据相关的 URL 参数和响应 JSON，不包含原请求头、Cookie、请求体或整个 Charles 会话。
原 `.chls` 文件保持原样。

## 接口目录

统一主机：`https://lol-api-champion.op.gg`。下列请求都是 GET。
`{region}` 在抓包中出现 `GLOBAL`、`global`、`eune`、`jp`、`me`、`ru`。
本地继续使用小写 `global`；补充线上请求已确认该形式有效。

| 路径                                                      |    条数 | 本地对应方法 / 本次处理                   |
| --------------------------------------------------------- | ------: | ----------------------------------------- |
| `/api/{region}/champions/ranked`                          |      15 | `getRankedChampions`，已有                |
| `/api/{region}/champions/ranked/{id}/{position}`          |      12 | `getRankedChampion`，新增 `isMore` 参数   |
| `/api/{region}/champions/ranked/{id}/{position}/counters` |      12 | 新增 `getRankedChampionCounters`          |
| `/api/{region}/champions/aram`                            |       2 | `getAramChampions`，已有                  |
| `/api/{region}/champions/aram/{id}/none`                  |      16 | `getAramChampion`，已有                   |
| `/api/{region}/champions/arena`                           |       3 | `getArenaChampions`，补可选 `tier: 'all'` |
| `/api/{region}/champions/arena/{id}`                      |       3 | `getArenaChampion`，补可选 `tier: 'all'`  |
| `/api/{region}/champions/nexus_blitz`                     |       4 | `getNexusBlitzChampions`，已有            |
| `/api/{region}/champions/nexus_blitz/{id}/none`           |       6 | `getNexusBlitzChampion`，已有             |
| `/api/{region}/champions/urf`                             |       1 | `getUrfChampions`，已有                   |
| `/api/{region}/champions/urf/{id}/none`                   |       1 | `getUrfChampion`，已有                    |
| `/api/{region}/champions/doom`                            |       1 | 新增 `getDoomChampions`                   |
| `/api/{region}/champions/doom/{id}/none`                  |       1 | 新增 `getDoomChampion`                    |
| `/api/{region}/champions/{mode}/versions`                 |      24 | `getChampionVersions`，补 `doom` 模式     |
| `/api/contents/aram-balance`                              |      16 | `getAramBalance`，已有                    |
| `/api/contents/tiers?type=aram_mayhem`                    |       8 | `getAramMayhemTiers`，已有                |
| `/api/contents/stats/champions/{id}/aram-augments`        |      15 | `getAramMayhemChampionAugments`，已有     |
| `/api/meta/champions`                                     |       1 | 新增 `getMetaChampions`                   |
| `/api/meta/items`                                         |      22 | 新增 `getMetaItems`                       |
| `/api/meta/runes`                                         |       1 | 新增 `getMetaRunes`                       |
| `/api/meta/stat-mods`                                     |       1 | 新增 `getMetaStatMods`                    |
| **合计**                                                  | **165** |                                           |

### 参数与版本

| 模式        | 抓包中的 tier                         | 抓包中的 version                   |
| ----------- | ------------------------------------- | ---------------------------------- |
| ranked      | `emerald_plus`、`gold_plus`、`master` | `16.19`、`16.20`；详情未传 version |
| aram        | `emerald_plus`、`platinum_plus`       | `16.20`                            |
| arena       | `all`                                 | `16.20`                            |
| nexus_blitz | `all`                                 | `13.23`                            |
| urf         | `platinum_plus`                       | `16.04`                            |
| doom        | `all`、`platinum_plus`                | `15.17`                            |

版本列表的 24 条记录分布为 ranked 6、aram 10、arena 3、nexus_blitz 3、urf 1、doom 1。
旧娱乐模式仍返回历史版本数据，不能用当前排位版本替代其版本列表。
`doom` 的中文名称及页面接入方式不由这份响应推断。

## 需要保留的响应差异

### `is_more` 扩展装备统计

抓包中的 12 次排位详情均带 `is_more=true`，且均包含 6 组 `single_items` 和 5 组 `combination_items`。
补充线上对照使用同一英雄、分路、段位与版本：

```text
/api/global/champions/ranked/777/top?tier=master&version=16.20
/api/global/champions/ranked/777/top?tier=master&version=16.20&is_more=true
```

两次均返回 200；不带参数的响应没有这两个字段，带参数的响应与抓包相同，包含 6 组和 5 组数据。
分组形状为 `{ depth, items: [{ ids, play, win, pick_rate }] }`。
因此新增 `isMore?: boolean`，映射为 `is_more`；原始详情类型中两组字段均为可选。
未传选项时不发送该参数，也不默认扩大现有页面的请求。

这两组额外字段暂不进入页面 DTO。现有详情解析器只保留页面使用的字段，
也会有意移除 `trends`、`game_lengths`、`rune_pages` 等未使用内容。
这与错误数据被降级、过滤是两回事；原始响应仍可从 HTTP helper 获取。

### counters 是独立列表

独立接口返回 `{ data: [{ champion_id, play, win }], meta: { version, cached_at } }`。
样本 `responses/0006.json` 有 62 条对位记录，第一条为
`{ champion_id: 58, play: 695, win: 359 }`。

新增 `parseOpggRankedCounters(input)`，沿用 `{ data, issues }` 返回形式和已有 counter schema。
坏的英雄 ID 会过滤该条记录；坏场次恢复为 0，未知胜场为 null。
详情中的 `counters` 和摘要中的分路 counters 保持现有解析方式。

### arena 的参数与统计

补充对照 `/api/global/champions/arena/50?version=16.20`，分别省略 tier 和传 `tier=all`：
两次均返回 200，`data` 深比较相同，只有缓存时间不同。
因此只补充显式传 `all` 的能力，不更改默认请求。

arena 详情的顶层 `skills` 确实带 `total_place`、`first_place`；
`skill_masteries[].builds[]` 没有这两个字段。现有原始类型分别使用
`OpggArenaSkillOrder` 与 `OpggSkillOrder`，与样本对应。

### metadata 与资源

四个端点均使用 `hl=zh_CN`；本地调用选项名为 `locale`。
items、runes、stat-mods 另支持本次捕获的 version 参数。
champions 本次只观察到 locale，不额外声明未验证的 version 选项。

| 端点 / 样本             | 样本规模 | 可用内容                                                            |
| ----------------------- | -------: | ------------------------------------------------------------------- |
| champions / `0057.json` |   250 条 | `id/key/name/image_url`，技能、被动、皮肤、基础属性、描述与攻略文本 |
| items / `0045.json`     |   912 条 | `id/name/image_url`、合成路径、价格、属性、描述、`availability`     |
| runes / `0062.json`     |    62 条 | `page_id/slot_sequence/rune_sequence`、图标、长短描述               |
| stat-mods / `0061.json` |    10 条 | 符文碎片 ID、名称、描述与图标                                       |

这些端点返回 `{ data: [...], meta: { version, cached_timestamp } }`，
不是统计接口的 `cached_at` 形状。items 抓包覆盖缺省、空字符串、
`13.23`、`15.17`、`16.04`、`16.19`；不应固定为最新装备表。
最新 items 样本的 `availability` 包含 `map_ids`、`exclusivity`、`provenance`，
合成路径字段 `into_items/from_items` 可以为 null。

HTTP 层继续返回 `AxiosResponse<unknown>`，不会用类型断言代替校验。
四类元数据目前未接入资源加载和页面，因此没有提前建立一整套未使用的 DTO 或 schema。

## 其他主机中的候选资料

这些资料单独记录，没有塞进固定主机的 champion API helper：

| 请求                                                      | 结果与用途                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `desktop-app-data.op.gg/analytics/TW/champion_stats.json` | 200，桌面端 TW 英雄统计，可供后续专门核对                                                  |
| `desktop-app-data.op.gg/analytics/TW/duo_stats.json`      | 403，没有成功响应，不能据此定义可用契约                                                    |
| `desktop-api.op.gg/buff-nerf/latest?gameType=lol`         | 200，版本改动资料，包含 `patchVersion/title/description/sourceUrl/en/kr`；样本标注 `26.20` |

网页跳转、视频分段、WebSocket、广告/配置请求不属于这次英雄 API 的接入范围。
补丁资料的 `26.20` 与统计接口的 `16.20` 是不同字段的实际原值，本次不做跨系统版本换算。

## 验证

1. 用真实 Axios adapter 路径重放 165 个请求，检查 helper 生成的路径、全部 query 参数、
   AbortSignal 和原始响应保留。**165/165 一致**。比较时只归一化 `GLOBAL/global` 和 query 顺序。
2. 用本地解析器回放 140 份统计/版本响应：原来能解析的 128 份，加上补齐的 12 份独立 counters。
   **异常 0、issues 0；已解析列表的数据条数均与输入相同**。
3. 25 份 metadata 响应检查了请求契约和原始 JSON，没有声称它们已经通过业务 schema 校验。
4. 线上追加的四次请求用于确认 `is_more` 和 arena 的 `tier=all` 行为；不代表所有英雄和版本。
5. `yarn typecheck` 通过；`yarn test`：**117 个测试文件、772 项测试通过**。
   新增 16 项请求/解析契约测试，另单独运行已有 OP.GG response boundary 测试，合计 21 项通过。
6. `git diff --check` 通过。

本次验证覆盖这份抓包出现的接口和参数，以及四次补充线上采样。
没有将单次抓包当作所有地区、分路、版本和参数组合的保证。

## 后续接入：灵活排位与出装顺序

以下为同日完成的后续实现，更新上文“暂不进入页面 DTO”的阶段性结论。

- 模式选择现在区分单双排与灵活排位。HTTP helper 通过 `queue: 'solo' | 'flex'`
  选择 `ranked` 或 `flex` 路径，继续共用排位响应结构；省略 queue 保持单双排。
- 灵活排位的版本、榜单、详情和独立 counters 接口均已线上验证返回 200。
  页面、版本缓存和榜单缓存按 mode 区分；现有选人跟随识别 queue ID 440。
- 排位详情请求发送 `is_more=true`，解析 `single_items` 与 `combination_items`。
  单件的 `depth` 是第几件，组合的 `depth + 1` 是几件套，保留上游装备顺序和原始场次。
  字段缺失时正常得到空列表，无须报错；坏阶段或坏装备记录使用已有解析恢复规则。
- “按顺序出装”使用现有 SettingsSection、radio、展开控件、装备展示和统计组件。
  单件与组合共用阶段选择，只展示当前阶段；展开入口位于 header。
  没有分阶段数据时继续显示原有装备推荐。
- 所有装备区的 header 使用同一个“+ 导入”按钮组件，均调用当前页面的完整 itemSet；
  独立的“方案应用”区已删除。未连接客户端、正在加载、数据过期或正在应用时禁止导入。
- 对位区从完整 counters 列表分为优势（胜率 > 50%）和劣势（胜率 < 50%），
  优势由高到低、劣势由低到高，取消原来的三个推荐限制。
  胜率未知或恰好 50% 的对位不归入任一组；空组 radio 禁用，自动选择有数据的一组。
  头像使用已有 ChampionIcon 和资源提供器，名称使用 tooltip。
- OP.GG 和 101 的标签栏内边距、分割线与筛选区间距已统一。
- 两个来源共用四行技能加点表：优先级、选用率／场次和胜率放在首行，
  下面由 Q／W／E／R 四行独占。加点格固定 22 × 22px，右侧允许留白；
  首列使用无底色标签并留出间隔，与后续加点格区分。
  方案序号、优先级和统计位于首行，加点表在第二行使用完整宽度；
  优先级从第 1 级加点格开始对齐，统计使用带标签的单行展示。
  两套方案之间间隔 32px，OP.GG 和 101 均默认显示两套，更多方案通过 header 展开。
  卡兹克的 `R-Q`、`R-W` 等保留在原始数据对应的 R 行列中，
  字母居中、进化箭头定位在右上角，tooltip 说明等级和进化目标。

### 后续验证

同一条件 `global / emerald_plus / 16.20 / 永恩 / top` 的实际响应：

| 队列     | 上单场次 |     胜率 |
| -------- | -------: | -------: |
| 单双排   |  160,218 | 49.7553% |
| 灵活排位 |   28,067 | 50.5754% |

这是采样结果，不是固定数据。Electron 中也确认请求分别进入 `ranked`、`flex` 路径。

- `yarn typecheck`、`yarn test` 通过：117 个文件、780 项测试。
- 更新后的 parser 再次回放 140 份抓包响应，异常 0、issues 0、已解析列表无条数损失。
- 实际 Electron 窗口验证 530 × 718 和 1100 × 820：单件／组合切换、六件套、
  header 展开至 10 条及收起均正常，未发现横向越界。
- 灵活排位样本完整显示 27 个优势和 31 个劣势对位；31 个头像在客户端未连接时均加载成功。
  临时内存样本验证仅优势、仅劣势、全部为空，结束后恢复原数据。
- 两个来源的标签栏 top 均为 40px，筛选控件 top 均为约 84.67px，控件高 28px。
- 共享加点表通过 `yarn typecheck:web`；实际窗口验证 OP.GG 卡兹克的 15 列及
  101 海克斯大乱斗的 17 列原始加点序列，530px 和 1100px 窗口下格子均为
  22 × 22px，没有拉伸或横向越界。卡兹克第 6 列的 tooltip 为“6 级：升级 R，进化 Q”。
- 当前客户端未连接，真实装备写入未执行；完整方案写入和页面身份校验由已有执行器测试覆盖。

对手专属出装、排位搭配推荐、`single_runes` 等仍待独立核对与设计；本轮不新增自动应用功能。
