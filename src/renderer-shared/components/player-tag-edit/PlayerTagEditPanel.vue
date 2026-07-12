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

    <div v-if="isChineseLocale" class="mt-2 flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <NButton size="tiny" quaternary :focusable="false" @click="toggleSuggestionPanel">
          <template #icon>
            <NIcon size="14">
              <ChevronDown20Regular v-if="isSuggestionPanelExpanded" />
              <ChevronRight20Regular v-else />
            </NIcon>
          </template>
          猜你想写
        </NButton>

        <NButton
          v-if="isSuggestionPanelExpanded"
          size="tiny"
          quaternary
          :disabled="!isReady || !text"
          :focusable="false"
          @click="clearText"
        >
          清空
        </NButton>
      </div>

      <NCollapseTransition :show="isSuggestionPanelExpanded">
        <div class="flex flex-col gap-1.5">
          <div v-for="(row, rowIndex) in phraseRows" :key="rowIndex" class="flex flex-wrap gap-1">
            <NButton
              v-for="phrase in row"
              :key="phrase"
              size="tiny"
              secondary
              :disabled="!isReady"
              @click="appendPhrase(phrase)"
            >
              {{ phrase }}
            </NButton>
          </div>
        </div>
      </NCollapseTransition>
    </div>

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
import { ChevronDown20Regular, ChevronRight20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NCollapseTransition, NIcon, NInput, useMessage } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { focusTextInput } from './cursor'
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
const isSuggestionPanelExpanded = ref(false)
const inputEl = useTemplateRef<InputInst>('input')
let focusFrame: number | null = null

const sp = useInstance(SavedPlayerRenderer)
const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const log = useInstance(LoggerRenderer)
const componentName = useComponentName()
const message = useMessage()

const { masked, summonerName: streamerSummonerName } = useStreamerModeMaskedText()

const phraseRows = [
  ['上路', '打野', '中路', '下路', '辅助', '三路', '四路'],
  ['傻逼', '唐氏', '弱智', '脑瘫', '畜生', '死', '司马', '全家', '嘴脸'],
  ['挂机', '嘲讽', 'K头', '地缚灵', '送头', '嘴硬', '公屏互动', '弱爆'],
  ['菜', '野', '狗', '东西'],
  ['的']
]

const isChineseLocale = computed(() => as.settings.locale.toLowerCase() === 'zh-cn')

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
  text.value += phrase
  focus(text.value.length)
}

const toggleSuggestionPanel = () => {
  isSuggestionPanelExpanded.value = !isSuggestionPanelExpanded.value
}

const clearText = () => {
  text.value = ''
  focus(0)
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
