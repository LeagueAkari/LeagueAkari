---
name: custom
description: 为 League Akari fork 设计、实现或审查定制功能，以及同步上游时检查定制兼容性。遵循 main、renderer、shared 各自的 custom 目录隔离、双 SQLite 和最小接入点方案；不用于普通上游功能维护。
---

# League Akari 定制开发

目标：让定制代码一眼可辨，减少跟进上游时的冲突，同时沿用现有 Electron、Shard、IPC、Vue 和数据库技术栈。

这是约定的目标结构，不代表代码已经实现。先检查工作区、相关源码和实际接入点，再确定本次变更范围。
用户要求只读讨论时，只输出设计；使用此技能不构成写入、同步 Git、提交、推送或发布的授权。

## 配合现有项目规则

- Shard 工作先读 [league-akari-shard-development](../league-akari-shard-development/SKILL.md)。
- renderer UI 工作先读 [league-akari-ui-components](../league-akari-ui-components/SKILL.md)。
- 涉及 SGP/LCU 数据源时读 [league-akari-sgp-data-source](../league-akari-sgp-data-source/SKILL.md)。
- 调试 dev 窗口时读 [league-akari-mcp-debug](../league-akari-mcp-debug/SKILL.md)。
- 准备 PR 前读取仓库根目录 `PR_REQUIREMENTS.md`。

定制代码的位置采用下述用户指定的 `custom` 结构，替代一般 Shard 示例中的默认目录。
其余生命周期、职责拆分、IPC、UI 和测试规则继续遵循项目技能。

## 目录边界

以下路径相对于仓库根目录；按实际需求创建，不预建空目录或虚构业务示例。

```text
src/
├── main/custom/
│   ├── register.ts
│   └── shards/
│       ├── storage/
│       │   ├── index.ts
│       │   ├── database-lifecycle.ts
│       │   ├── state.ts
│       │   ├── entities/
│       │   └── upgrades/
│       └── <实际功能名>/
├── renderer/custom/
│   ├── main-window/
│   │   ├── register.ts
│   │   ├── routes.ts
│   │   ├── navigation.ts
│   │   └── views/
│   │       └── <实际功能名>/
│   ├── shared/
│   │   ├── shards/
│   │   ├── components/
│   │   ├── composables/
│   │   └── locales/
│   └── <其他实际使用的窗口>/
└── shared/custom/
    └── <实际功能名>/
```

- 只在边界目录使用 `custom`；内部目录使用实际业务名，不采用 `custom-业务名`。
- Shard ID、IPC namespace、路由名、翻译根键等全局标识保留定制命名空间，避免和上游重名。
- 页面私有组件、辅助文件和测试留在功能目录；确实跨功能或跨窗口复用时再提取。
- `renderer/custom/shared` 是 renderer 专用共享代码，可以依赖 Vue、Pinia。
- `shared/custom` 是 main 与 renderer 共用的数据契约、校验、常量或纯函数，不引入数据库实体、Electron 主进程模块或 Vue 页面。
- 定制 renderer 代码集中在 `renderer/custom`，不要散落到上游 `renderer-shared`。
- 不复制整套上游页面、连接层或公共基础设施；复用其公开能力，只在真实易变依赖处做薄适配。
- 不因几个定制功能引入动态插件系统、新仓库、新窗口或独立构建体系。

## 双 SQLite

默认使用同一应用 `userData` 下的两个文件：

| 数据库 | 所有者 | 内容 |
| --- | --- | --- |
| `LeagueAkari.db` | 上游 StorageMain | 上游原有数据 |
| `CustomFeatures.db` | `main/custom/shards/storage` | 定制业务数据与需持久化的业务配置 |

- 复用已安装的 TypeORM 和 better-sqlite3；主进程分别管理两个 DataSource。
- 定制库独立维护实体、结构版本和迁移。不要向原库追加实体、列或定制迁移，也不要继承原库生命周期来处理定制数据。
- 同一个定制库服务多个功能；不按页面或 renderer 窗口各开一个库。
- 正式数据使用明确迁移，关闭自动表结构同步。迁移失败保留原数据并报告错误，不自动清库重建。
- 旧程序遇到不支持的新库版本时，停止定制库读写并提示，不自动降级。
- 根据真实契约选择稳定业务标识和账号、区域范围；不依赖上游表的自增 ID 或跨库外键。
- 读取上游数据优先使用已有业务 shard 的公开方法，避免定制代码直接依赖原库表结构。
- 不默认提供跨库原子提交。确需同时修改两个库且要求全成全败时，先重新讨论事务边界。
- 仅在需要保留当时状态时存业务快照，不无目的复制上游数据。

现有 `SettingFactoryMain` 写入原库。原有设置继续沿用其机制；页面临时状态留在 renderer；
需要随定制业务保存、备份的配置进入定制库。这是定制数据隔离对通用设置持久化规则的具体例外，
不要因此复制一个通用 SettingFactory。

检查当前 Shard manager 的失败传播和销毁顺序。若初始化抛错会中断整体启动，则在定制模块内处理
可识别的数据库不可用情况：记录错误、暴露不可用状态、阻止定制任务和数据操作，让上游功能继续初始化。
不得把失败伪装为空数据或吞掉无关程序错误。通过依赖关系保证业务在库就绪后运行，退出时先停止任务再关闭库。

