<template>
  <div class="w-118 text-black dark:text-white">
    <div class="mb-3 flex min-w-0 items-center gap-2">
      <div class="mr-auto text-sm font-bold">{{ t('playerTags.editModal.title') }}</div>

      <template v-if="summoner">
        <LcuImage class="size-6 shrink-0 rounded" :src="profileIconUri(summoner.profileIconId)" />
        <StreamerModeMaskedText>
          <template #masked>
            <div class="flex min-w-0 items-baseline gap-1">
              <span class="max-w-40 truncate text-xs font-bold">{{ maskedSummonerName }}</span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400">
                #{{ maskedTagLine }}
              </span>
            </div>
          </template>
          <div class="flex min-w-0 items-baseline gap-1">
            <span class="max-w-40 truncate text-xs font-bold">{{ summoner.gameName }}</span>
            <span class="text-[11px] text-neutral-500 dark:text-neutral-400">
              {{ `#${summoner.tagLine}` }}
            </span>
          </div>
        </StreamerModeMaskedText>
      </template>

      <template v-else>
        <span class="text-xs text-black/60 dark:text-white/60">
          {{ t('playerTags.editModal.loading') }}
        </span>
      </template>
    </div>

    <NInput
      ref="input"
      v-model:value="text"
      :placeholder="
        t('playerTags.editModal.placeholder', {
          name: masked(displayName, t('summoner', { ns: 'common' }))
        })
      "
      type="textarea"
      :autosize="{ minRows: 3, maxRows: 4 }"
      :disabled="isLoadingTag || isSaving"
      @keydown="handleInputKeydown"
    />

    <PlayerTagPhrasePanel
      class="mt-2"
      :phrases="sps.settings.playerTagPhrases"
      :expanded="isPhrasePanelExpanded"
      :disabled="!isReady || isUpdatingPhrases"
      :can-clear="Boolean(text)"
      @append="appendPhrase"
      @clear="clearText"
      @update:expanded="handleUpdatePhrasePanelExpanded"
      @update:phrases="handleUpdatePhrases"
    />

    <div class="mt-3 flex justify-end gap-1">
      <NButton size="small" :disabled="isSaving" @click="emit('cancel')">
        {{ t('playerTags.editModal.cancel') }}
      </NButton>
      <NButton
        size="small"
        type="primary"
        :disabled="!isReady"
        :loading="isSaving"
        @click="handleSaveTag"
      >
        <span class="flex items-center gap-1">
          <span class="text-sm text-white/80 dark:text-black/80">{{
            as.platform === 'win32' ? 'Shift+Enter' : '⇧+⏎'
          }}</span>
          <span>{{ t('playerTags.editModal.save') }}</span>
        </span>
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import { useSavedPlayerStore } from '@renderer-shared/shards/saved-player/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NInput, useMessage } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { focusTextInput, insertTextAtSelection } from './cursor'
import PlayerTagPhrasePanel from './PlayerTagPhrasePanel.vue'
import type { PlayerTagEditPanelSummoner } from './types'
import type { InputInst } from 'naive-ui'

const { t } = useTranslation()

