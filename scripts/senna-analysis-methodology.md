# 赛娜 OTP 分析方法论

## 概述

对高段位赛娜单招（OTP）玩家的单双排辅助局进行全面分析，生成包含出装、符文、对位、决策树等维度的 HTML 报告。

## 数据来源

### 1. SGP (Service Gateway Proxy)
- **SUMMARY 端点**: `/match-history-query/v1/products/lol/{platformId}_{gameId}/SUMMARY`
  - 返回单局所有10名参与者信息（英雄、位置、胜负、KDA等）
  - 用于提取：己方/对方 辅助、ADC、打野英雄
- **DETAILS 端点**: `/match-history-query/v1/products/lol/{platformId}_{gameId}/DETAILS`
  - 返回时间线数据（每分钟位置、事件）
  - 用于提取：购买装备顺序及时间戳、游走事件
- **比赛列表**: `/match-history-query/v1/products/lol/player/{puuid}/SUMMARY?startIndex={n}&count={m}`

### 2. Data Dragon (静态数据)
- 英雄 ID → 英雄名 映射 (`champion.json`)
- 物品数据（名称、价格、合成路线）(`item.json`)
- 符文数据（ID → 名称）(`runesReforged.json`)

### 3. lolalytics (翡翠+ 大样本去偏基准)
- **对位数据 (counter API)**: `a1.lolalytics.com/mega/?ep=counter&v=1&c=senna&tier=emerald_plus&lane=support&vslane={role}`
  - vslane=support → 赛娜 vs 对方辅助 胜率
  - vslane=bottom → 赛娜 vs 对方 ADC 胜率
  - vslane=jungle → 赛娜 vs 对方打野 胜率
- **协同数据 (build-team API)**: `a1.lolalytics.com/mega/?ep=build-team&v=1&patch=30&c=senna&lane=support&tier=emerald_plus&queue=ranked&region=all`
  - team.bottom → 赛娜与己方 ADC 协同胜率
  - team.jungle → 赛娜与己方打野 协同胜率

## 筛选条件

- `queueId = 420`（单双排）
- 玩家使用赛娜且位置为 UTILITY（辅助）
- 排除重开局（`gameDuration < 300`）

## 五因子去偏模型

### 动机
原始胜率受阵容强弱影响。例如"出 X 装备时胜率高"可能只是因为对面是弱势辅助时倾向出这件装备。

### 模型
对每局计算期望胜率，综合5个因子（来自 lolalytics 翡翠+ 大样本数据）：

1. **对方辅助** — `LOLA_VS_SUP[enemy_sup]` (对位胜率)
2. **对方 ADC** — `LOLA_VS_ADC[enemy_adc]` (对位胜率)
3. **对方打野** — `LOLA_VS_JG[enemy_jg]` (对位胜率)
4. **己方 ADC** — `LOLA_WITH_ADC[ally_adc]` (协同胜率)
5. **己方打野** — `LOLA_WITH_JG[ally_jg]` (协同胜率)

```
expected_wr(game) = mean(available_factors)  # 缺失因子不参与计算
```

### 去偏胜率计算
```
debiased_wr = (actual_wins - sum(expected_wr_per_game)) / games + overall_wr
excess_wins = actual_wins - sum(expected_wr_per_game)  # 超额胜场（可为正/负）
```

- 去偏胜率**不做 cap**，可超过 100%
- 超额胜场为正 = 装备/符文本身有正向贡献
- 超额胜场为负 = 实际表现不如期望

## 分析维度

### 1. 总览
场次、胜率、KDA、场均时长、视野分、经济、伤害

### 2. BAN 位推荐
- 对方辅助：按胜率排序，计算预期损失（= 场次 × (50% - 实际胜率)）
- 对方 ADC：同上
- 对方打野：同上
- 阈值：≥5场，预期损失 ≥1.5 场标为"必BAN"

### 3. 队友搭配
- 己方 ADC 按胜率评级（S/A/D/F）

### 4. 出装路线
- **第一件大件**：原始胜率 + 去偏胜率 + 超额胜场 + 平均完成时间
  - 成装判定：`item_gold >= 1500`，排除鞋子/出门装/消耗品
- **前两件/三件组合**（≥3场）
- **鞋子选择**

### 5. 符文分析
- 基石符文胜率（原始 + 去偏）
- 主系 + 副系组合
- 符文 + 首件装备联动

### 6. 出装路线决策树
按 **基石符文 → 第1件 → 第2件** 分支展示：
- 基石层：≥10场
- 第1件层：≥5场
- 第2件层：≥3场
- 不足阈值的归入「其他」（悬浮显示详情）
- 未出第二件的单独统计

### 7. 出装犹豫分析（孤儿小件）
第一件成装完成前买的、不在该成装合成路线内的小件。
- 排除：鞋子底材(1001)、女神之泪(3070)
- 说明中途换了出装思路

### 8. 游走主动性
基于位置数据判断离开下路时间，统计先游走/对方先游走的胜率差异。

### 9. 对局时长
短局(15-25分)/中局(25-35分)/长局(35分+) 胜率对比

### 10. 详细对位
所有对位英雄的胜率、KDA（辅助/ADC/打野）

## 输出

### 图表（matplotlib）
1. 对面辅助胜率水平条形图
2. 第一件大件原始 vs 去偏胜率双条图

### 报告
- `report-{player}.html` — 自包含 HTML（base64 嵌入图表，CSS tooltip 决策树）
- `report-{player}-zh.md` — Markdown 版本

## SGP 区域端点

| 区域 | SGP Base URL | Platform ID |
|------|-------------|-------------|
| NA | `usw2-red.pp.sgp.pvp.net` | NA1 |
| EUW | `euw1-red.pp.sgp.pvp.net` | EUW1 |
| KR | `kr-red.pp.sgp.pvp.net` | KR |

## 依赖

- Python 3.10+
- matplotlib, numpy, requests
- League Client 运行中（获取 SGP Bearer Token）
