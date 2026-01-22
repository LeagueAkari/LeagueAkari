<template>
  <NModal v-model:show="show" preset="card" style="max-width: 60vw">
    <template #header>
      <span class="card-header-title">{{ t('PlayerTagEditModal.title') }}</span>
    </template>
    <template v-if="summoner">
      <div class="flex items-center">
        <LcuImage class="size-6 rounded" :src="profileIconUri(summoner.profileIconId)" />
        <span class="ml-2 max-w-[300px] truncate text-sm font-bold">{{
          masked(
            summonerName(summoner?.gameName || summoner?.displayName, summoner?.tagLine, puuid),
            t('summoner', { ns: 'common' })
          )
        }}</span>
      </div>
    </template>

    <template v-else>
      <span class="text-xs">{{ t('PlayerTagEditModal.loading') }}</span>
    </template>

    <div class="mt-3">
      <NInput
        v-model:value="text"
        :placeholder="
          t('PlayerTagEditModal.placeholder', {
            name: masked(
              summonerName(summoner?.gameName || summoner?.displayName, summoner?.tagLine, puuid),
              t('summoner', { ns: 'common' })
            )
          })
        "
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 4 }"
        ref="input"
      />
    </div>

    <div class="mt-3 flex justify-end gap-1">
      <NButton size="small" @click="show = false">{{ t('PlayerTagEditModal.cancel') }}</NButton>
      <NButton size="small" type="primary" @click="handleSaveTag">{{
        t('PlayerTagEditModal.save')
      }}</NButton>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { PlayerTagDto } from '@shared/types/shards/saved-player'
import { summonerName } from '@shared/utils/name'
import { useTranslation } from 'i18next-vue'
import { NButton, NInput, NModal } from 'naive-ui'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

const { t } = useTranslation()

const show = defineModel<boolean>('show', { default: false })

const inputEl = useTemplateRef('input')

const emits = defineEmits<{
  submit: [tag: string | null]
}>()

const { summoner, tags } = defineProps<{
  puuid?: string
  summoner?: SummonerInfo | null
  tags?: PlayerTagDto[]
}>()

const { masked } = useStreamerModeMaskedText()

const selfTagged = computed(() => {
  return tags?.find((t) => t.markedBySelf)
})

const text = ref('')

watch(
  () => show.value,
  (show) => {
    if (show) {
      text.value = selfTagged.value?.tag || ''
      nextTick(() => inputEl.value?.focus())
    }
  }
)

const handleSaveTag = async () => {
  emits('submit', text.value || null)
}
</script>

<style scoped></style>
