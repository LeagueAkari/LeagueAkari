<div align="center">
  <div>
    <img
    src="https://github.com/LeagueAkari/LeagueAkari/raw/HEAD/pictures/logo.png"
    width="128"
    height="128"
    alt="League Akari logo"
    />
  </div>
  A League of Legends client toolkit based on the LCU API
</div>

<p align="center">
    <a href="https://github.com/LeagueAkari/LeagueAkari/releases"><img src="https://img.shields.io/github/v/release/LeagueAkari/LeagueAkari?include_prereleases&style=flat-square&label=Version" alt="Latest version"></a>
    <a href="https://github.com/LeagueAkari/LeagueAkari/releases">
    <img src="https://img.shields.io/github/downloads/LeagueAkari/LeagueAkari/total?style=flat&label=Downloads"></a>
    <a href="https://github.com/LeagueAkari/LeagueAkari/stargazers">
    <img src="https://img.shields.io/github/stars/LeagueAkari/LeagueAkari?style=flat&label=Stars">
  </a>
</p>

# League Akari

A League of Legends client toolkit based on the LCU API.

## Download and Usage

Download the latest Windows or macOS build from [GitHub Releases](https://github.com/LeagueAkari/LeagueAkari/releases).

Administrator privileges are not required. On Windows, some native shortcuts, overlays, and client-window utilities require administrator privileges.

Most Riot-operated regions are supported. Tencent-operated servers are not supported.

## Feedback and Contributing

Use [GitHub Issues](https://github.com/LeagueAkari/LeagueAkari/issues) to report bugs or suggest improvements. Please include enough detail to reproduce the problem when filing a bug report.

Code contributions are welcome. Feel free to open a pull request with fixes or new features.

## Development

League Akari uses Node.js 24 and Yarn 4. Enable Corepack before installing dependencies:

```sh
corepack enable
yarn install --immutable
yarn dev
```

Common commands:

```sh
yarn typecheck
yarn test
yarn storybook
yarn build
yarn build:win
yarn build:mac
```

`yarn build` creates the production application bundle. Use the platform-specific commands to create distributable packages.

## References

The development of **League Akari** has been greatly inspired by several outstanding open-source projects. These projects provided valuable insights and guidance for various modules of the software. We would like to extend our sincere appreciation to the authors and maintainers of the following resources:

| Project                                                                                            | Description                                                                          |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Pengu Loader](https://github.com/PenguLoader/PenguLoader)                                         | The ultimate JavaScript plugin loader, build your unmatched LoL Client.              |
| [League of Legends LCU and Riot Client API Docs](https://github.com/KebsCS/lcu-and-riotclient-api) | League of Legends LCU and Riot Client API Docs                                       |
| [Community Dragon](https://www.communitydragon.org/documentation/assets)                           | Resource management and asset documentation reference.                               |
| [Seraphine](https://github.com/Zzaphkiel/Seraphine)                                                | Provided integration approaches and insights into combining multiple tools.          |
| [fix-lcu-window](https://github.com/LeagueTavern/fix-lcu-window)                                   | Resolved the issue with abnormal window size of the League of Legends client.        |
| [Joi](https://github.com/watchingfun/Joi)                                                          | A League of Legends assistant.                                                       |
| [vscode-league-respawn-timer](https://github.com/Coooookies/vscode-league-respawn-timer)           | An extension to display League of Legends player respawn time in Visual Studio Code. |
| [LeaguePrank](https://github.com/LeagueTavern/LeaguePrank)                                         | Provided inspiration for playful and humorous features.                              |

## Disclaimer

This software is a tool developed based on Riot's League Client Update (LCU) API. It does not use intrusive techniques and theoretically does not directly interfere with or modify game data. However, please be aware of potential compatibility issues or risks associated with game updates or anti-cheat systems.

The developer is not responsible for any consequences, such as account bans or data loss, resulting from the use of this software. Users are advised to fully understand the risks and take responsibility for their actions.

Additionally, **this application is not officially supported or endorsed by Riot Games**. All rights are reserved by Riot Games. Use it at your own risk, as it may violate the game's terms of service.

This disclaimer is intended to provide transparency and enable users to make informed decisions. Thank you for your understanding, and please ensure fair play in the gaming environment.

[![Star History Chart](https://star-history.dera.page/svg?repos=LeagueAkari/LeagueAkari&type=Date)](https://star-history.dera.page/#LeagueAkari/LeagueAkari&Date)
