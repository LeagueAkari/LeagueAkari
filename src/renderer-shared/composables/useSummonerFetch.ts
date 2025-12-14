import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { toSummoner } from '@shared/data-adapter/summoner'
import { isAxiosError } from 'axios'

export function useSummonerFetch() {
  const lc = useInstance(LeagueClientRenderer)
  const rc = useInstance(RiotClientRenderer)
  const sgp = useInstance(SgpRenderer)

  const searchSummonerByAlias = async (
    gameName: string,
    tagLine: string,
    source: 'lcu' | 'sgp',
    sgpServerId?: string
  ) => {
    const { data } = await rc.api.playerAccount.getPlayerAccountAlias(gameName, tagLine)

    if (data.length === 0) {
      return null
    }

    const alias = data[0]

    if (source === 'sgp') {
      const { data: summoners } = await sgp.api.summonerLedge.postSummonersByPuuids([alias.puuid], {
        __sgpServerId: sgpServerId
      })

      if (summoners.length === 0) {
        return null
      }

      return toSummoner(
        { source: 'sgp', data: summoners[0], puuid: summoners[0].puuid },
        {
          gameName: alias.alias.game_name,
          tagLine: alias.alias.tag_line
        }
      )
    } else {
      try {
        const { data: summoner } = await lc.api.summoner.getSummonerByPuuid(alias.puuid)

        return toSummoner({ source: 'lcu', data: summoner, puuid: summoner.puuid })
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null
        }

        throw error
      }
    }
  }

  // 保证它的返回格式类似于 sgp summonerLedge
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

      return summoners
        .map((summoner) => {
          const nameset = namesets.find((nameset) => nameset.puuid === summoner.puuid)

          if (!nameset) {
            return null
          }

          return toSummoner(
            { source: 'sgp', data: summoner, puuid: summoner.puuid },
            {
              gameName: nameset.gnt.gameName,
              tagLine: nameset.gnt.tagLine
            }
          )
        })
        .filter((summoner) => summoner !== null)
    } else {
      const tasks = puuids.map(async (puuid) => {
        try {
          const { data: summoner } = await lc.api.summoner.getSummonerByPuuid(puuid)
          return toSummoner({ source: 'lcu', data: summoner, puuid: summoner.puuid })
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return null
          }

          throw error
        }
      })

      return (await Promise.all(tasks)).filter((summoner) => summoner !== null)
    }
  }

  return {
    getSummoners,
    searchSummonerByAlias
  }
}
