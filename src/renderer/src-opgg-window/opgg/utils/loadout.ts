import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { OpggChampionBuildResponse } from '@shared/types/opgg'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'

import { restoreRecipe } from './recipe-restore'

const SUMMONER_SPELL_FLASH_ID = 4

export function useLoadout() {
  const lc = useInstance(LeagueClientRenderer)
  const log = useInstance(LoggerRenderer)

  const lcs = useLeagueClientStore()
  const message = useMessage()

  const componentName = useComponentName()

  const { t } = useTranslation()

  // 更新召唤师技能，会考虑到闪现位置的偏好
  const setSummonerSpells = async (ids: number[], flashPosition: 'auto' | 'd' | 'f') => {
    try {
      const selection = (await lc.api.champSelect.getMySelections()).data

      const [oldSpell1Id, oldSpell2Id] = [selection.spell1Id, selection.spell2Id]
      let [newSpell1Id, newSpell2Id] = ids

      // 有闪现的情况且不为 auto 时, 优先按照偏好闪现位置, 否则强制按照 auto
      if (
        flashPosition !== 'auto' &&
        (newSpell1Id === SUMMONER_SPELL_FLASH_ID || newSpell2Id === SUMMONER_SPELL_FLASH_ID)
      ) {
        if (newSpell2Id === SUMMONER_SPELL_FLASH_ID) {
          if (flashPosition === 'd') {
            ;[newSpell1Id, newSpell2Id] = [newSpell2Id, newSpell1Id]
          }
        } else if (newSpell1Id === SUMMONER_SPELL_FLASH_ID) {
          if (flashPosition === 'f') {
            ;[newSpell1Id, newSpell2Id] = [newSpell2Id, newSpell1Id]
          }
        }
      } else {
        if (newSpell1Id === oldSpell2Id || newSpell2Id === oldSpell1Id) {
          ;[newSpell1Id, newSpell2Id] = [newSpell2Id, newSpell1Id]
        }
      }

      await lc.api.champSelect.setSummonerSpells({
        spell1Id: newSpell1Id,
        spell2Id: newSpell2Id
      })

      message.success(() => t('OpggView.success', { reason: t('OpggView.summonerSpells') }))

      if (lcs.chat.conversations.championSelect) {
        lc.api.chat
          .chatSend(
            lcs.chat.conversations.championSelect.id,
            t('OpggView.spellsSet', {
              spell1: lcs.gameData.summonerSpellName(newSpell1Id),
              spell2: lcs.gameData.summonerSpellName(newSpell2Id)
            }),
            'celebration'
          )
          .catch(() => {})
      }
    } catch (error) {
      log.warn(componentName, '	set summoner spells failed', error)
      message.warning(t('OpggView.setSpellsFailedMessage', { reason: (error as any).message }))
    }
  }

  // 获取符文页名称，如果位置为 none，则只显示英雄名称
  const getRunePageName = (championId: number, position: string) => {
    if (position === 'none') {
      return `[OP.GG] ${lcs.gameData.championName(championId)}`
    }

    return `[OP.GG] ${lcs.gameData.championName(championId)} - ${t(
      `OpggTabAndFilters.positions.${position}`
    )}`
  }

  const setRunes = async (
    runes: {
      primary_page_id: number
      secondary_page_id: number
      primary_rune_ids: number[]
      secondary_rune_ids: number[]
      stat_mod_ids: number[]
    },
    meta: {
      championId: number
      position: string
    }
  ) => {
    const { championId, position } = meta

    try {
      const inventory = (await lc.api.perks.getPerkInventory()).data
      let newRunePageAdded = false

      if (inventory.canAddCustomPage) {
        const { data: added } = await lc.api.perks.postPerkPage({
          name: getRunePageName(championId, position),
          isEditable: true,
          primaryStyleId: runes.primary_page_id.toString()
        })
        await lc.api.perks.putPage({
          id: added.id,
          isRecommendationOverride: false,
          isTemporary: false,
          name: getRunePageName(championId, position),
          primaryStyleId: runes.primary_page_id,
          selectedPerkIds: [
            ...runes.primary_rune_ids,
            ...runes.secondary_rune_ids,
            ...runes.stat_mod_ids
          ],
          subStyleId: runes.secondary_page_id
        })
        await lc.api.perks.putCurrentPage(added.id)
        newRunePageAdded = true
      } else {
        const pages = (await lc.api.perks.getPerkPages()).data
        if (!pages.length) {
          return
        }

        const page1 = pages[0]

        await lc.api.perks.putPage({
          id: page1.id,
          isRecommendationOverride: false,
          isTemporary: false,
          name: getRunePageName(championId, position),
          primaryStyleId: runes.primary_page_id,
          selectedPerkIds: [
            ...runes.primary_rune_ids,
            ...runes.secondary_rune_ids,
            ...runes.stat_mod_ids
          ],
          subStyleId: runes.secondary_page_id
        })

        await lc.api.perks.putCurrentPage(page1.id)
      }

      message.success(() => t('OpggView.success', { reason: t('OpggView.runes') }))

      if (lcs.chat.conversations.championSelect) {
        lc.api.chat.chatSend(
          lcs.chat.conversations.championSelect.id,
          t('OpggView.runesSet', {
            name: getRunePageName(championId, position),
            action: newRunePageAdded ? t('OpggView.create') : t('OpggView.replace')
          }),
          'celebration'
        )
      }
    } catch (error) {
      log.warn(componentName, 'set runes failed', error)
      message.warning(t('OpggView.setRunesFailedMessage', { reason: (error as any).message }))
    }
  }

  const toItemSetsUid = (traits: {
    championId: number
    mode?: string
    region?: string
    tier?: string
    position?: string
    version?: string
  }) => {
    return `akari1-${traits.championId}-${traits.mode || '_'}-${traits.region || '_'}-${traits.tier || '_'}-${traits.position || '_'}-${traits.version || '_'}`
  }

  const getItemSetsTitle = (options: { championId: number; mode: string; position: string }) => {
    const { championId, mode, position } = options

    const championName = lcs.gameData.championName(championId)
    let title = `[OP.GG] ${championName}`

    if (mode) {
      const modeName = t(`OpggTabAndFilters.modes.${mode}`)
      title += ` - ${modeName || mode}`
    }

    const hasPosition = position && position !== 'none'
    if (hasPosition) {
      const positionName = t(`OpggTabAndFilters.positions.${position}`)
      title += ` - ${positionName || position}`
    }

    return title
  }

  const getItemSetsChatName = (options: { championId: number; position: string }) => {
    const { championId, position } = options

    const championName = lcs.gameData.championName(championId)
    let name = `[OP.GG] ${championName}`

    const hasPosition = position && position !== 'none'
    if (hasPosition) {
      const positionName = t(`OpggTabAndFilters.positions.${position}`)
      name += ` - ${positionName || position}`
    }

    return name
  }

  const writeItemSets = async (
    champion: OpggChampionBuildResponse,
    meta: {
      position: string
      mode: string
      region: string
      tier: string
    }
  ) => {
    try {
      const itemGroups: Array<{ title: string; items: number[] }> = []
      const championId = champion.data.summary.id

      const newUid = toItemSetsUid({
        championId,
        mode: meta.mode,
        region: meta.region,
        tier: meta.tier,
        position: meta.position,
        version: champion.meta.version
      })

      if (champion.data.starter_items && champion.data.starter_items.length) {
        champion.data.starter_items.slice(0, 3).forEach((s: any, i: number) => {
          itemGroups.push({
            title: t('OpggChampion.starterItem', {
              index: i + 1,
              pickRate: (s.pick_rate * 100).toFixed(2)
            }),
            items: s.ids
          })
        })
      }

      if (champion.data.boots && champion.data.boots.length) {
        itemGroups.push({
          title: t('OpggChampion.bootsDesc'),
          items: champion.data.boots.reduce((acc: number[], cur: any) => {
            acc.push(...cur.ids)
            return acc
          }, [])
        })
      }

      // @ts-ignore
      if (champion.data?.prism_items && champion.data?.prism_items.length) {
        itemGroups.push({
          title: t('OpggChampion.prismItemsDesc'),
          items: champion.data?.prism_items.reduce((acc: number[], cur: any) => {
            acc.push(...cur.ids)
            return acc
          }, [])
        })
      }

      if (champion.data.core_items && champion.data.core_items.length) {
        champion.data.core_items.slice(0, 4).forEach((s: any, i: number) => {
          itemGroups.push({
            title: t('OpggChampion.coreItem', {
              index: i + 1,
              pickRate: (s.pick_rate * 100).toFixed(2)
            }),
            items: s.ids
          })
        })
      }

      if (champion.data.last_items && champion.data.last_items.length) {
        itemGroups.push({
          title: t('OpggChampion.itemsDesc'),
          items: champion.data.last_items.reduce((acc: number[], cur: any) => {
            acc.push(...cur.ids)
            return acc
          }, [])
        })
      }

      await lc.writeItemSetsToDisk([
        {
          uid: newUid,
          title: getItemSetsTitle({
            championId,
            mode: meta.mode,
            position: meta.position
          }),
          sortrank: 0,
          type: 'global',
          map: 'any',
          mode: 'any',
          blocks: itemGroups.map((g) => ({
            type: g.title,
            items: g.items.map((i) => ({
              id: restoreRecipe(i).toString(),
              count: 1
            }))
          })),
          associatedChampions: [],
          associatedMaps: [],
          preferredItemSlots: []
        }
      ])

      message.success(t('OpggChampion.writtenToDisk'))

      if (lcs.chat.conversations.championSelect) {
        lc.api.chat
          .chatSend(
            lcs.chat.conversations.championSelect.id,
            t('OpggChampion.writeToDisk', {
              name: getItemSetsChatName({
                championId,
                position: meta.position
              })
            }),
            'celebration'
          )
          .catch(() => {})
      }
    } catch (error) {
      log.warn(componentName, 'write item sets failed', error)

      message.warning(
        t('OpggChampion.writeFileFailedMessage', {
          error: (error as any).message
        })
      )
    }
  }

  return {
    setSummonerSpells,
    setRunes,
    writeItemSets
  }
}

export function hasItemsSets(champion: OpggChampionBuildResponse) {
  return (
    (champion.data.starter_items && champion.data.starter_items.length) ||
    (champion.data.boots && champion.data.boots.length) ||
    (champion.data.prism_items && champion.data.prism_items.length) ||
    (champion.data.core_items && champion.data.core_items.length) ||
    (champion.data.last_items && champion.data.last_items.length)
  )
}
