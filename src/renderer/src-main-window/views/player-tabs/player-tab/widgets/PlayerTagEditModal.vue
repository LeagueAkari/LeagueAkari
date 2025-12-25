<template>
  <NModal v-model:show="show" preset="card" class="max-w-[60vw]">
    <template #header>
      <span class="card-header-title">{{ t('PlayerTagEditModal.title') }}</span>
    </template>

    <template v-if="summoner">
      <div class="flex items-center">
        <LcuImage class="size-6 rounded" :src="profileIconUri(summoner.profileIconId)" />
        <StreamerModeMaskedText>
          <template #masked>
            <span class="ml-2 max-w-[300px] truncate text-sm font-bold">
              {{ maskedSummonerName }}
            </span>
          </template>
          <span class="ml-2 max-w-[300px] truncate text-sm font-bold">
            {{ `${summoner.gameName} #${summoner.tagLine}` }}
          </span>
        </StreamerModeMaskedText>
      </div>
    </template>

    <!-- loading summoner... -->
    <template v-else>
      <span class="text-xs">{{ t('PlayerTagEditModal.loading') }}</span>
    </template>

    <div class="mt-3">
      <NInput
        v-model:value="text"
        :placeholder="
          t('PlayerTagEditModal.placeholder', {
            name: masked(displayName, t('summoner', { ns: 'common' }))
          })
        "
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 4 }"
        ref="input"
      ></NInput>
    </div>

    <!-- buttons -->
    <div class="mt-3 flex justify-end gap-1">
      <NButton size="small" @click="show = false">{{ t('PlayerTagEditModal.cancel') }}</NButton>
      <NButton size="small" type="primary" @click="handleSaveTag">
        {{ t('PlayerTagEditModal.save') }}
      </NButton>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useSummonerFetch } from '@renderer-shared/composables/useSummonerFetch'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { Summoner } from '@shared/data-adapter/summoner'
import { useTranslation } from 'i18next-vue'
import { NButton, NInput, NModal, useMessage } from 'naive-ui'
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'

import { usePlayerTab } from '../context'
import { useTags } from '../data/tags'

const { t } = useTranslation()

const text = ref('')
const show = defineModel<boolean>('show', { default: false })

const inputEl = useTemplateRef('input')

const { puuid, preferredSource, isCrossRegion, sgpServerId } = usePlayerTab()
const { tags, loadTags, editTag, removeTag } = useTags()

const selfTagged = computed(() => {
  return tags.value.find((t) => t.markedBySelf)
})

const componentName = useComponentName()

const message = useMessage()

const lcs = useLeagueClientStore()

const log = useInstance(LoggerRenderer)
const summoner = shallowRef<Summoner | null>(null)

const { getSummoners } = useSummonerFetch()

const { masked, summonerName: streamerSummonerName } = useStreamerModeMaskedText()

const displayName = computed(() => {
  if (!summoner.value) {
    return t('summoner', { ns: 'common' })
  }
  return `${summoner.value.gameName} #${summoner.value.tagLine}`
})

const maskedSummonerName = computed(() => {
  const seed = summoner.value?.gameName || summoner.value?.puuid || puuid.value
  return streamerSummonerName(seed, 0)
})

const loadSummoner = async () => {
  try {
    if (preferredSource.value === 'sgp' || isCrossRegion.value) {
      const summoners = await getSummoners([puuid.value], 'sgp', sgpServerId.value)

      if (summoners.length && summoners[0]) {
        summoner.value = summoners[0]
      }
    } else {
      const summoners = await getSummoners([puuid.value], 'lcu')

      if (summoners.length) {
        summoner.value = summoners[0]
      }
    }
  } catch (error) {
    log.error(componentName, error)
  }
}

const handleSaveTag = async () => {
  if (!lcs.summoner.me || !lcs.auth) {
    return
  }

  const success = text.value.trim()
    ? await editTag(text.value)
    : await removeTag(puuid.value, lcs.summoner.me.puuid)

  if (success) {
    message.success(() => t('PlayerTab.operationSuccessTitle'))
  } else {
    message.warning(() => t('PlayerTab.failedToLoadTitle'))
  }

  show.value = false

  await loadTags()
}

watch(
  () => show.value,
  (show) => {
    if (show) {
      text.value = selfTagged.value?.tag || ''
      nextTick(() => inputEl.value?.focus())
      loadSummoner()
    }
  }
)
</script>
