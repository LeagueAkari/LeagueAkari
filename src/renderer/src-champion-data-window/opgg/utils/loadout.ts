import type { OpggApplySelection } from '@champion-data-window/shards/champion-data/opgg/context'
import { isAbortError } from '@shared/utils/queue-keeper'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'

import { useOpggPage } from '../context'

export function useLoadout() {
  const message = useMessage()
  const { t } = useTranslation()
  const { isDataStale, applying, apply: applyRecommendation } = useOpggPage()

  const apply = async (kind: OpggApplySelection['kind'], recommendationId: string) => {
    if (applying.value[kind]) {
      return
    }

    try {
      if (isDataStale.value) {
        throw new Error(t('opgg.view.notLoaded'))
      }

      await applyRecommendation(kind, recommendationId)
      message.success(
        kind === 'items'
          ? t('opgg.champion.writtenToDisk')
          : t('opgg.view.success', {
              reason: t(kind === 'runes' ? 'opgg.view.runes' : 'opgg.view.summonerSpells')
            })
      )
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

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
