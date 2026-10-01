import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import type { OpggApplyRecommendation } from '@shared/types/champion-data/opgg'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'

import { useOpgg } from '../context'

export function useLoadout() {
  const championData = useInstance(ChampionDataRenderer)
  const message = useMessage()
  const { t } = useTranslation()
  const { championId, snapshot, pageState, isDataStale } = useOpgg()

  const apply = async (kind: OpggApplyRecommendation['kind'], recommendationId: string) => {
    try {
      if (championId.value === null || !pageState.value || isDataStale.value) {
        throw new Error(t('opgg.view.notLoaded'))
      }
      await championData.opgg.apply({
        championId: championId.value,
        generation: snapshot.value.generation,
        revision: pageState.value.revision,
        kind,
        recommendationId
      })
      message.success(
        kind === 'items'
          ? t('opgg.champion.writtenToDisk')
          : t('opgg.view.success', {
              reason: t(kind === 'runes' ? 'opgg.view.runes' : 'opgg.view.summonerSpells')
            })
      )
    } catch (error) {
      const key =
        kind === 'items'
          ? 'opgg.champion.writeFileFailedMessage'
          : kind === 'runes'
            ? 'opgg.view.setRunesFailedMessage'
            : 'opgg.view.setSpellsFailedMessage'
      message.warning(t(key, { reason: String(error) }))
    }
  }

  return {
    setRunes: (recommendationId: string) => apply('runes', recommendationId),
    setSummonerSpells: (recommendationId: string) => apply('spells', recommendationId),
    writeItemSets: (recommendationId: string) => apply('items', recommendationId)
  }
}
