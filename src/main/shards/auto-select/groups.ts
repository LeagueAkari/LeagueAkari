/**
 * 预定义的自动选择组
 */
export const GROUPS = [
  {
    groupId: 'ranked', // 独一无二的标注
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
    groupId: 'practice',
    targetGameModes: [
      {
        gameMode: 'PRACTICETOOL',
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
    targetGameModes: [
      {
        gameMode: 'RUBY',
        queueTypes: ['*']
      }
    ],
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  }
]
