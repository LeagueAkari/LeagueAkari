/**
 * 预定义的自动选择组
 */
export const GROUPS = [
  {
    groupId: 'ranked', // 独一无二的标注
    // 匹配自定义对局
    isCumstom: false,
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
    isCumstom: false,
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
    isCumstom: false,
    targetGameModes: [
      {
        gameMode: 'ARAM',
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
    isCumstom: false,
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
    isCumstom: false,
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
    isCumstom: false,
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
    isCumstom: false,
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
    isCumstom: false,
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
    isCumstom: false,
    targetGameModes: [
      {
        gameMode: 'CLASSIC',
        queueTypes: ['PRACTICE_GAME']
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
    isCumstom: false,
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
