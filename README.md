<div align="center">
  <div>
    <img
    src="resources/LA_ICON.png"
    width="128"
    height="128"
    />
  </div>
  <h1>League GanYu</h1>
  <p>基于 <a href="https://github.com/Hanxven/LeagueAkari">League Akari</a> 二次开发的英雄联盟客户端工具箱</p>
</div>

<p align="center">
    <a href="https://github.com/963656544/LeagueGanYu/releases"><img src="https://img.shields.io/github/release/963656544/LeagueGanYu.svg?style=flat-square&maxAge=600" alt="Release"></a>
    <a href="https://github.com/963656544/LeagueGanYu/releases">
    <img src="https://img.shields.io/github/downloads/963656544/LeagueGanYu/total?style=flat&label=Downloads"></a>
    <a href="https://github.com/963656544/LeagueGanYu/stargazers">
    <img src="https://img.shields.io/github/stars/963656544/LeagueGanYu?style=flat&label=Stars">
  </a>
</p>

## 下载

前往 [Releases](https://github.com/963656544/LeagueGanYu/releases) 页面下载最新版本：

| 版本 | 文件 | 大小 |
|------|------|------|
| 安装版 | `LeagueGanYu-1.3.8-AutoLogin-Setup.exe` | ~156 MB |
| 免安装版 | `LeagueGanYu-1.3.8-AutoLogin-portable.7z` | ~121 MB |

解压即用版下载后解压，运行 `LeagueGanYu.exe` 即可。

---

## 关于本项目

**League GanYu**（甘雨）是一款基于 LCU API 的英雄联盟客户端辅助工具，由 [League Akari](https://github.com/Hanxven/LeagueAkari) 二次开发而来。

原项目 **League Akari** 由 [Hanxven](https://github.com/Hanxven) 开发，提供了强大的 LCU 框架、自动选择、自动流程、战绩查询等核心功能。本项目在其基础上进行了功能扩展，主要面向国服（腾讯）玩家增加实用特性。

> 感谢 [League Akari](https://github.com/Hanxven/LeagueAkari) 及其所有贡献者提供的优秀框架。

---

## 新增功能（相比原版 Akari）

### QQ 账号管理

一站式管理多个 QQ 账号，支持以下能力：

| 功能 | 说明 |
|------|------|
| 账号绑定 | 添加 QQ 号 + 大区 + 游戏 ID（Riot ID），支持全部 29 个大区 |
| 封禁查询 | 单个或批量查询 QQ 号封禁状态、解封时间、剩余天数 |
| 段位查询 | 批量查询所有账号当前段位（单双排 / 灵活排位 / 云顶），自动匹配当前客户端大区 |
| 拖拽排序 | 自定义账号排列顺序，拖拽即可调整 |
| 状态持久化 | 封禁状态、段位信息本地存储，重启不丢失 |

### 快捷登录

一键启动 LeagueClient 已登录状态，无需手动输入密码或扫码。

| 功能 | 说明 |
|------|------|
| 静默登录 | 后台完成 WeGame → QQ 鉴权链，直启 LeagueClient |
| 多账号支持 | 每个 QQ 账号独立配置密码和大区 |
| 大区切换 | 自动使用账号绑定大区登录 |
| 状态通知 | 登录流程实时提示（初始化 → 登录中 → 成功/失败） |
| 安全机制 | 密码加密存储，临时凭据用后即焚 |

> 需要游戏路径配置正确（默认 `E:\WeGameApps\英雄联盟`）

### 其他改进

- 新增应用图标
- 国际化完善（中英文）

---

## 原版功能（来自 League Akari）

- 自动接受对局
- 自动选择 / Ban 英雄
- 自动流程（排队、准备等）
- 战绩查询与玩家分析
- 英雄选择建议（智能选人）
- 客户端窗口管理
- 自动更新
- 系统托盘集成

---

## 构建与运行

```bash
yarn install
yarn dev
yarn build:win
```

需要有效的 GitHub PAT 来安装私有包，设置环境变量 `NODE_AUTH_TOKEN`。

---

## 免责声明

本软件基于 Riot Games 的 LCU API 开发，不使用侵入式技术，不直接修改游戏数据。使用本软件可能导致账号封禁或数据丢失等风险，开发者不承担任何责任。**本应用未经 Riot Games 官方认可或支持**，使用即表示您了解并接受相关风险。

---

## 致谢

| 项目 | 说明 |
|------|------|
| [League Akari](https://github.com/Hanxven/LeagueAkari) | 本项目的基础框架 |
| [Pengu Loader](https://github.com/PenguLoader/PenguLoader) | JavaScript 插件加载器 |
| [Seraphine](https://github.com/Zzaphkiel/Seraphine) | 工具集成思路 |
| [Community Dragon](https://www.communitydragon.org/documentation/assets) | 资源管理参考 |
| [fix-lcu-window](https://github.com/LeagueTavern/fix-lcu-window) | 客户端窗口修复 |
