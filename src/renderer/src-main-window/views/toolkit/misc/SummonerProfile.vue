<template>
  <SettingsSection :title="t('SummonerProfile.title')">
    <NModal
      class="w-fit!"
      preset="card"
      size="small"
      :title="t('SummonerProfile.skinSelectModal.title')"
      v-model:show="isModalShow"
    >
      <div class="mb-2 flex w-85 max-w-full gap-1">
        <div class="min-w-0 flex-1">
          <NSelect
            class="w-full! max-w-full"
            filterable
            :options="championOptions"
            v-model:value="currentChampionId"
            :render-label="renderLabel"
            size="small"
            :filter="(a, b) => isNameMatch(a, b.label as string, b.value as number)"
          ></NSelect>
        </div>
        <NButton
          type="primary"
          size="small"
          @click="handleApplyToProfile"
          :disabled="!currentSkinId"
          :loading="isProceeding"
        >
          {{ t('SummonerProfile.skinSelectModal.button') }}
        </NButton>
      </div>
      <NSelect
        class="mb-2 w-85! max-w-full"
        filterable
        :options="skinOptions"
        :render-option="renderOption"
        v-model:value="currentSkinId"
        size="small"
        :filter="(a, b) => isNameMatch(a, b.label as string)"
      />
      <NSelect
        class="w-85! max-w-full"
        filterable
        :render-option="renderOption"
        v-if="currentAugmentOptions.length >= 1"
        :options="currentAugmentOptions"
        v-model:value="currentAugmentId"
        size="small"
      />
    </NModal>
    <SettingsRow
      :label="t('SummonerProfile.profileBackground.label')"
      :label-description="t('SummonerProfile.profileBackground.description')"
      :label-width="260"
    >
      <NButton size="small" type="primary" @click="isModalShow = true" :disabled="!lcs.isConnected">
        {{ t('SummonerProfile.profileBackground.button') }}
      </NButton>
    </SettingsRow>
    <SettingsRow
      :label="t('SummonerProfile.bannerAccent.label')"
      :label-description="t('SummonerProfile.bannerAccent.description')"
      :label-width="260"
    >
      <NButton
        :disabled="!lcs.isConnected"
        @click="handleUpdatePr"
        :loading="isUpdating"
        size="small"
      >
        {{ t('SummonerProfile.bannerAccent.button') }}
      </NButton>
    </SettingsRow>
    <SettingsRow
      :label-description="
        lcs.summoner.me &&
        lcs.summoner.me.summonerLevel <= MINIMUM_SUMMONER_LEVEL_FOR_PRESTIGE_CREST
          ? t('SummonerProfile.prestigeCrest.descriptionInsufficientLevel', {
              level: lcs.summoner.me.summonerLevel
            })
          : t('SummonerProfile.prestigeCrest.description')
      "
      :label="t('SummonerProfile.prestigeCrest.label')"
      :label-width="260"
    >
      <NButton
        :disabled="!lcs.isConnected"
        @click="handleRemovePrestigeCrest"
        :loading="isRemovingPrestigeCrest"
        size="small"
      >
        {{ t('SummonerProfile.prestigeCrest.button') }}
      </NButton>
    </SettingsRow>
    <SettingsRow
      :label-description="t('SummonerProfile.token.description')"
      :label="t('SummonerProfile.token.label')"
      :label-width="260"
    >
      <NButton
        :disabled="!lcs.isConnected"
        @click="handleRemoveTokens"
        :loading="isRemovingTokens"
        size="small"
      >
        {{ t('SummonerProfile.token.button') }}
      </NButton>
    </SettingsRow>
    <SettingsRow
      :label-description="t('SummonerProfile.emotes.description')"
      :label="t('SummonerProfile.emotes.label')"
      :label-width="260"
    >
      <NButton
        :disabled="!lcs.isConnected"
        @click="handleClearEmotes"
        :loading="isClearingEmotes"
        size="small"
      >
        {{ t('SummonerProfile.emotes.button') }}
      </NButton>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="tsx">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { AugmentOverlay, ChampSkin } from '@shared/types/league-client/game-data'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal, NSelect, NTooltip, SelectOption, useMessage } from 'naive-ui'
import { VNode, computed, ref, watch } from 'vue'

import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const { match: isNameMatch } = useChampionNameMatch()