## renderer 与 IPC

调用方向：页面 → 页面 composable（需要时）→ renderer shard → 现有 IPC → main 业务 shard → 定制存储。

- main 拥有持久数据和后台任务；renderer store 仅保存显示状态、缓存和必要的同步状态。
- IPC 暴露具体业务操作，在主进程边界校验输入，不向 renderer 暴露任意 SQL、数据库路径或数据库连接。
- 沿用现有 IPC 返回值和异常封装，业务不重复包装 envelope。
- 小型实时状态复用 MobX → Pinia 同步；列表分页查询，不同步整张表。
- 各窗口有独立 Shard manager 和 Pinia 实例；只在实际使用功能的窗口注册。
- 后台任务统一在 main 执行，避免多窗口重复运行。确有多窗口读写时，通过主进程事件或现有状态同步触发刷新。
- 当前主窗口使用 KeepAlive；页面轮询、监听要处理激活和停用，切换查询对象时避免旧请求覆盖新结果。
- 沿用 Naive UI、主题变量与局部样式。文案集中在定制 locales，菜单文案保持响应式。
- 路由名与菜单 key 保持对应；出现嵌套子路由时再处理父菜单选中映射。
- 检查现有游戏开始自动跳转是否符合新页面需求，不默默覆盖上游行为。

## 最小接入点

实施前核对当前源码，以下是已讨论的接入位置，不是允许任意重构这些文件：

| 现有文件 | 定制接入 |
| --- | --- |
| `src/main/bootstrap/index.ts` | setup 前调用 `main/custom/register.ts` 注册定制 shards |
| `src/renderer/src-main-window/shards/index.ts` | 调用定制主窗口 register |
| `src/renderer/src-main-window/routes/index.ts` | 追加定制路由，页面可延迟加载 |
| `src/renderer/src-main-window/components/sidebar/Sidebar.vue` | 在现有响应式菜单中追加定制 navigation |
| `src/renderer-shared/i18n/index.ts` | 接入定制文案，避免翻译根键重名 |
| `tsconfig.web.json` | 覆盖 `src/renderer/custom` 的 TypeScript 与 Vue 文件 |
| `electron.vite.config.ts`、`tsconfig.web.json` | 需要时一致配置 `@renderer-custom` 别名 |

main 与 shared 可沿用 `@main/custom`、`@shared/custom`。核对测试工具是否需要对应的路径解析配置。
普通页面复用现有窗口入口、preload 和 IPC，无需新增 Vite entry。
后续新增功能优先修改自己的 register、routes、navigation；其他窗口只有使用功能时才添加接入。

上游入口可以接入定制注册模块；定制业务可以依赖上游公开能力；避免上游业务内部反向依赖定制实现。
数据库、IPC、路由和主题等上游契约不是稳定性保证，升级时仍须核对。

## 同步上游

仅在用户授权同步时执行；讨论方案不执行 fetch、切换分支或 merge。

1. 检查工作区、分支与 remote，确认 `origin` 是 fork、`upstream` 是主仓库，以及实际跟进的分支或 tag；不硬编码上游必为 main。
2. 工作区干净后获取远程更新，更新自己的集成分支；若快进失败，先分析分叉，不覆盖已有定制提交。
3. 从自己的最新集成分支创建 `codex/sync-upstream-日期` 临时分支，普通 merge 选定的上游版本。
4. 保留上游修复及定制接入点，适配定制代码依赖；冲突逐项分析，不整份盲选 ours/theirs，不以 reset 覆盖定制分支。
5. 检查依赖和锁文件，验证代码与数据库副本，验证通过后再合回自己的集成分支。推送、PR、发布遵守当前任务授权。

长期同步保留上游提交历史，不把每次上游更新 squash 成一个普通提交。普通功能 PR 遵循
`PR_REQUIREMENTS.md`；同步 PR 说明为何需要保留上游 merge，并跟上目标分支的最新变化。
同步期间目标分支有新提交时，重新集成并验证。

保持三类变更可辨：定制功能、上游接入、确有必要的上游行为修改；避免夹带无关格式化和重构。
修改范围主要是三个 custom 目录及明确列出的接入点，但不承诺零冲突或永久兼容。

## 验证与发布边界

- 根据改动执行类型检查、相关行为测试和构建；不靠源码字符串断言证明目录或实现正确。
- 数据库变更检查空库初始化、带数据升级、迁移失败保留数据、新版本库被旧程序拒绝。
- 页面检查进入、切换、保存、重启恢复；有多窗口时检查刷新与后台任务不重复执行。
- 定制库不可用时检查错误提示与上游功能能否继续启动。
- SQLite 原生模块和窗口行为需要目标平台 Electron 或安装包验证，mock 测试不能替代。
- 升级测试使用数据库副本；应用完全退出后复制，或使用数据库一致性备份机制，勿直接复制正在写入的单个 db 文件。
- Git 回退不会回退数据库；回退程序前核对库版本或使用兼容备份。
- 发布定制安装包前确认自己的更新渠道；需要与官方版并存时另行确定应用身份和 userData 隔离。
  两个 SQLite 文件不能防止安装覆盖、官方更新替换定制版本或共享用户目录带来的影响。

只报告实际完成的检查；不把保存此技能当成架构已经落地。
