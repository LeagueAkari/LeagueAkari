import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { useTranslation } from 'i18next-vue'
import { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { computed } from 'vue'

export const ALL_SGPTAG_VALUE = '<akari:all>'
export const RANKED_SGPTAG_VALUE = 'ranked'
export const NORMAL_SGPTAG_VALUE = 'normal'

export function useSgpTagOptions() {
  const { t } = useTranslation()
  const lcs = useLeagueClientStore()
  const sgps = useSgpStore()

  return computed(() => {
    return [
      {
        type: 'group',
        children: [
          {
            label: t('sgpMatchHistoryTags.all', { ns: 'common' }),
            value: ALL_SGPTAG_VALUE
          },
          {
            label: t('sgpMatchHistoryTags.ranked', { ns: 'common' }),
            value: RANKED_SGPTAG_VALUE
          },
          {
            label: t('sgpMatchHistoryTags.normal', { ns: 'common' }),
            value: NORMAL_SGPTAG_VALUE
          }
        ],
        label: t('sgpMatchHistoryTags.groupGeneral', { ns: 'common' })
      },
      {
        type: 'group',
        children: sgps.supportedQueues.map((id) => ({
          label: lcs.gameData.queues[id]?.name || id,
          value: `q_${id}`
        })),
        label: t('sgpMatchHistoryTags.groupGameModes', { ns: 'common' })
      }
    ] as SelectMixedOption[]
  })
}
