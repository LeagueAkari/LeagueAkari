const TRANS = {
  'zh-CN': {
    unknownSummoner: '未知召唤师',
    unknownChampion: '未知英雄',
    text: '{name}：近{count}场KDA {averageKda} 胜率 {winRate}%'
  },
  en: {
    unknownSummoner: 'Unknown Summoner',
    unknownChampion: 'Unknown Champion',
    text: '{name}：{count} games KDA {averageKda}, win rate {winRate}%'
  }
}

function getMessages(env) {
  if (!env.playerStats) return []

  return env.targetMembers
    .map((puuid) => {
      let name
      if (env.queryStage.phase === 'champ-select') {
        name = env.summoner[puuid]?.data.gameName || TRANS[env.locale].unknownSummoner
      } else {
        let selection = env.championSelections[puuid] || -1
        name = env.gameData.champions[selection]?.name || TRANS[env.locale].unknownChampion
      }

      const {
        averageKda = 0,
        count = 0,
        winRate = 0
      } = env.playerStats.players[puuid]?.summary || {}
      return { puuid, name, averageKda, count, winRate }
    })
    .map(({ name, averageKda, count, winRate }) =>
      TRANS[env.locale].text
        .replace('{name}', name)
        .replace('{count}', count)
        .replace('{averageKda}', averageKda.toFixed(2))
        .replace('{winRate}', (winRate * 100).toFixed(0))
    )
}

function getMetadata() {
  return {
    version: 10,
    type: 'ongoing-game'
  }
}
