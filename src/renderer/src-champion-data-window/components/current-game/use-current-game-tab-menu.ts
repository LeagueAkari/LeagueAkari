import { ChampionDataRenderer } from '@champion-data-window/shards/champion-data'
import { useChampionDataStore } from '@champion-data-window/shards/champion-data/store'
import { useInstance } from '@renderer-shared/shards'
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

export function useCurrentGameTabMenu(source: ChampionDataSourceId, isManaged: () => boolean) {
  const { t } = useTranslation()
  const store = useChampionDataStore()
  const { currentGame } = useInstance(ChampionDataRenderer)

  const options = computed(() => {
    if (!isManaged()) {
      return []
    }

    if (store.currentGame.status === 'preset') {
      return [{ key: 'preset', label: t('opgg.automation.status.preset'), disabled: true }]
    }

    if (
      source === store.settings.sourcePreferences.defaultSource &&
      store.currentGame.status === 'applyError'
    ) {
      return [
        {
          key: 'retry-apply',
          label: t('opgg.automation.retryApply'),
          disabled: store.applying.runes
        }
      ]
    }

    return []
  })

  return { options, retryApplication: () => currentGame.retryApplication() }
}
