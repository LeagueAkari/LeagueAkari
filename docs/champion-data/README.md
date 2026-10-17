# Champion Data 数据边界

每个来源维护自己的结构。OP.GG 和 QQ101 不共享英雄详情 DTO。

## 四层职责

| 层           | 职责                                                                | 实现                                                                        |
| ------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Axios 请求   | 组装 URL、参数和 AbortSignal，原样返回 Axios 响应；响应体为 unknown | `src/shared/http-api-axios-helper/{opgg,qq101}/`                            |
| QQ101 parser | 解外壳、嵌套 JSON、分隔记录；保留源字段名、数值文本和单位           | `src/shared/data-adapter/qq101/protocol-parser.ts`                          |
| 校验         | Zod 识别已知结构、剔除未知字段、恢复损坏字段或记录，汇总诊断        | `src/shared/data-adapter/{opgg,qq101}/schemas.ts`                           |
| Akari 映射   | 显式构造业务 DTO，使用驼峰字段、数值 ID 和业务单位                  | QQ101 的 `akari-adapter.ts`；OP.GG 的 `projection.ts` 与 `akari-adapter.ts` |

QQ101 的 `protocol.ts` 串起纯数据转换；`Qq101DataSource` 串起请求与转换。
OP.GG 的 loader 在请求后执行校验，controller 调用 projection 生成页面快照。
OP.GG 普通 JSON 不需要 QQ101 那种额外的协议 parser。

例：QQ101 原始 `52.16` 文本在 parser 后仍为字符串，在校验后为源单位的 number，
在 Akari mapper 后为 `winRate: 0.5216`。`championId` 只有在通过正整数校验后才能进入业务记录。

## 恢复规则

- 损坏统计值恢复为字段声明的默认值：未知统计通常为 null，空列表为 []。
- OP.GG 保留现有展示契约：推荐的场次、登场比例缺失时为 0；未知胜场为 null，无法计算的胜率和败场为 null。
- ARAM 平衡数据缺失时使用中性基线：比例项为 100，加法项为 0。
- 核心身份无法识别时过滤该条记录，保留其他记录。不会伪造英雄、装备、符文或召唤师技能 ID。
- 可直接应用的 OP.GG 符文页和召唤师技能组合必须完整；不会把残缺配置补成可应用推荐。
- QQ101 的 JSON 分区损坏仅影响该分区。HTTP 失败、取消仍由 loader/controller 的请求流程处理。
- 未使用的上游字段不进入最终模型，不用展开整个上游对象的方式生成业务 DTO。

## 互斥类型

OP.GG 英雄详情是判别联合：常规模式、arena、aram_mayhem 分别携带各自有效字段。
业务代码必须检查 `kind`，才能访问符文页、斗魂竞技场强化或海克斯强化等字段。
摘要的胜率统计与名次统计也通过 `kind` 区分。
QQ101 overview/details 保持按 `mode` 区分的联合；极地和海克斯英雄记录分别具有独立返回类型。

`null` 表示值未知；不通过可选字段组合猜测模式。最终 OP.GG 契约位于
`src/shared/types/champion-data/opgg.ts`，QQ101 契约由显式 Akari 映射函数的返回结构推导，
不再从 HTTP helper 返回类型推导。

## 日志与验证

对外调用普通解析函数，例如 `parseOpggAramBalance(input)`，统一返回 `{ data, issues }`。
`data` 是校验并适当降级后的结构，`issues` 是本次解析的问题列表；正常时为空。
问题包含字段路径、原因和最多 80 字符的原始标量样本，不携带整份响应。

每个来源的 `ResponseParser` 和 Zod schema 在模块加载时创建一次。
解析函数按顺序完成解包、校验和映射；每次调用收集独立的问题列表，不注册回调、不执行日志或 `flush()`。
调用方按需读取 `issues`，请求失败和取消仍沿用 loader/controller 的处理流程。

测试覆盖 HTTP 原样返回、四层单位转换、未知字段剔除、字段/行/分区降级、连续调用的问题隔离、
不可应用配置过滤及现有页面请求取消/版本隔离流程。

QQ101 的近期线上采样见 [2026-10-07 审计](./qq101-audit-2026-10-07.md)。
OP.GG 的抓包提取、接口补齐和响应回放见 [2026-10-18 审计](./opgg-audit-2026-10-18.md)。
