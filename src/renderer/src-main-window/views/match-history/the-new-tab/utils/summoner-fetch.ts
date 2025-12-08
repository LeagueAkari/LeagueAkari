import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { toSummoner } from '@shared/data-adapter/summoner'

export function useSummonerFetch() {
  const lc = useInstance(LeagueClientRenderer)
  const rc = useInstance(RiotClientRenderer)
  const sgp = useInstance(SgpRenderer)

  const getSummoners = async (puuids: string[], source: 'lcu' | 'sgp', sgpServerId?: string) => {
    if (source === 'sgp') {
      const getSgpSummoners = async () => {
        const { data: summoners } = await sgp.api.summonerLedge.postSummonersByPuuids(puuids, {
          __sgpServerId: sgpServerId
        })

        return summoners
      }

      const getRcNamesets = async () => {
        const {
          data: { namesets }
        } = await rc.api.playerAccount.getPlayerAccountNameset(puuids)
        return namesets
      }

      const [summoners, namesets] = await Promise.all([getSgpSummoners(), getRcNamesets()])

      if (summoners.length !== namesets.length) {
        return []
      }

      return summoners.map((summoner, index) => {
        return toSummoner(
          { source: 'sgp', data: summoner, puuid: summoner.puuid },
          {
            gameName: namesets[index].gnt.gameName,
            tagLine: namesets[index].gnt.tagLine
          }
        )
      })
    } else {
      const tasks = puuids.map(async (puuid) => {
        const { data: summoner } = await lc.api.summoner.getSummonerByPuuid(puuid)
        return toSummoner({ source: 'lcu', data: summoner, puuid: summoner.puuid })
      })

      return Promise.all(tasks)
    }
  }

  return {
    getSummoners
  }
}
