<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex min-w-0 items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-1.5">
        <NButton
          text
          size="tiny"
          class="cursor-pointer py-1!"
          :focusable="false"
          @click="handleToggleExpanded"
        >
          <span class="flex items-center gap-1.5">
            <NIcon size="14">
              <ChevronDown20Regular v-if="expanded" />
              <ChevronRight20Regular v-else />
            </NIcon>
            <span>{{ t('playerTags.editModal.phrases.title') }}</span>
          </span>
        </NButton>

        <span class="text-[11px] text-black/45 dark:text-white/45">
          {{
            t('playerTags.editModal.phrases.count', {
              count: phrases.length,
              max: maxItems
            })
          }}
        </span>
      </div>

      <NPopconfirm
        v-if="expanded"
        type="warning"
        :show-icon="false"
        :positive-text="t('playerTags.editModal.phrases.confirmClearTag')"
        :negative-text="t('playerTags.editModal.cancel')"
        :positive-button-props="{ type: 'warning', size: 'tiny' }"
        :negative-button-props="{ size: 'tiny' }"
        @positive-click="emit('clear')"
      >
        <template #trigger>
          <NButton
            text
            size="tiny"
            class="cursor-pointer py-1!"
            :disabled="disabled || !canClear"
            :focusable="false"
          >
            {{ t('playerTags.editModal.phrases.clearTag') }}
          </NButton>
        </template>
        {{ t('playerTags.editModal.phrases.clearTagConfirm') }}
      </NPopconfirm>
    </div>

    <NCollapseTransition :show="expanded">
      <div class="flex flex-col gap-2 py-1">
        <div v-if="phrases.length || !isAtLimit" class="flex flex-wrap gap-1">
          <NButtonGroup v-for="phrase in phrases" :key="phrase" size="tiny">
            <NButton size="tiny" secondary :disabled="disabled" @click="emit('append', phrase)">
              <span class="max-w-84 truncate" :title="phrase">{{ phrase }}</span>
            </NButton>
            <NTooltip>
              <template #trigger>
                <NButton
                  size="tiny"
                  secondary
                  :disabled="disabled"
                  :aria-label="t('playerTags.editModal.phrases.delete', { phrase })"
                  @click="handleDelete(phrase)"
                >
                  <template #icon>
                    <NIcon><Dismiss20Regular /></NIcon>
                  </template>
                </NButton>
              </template>
              {{ t('playerTags.editModal.phrases.delete', { phrase }) }}
            </NTooltip>
          </NButtonGroup>

          <NButton
            v-if="!isAddingPhrase && !isAtLimit"
            size="tiny"
            quaternary
            :disabled="disabled"
            @click="handleStartAdding"
          >
            <template #icon>
              <NIcon><Add20Regular /></NIcon>
            </template>
            {{ t('playerTags.editModal.phrases.add') }}
          </NButton>
        </div>

        <div v-if="isAddingPhrase" class="flex min-w-0 items-start gap-1.5">
          <NInput
            ref="phraseInput"
            v-model:value="draftPhrase"
            size="small"
            clearable
            show-count
            :maxlength="maxPhraseLength"
            :disabled="disabled || isAtLimit"
            :placeholder="t('playerTags.editModal.phrases.addPlaceholder')"
            @keydown="handlePhraseInputKeydown"
          />

          <NTooltip :disabled="!addDisabledReason">
            <template #trigger>
              <span class="inline-flex">
                <NButton
                  size="small"
                  type="primary"
                  secondary
                  :disabled="!canAdd"
                  :aria-label="t('playerTags.editModal.phrases.add')"
                  @click="handleAdd"
                >
                  <template #icon>
                    <NIcon><Add20Regular /></NIcon>
                  </template>
                </NButton>
              </span>
            </template>
            {{ addDisabledReason }}
          </NTooltip>
          <NButton
            size="small"
            quaternary
            :disabled="disabled"
            :aria-label="t('playerTags.editModal.phrases.cancelAdd')"
            @click="handleCancelAdding"
          >
            <template #icon>
              <NIcon><Dismiss20Regular /></NIcon>
            </template>
          </NButton>
        </div>

        <div
          v-if="!phrases.length && !isAddingPhrase"
          class="text-xs leading-5 text-black/45 dark:text-white/45"
        >
          {{ t('playerTags.editModal.phrases.empty') }}
        </div>
      </div>
    </NCollapseTransition>
  </div>
</template>

<script setup lang="ts">
import {
  SAVED_PLAYER_TAG_PHRASE_MAX_ITEMS,
  SAVED_PLAYER_TAG_PHRASE_MAX_LENGTH,
  normalizeSavedPlayerTagPhrase,
  normalizeSavedPlayerTagPhrases
} from '@shared/shards/saved-player'
import {
  Add20Regular,
  ChevronDown20Regular,
  ChevronRight20Regular,
  Dismiss20Regular
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NButtonGroup,
  NCollapseTransition,
  NIcon,
  NInput,
  NPopconfirm,
  NTooltip,
  type InputInst
} from 'naive-ui'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    phrases: string[]
    expanded: boolean
    disabled?: boolean
    canClear?: boolean
  }>(),
  {
    disabled: false,
    canClear: false
  }
)

const emit = defineEmits<{
  'update:phrases': [phrases: string[]]
  'update:expanded': [expanded: boolean]
  append: [phrase: string]
  clear: []
}>()

const { t } = useTranslation()

const maxItems = SAVED_PLAYER_TAG_PHRASE_MAX_ITEMS
const maxPhraseLength = SAVED_PLAYER_TAG_PHRASE_MAX_LENGTH
const draftPhrase = ref('')
const isAddingPhrase = ref(false)
const phraseInput = useTemplateRef<InputInst>('phraseInput')

const normalizedDraftPhrase = computed(() => normalizeSavedPlayerTagPhrase(draftPhrase.value))
const isAtLimit = computed(() => props.phrases.length >= maxItems)
const isDuplicate = computed(() => props.phrases.includes(normalizedDraftPhrase.value))
const canAdd = computed(
  () =>
    !props.disabled &&
    !isAtLimit.value &&
    Boolean(normalizedDraftPhrase.value) &&
    !isDuplicate.value
)

const addDisabledReason = computed(() => {
  if (normalizedDraftPhrase.value && isDuplicate.value) {
    return t('playerTags.editModal.phrases.duplicate')
  }

  return ''
})

const handleStartAdding = () => {
  if (props.disabled || isAtLimit.value) {
    return
  }

  isAddingPhrase.value = true
  void nextTick(() => phraseInput.value?.focus())
}

const handleCancelAdding = () => {
  isAddingPhrase.value = false
  draftPhrase.value = ''
}

const handleToggleExpanded = () => {
  if (props.expanded) {
    handleCancelAdding()
  }

  emit('update:expanded', !props.expanded)
}

const handlePhraseInputKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) {
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    handleAdd()
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    handleCancelAdding()
  }
}

const handleAdd = () => {
  if (!canAdd.value) {
    return
  }

  emit(
    'update:phrases',
    normalizeSavedPlayerTagPhrases([...props.phrases, normalizedDraftPhrase.value])
  )
  handleCancelAdding()
}

const handleDelete = (phrase: string) => {
  if (props.disabled) {
    return
  }

  emit(
    'update:phrases',
    props.phrases.filter((item) => item !== phrase)
  )
}

watch(
  () => props.expanded,
  (expanded) => {
    if (!expanded) {
      handleCancelAdding()
    }
  }
)

watch(isAtLimit, (atLimit) => {
  if (atLimit) {
    handleCancelAdding()
  }
})
</script>
