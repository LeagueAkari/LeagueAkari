import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { useTranslation } from 'i18next-vue'
import { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { MaybeRefOrGetter, computed, toValue } from 'vue'

export function useSgpTagOptions(allowTagQuery?: MaybeRefOrGetter<boolean>) {
  const { t } = useTranslation()
  const lcs = useLeagueClientStore()
  const sgps = useSgpStore()

  return computed(() => {
    return [
      {
        label: t('sgpMatchHistoryTags.all', { ns: 'common' }),
        value: 'all'
      },
      ...sgps.supportedQueues.map((id) => ({
        label: lcs.gameData.queues[id]?.name || id,
        value: `q_${id}`,
        disabled: allowTagQuery && !toValue(allowTagQuery)
      }))
    ] as SelectMixedOption[]
  })
}