const props = defineProps<{
  puuid: string
  summoner?: PlayerTagEditPanelSummoner | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const text = ref('')
const hasLoadedTag = ref(false)
const isLoadingTag = ref(false)
const isSaving = ref(false)
const isUpdatingPhrases = ref(false)
const inputEl = useTemplateRef<InputInst>('input')
let focusFrame: number | null = null

const sp = useInstance(SavedPlayerRenderer)
const sps = useSavedPlayerStore()
const isPhrasePanelExpanded = ref(sps.settings.playerTagPhrasePanelExpanded)
const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const log = useInstance(LoggerRenderer)
const componentName = useComponentName()
const message = useMessage()

const { masked, summonerName: streamerSummonerName } = useStreamerModeMaskedText()

const displayName = computed(() => {
  if (!props.summoner) {
    return t('summoner', { ns: 'common' })
  }

  return `${props.summoner.gameName} #${props.summoner.tagLine}`
})

const maskedSummonerName = computed(() => {
  const seed = props.summoner?.gameName || props.summoner?.puuid || props.puuid
  return streamerSummonerName(seed, 0)
})

const maskedTagLine = computed(() => masked(props.summoner?.tagLine || '', '#####'))

const isReady = computed(() => hasLoadedTag.value && !isLoadingTag.value && !isSaving.value)

const focus = (cursorPosition?: number) => {
  if (focusFrame !== null) {
    window.cancelAnimationFrame(focusFrame)
  }

  focusFrame = window.requestAnimationFrame(() => {
    focusTextInput(inputEl.value, cursorPosition)
    focusFrame = null
  })
}

const appendPhrase = (phrase: string) => {
  const result = insertTextAtSelection(inputEl.value, text.value, phrase)
  text.value = result.value
  focus(result.cursorPosition)
}

const clearText = () => {
  text.value = ''
  focus(0)
}

const handleUpdatePhrases = async (phrases: string[]) => {
  if (isUpdatingPhrases.value) {
    return
  }

  isUpdatingPhrases.value = true

  try {
    await sp.setPlayerTagPhrases(phrases)
  } catch (error) {
    log.warn(componentName, 'Failed to update player tag phrases', error)
    message.warning(() => t('playerTags.editModal.phrases.updateFailed'))
  } finally {
    isUpdatingPhrases.value = false
  }
}

const handleUpdatePhrasePanelExpanded = async (expanded: boolean) => {
  const previous = isPhrasePanelExpanded.value
  isPhrasePanelExpanded.value = expanded

  try {
    await sp.setPlayerTagPhrasePanelExpanded(expanded)
  } catch (error) {
    isPhrasePanelExpanded.value = previous
    log.warn(componentName, 'Failed to update player tag phrase panel state', error)
  }
}

const loadSelfTag = async () => {
  hasLoadedTag.value = false

  if (!lcs.summoner.me || !props.puuid) {
    text.value = ''
    hasLoadedTag.value = true
    return
  }

  isLoadingTag.value = true

  try {
    const tags = await sp.getPlayerTags({
      puuid: props.puuid,
      selfPuuid: lcs.summoner.me.puuid
    })

    text.value = tags.find((tag) => tag.markedBySelf)?.tag || ''
  } catch (error) {
    log.warn(componentName, error)
  } finally {
    isLoadingTag.value = false
    hasLoadedTag.value = true
  }
}

const handleSaveTag = async () => {
  if (!isReady.value || !lcs.summoner.me || !lcs.auth) {
    return
  }

  isSaving.value = true

  try {
    const tag = text.value.trim() ? text.value : null

    await sp.updatePlayerTag({
      puuid: props.puuid,
      selfPuuid: lcs.summoner.me.puuid,
      tag,
      ...(tag
        ? {
            rsoPlatformId: lcs.auth.rsoPlatformId,
            region: lcs.auth.region
          }
        : {})
    })

    message.success(() => t('playerTabs.profile.operationSuccessTitle'))
    emit('saved')
  } catch (error) {
    log.warn(componentName, error)
    message.warning(() => t('playerTabs.profile.failedToLoadTitle'))
  } finally {
    isSaving.value = false
  }
}

const isSaveTagShortcut = (event: {
  key: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  isComposing: boolean
}) => {
  return (
    (event.key === 'Enter' || event.key === 'NumpadEnter') &&
    event.shiftKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.isComposing
  )
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (!isSaveTagShortcut(event) || !isReady.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  handleSaveTag()
}

onMounted(() => {
  loadSelfTag()
})

watch(
  () => sps.settings.playerTagPhrasePanelExpanded,
  (expanded) => {
    isPhrasePanelExpanded.value = expanded
  }
)

onBeforeUnmount(() => {
  if (focusFrame !== null) {
    window.cancelAnimationFrame(focusFrame)
  }
})

watch(
  () => props.puuid,
  () => {
    loadSelfTag()
  }
)

watch(
  isReady,
  (ready) => {
    if (ready) {
      focus()
    }
  },
  { flush: 'post' }
)
</script>

<style scoped>
.shortcut-save-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.shortcut-combo {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  line-height: 1;
}

.shortcut-key {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(255 255 255 / 36%);
  border-radius: 4px;
  background: rgb(255 255 255 / 16%);
  box-shadow:
    inset 0 -1px 0 rgb(0 0 0 / 24%),
    0 1px 0 rgb(255 255 255 / 10%);
  color: currentColor;
  font-family: system-ui, 'Segoe UI Symbol', 'Apple Symbols', sans-serif;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.shortcut-plus {
  opacity: 0.78;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
</style>