const currentChampionId = ref<number>()
const currentSkinId = ref<number>()
const currentAugmentId = ref<string>()
const championOptions = computed(() => {
  const list = Object.values(lcs.gameData.champions).reduce((arr, current) => {
    if (current.id === -1) {
      return arr
    }

    arr.push({
      label: current.name,
      value: current.id
    })
    return arr
  }, [] as SelectOption[])

  list.sort((a, b) => (a.label as string).localeCompare(b.label as string, 'zh-Hans-CN'))

  return list
})

const skinList = ref<ChampSkin[]>([])
const skinOptions = computed(() => {
  const arr: {
    label: string
    value: number
    imgUrl: string
    augments?: { label: string; value: string; imgUrl: string; overlays: AugmentOverlay[] }[]
  }[] = []

  const skinSet = new Set<number>()
  skinList.value.forEach((v) => {
    const augOptions1: {
      label: string
      value: string
      imgUrl: string
      overlays: AugmentOverlay[]
    }[] = []
    if (v.skinAugments && v.skinAugments.augments) {
      for (const au of v.skinAugments.augments) {
        if (au.overlays) {
          augOptions1.push({
            label: `${t('SummonerProfile.skinSelectModal.augment')} ${au.contentId}`,
            imgUrl: v.uncenteredSplashPath,
            value: au.contentId,
            overlays: au.overlays
          })
        }
      }
    }

    if (augOptions1.length) {
      augOptions1.unshift({
        label: t('SummonerProfile.skinSelectModal.unset'),
        value: '',
        imgUrl: '',
        overlays: []
      })
    }

    arr.push({
      label: v.name,
      value: v.id,
      imgUrl: v.uncenteredSplashPath,
      augments: augOptions1
    })

    skinSet.add(v.id)

    // 收集任务皮肤特殊挂件
    if (v.questSkinInfo && v.questSkinInfo.tiers) {
      v.questSkinInfo.tiers.forEach((ti) => {
        if (!skinSet.has(ti.id)) {
          const augOptions2: {
            label: string
            value: string
            imgUrl: string
            overlays: AugmentOverlay[]
          }[] = []
          if (ti.skinAugments && ti.skinAugments.augments) {
            for (const au of ti.skinAugments.augments) {
              if (au.overlays) {
                augOptions2.push({
                  label: `${t('SummonerProfile.skinSelectModal.augment')} ${au.contentId}`,
                  value: au.contentId,
                  imgUrl: ti.uncenteredSplashPath,
                  overlays: au.overlays
                })
              }
            }
          }

          if (augOptions2.length) {
            augOptions2.unshift({
              label: t('SummonerProfile.skinSelectModal.unset'),
              value: '',
              imgUrl: '',
              overlays: []
            })
          }

          arr.push({
            label: ti.name,
            value: ti.id,
            imgUrl: ti.uncenteredSplashPath,
            augments: augOptions2
          })
          skinSet.add(ti.id)
        }
      })
    }
  })

  return arr
})

const currentAugmentOptions = computed(() => {
  if (!currentSkinId.value) {
    return []
  }

  const s = skinOptions.value.find((s) => s.value === currentSkinId.value)

  return s?.augments || []
})

const renderLabel = (option: SelectOption) => {
  if (option.type === 'group') {
    return <span>{option.label as string}</span>
  }

  return (
    <div class="flex items-center gap-2">
      <LcuImage src={championIconUri(option.value as number)} class="h-5 w-5" />
      <span>{option.label as string}</span>
    </div>
  )
}

const renderOption = ({ option, node }: { node: VNode; option: SelectOption }) => {
  return (
    <NTooltip placement="right" delay={300} animated raw disabled={!option.imgUrl}>
      {{
        trigger: () => node,
        default: () => (
          <div class="relative h-40 min-w-70 overflow-hidden rounded bg-black/30 shadow-sm">
            <LcuImage
              {...({
                src: option.imgUrl as string,
                cache: false,
                class: 'absolute inset-0 h-full w-full overflow-hidden object-cover'
              } as any)}
            />
            {((option.overlays as AugmentOverlay[]) || []).map((o) => (
              <LcuImage
                {...({
                  src: o.uncenteredLCOverlayPath,
                  cache: false,
                  class: 'absolute inset-0 h-full w-full overflow-hidden object-cover'
                } as any)}
              />
            ))}
          </div>
        )
      }}
    </NTooltip>
  )
}

watch(
  () => currentChampionId.value,
  async (id) => {
    if (!id) {
      return
    }

    const details = (await lc.api.gameData.getChampDetails(id)).data

    if (details.id !== currentChampionId.value) {
      return
    }

    skinList.value = details.skins
    if (details.skins.length) {
      currentAugmentId.value = undefined
      currentSkinId.value = details.skins[0].id
    }
  }
)

