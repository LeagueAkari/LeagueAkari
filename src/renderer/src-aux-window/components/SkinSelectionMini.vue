<template>
  <NCard
    size="small"
    v-if="aws.settings.showSkinSelector && lcs.champSelect.currentChampion && skinOptions.length"
  >
    <NSelect
      size="tiny"
      :render-label="renderLabel"
      :render-tag="renderTag"
      class="flex-1"
      :value="lcs.champSelect.skinSelectorInfo?.selectedSkinId"
      @update:value="handleSetSkin"
      :placeholder="
        t('SkinSelectionMini.skins', {
          count: skinOptions.length
        })
      "
      :options="skinOptions"
      :loading="isSettingSkin"
    />
  </NCard>
</template>

<script setup lang="tsx">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useAuxWindowStore } from '@renderer-shared/shards/window-manager/store'
import { CarouselSkins } from '@shared/types/league-client/champ-select'
import { ChampDetails } from '@shared/types/league-client/game-data'
import { useTranslation } from 'i18next-vue'
import { NCard, NSelect, SelectRenderLabel, SelectRenderTag, useMessage } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

const { t } = useTranslation()

const aws = useAuxWindowStore()
const lcs = useLeagueClientStore()

const lc = useInstance(LeagueClientRenderer)

const currentSkinId = ref<number>()
const isSettingSkin = ref(false)

const renderLabel: SelectRenderLabel = (option) => {
  return (
    <div class="flex items-center justify-center gap-2 px-1 py-0.5">
      <LcuImage
        {...({
          src: option.isChild ? (option.chromaPreviewUrl as string) : (option.previewUrl as string),
          cache: false,
          class: 'h-5 w-9 rounded-[2px] object-contain'
        } as any)}
      />
      <div
        class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-black/70 dark:text-white/70"
        title={option.label as string}
      >
        {option.label as string}
      </div>
    </div>
  )
}

const renderTag: SelectRenderTag = ({ option }) => {
  return <span class="text-xs text-black/70 dark:text-white/70">{option.label as string}</span>
}

const carouselSkins = shallowRef<CarouselSkins[]>([])
const championDetails = shallowRef<ChampDetails | null>(null)

const championSkinNameMap = computed(() => {
  if (!championDetails.value) {
    return {}
  }

  const skins = championDetails.value.skins

  const map: Record<number, string> = {}

  for (const s of skins) {
    map[s.id] = s.name

    if (s.chromas) {
      for (const c of s.chromas) {
        map[c.id] = c.name
      }
    }
  }

  return map
})

const skinOptions = computed(() => {
  const flattedSkins: {
    label: string
    value: number
    previewUrl: string
    chromaPreviewUrl: string
    isChild: boolean
  }[] = []

  for (const skin of carouselSkins.value) {
    if (!skin.unlocked) {
      continue
    }

    if (!skin.disabled) {
      flattedSkins.push({
        label: championSkinNameMap.value[skin.id] || skin.name,
        value: skin.id,
        previewUrl: skin.splashPath,
        chromaPreviewUrl: '',
        isChild: false
      })
    }

    for (const child of skin.childSkins) {
      if (!child.disabled && child.unlocked) {
        flattedSkins.push({
          label: championSkinNameMap.value[child.id] || child.name,
          value: child.id,
          previewUrl: child.splashPath,
          chromaPreviewUrl: child.chromaPreviewPath,
          isChild: true
        })
      }
    }
  }

  return flattedSkins
})

watch(
  () => lcs.champSelect.currentChampion,
  async (c) => {
    if (!c) {
      carouselSkins.value = []
      championDetails.value = null
      return
    }

    currentSkinId.value = undefined

    try {
      const list = (await lc.api.champSelect.getCarouselSkins()).data
      carouselSkins.value = list

      if (list.length) {
        currentSkinId.value = list[0].id
      }

      const cm = (await lc.api.gameData.getChampDetails(c)).data
      championDetails.value = cm
    } catch (error) {}
  },
  { immediate: true }
)

const message = useMessage()

const handleSetSkin = async (skinId: number) => {
  if (!skinId || isSettingSkin.value) {
    return
  }

  isSettingSkin.value = true

  try {
    await lc.api.champSelect.setSkin(skinId)
    message.success(t('SkinSelectionMini.success'))
  } catch (error) {
    message.warning(t('SkinSelectionMini.failed'))
  } finally {
    isSettingSkin.value = false
  }
}

watch(
  () => lcs.champSelect.skinSelectorInfo,
  (info) => {
    if (!info) {
      return
    }

    if (info.selectedSkinId) {
      currentSkinId.value = info.selectedSkinId
    }
  },
  { immediate: true }
)
</script>

<style scoped></style>
