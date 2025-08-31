/**
 * 预定义的自动选择组
 */
export const GROUPS = [
  {
    groupId: 'ranked', // 独一无二的标注
    targetGameMode: 'CLASSIC', // 仅面向此游戏模式生效
    targetQueueTypes: ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'], // 在此模式下生效的队列，若无则默认生效所有
    positions: ['top', 'jungle', 'middle', 'bottom', 'utility'], // 可以根据什么位置选择
    additionalPicks: [], // 可以额外选用的英雄
    additionalBans: [], // 可以额外禁用的英雄
    excludedPicks: [-1], // 禁止选用的英雄
    excludedBans: [] // 禁止 Ban 的英雄
  },
  {
    groupId: 'normal',
    targetGameMode: 'CLASSIC',
    targetQueueTypes: ['NORMAL'],
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  },
  {
    groupId: 'aram',
    targetGameMode: 'ARAM',
    targetQueueTypes: null, // 具体而言是 "ARAM_UNRANKED_5x5"
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  },
  {
    groupId: 'cherry',
    targetGameMode: 'CHERRY',
    targetQueueTypes: null,
    positions: ['default'],
    additionalPicks: [-3],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  },
  {
    groupId: 'urf',
    targetGameMode: 'URF',
    targetQueueTypes: null,
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  },
  {
    groupId: 'oneforall',
    targetGameMode: 'ONEFORALL',
    targetQueueTypes: null,
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  },
  {
    groupId: 'ultbook',
    targetGameMode: 'ULTBOOK',
    targetQueueTypes: null,
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  },
  {
    groupId: 'bot',
    targetGameMode: 'SWIFTPLAY',
    targetQueueTypes: ['RIOTSCRIPT_BOT'],
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  },
  {
    groupId: 'custom',
    targetGameMode: 'CLASSIC',
    targetQueueTypes: ['PRACTICE_GAME'],
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  },
  {
    groupId: 'practice',
    targetGameMode: 'PRACTICETOOL',
    targetQueueTypes: ['PRACTICE_GAME'],
    positions: ['default'],
    additionalPicks: [],
    additionalBans: [],
    excludedPicks: [-1],
    excludedBans: []
  }
]
