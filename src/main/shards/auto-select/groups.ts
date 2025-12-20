/**
 * 预定义的自动选择组
 */
export const GROUPS = [
  {
    groupId: 'ranked', // 独一无二的标注
    // 匹配自定义对局
    isCustom: false,
    // 适用的游戏模式，* 表示所有
    targetGameModes: [
      {
        gameMode: 'CLASSIC',
        queueTypes: ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR']
      }
    ],
    positions: ['top', 'jungle', 'middle', 'bottom', 'utility'], // 可以根据什么位置选择
    additionalPicks: [], // 可以额外选用的英雄
    additionalBans: [], // 可以额外禁用的英雄
    excludedPicks: [-1], // 禁止选用的英雄
    excludedBans: [] // 禁止 Ban 的英雄
  },
  {
    groupId: 'normal',
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
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  },
  {
    groupId: 'ruby',
    isCustom: false,
    targetGameModes: [
      {
        gameMode: 'RUBY',
        queueTypes: ['NIGHTMARE_BOT']
      },
      {
        gameMode: 'RUBY_TRIAL_1',
        queueTypes: ['NIGHTMARE_BOT']
      },
      {
        gameMode: 'RUBY_TRIAL_2',
        queueTypes: ['NIGHTMARE_BOT']
      },
      {
        gameMode: 'RUBY_TRIAL_3',
        queueTypes: ['NIGHTMARE_BOT']
      }
    ],
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  }
]
