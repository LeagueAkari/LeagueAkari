import {
  AkariAutoSelectGroupsConfig,
  AkariLeagueServersConfig,
  AkariOngoingGameConfig,
  AkariSupportedQueuesConfig
} from '@shared/shards/akari-api'

export const BUILTIN_ONGOING_GAME_CONFIG: AkariOngoingGameConfig = {
  updatedAt: '2025-10-04T08:54:51.536Z',
  spotlight: {
    deobfuscation: true,
    gsmByPuuid: true,
    spectatorByPuuid: false
  }
}

export const BUILTIN_SGP_LEAGUE_SERVERS_CONFIG: AkariLeagueServersConfig = {
  updatedAt: '2026-07-17T08:19:07.000Z',
  servers: {
    TENCENT_HN1: {
      matchHistory: 'https://hn1-k8s-sgp.lol.qq.com:21019',
      common: 'https://hn1-k8s-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TENCENT_HN10: {
      matchHistory: 'https://hn10-k8s-sgp.lol.qq.com:21019',
      common: 'https://hn10-k8s-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TENCENT_TJ100: {
      matchHistory: 'https://tj100-sgp.lol.qq.com:21019',
      common: 'https://tj100-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TENCENT_TJ101: {
      matchHistory: 'https://tj101-sgp.lol.qq.com:21019',
      common: 'https://tj101-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TENCENT_NJ100: {
      matchHistory: 'https://nj100-sgp.lol.qq.com:21019',
      common: 'https://nj100-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TENCENT_GZ100: {
      matchHistory: 'https://gz100-sgp.lol.qq.com:21019',
      common: 'https://gz100-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TENCENT_CQ100: {
      matchHistory: 'https://cq100-sgp.lol.qq.com:21019',
      common: 'https://cq100-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TENCENT_BGP2: {
      matchHistory: 'https://bgp2-k8s-sgp.lol.qq.com:21019',
      common: 'https://bgp2-k8s-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TENCENT_PBE: {
      matchHistory: 'https://pbe-sgp.lol.qq.com:21019',
      common: 'https://pbe-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TENCENT_PREPBE: {
      matchHistory: 'https://prepbe-sgp.lol.qq.com:21019',
      common: 'https://prepbe-sgp.lol.qq.com:21019',
      isTencent: true
    },
    TW2: {
      common: 'https://tw2-red.lol.sgp.pvp.net',
      matchHistory: 'https://apse1-red.pp.sgp.pvp.net',
      isTencent: false
    },
    SG2: {
      common: 'https://sg2-red.lol.sgp.pvp.net',
      matchHistory: 'https://apse1-red.pp.sgp.pvp.net',
      isTencent: false
    },
    PH2: {
      matchHistory: 'https://apse1-red.pp.sgp.pvp.net',
      common: 'https://ph2-red.lol.sgp.pvp.net',
      isTencent: false
    },
    VN2: {
      matchHistory: 'https://apse1-red.pp.sgp.pvp.net',
      common: 'https://vn2-red.lol.sgp.pvp.net',
      isTencent: false
    },
    PBE: {
      matchHistory: 'https://usw2-red.pp.sgp.pvp.net',
      common: 'https://pbe-red.lol.sgp.pvp.net',
      isTencent: false,
      regionPathParam: 'PBE1'
    },
    EUW: {
      matchHistory: 'https://euc1-red.pp.sgp.pvp.net',
      common: 'https://euw-red.lol.sgp.pvp.net',
      isTencent: false
    },
    JP: {
      matchHistory: 'https://apne1-red.pp.sgp.pvp.net',
      common: 'https://jp-red.lol.sgp.pvp.net',
      isTencent: false,
      regionPathParam: 'JP1'
    },
    RU: {
      matchHistory: 'https://euc1-red.pp.sgp.pvp.net',
      common: 'https://ru-red.lol.sgp.pvp.net',
      isTencent: false
    },
    BR1: {
      matchHistory: 'https://usw2-red.pp.sgp.pvp.net',
      common: 'https://br-red.lol.sgp.pvp.net',
      isTencent: false
    },
    OC1: {
      matchHistory: 'https://apse1-red.pp.sgp.pvp.net',
      common: 'https://oce-red.lol.sgp.pvp.net',
      isTencent: false
    },
    TR1: {
      matchHistory: 'https://euc1-red.pp.sgp.pvp.net',
      common: 'https://tr-red.lol.sgp.pvp.net',
      isTencent: false
    },
    LA1: {
      matchHistory: 'https://usw2-red.pp.sgp.pvp.net',
      common: 'https://lan-red.lol.sgp.pvp.net',
      isTencent: false
    },
    LA2: {
      matchHistory: 'https://usw2-red.pp.sgp.pvp.net',
      common: 'https://las-red.lol.sgp.pvp.net',
      isTencent: false
    },
    NA1: {
      matchHistory: 'https://usw2-red.pp.sgp.pvp.net',
      common: 'https://na-red.lol.sgp.pvp.net',
      isTencent: false
    },
    TH2: {
      matchHistory: 'https://apse1-red.pp.sgp.pvp.net',
      common: 'https://th2-red.lol.sgp.pvp.net',
      isTencent: false
    },
    KR: {
      matchHistory: 'https://apne1-red.pp.sgp.pvp.net',
      common: 'https://kr-red.lol.sgp.pvp.net',
      isTencent: false
    }
  },
  serverNames: {
    en: {
      TENCENT_HN1: 'Ionia',
      TENCENT_HN10: 'Black Rose',
      TENCENT_TJ100: 'League 4',
      TENCENT_TJ101: 'League 5',
      TENCENT_NJ100: 'League 1',
      TENCENT_GZ100: 'League 2',
      TENCENT_CQ100: 'League 3',
      TENCENT_BGP2: "Rift's Summit",
      TENCENT_PBE: 'PBE (Tencent)',
      TENCENT_PREPBE: 'PREPBE (Tencent)',
      TW2: 'Taiwan',
      SG2: 'Singapore',
      PH2: 'Philippines',
      VN2: 'Vietnam',
      PBE: 'PBE',
      EUW: 'EUW',
      JP: 'Japan',
      RU: 'Russia',
      BR1: 'Brazil',
      OC1: 'Oceania',
      TR1: 'Turkey',
      LA1: 'Latin America North',
      LA2: 'Latin America South',
      NA1: 'North America',
      TH2: 'Thailand',
      KR: 'Korea'
    },
    'zh-CN': {
      TENCENT_HN1: '艾欧尼亚',
      TENCENT_HN10: '黑色玫瑰',
      TENCENT_TJ100: '联盟四区',
      TENCENT_TJ101: '联盟五区',
      TENCENT_NJ100: '联盟一区',
      TENCENT_GZ100: '联盟二区',
      TENCENT_CQ100: '联盟三区',
      TENCENT_BGP2: '峡谷之巅',
      TENCENT_PBE: 'PBE (腾讯)',
      TENCENT_PREPBE: 'PREPBE (腾讯)',
      TW2: '台湾',
      SG2: '新加坡',
      PH2: '菲律宾',
      VN2: '越南',
      PBE: 'PBE',
      EUW: 'EUW',
      JP: '日本',
      RU: '俄罗斯',
      BR1: '巴西',
      OC1: '大洋洲',
      TR1: '土耳其',
      LA1: '拉丁美洲北部',
      LA2: '拉丁美洲南部',
      NA1: '北美',
      TH2: '泰国',
      KR: '韩国'
    }
  }
}

