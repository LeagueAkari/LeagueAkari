export interface LanWebLabels {
  currentGame: string
  playerLookup: string
  playerSearch: string
  connected: string
  disconnected: string
  noCurrentGame: string
  waitingForClient: string
  refresh: string
  searchPlaceholder: string
  search: string
  emptySearch: string
  matches: string
  summary: string
  rankedSolo: string
  rankedFlex: string
  rankedUnavailable: string
  unranked: string
  highest: string
  wins: string
  losses: string
  lp: string
  activeSession: string
  teamSides: string
  frequentChampions: string
  damageShare: string
  damageTakenShare: string
  goldShare: string
  queueAll: string
  noMatches: string
  previousPage: string
  nextPage: string
  page: string
  winningStreak: string
  losingStreak: string
  loadMore: string
  details: string
  close: string
  loading: string
  gameCount: string
  winRate: string
  kda: string
  participation: string
  damagePerMinute: string
  csPerMinute: string
  vision: string
  akariScore: string
  victory: string
  defeat: string
  serviceUnavailable: string
  team: string
  blueTeam: string
  redTeam: string
  self: string
  level: string
  gold: string
  damage: string
  taken: string
  score: string
}

const zh: LanWebLabels = {
  currentGame: '当前对局',
  playerLookup: '战绩',
  playerSearch: '玩家查询',
  connected: 'League Client 已连接',
  disconnected: 'League Client 未连接',
  noCurrentGame: '当前没有可分析的对局',
  waitingForClient: '连接 League Client 后即可查看数据',
  refresh: '刷新',
  searchPlaceholder: '输入 Riot ID（名称#标签）或 PUUID',
  search: '查询',
  emptySearch: '没有找到玩家',
  matches: '战绩列表',
  summary: '近期概览',
  rankedSolo: '单双排',
  rankedFlex: '灵活组排',
  rankedUnavailable: '跨区查询暂不支持排位信息',
  unranked: '未定级',
  highest: '最高',
  wins: '胜',
  losses: '负',
  lp: '胜点',
  activeSession: '本次会话',
  teamSides: '阵营',
  frequentChampions: '常用英雄',
  damageShare: '团队伤害占比',
  damageTakenShare: '团队承伤占比',
  goldShare: '团队经济占比',
  queueAll: '全部模式',
  noMatches: '没有符合条件的对局',
  previousPage: '上一页',
  nextPage: '下一页',
  page: '页',
  winningStreak: '连胜',
  losingStreak: '连败',
  loadMore: '加载更多',
  details: '单局详情',
  close: '关闭',
  loading: '加载中…',
  gameCount: '样本',
  winRate: '胜率',
  kda: 'KDA',
  participation: '参团率',
  damagePerMinute: '分均伤害',
  csPerMinute: '分均补刀',
  vision: '场均视野',
  akariScore: 'Akari 评分',
  victory: '胜利',
  defeat: '失败',
  serviceUnavailable: '无法连接到 League Akari Web 服务',
  team: '队伍',
  blueTeam: '蓝色方',
  redTeam: '红色方',
  self: '自己',
  level: '等级',
  gold: '金币',
  damage: '伤害',
  taken: '承伤',
  score: '战绩'
}

const en: LanWebLabels = {
  currentGame: 'Current Game',
  playerLookup: 'Match History',
  playerSearch: 'Player Search',
  connected: 'League Client connected',
  disconnected: 'League Client disconnected',
  noCurrentGame: 'No analyzable game is active',
  waitingForClient: 'Connect League Client to view data',
  refresh: 'Refresh',
  searchPlaceholder: 'Riot ID (name#tag) or PUUID',
  search: 'Search',
  emptySearch: 'No players found',
  matches: 'Match History',
  summary: 'Recent Summary',
  rankedSolo: 'Ranked Solo',
  rankedFlex: 'Ranked Flex',
  rankedUnavailable: 'Ranked data is unavailable for cross-region players',
  unranked: 'Unranked',
  highest: 'Peak',
  wins: 'W',
  losses: 'L',
  lp: 'LP',
  activeSession: 'Active session',
  teamSides: 'Sides',
  frequentChampions: 'Champions',
  damageShare: 'Team damage share',
  damageTakenShare: 'Team damage taken',
  goldShare: 'Team gold share',
  queueAll: 'All queues',
  noMatches: 'No matching games',
  previousPage: 'Previous',
  nextPage: 'Next',
  page: 'Page',
  winningStreak: 'win streak',
  losingStreak: 'loss streak',
  loadMore: 'Load More',
  details: 'Match Details',
  close: 'Close',
  loading: 'Loading…',
  gameCount: 'Games',
  winRate: 'Win Rate',
  kda: 'KDA',
  participation: 'Kill Participation',
  damagePerMinute: 'Damage / min',
  csPerMinute: 'CS / min',
  vision: 'Avg Vision',
  akariScore: 'Akari Score',
  victory: 'Victory',
  defeat: 'Defeat',
  serviceUnavailable: 'League Akari Web service is unavailable',
  team: 'Team',
  blueTeam: 'Blue Team',
  redTeam: 'Red Team',
  self: 'Self',
  level: 'Level',
  gold: 'Gold',
  damage: 'Damage',
  taken: 'Damage Taken',
  score: 'Score'
}

export function getLabels() {
  const isChinese = navigator.language.toLowerCase().startsWith('zh')
  return { labels: isChinese ? zh : en, locale: isChinese ? 'zh-CN' : 'en-US' }
}
