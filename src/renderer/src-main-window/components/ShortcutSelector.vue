<template>
  <div class="flex items-center gap-2">
    <NModal
      class="w-fit!"
      size="small"
      preset="card"
      transform-origin="center"
      v-model:show="show"
      :close-on-esc="false"
      @keydown.enter.prevent
      @keydown.space.prevent
      :title="t('settings.shortcutSelector.title')"
    >
      <template #footer>
        <div class="flex justify-end gap-1">
          <NButton size="small" @click="show = false">{{
            t('settings.shortcutSelector.cancel')
          }}</NButton>
          <NButton size="small" type="warning" @click="currentShortcutId = null">{{
            t('settings.shortcutSelector.clear')
          }}</NButton>
          <NButton
            size="small"
            type="primary"
            @click="handleSubmit"
            :disabled="isOccupiedBy !== null"
            >{{ t('settings.shortcutSelector.ok') }}</NButton
          >
        </div>
      </template>

      <div
        class="flex min-h-7 w-100 flex-wrap items-center justify-center gap-1 rounded border border-black/20 bg-gray-100 p-1 dark:border-white/10 dark:bg-black/60"
      >
        <template v-for="(key, index) of editingKeys" :key="key">
          <div
            class="rounded-xs border-b border-black/40 bg-black/2 px-2 py-0.5 text-xs leading-none font-bold text-black/90 dark:border-white/40 dark:bg-white/10 dark:text-gray-300"
          >
            {{ key }}
          </div>
          <span
            class="leading-none text-black/60 dark:text-white/60"
            v-if="index !== editingKeys.length - 1"
            >+</span
          >
        </template>
        <span
          class="text-xs leading-none text-black/40 dark:text-white/40"
          v-if="!editingKeys.length"
          >{{ t('settings.shortcutSelector.hint') }}</span
        >
      </div>

      <div
        v-if="isOccupiedBy && targetId !== isOccupiedBy.targetId"
        class="mt-1 text-xs text-yellow-600/80 dark:text-yellow-400/80"
      >
        <template
          v-if="isOccupiedBy.targetId === KeyboardShortcutsRenderer.DISABLED_KEYS_TARGET_ID"
        >
          {{ t('settings.shortcutSelector.reservedShortcut') }}
        </template>
        <template v-else>
          {{ t('settings.shortcutSelector.beingOccupied') }}
        </template>
      </div>

      <div
        v-if="editingKeys.length > 4"
        class="mt-1 text-xs text-yellow-500/80 dark:text-yellow-400/80"
      >
        {{ t('settings.shortcutSelector.tooComplicated') }}
      </div>
    </NModal>

    <NPopover :disabled="as.nativeSupport.nativeInput.available">
      <template #trigger>
        <NButton
          size="tiny"
          :disabled="!as.nativeSupport.nativeInput.available"
          type="primary"
          @click="
            () => {
              if (!as.nativeSupport.nativeInput.available) return
              show = true
            }
          "
        >
          {{ t('settings.shortcutSelector.select') }}
        </NButton>
      </template>
      <template v-if="!as.nativeSupport.nativeInput.available">
        {{
          nativeInputRequiresElevation
            ? t('settings.shortcutSelector.notRunAsAdministrator')
            : t('settings.shortcutSelector.nativeGlobalShortcutsWindowsOnly')
        }}
      </template>
    </NPopover>

    <div class="flex flex-wrap items-center gap-1">
      <template v-for="(key, index) of keys" :key="key">
        <div
          class="rounded-xs border-b border-black/40 bg-black/5 px-2 py-0.5 text-xs leading-none font-bold text-black/90 dark:border-white/40 dark:bg-white/10 dark:text-gray-300"
        >
          {{ key }}
        </div>
        <span class="leading-none text-black/60 dark:text-white/60" v-if="index !== keys.length - 1"
          >+</span
        >
      </template>
      <span class="text-xs leading-none text-black/40 dark:text-white/40" v-if="!keys.length">{{
        t('settings.shortcutSelector.unset')
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { KeyboardShortcutsRenderer } from '@renderer-shared/shards/keyboard-shortcut'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal, NPopover } from 'naive-ui'
import { computed, onDeactivated, onUnmounted, ref, shallowRef, watch } from 'vue'

defineProps<{
  targetId?: string
}>()

const { t } = useTranslation()

const as = useAppCommonStore()

const nativeInputRequiresElevation = computed(
  () => as.nativeSupport.nativeInput.requiresElevation && !as.isElevated
)

const kbd = useInstance(KeyboardShortcutsRenderer)

const show = defineModel<boolean>('show', { default: false })
const shortcutId = defineModel<string | null>('shortcutId', { default: null })

const currentShortcutId = ref<string | null>(null)

const handleSubmit = async () => {
  shortcutId.value = currentShortcutId.value
  show.value = false
}

const editingKeys = computed(() => {
  return currentShortcutId.value?.split('+') ?? []
})

const keys = computed(() => {
  return shortcutId.value?.split('+') ?? []
})

let handler: () => void

const preventFn = (event: KeyboardEvent) => {
  const { key, altKey, ctrlKey, metaKey, shiftKey } = event

  const blockedCombinations: {
    key: string
    altKey?: boolean
    ctrlKey?: boolean
    metaKey?: boolean
    shiftKey?: boolean
  }[] = [
    { key: 'F4', altKey: true },
    { key: 'R', ctrlKey: true, shiftKey: true },
    { key: 'I', ctrlKey: true, shiftKey: true }
  ]

  const isBlocked = blockedCombinations.some((combo) => {
    return (
      key === combo.key &&
      !!combo.altKey === !!altKey &&
      !!combo.ctrlKey === !!ctrlKey &&
      !!combo.metaKey === !!metaKey &&
      !!combo.shiftKey === !!shiftKey
    )
  })

  if (isBlocked) {
    event.preventDefault()
    event.stopPropagation()
  }
}

const isOccupiedBy = shallowRef<{
  type: 'last-active' | 'normal' | 'stateful'
  targetId: string
} | null>(null)

watch(
  () => currentShortcutId.value,
  async (shortcut) => {
    if (shortcut) {
      isOccupiedBy.value = await kbd.getRegistration(shortcut)
    } else {
      isOccupiedBy.value = null
    }
  },
  { immediate: true }
)

watch(
  () => show.value,
  async () => {
    if (show.value) {
      if (currentShortcutId.value) {
        isOccupiedBy.value = await kbd.getRegistration(currentShortcutId.value)
      }

      currentShortcutId.value = shortcutId.value
      handler = kbd.onShortcut((event) => {
        currentShortcutId.value = event.id
      })
      window.addEventListener('keydown', preventFn)
    } else {
      handler?.()
      window.removeEventListener('keydown', preventFn)
      isOccupiedBy.value = null
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  handler?.()
  window.removeEventListener('keydown', preventFn)
})

onDeactivated(() => {
  show.value = false
})
</script>

<style scoped></style>