const isModalShow = ref(false)
const message = useMessage()
const isProceeding = ref(false)

const handleApplyToProfile = async () => {
  if (!currentSkinId.value || isProceeding.value) {
    return
  }

  isProceeding.value = true
  try {
    await lc.api.summoner.setSummonerBackgroundSkin(currentSkinId.value)
    if (currentAugmentId.value !== undefined) {
      await lc.api.summoner.setSummonerBackgroundAugments(currentAugmentId.value)
    }
    message.success(() => t('SummonerProfile.commonSuccess'), { duration: 1000 })
  } catch (error) {
    console.warn(error)
    message.warning(() => t('SummonerProfile.commonFailed'), { duration: 1000 })
  } finally {
    isProceeding.value = false
  }
}

const BANNER_ACCENT_A = '2'

const isUpdating = ref(false)
const handleUpdatePr = async () => {
  if (isUpdating.value) {
    return
  }

  try {
    isUpdating.value = true
    await lc.api.challenges.updatePlayerPreferences({ bannerAccent: BANNER_ACCENT_A })
    message.success(() => t('SummonerProfile.commonSuccess'))
  } catch (error) {
    message.warning(() => t('SummonerProfile.commonFailed'))
    console.warn(error)
  } finally {
    isUpdating.value = false
  }
}

const FIXED_PRESTIGE_CREST = 22
const MINIMUM_SUMMONER_LEVEL_FOR_PRESTIGE_CREST = 525
const isRemovingPrestigeCrest = ref(false)
// Copied from Seraphine: https://github.com/Zzaphkiel/Seraphine
const handleRemovePrestigeCrest = async () => {
  if (isRemovingPrestigeCrest.value) {
    return
  }

  try {
    isRemovingPrestigeCrest.value = true
    const current = await lc.api.regalia.getRegalia()
    await lc.api.regalia.updateRegalia({
      preferredCrestType: 'prestige',
      preferredBannerType: current.data.bannerType,
      selectedPrestigeCrest: FIXED_PRESTIGE_CREST
    })
    message.success(() => t('SummonerProfile.commonSuccess'))
  } catch (error) {
    message.warning(() => t('SummonerProfile.commonFailed'))
    console.warn(error)
  } finally {
    isRemovingPrestigeCrest.value = false
  }
}

const isRemovingTokens = ref(false)
// Copied from Seraphine: https://github.com/Zzaphkiel/Seraphine
const handleRemoveTokens = async () => {
  if (isRemovingTokens.value) {
    return
  }

  try {
    isRemovingTokens.value = true
    await lc.api.challenges.updatePlayerPreferences({
      challengeIds: [],
      bannerAccent: (await lc.api.chat.getMe()).data.lol?.bannerIdSelected
    })
    message.success(() => t('SummonerProfile.commonSuccess'))
  } catch (error) {
    message.warning(() => t('SummonerProfile.commonFailed'))
    console.warn(error)
  } finally {
    isRemovingTokens.value = false
  }
}

const isClearingEmotes = ref(false)
const handleClearEmotes = async () => {
  if (isClearingEmotes.value) {
    return
  }

  try {
    isClearingEmotes.value = true

    const { data } = await lc.api.loadouts.getAccountScopeLoadouts()

    if (!data.length) {
      message.warning(() => t('SummonerProfile.commonFailed'))
      return
    }

    const loadoutId = data[0].id

    await lc.api.loadouts.setEmotes(loadoutId, {
      EMOTES_ACE: -1,
      EMOTES_FIRST_BLOOD: -1,
      EMOTES_VICTORY: -1,
      EMOTES_WHEEL_CENTER: -1,
      EMOTES_WHEEL_UPPER: -1,
      EMOTES_WHEEL_RIGHT: -1,
      EMOTES_WHEEL_UPPER_RIGHT: -1,
      EMOTES_WHEEL_UPPER_LEFT: -1,
      EMOTES_WHEEL_LOWER: -1,
      EMOTES_START: -1,
      EMOTES_WHEEL_LEFT: -1,
      EMOTES_WHEEL_LOWER_RIGHT: -1,
      EMOTES_WHEEL_LOWER_LEFT: -1
    })

    message.success(() => t('SummonerProfile.commonSuccess'))
  } catch (error) {
    message.warning(() => t('SummonerProfile.commonFailed'))
    console.warn(error)
  } finally {
    isClearingEmotes.value = false
  }
}
</script>