export const BUILTIN_SUPPORTED_QUEUES: AkariSupportedQueuesConfig = {
  updatedAt: '2026-05-15T16:40:26.395Z',
  queues: [
    420, 440, 430, 450, 480, 1700, 1750, 490, 1900, 900, 2300, 2400, 4210, 4220, 4240, 4250, 4260
  ]
}

export const BUILTIN_AUTO_SELECT_GROUPS: AkariAutoSelectGroupsConfig = {
  updatedAt: '2026-01-25T02:46:47.628Z',
  groups: [
    {
      groupId: 'ranked',
      name: { 'zh-CN': '排位模式', en: 'Ranked' },
      iconPath:
        '/lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/game-select-icon-hover.png',
      isCustom: false,
      targetGameModes: [
        {
          gameMode: 'CLASSIC',
          queueTypes: ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR']
        }
      ],
      positions: ['top', 'jungle', 'middle', 'bottom', 'utility'],
      additionalPicks: [],
      additionalBans: [],
      excludedPicks: [-1],
      excludedBans: []
    },
    {
      groupId: 'normal',
      name: { 'zh-CN': '普通模式', en: 'Normal' },
      iconPath:
        '/lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/game-select-icon-hover.png',
      isCustom: false,
      targetGameModes: [
        {
          gameMode: 'CLASSIC',
          queueTypes: ['NORMAL']
        }
      ],
      positions: ['default'],
      additionalPicks: [],
      additionalBans: [],
      excludedPicks: [-1],
      excludedBans: []
    },
    {
      groupId: 'aram',
      name: { 'zh-CN': '大乱斗类', en: 'ARAM-like' },
      iconPath:
        '/lol-game-data/assets/content/src/LeagueClient/GameModeAssets/ARAM/img/game-select-icon-hover.png',
      isCustom: false,
      targetGameModes: [
        {
          gameMode: 'ARAM',
          queueTypes: ['*']
        },
        {
          gameMode: 'KIWI',
          queueTypes: ['*']
        }
      ],
      positions: ['default'],
      additionalPicks: [],
      additionalBans: [],
      excludedPicks: [-1],
      excludedBans: []
    },
    {
      groupId: 'cherry',
      name: { 'zh-CN': '斗魂竞技场', en: 'Arena' },
      iconPath:
        '/lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Cherry/img/game-select-icon-hover.png',
      isCustom: false,
      targetGameModes: [
        {
          gameMode: 'CHERRY',
          queueTypes: ['*']
        }
      ],
      positions: ['default'],
      additionalPicks: [-3],
      additionalBans: [],
      excludedPicks: [-1],
      excludedBans: []
    },
    {
      groupId: 'urf',
      name: { 'zh-CN': '无限火力', en: 'URF' },
      iconPath:
        '/lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Shared/img/icon-rgm-hover.png',
      isCustom: false,
      targetGameModes: [
        {
          gameMode: 'URF',
          queueTypes: ['*']
        }
      ],
      positions: ['default'],
      additionalPicks: [],
      additionalBans: [],
      excludedPicks: [-1],
      excludedBans: []
    },
    {
      groupId: 'oneforall',
      name: { 'zh-CN': '克隆模式', en: 'One for All' },
      iconPath:
        '/lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Shared/img/icon-rgm-hover.png',
      isCustom: false,
      targetGameModes: [
        {
          gameMode: 'ONEFORALL',
          queueTypes: ['*']
        }
      ],
      positions: ['default'],
      additionalPicks: [],
      additionalBans: [],
      excludedPicks: [-1],
      excludedBans: []
    },
    {
      groupId: 'ultbook',
      name: { 'zh-CN': '终极魔典', en: 'Ultbook' },
      iconPath:
        '/lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Shared/img/icon-rgm-hover.png',
      isCustom: false,
      targetGameModes: [
        {
          gameMode: 'ULTBOOK',
          queueTypes: ['*']
        }
      ],
      positions: ['default'],
      additionalPicks: [],
      additionalBans: [],
      excludedPicks: [-1],
      excludedBans: []
    },
    {
      groupId: 'bot',
      name: { 'zh-CN': '人机模式', en: 'Bot' },
      iconPath:
        '/lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/game-select-icon-hover.png',
      isCustom: false,
      targetGameModes: [
        {
          gameMode: 'SWIFTPLAY',
          queueTypes: ['RIOTSCRIPT_BOT']
        }
      ],
      positions: ['default'],
      additionalPicks: [],
      additionalBans: [],
      excludedPicks: [-1],
      excludedBans: []
    },
    {
      groupId: 'custom',
      name: { 'zh-CN': '自定义对局', en: 'Custom' },
      iconPath:
        '/lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/game-select-icon-hover.png',
      isCustom: true,
      targetGameModes: [
        {
          gameMode: 'CLASSIC',
          queueTypes: ['NORMAL']
        },
        {
          gameMode: 'PRACTICETOOL',
          queueTypes: ['NORMAL']
        }
      ],
      positions: ['top', 'jungle', 'middle', 'bottom', 'utility'],
      additionalPicks: [],
      additionalBans: [],
      excludedPicks: [-1],
      excludedBans: []
    }
  ]
}
