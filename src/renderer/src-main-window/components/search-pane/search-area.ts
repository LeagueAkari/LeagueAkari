import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useSummonerFetch } from '@renderer-shared/composables/useSummonerFetch'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { isAxiosError } from 'axios'
import { useTranslation } from 'i18next-vue'
import { computed, markRaw, reactive, readonly, ref } from 'vue'

import { SearchResult } from './search-history'

export function isPuuid(puuid: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    puuid.trim()
  )
}

export function replaceInvisibleChar(str: string) {
  return str.replace(
    /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\u2060-\u2069\u202A-\u202E\uFFF9-\uFFFB]/g,
    ''
  )
}

export function includesInvisibleChar(str: string) {
  return /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\u2060-\u2069\u202A-\u202E\uFFF9-\uFFFB]/g.test(
    str
  )
}

export function isNameFuzzOrWithTagline(nameStr: string) {
  return /^(?!\s+$)[^#]+(?:#[^#]+)?$/.test(nameStr)
}

export function useTencentServers() {
  const sgps = useSgpStore()
  const { t } = useTranslation()

  const tencentServers = computed(() => {
    if (sgps.availability.region !== 'TENCENT') {
      return []
    }

    // 出于硬编码, 这里仅仅使用 match-history 的互操作性预定义表
    return sgps.leagueServers.tencentServerMatchHistoryInteroperability.map((serverId) => {
      return {
        label:
          serverId === sgps.availability.sgpServerId
            ? `${t(`sgpServers.${serverId}`, { defaultValue: serverId, ns: 'common' })} (${t('sgpServers.AKARI_CURRENT', { ns: 'common' })})`
            : t(`sgpServers.${serverId}`, { defaultValue: serverId, ns: 'common' }),
        value: serverId
      }
    })
  })

  const isTencentRegion = computed(() => {
    return sgps.availability.region === 'TENCENT'
  })
  return {
    tencentServers,
    isTencentRegion
  }
}

export function useSearchPaneSearchArea() {
  const componentName = useComponentName()

  const logger = useInstance(LoggerRenderer)
  const lc = useInstance(LeagueClientRenderer)
  const rc = useInstance(RiotClientRenderer)

  const as = useAppCommonStore()
  const sgps = useSgpStore()

  const STEP = 16
  const FIXED_TENCENT_SGP_SERVERS = [
    'TENCENT_HN1',
    'TENCENT_HN10',
    'TENCENT_NJ100',
    'TENCENT_GZ100',
    'TENCENT_CQ100',
    'TENCENT_TJ100',
    'TENCENT_TJ101'
  ]

  const currentSgpServerId = ref(sgps.availability.sgpServerId)

  const { tencentServers, isTencentRegion } = useTencentServers()

  const searchInput = ref('')

  const isPuuidInput = computed(() => {
    return isPuuid(searchInput.value)
  })

  const isNameFuzzOrWithTaglineInput = computed(() => {
    return isNameFuzzOrWithTagline(searchInput.value)
  })

  const isEmptyInput = computed(() => {
    return !searchInput.value.trim()
  })

  const isValidSearchInput = computed(() => {
    return isNameFuzzOrWithTaglineInput.value || isPuuidInput.value
  })

  const searchType = computed(() => {
    if (isPuuid(searchInput.value)) {
      return 'puuid'
    }

    if (isNameFuzzOrWithTagline(searchInput.value)) {
      return searchInput.value.includes('#') ? 'exact' : 'fuzzy'
    }

    return 'invalid'
  })

  const searchProgress = reactive({
    isProcessing: false,
    type: 'fuzzy' as 'fuzzy' | 'exact' | 'puuid',
    total: 0,
    finish: 0
  })
  const isEmptyResult = ref(false)
  const searchResult = ref<SearchResult[]>([])
  const lastSearchText = ref('')

  const { getSummoners, searchSummonerByAlias } = useSummonerFetch()

  const cancel = () => {
    searchProgress.isProcessing = false
  }

  const handleSearchByPuuid = async () => {
    searchProgress.type = 'puuid'
    lastSearchText.value = searchInput.value.trim()
    searchProgress.isProcessing = true

    if (currentSgpServerId.value === sgps.availability.sgpServerId) {
      try {
        const summoners = await getSummoners([lastSearchText.value], 'lcu')

        if (!summoners.length) {
          isEmptyResult.value = true
          return
        }

        const summoner = summoners[0]

        searchResult.value.push(
          markRaw({
            puuid: summoner.puuid,
            gameName: summoner.gameName,
            tagLine: summoner.tagLine,
            profileIconId: summoner.profileIconId,
            sgpServerId: currentSgpServerId.value,
            privacy: summoner.privacy,
            summonerLevel: summoner.level
          })
        )
      } catch (error) {
        logger.error(componentName, error)
      } finally {
        searchProgress.isProcessing = false
      }
    } else {
      try {
        searchProgress.isProcessing = true

        const summoners = await getSummoners(
          [lastSearchText.value],
          'sgp',
          currentSgpServerId.value
        )

        if (!summoners.length) {
          isEmptyResult.value = true
          return
        }

        const summoner = summoners[0]

        searchResult.value.push(
          markRaw({
            puuid: summoner.puuid,
            gameName: summoner.gameName,
            tagLine: summoner.tagLine,
            profileIconId: summoner.profileIconId,
            sgpServerId: currentSgpServerId.value,
            privacy: summoner.privacy,
            summonerLevel: summoner.level
          })
        )
      } catch (error) {
        logger.error(componentName, error)
      } finally {
        searchProgress.isProcessing = false
      }
    }
  }

  const handleSearchByFuzzy = async () => {
    searchProgress.type = 'fuzzy'
    searchProgress.isProcessing = true

    try {
      // 这里需要用到 raw rc api
      const { data: aliases } = await rc.api.playerAccount.getPlayerAccountAlias(
        lastSearchText.value.trim()
      )

      if (aliases.length === 0) {
        isEmptyResult.value = true
        return
      }

      // 对于每个玩家, 都需要判定其是否存在
      searchProgress.total = aliases.length
      let added = 0

      // 对于模糊查询，尽量走和数据源一致的 API
      // 对于 LCU 偏好，因为后端是单查询，所以逻辑上也写成依次查询
      // 对于 SGP 偏好，可以批量查询
      if (as.settings.preferredLolSource === 'lcu') {
        for (const alias of aliases) {
          if (!searchProgress.isProcessing) {
            break
          }

          try {
            const { data: summoner } = await lc.api.summoner.getSummonerByPuuid(alias.puuid)

            searchResult.value.push(
              markRaw({
                puuid: summoner.puuid,
                gameName: summoner.gameName,
                tagLine: summoner.tagLine,
                profileIconId: summoner.profileIconId,
                sgpServerId: currentSgpServerId.value,
                privacy: summoner.privacy,
                summonerLevel: summoner.summonerLevel
              })
            )
            added++
          } catch (error) {
            // 404 是预期中的情况
            if (isAxiosError(error) && error.response?.status === 404) {
              continue
            }

            logger.error(componentName, error)
          } finally {
            searchProgress.finish++
          }
        }

        if (added === 0) {
          isEmptyResult.value = true
        }
      } else {
        // sgp 途径 (batch)
        for (let i = 0; i < aliases.length; i += STEP) {
          if (!searchProgress.isProcessing) {
            break
          }

          const aliasGroup = aliases.slice(i, i + STEP)

          try {
            const summoners = await getSummoners(
              aliasGroup.map((alias) => alias.puuid),
              'sgp',
              currentSgpServerId.value
            )

            for (const summoner of summoners) {
              searchResult.value.push(
                markRaw({
                  puuid: summoner.puuid,
                  gameName: summoner.gameName,
                  tagLine: summoner.tagLine,
                  profileIconId: summoner.profileIconId,
                  sgpServerId: currentSgpServerId.value,
                  privacy: summoner.privacy,
                  summonerLevel: summoner.level
                })
              )
              added++
            }
          } catch (error) {
            logger.error(componentName, error)
          } finally {
            searchProgress.finish += STEP
          }
        }

        if (added === 0) {
          isEmptyResult.value = true
        }
      }
    } catch (error) {
      logger.error(componentName, 'error when calling rc api', error)
    } finally {
      searchProgress.isProcessing = false
    }
  }

  // 查本区的时候，顺手会查询其他大区
  const handleSearchByExact = async () => {
    searchProgress.type = 'exact'
    searchProgress.isProcessing = true

    // 由于 alias 是全局唯一的，因此如果查询到结果，则后续的查询可以跳过
    let hasInRegionResult = false

    try {
      const [gameName, tagLine] = lastSearchText.value.split('#')

      // 同区查询只需用 LCU API, 以保证最大的可用性
      if (currentSgpServerId.value === sgps.availability.sgpServerId) {
        const summoner = await searchSummonerByAlias(gameName.trim(), tagLine.trim(), 'lcu')

        if (summoner) {
          hasInRegionResult = true

          searchResult.value.push(
            markRaw({
              puuid: summoner.puuid,
              gameName: summoner.gameName,
              tagLine: summoner.tagLine,
              profileIconId: summoner.profileIconId,
              sgpServerId: currentSgpServerId.value,
              privacy: summoner.privacy,
              summonerLevel: summoner.level
            })
          )
        }
      } else {
        const summoner = await searchSummonerByAlias(
          gameName.trim(),
          tagLine.trim(),
          'sgp',
          currentSgpServerId.value
        )

        if (summoner) {
          hasInRegionResult = true

          searchResult.value.push(
            markRaw({
              puuid: summoner.puuid,
              gameName: summoner.gameName,
              tagLine: summoner.tagLine,
              profileIconId: summoner.profileIconId,
              sgpServerId: currentSgpServerId.value,
              privacy: summoner.privacy,
              summonerLevel: summoner.level
            })
          )
        }
      }

      if (!hasInRegionResult && isTencentRegion.value && as.settings.preferredLolSource === 'sgp') {
        const toQuery = FIXED_TENCENT_SGP_SERVERS.filter(
          (serverId) => serverId !== currentSgpServerId.value
        )

        for (const serverId of toQuery) {
          if (!searchProgress.isProcessing) {
            break
          }

          const summoner = await searchSummonerByAlias(
            gameName.trim(),
            tagLine.trim(),
            'sgp',
            serverId
          )

          if (summoner) {
            searchResult.value.push(
              markRaw({
                puuid: summoner.puuid,
                gameName: summoner.gameName,
                tagLine: summoner.tagLine,
                profileIconId: summoner.profileIconId,
                sgpServerId: serverId,
                privacy: summoner.privacy,
                summonerLevel: summoner.level
              })
            )
          }
        }
      }

      if (!searchResult.value.length) {
        isEmptyResult.value = true
      }
    } catch (error) {
      logger.error(componentName, error)
    } finally {
      searchProgress.isProcessing = false
    }
  }

  const search = async () => {
    if (!isValidSearchInput.value) {
      return
    }

    if (searchProgress.isProcessing) {
      return
    }

    searchProgress.total = 0
    searchProgress.finish = 0
    isEmptyResult.value = false
    searchResult.value = []

    if (searchType.value === 'puuid') {
      await handleSearchByPuuid()
    } else if (searchType.value === 'fuzzy') {
      lastSearchText.value = replaceInvisibleChar(searchInput.value)
      await handleSearchByFuzzy()
    } else if (searchType.value === 'exact') {
      lastSearchText.value = replaceInvisibleChar(searchInput.value)
      await handleSearchByExact()
    }
  }

  const reset = () => {
    searchInput.value = ''
    lastSearchText.value = ''
    searchResult.value = []
    searchProgress.total = 0
    searchProgress.finish = 0
    isEmptyResult.value = false
    searchProgress.isProcessing = false
    currentSgpServerId.value = sgps.availability.sgpServerId
  }

  return {
    // state (for view)
    currentSgpServerId,
    tencentServers,
    isTencentRegion,
    searchInput,
    isEmptyInput,
    isEmptyResult: readonly(isEmptyResult),
    isValidSearchInput,
    searchType,
    searchProgress,
    searchResult,

    // actions
    search,
    cancel,
    reset
  }
}
