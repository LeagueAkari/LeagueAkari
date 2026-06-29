<template>
  <div>
    <NModal
      preset="card"
      size="small"
      class="w-full max-w-[980px] min-w-[940px]"
      transform-origin="center"
      v-model:show="show"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <template v-if="selectedId">
            <LcuImage class="h-5 w-5" :src="championIconUri(selectedId)" />
            <span class="text-sm font-medium text-black dark:text-white">
              {{ lcs.gameData.champions[selectedId]?.name }}
            </span>
          </template>
          <template v-else>
            <span class="text-sm font-medium text-black dark:text-white">
              {{ t('automation.champConfig.championConfig.configure') }}
            </span>
          </template>
        </div>
      </template>

      <div class="flex max-h-[520px] gap-4 text-xs text-black/80 dark:text-white/80">
        <div class="flex max-h-[520px] w-52 flex-col gap-2">
          <!-- filter -->
          <NInput
            clearable
            size="small"
            :placeholder="t('automation.champConfig.championConfig.searchPlaceholder')"
            v-model:value="filterInput"
          >
            <template #prefix>
              <NIcon :component="SearchIcon" />
            </template>
          </NInput>

          <!-- champion list -->
          <NVirtualList
            class="flex-1 overflow-y-auto"
            :padding-top="2"
            :item-size="30"
            key-field="value"
            :items="championOptions"
          >
            <template #default="{ item }">
              <div
                :class="[
                  'mb-0.5 flex h-7 cursor-pointer items-center gap-2 rounded px-2 text-xs transition-colors last:mb-0 hover:bg-black/10 hover:text-black dark:hover:bg-white/10 dark:hover:text-white',
                  item.value === selectedId
                    ? 'bg-black/10 text-black dark:bg-white/10 dark:text-white'
                    : 'text-black/60 dark:text-white/60'
                ]"
                @click="handleChangeChampion(item.value)"
              >
                <LcuImage
                  class="mr-2 h-5 w-5 shrink-0 rounded-sm bg-black/10 dark:bg-white/10"
                  :src="championIconUri(item.value)"
                />
                <div class="mr-2 flex-1 truncate text-xs">
                  {{ item.label }}
                </div>

                <!-- runes configuration status -->
                <NPopover :keep-alive-on-hover="false" v-if="item.hasRunes || item.hasSpells">
                  <template #trigger>
                    <template v-if="item.hasRunes">
                      <NIcon class="text-lg text-emerald-600 dark:text-emerald-400">
                        <CheckmarkCircle16RegularIcon />
                      </NIcon>
                    </template>
                    <template v-else>
                      <NIcon class="text-lg text-gray-500 dark:text-gray-400">
                        <SubtractCircle16RegularIcon />
                      </NIcon>
                    </template>
                  </template>
                  <template v-if="item.hasRunes">{{
                    t('automation.champConfig.championConfig.runesConfigured')
                  }}</template>
                  <template v-else>{{
                    t('automation.champConfig.championConfig.runesUnconfigured')
                  }}</template>
                </NPopover>

                <!-- spells configuration status -->
                <NPopover :keep-alive-on-hover="false" v-if="item.hasRunes || item.hasSpells">
                  <template #trigger>
                    <template v-if="item.hasSpells">
                      <NIcon class="ml-1 text-lg text-emerald-600 dark:text-emerald-400">
                        <CheckmarkCircle16RegularIcon />
                      </NIcon>
                    </template>
                    <template v-else>
                      <NIcon class="ml-1 text-lg text-gray-500 dark:text-gray-400">
                        <SubtractCircle16RegularIcon />
                      </NIcon>
                    </template>
                  </template>
                  <template v-if="item.hasSpells">{{
                    t('automation.champConfig.championConfig.spellsConfigured')
                  }}</template>
                  <template v-else>{{
                    t('automation.champConfig.championConfig.spellsUnconfigured')
                  }}</template>
                </NPopover>
              </div>
            </template>
          </NVirtualList>
        </div>

        <div class="h-full w-px bg-black/10 dark:bg-white/10"></div>

        <!-- right content -->
        <div class="flex min-w-[540px] flex-1 flex-col" v-if="selectedId">
          <!-- modes -->
          <div class="mb-2">
            <div class="mb-1 text-xs font-medium text-black/60 dark:text-white/60">
              {{ t('automation.champConfig.championConfig.targetMode') }}
            </div>

            <NRadioGroup
              v-model:value="currentType"
              size="small"
              :theme-overrides="{
                buttonHeightSmall: '28px'
              }"
            >
              <NRadioButton value="ranked">
                <div class="flex h-full items-center gap-1 text-xs">
                  <LcuImage class="h-4 w-4" :src="gameModeIconUri['CLASSIC']" />
                  <span>{{ t('automation.champConfig.championConfig.ranked') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.some((r) => r.startsWith('ranked')) ||
                      configExistence.spells.some((r) => r.startsWith('ranked'))
                    "
                    class="text-sm"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="normal">
                <div class="flex h-full items-center gap-1 text-xs">
                  <LcuImage class="h-4 w-4" :src="gameModeIconUri['CLASSIC']" />
                  <span>{{ t('automation.champConfig.championConfig.normal') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('normal') ||
                      configExistence.spells.includes('normal')
                    "
                    class="text-sm"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="aram">
                <div class="flex h-full items-center gap-1 text-xs">
                  <LcuImage class="h-4 w-4" :src="gameModeIconUri['ARAM']" />
                  <span>{{ t('automation.champConfig.championConfig.aram') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('aram') ||
                      configExistence.spells.includes('aram')
                    "
                    class="text-sm"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="urf">
                <div class="flex h-full items-center gap-1 text-xs">
                  <LcuImage class="h-4 w-4" :src="gameModeIconUri['URF']" />
                  <span>{{ t('automation.champConfig.championConfig.urf') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('urf') ||
                      configExistence.spells.includes('urf')
                    "
                    class="text-sm"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="nexusblitz">
                <div class="flex h-full items-center gap-1 text-xs">
                  <LcuImage class="h-4 w-4" :src="gameModeIconUri['NEXUSBLITZ']" />
                  <span>{{ t('automation.champConfig.championConfig.nexusblitz') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('nexusblitz') ||
                      configExistence.spells.includes('nexusblitz')
                    "
                    class="text-sm"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="ultbook">
                <div class="flex h-full items-center gap-1 text-xs">
                  <LcuImage class="h-4 w-4" :src="gameModeIconUri['ULTBOOK']" />
                  <span>{{ t('automation.champConfig.championConfig.ultbook') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('ultbook') ||
                      configExistence.spells.includes('ultbook')
                    "
                    class="text-sm"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
            </NRadioGroup>
          </div>

          <!-- line2 radios -->
          <div class="flex gap-2">
            <!-- group: configure -->
            <div class="mb-2">
              <div class="mb-1 text-xs font-medium text-black/60 dark:text-white/60">
                {{ t('automation.champConfig.championConfig.configure') }}
              </div>

              <NRadioGroup
                v-model:value="currentConfig"
                size="small"
                :theme-overrides="{
                  buttonHeightSmall: '28px'
                }"
              >
                <NRadioButton value="runes">
                  <div class="flex h-full items-center gap-1 text-xs">
                    <span>{{ t('automation.champConfig.championConfig.runes') }}</span>
                    <NIcon
                      v-if="configExistence.runes.some((r) => r.startsWith(currentType))"
                      class="text-sm"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="spells">
                  <div class="flex h-full items-center gap-1 text-xs">
                    <span>{{ t('automation.champConfig.championConfig.spells') }}</span>
                    <NIcon
                      v-if="configExistence.spells.some((r) => r.startsWith(currentType))"
                      class="text-sm"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
              </NRadioGroup>
            </div>

            <!-- group: position -->
            <div class="mb-2" v-if="currentType === 'ranked'">
              <div class="mb-1 text-xs font-medium text-black/60 dark:text-white/60">
                {{ t('automation.champConfig.championConfig.position') }}
              </div>

              <NRadioGroup
                v-model:value="currentPosition"
                size="small"
                :theme-overrides="{
                  labelPadding: '0 8px',
                  buttonHeightSmall: '28px'
                }"
              >
                <NRadioButton value="default">
                  <div class="flex h-full items-center gap-1 text-xs">
                    <PositionIcon position="all" />
                    <span>{{ t('automation.champConfig.championConfig.default') }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-default`)
                          : configExistence.spells.includes(`${currentType}-default`)
                      "
                      class="text-sm"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="top">
                  <div class="flex h-full items-center gap-1 text-xs">
                    <PositionIcon position="top" />
                    <span>{{ t('positions.top', { ns: 'common' }) }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-top`)
                          : configExistence.spells.includes(`${currentType}-top`)
                      "
                      class="text-sm"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="jungle">
                  <div class="flex h-full items-center gap-1 text-xs">
                    <PositionIcon position="jungle" />
                    <span>{{ t('positions.jungle', { ns: 'common' }) }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-jungle`)
                          : configExistence.spells.includes(`${currentType}-jungle`)
                      "
                      class="text-sm"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="middle">
                  <div class="flex h-full items-center gap-1 text-xs">
                    <PositionIcon position="middle" />
                    <span>{{ t('positions.middle', { ns: 'common' }) }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-middle`)
                          : configExistence.spells.includes(`${currentType}-middle`)
                      "
                      class="text-sm"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="bottom">
                  <div class="flex h-full items-center gap-1 text-xs">
                    <PositionIcon position="bottom" />
                    <span>{{ t('positions.bottom', { ns: 'common' }) }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-bottom`)
                          : configExistence.spells.includes(`${currentType}-bottom`)
                      "
                      class="text-sm"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="utility">
                  <div class="flex h-full items-center gap-1 text-xs">
                    <PositionIcon position="utility" />
                    <span>{{ t('positions.utility', { ns: 'common' }) }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-utility`)
                          : configExistence.spells.includes(`${currentType}-utility`)
                      "
                      class="text-sm"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
              </NRadioGroup>
            </div>
          </div>

          <!-- runes editor -->
          <div
            class="mb-2 flex flex-1 items-center justify-center rounded-sm bg-black/5 p-4 dark:bg-white/5"
            v-if="currentConfig === 'runes'"
          >
            <RuneV2Edit v-model:page="tempEditingRunes" v-if="tempEditingRunes" />
            <div
              class="flex h-full flex-col items-center justify-center gap-2 text-sm text-black/60 dark:text-white/60"
              v-else
            >
              <span>
                {{ t('automation.champConfig.championConfig.runesUnconfigured') }}
              </span>
              <NButton secondary size="small" type="primary" @click="handleCreateRunesConfig">{{
                t('automation.champConfig.championConfig.configureRunes')
              }}</NButton>
            </div>
          </div>

          <!-- spells editor -->
          <div
            class="mb-2 flex flex-1 items-center justify-center rounded-sm bg-black/5 p-4 dark:bg-white/5"
            v-else-if="currentConfig === 'spells'"
          >
            <SummonerSpellEdit
              v-if="tempEditingSpells"
              :game-mode="typeToGameMode(currentType)"
              v-model:spell-ids="tempEditingSpells"
            />
            <div
              class="flex h-full flex-col items-center justify-center gap-2 text-sm text-black/60 dark:text-white/60"
              v-else
            >
              <span>
                {{ t('automation.champConfig.championConfig.spellsUnconfigured') }}
              </span>
              <NButton size="small" secondary type="primary" @click="handleCreateSpellsConfig">{{
                t('automation.champConfig.championConfig.configureSpells')
              }}</NButton>
            </div>
          </div>

          <!-- buttons -->
          <div class="flex justify-end gap-1">
            <template v-if="currentConfig === 'runes'">
              <NButton size="small" @click="handleClearRunes" :disabled="!tempEditingRunes">{{
                t('automation.champConfig.championConfig.clear')
              }}</NButton>

              <NButton size="small" :disabled="isRunesUnchanged" @click="handleRestoreRunes">{{
                t('automation.champConfig.championConfig.restore')
              }}</NButton>
              <NButton
                size="small"
                type="primary"
                :disabled="isRunesUnchanged || !isRunesValid"
                @click="handleSaveRunes"
                >{{ t('automation.champConfig.championConfig.save') }}</NButton
              >
            </template>
            <template v-else-if="currentConfig === 'spells'">
              <NButton size="small" @click="handleClearSpells" :disabled="!tempEditingSpells">{{
                t('automation.champConfig.championConfig.clear')
              }}</NButton>
              <NButton size="small" @click="handleRestoreSpells" :disabled="isSpellsUnchanged">{{
                t('automation.champConfig.championConfig.restore')
              }}</NButton>
              <NButton
                size="small"
                type="primary"
                @click="handleSaveSpells"
                :disabled="isSpellsUnchanged"
                >{{ t('automation.champConfig.championConfig.save') }}</NButton
              >
            </template>
          </div>
        </div>

        <!-- no champion placeholder -->
        <div
          v-else
          class="flex h-full min-w-[540px] items-center justify-center text-sm text-black/60 dark:text-white/60"
        >
          <span>{{ t('automation.champConfig.championConfig.noChampionPlaceholder') }}</span>
        </div>
      </div>
    </NModal>

    <NButton size="tiny" type="primary" @click="show = true">{{
      t('automation.champConfig.championConfig.configure')
    }}</NButton>
  </div>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoChampConfigRenderer } from '@renderer-shared/shards/auto-champ-config'
import { useAutoChampConfigStore } from '@renderer-shared/shards/auto-champ-config/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { maybePveChampion } from '@shared/types/league-client/game-data'
import { ChampionRunesConfig, SummonerSpellsConfig } from '@shared/shards/auto-champ-config'
import { Search as SearchIcon } from '@vicons/carbon'
import {
  CheckmarkCircle16Regular as CheckmarkCircle16RegularIcon,
  SubtractCircle16Regular as SubtractCircle16RegularIcon
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import _ from 'lodash'
import {
  NButton,
  NIcon,
  NInput,
  NModal,
  NPopover,
  NRadioButton,
  NRadioGroup,
  NVirtualList,
  useMessage
} from 'naive-ui'
import { computed, ref, toRaw, watch } from 'vue'

import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'
import { useMapAssets } from '@main-window/composables/useMapAssets'

import RuneV2Edit from './RuneV2Edit.vue'
import SummonerSpellEdit from './SummonerSpellEdit.vue'
import { useValidatedRunes } from './utils'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const acs = useAutoChampConfigStore()
const ac = useInstance(AutoChampConfigRenderer)

const { match: isNameMatch } = useChampionNameMatch()

const show = defineModel<boolean>('show', { default: false })

const filterInput = ref('')

const championOptions = computed(() => {
  const sorted = Object.values(lcs.gameData.champions)
    .map((c) => {
      const hasRunes =
        acs.settings.runesV2[c.id] && Object.values(acs.settings.runesV2[c.id]).some((r) => r)
      const hasSpells =
        acs.settings.summonerSpells[c.id] &&
        Object.values(acs.settings.summonerSpells[c.id]).some((s) => s)

      return {
        ...c,
        hasRunes,
        hasSpells
      }
    })
    .toSorted((a, b) => {
      const aIsPVE = maybePveChampion(a.id)
      const bIsPVE = maybePveChampion(b.id)

      if (aIsPVE && !bIsPVE) {
        return 1
      } else if (!aIsPVE && bIsPVE) {
        return -1
      } else if (aIsPVE && bIsPVE) {
        return a.name.localeCompare(b.name, 'zh-Hans-CN')
      }

      const aConfigCount = (a.hasRunes ? 1 : 0) + (a.hasSpells ? 1 : 0)
      const bConfigCount = (b.hasRunes ? 1 : 0) + (b.hasSpells ? 1 : 0)

      if (aConfigCount === 0 && bConfigCount === 0) {
        return a.name.localeCompare(b.name, 'zh-Hans-CN')
      }
      if (aConfigCount === 0 && bConfigCount !== 0) {
        return 1
      }
      if (aConfigCount !== 0 && bConfigCount === 0) {
        return -1
      }

      if (aConfigCount === bConfigCount) {
        if (aConfigCount === 2) {
          return a.name.localeCompare(b.name, 'zh-Hans-CN')
        }
        if (aConfigCount === 1) {
          if (a.hasRunes && b.hasSpells) {
            return -1
          }
          if (a.hasSpells && b.hasRunes) {
            return 1
          }
          return a.name.localeCompare(b.name, 'zh-Hans-CN')
        }
      } else {
        return aConfigCount > bConfigCount ? -1 : 1
      }

      return a.name.localeCompare(b.name, 'zh-Hans-CN')
    })

  const isEmpty = filterInput.value.trim() === ''
  const nonEmpty = sorted.filter((b) => b.id !== -1)

  if (isEmpty) {
    return nonEmpty.map((b) => ({
      value: b.id,
      label: b.name,
      hasRunes: b.hasRunes,
      hasSpells: b.hasSpells
    }))
  } else {
    return nonEmpty
      .filter((b) => isNameMatch(filterInput.value, b.name, b.id))
      .map((b) => ({
        value: b.id,
        label: b.name,
        hasRunes: b.hasRunes,
        hasSpells: b.hasSpells
      }))
  }
})

const message = useMessage()

const selectedId = ref<number | null>(null)
const currentType = ref('ranked')
const currentConfig = ref('runes')
const currentPosition = ref('default')

const tempEditingRunes = ref<ChampionRunesConfig | null>(null)
const tempEditingSpells = ref<SummonerSpellsConfig | null>(null)

watch(
  [
    () => selectedId.value,
    () => currentType.value,
    () => currentConfig.value,
    () => currentPosition.value
  ],
  ([id, type, config, position]) => {
    if (!id) {
      tempEditingRunes.value = null
      tempEditingSpells.value = null
      return
    }

    if (config === 'runes') {
      tempEditingSpells.value = null
      tempEditingRunes.value = null

      if (acs.settings.runesV2[id]) {
        if (type === 'ranked') {
          tempEditingRunes.value = structuredClone(
            acs.settings.runesV2[id][`${type}-${position}`] || null
          )
        } else {
          tempEditingRunes.value = structuredClone(acs.settings.runesV2[id][type] || null)
        }
      } else {
      }
    } else if (config === 'spells') {
      tempEditingRunes.value = null
      tempEditingSpells.value = null

      if (acs.settings.summonerSpells[id]) {
        if (type === 'ranked') {
          tempEditingSpells.value = acs.settings.summonerSpells[id][`${type}-${position}`] || null
        } else {
          tempEditingSpells.value = acs.settings.summonerSpells[id][type] || null
        }
      } else {
      }
    }
  },
  { immediate: true }
)

const handleChangeChampion = (id: number) => {
  selectedId.value = id
}

// Here just create an object and the RuneV2Edit will handle the initialization and correct the data
const handleCreateRunesConfig = () => {
  if (!selectedId.value) {
    return
  }

  tempEditingRunes.value = {
    primaryStyleId: 0,
    subStyleId: 0,
    selectedPerkIds: []
  }
}

const handleSaveRunes = async () => {
  if (!selectedId.value) {
    return
  }

  if (currentType.value === 'ranked') {
    await ac.updatePositionRunes(
      selectedId.value,
      currentType.value,
      currentPosition.value,
      toRaw(tempEditingRunes.value)
    )
  } else {
    await ac.updateRunes(selectedId.value, currentType.value, toRaw(tempEditingRunes.value))
  }

  message.success(() => t('automation.champConfig.championConfig.runesSaved'))
}

const handleClearRunes = () => {
  if (!selectedId.value) {
    return
  }

  tempEditingRunes.value = null
}

const handleCreateSpellsConfig = () => {
  if (!selectedId.value) {
    return
  }

  tempEditingSpells.value = {
    spell1Id: 0,
    spell2Id: 0
  }
}

const handleSaveSpells = async () => {
  if (!selectedId.value) {
    return
  }

  if (currentType.value === 'ranked') {
    await ac.updatePositionSummonerSpells(
      selectedId.value,
      currentType.value,
      currentPosition.value,
      toRaw(tempEditingSpells.value)
    )
  } else {
    await ac.updateSummonerSpells(
      selectedId.value,
      currentType.value,
      toRaw(tempEditingSpells.value)
    )
  }

  message.success(() => t('automation.champConfig.championConfig.spellsSaved'))
}

const handleClearSpells = () => {
  if (!selectedId.value) {
    return
  }

  tempEditingSpells.value = null
}

const handleRestoreSpells = () => {
  if (!selectedId.value) {
    return
  }

  if (currentType.value === 'ranked') {
    tempEditingSpells.value = structuredClone(
      acs.settings.summonerSpells[selectedId.value]?.[
        `${currentType.value}-${currentPosition.value}`
      ] || null
    )
  } else {
    tempEditingSpells.value = structuredClone(
      acs.settings.summonerSpells[selectedId.value]?.[currentType.value] || null
    )
  }

  message.success(() => t('automation.champConfig.championConfig.spellsRestored'))
}

const handleRestoreRunes = () => {
  if (!selectedId.value) {
    return
  }

  if (currentType.value === 'ranked') {
    tempEditingRunes.value = structuredClone(
      acs.settings.runesV2[selectedId.value]?.[`${currentType.value}-${currentPosition.value}`] ||
        null
    )
  } else {
    tempEditingRunes.value = structuredClone(
      acs.settings.runesV2[selectedId.value]?.[currentType.value] || null
    )
  }

  message.success(() => t('automation.champConfig.championConfig.runesRestored'))
}

// 在可用时始终选择一个英雄
watch(
  () => championOptions.value,
  (options) => {
    if (!selectedId.value && options.length) {
      selectedId.value = options[0].value
    }
  },
  { immediate: true }
)

// 在发生变化时更新到当前配置
watch(
  () => acs.settings.runesV2,
  (runes) => {
    if (!selectedId.value) {
      return
    }

    if (currentConfig.value === 'runes' && runes[selectedId.value]) {
      if (currentType.value === 'ranked') {
        const currentPageValue =
          runes[selectedId.value][`${currentType.value}-${currentPosition.value}`] || null
        tempEditingRunes.value = structuredClone(currentPageValue)
      } else {
        tempEditingRunes.value = runes[selectedId.value][currentType.value] || null
      }
    } else {
      tempEditingRunes.value = null
    }
  }
)

watch(
  () => acs.settings.summonerSpells,
  (spells) => {
    if (!selectedId.value) {
      return
    }

    if (currentConfig.value === 'spells' && spells[selectedId.value]) {
      if (currentType.value === 'ranked') {
        tempEditingSpells.value = structuredClone(
          spells[selectedId.value][`${currentType.value}-${currentPosition.value}`] || null
        )
      } else {
        tempEditingSpells.value = structuredClone(
          spells[selectedId.value][currentType.value] || null
        )
      }
    } else {
      tempEditingSpells.value = null
    }
  }
)

const isRunesUnchanged = computed(() => {
  if (!selectedId.value) {
    return true
  }

  if (currentConfig.value === 'runes') {
    if (currentType.value === 'ranked') {
      return _.isEqual(
        tempEditingRunes.value,
        acs.settings.runesV2[selectedId.value]?.[`${currentType.value}-${currentPosition.value}`] ||
          null
      )
    } else {
      return _.isEqual(
        tempEditingRunes.value,
        acs.settings.runesV2[selectedId.value]?.[currentType.value] || null
      )
    }
  }

  return true
})

const isRunesValid = computed(() => {
  if (!tempEditingRunes.value) {
    return true
  }

  return useValidatedRunes(tempEditingRunes.value).value
})

const isSpellsUnchanged = computed(() => {
  if (!selectedId.value) {
    return true
  }

  if (currentConfig.value === 'spells') {
    if (currentType.value === 'ranked') {
      return _.isEqual(
        tempEditingSpells.value,
        acs.settings.summonerSpells[selectedId.value]?.[
          `${currentType.value}-${currentPosition.value}`
        ] || null
      )
    } else {
      return _.isEqual(
        tempEditingSpells.value,
        acs.settings.summonerSpells[selectedId.value]?.[currentType.value] || null
      )
    }
  }

  return true
})

const mapAssets = useMapAssets()
const gameModeIconUri = computed(() => {
  if (!mapAssets.value) {
    return {}
  }

  const gameModeUri: Record<string, string> = {}
  const flattened = Object.values(mapAssets.value).flat()

  for (const item of flattened) {
    if (gameModeUri[item.gameMode]) {
      continue
    }

    gameModeUri[item.gameMode] = item.assets?.['game-select-icon-hover']
  }

  return gameModeUri
})

const typeToGameMode = (type: string) => {
  switch (type) {
    case 'ranked':
      return 'CLASSIC'
    case 'normal':
      return 'CLASSIC'
    case 'aram':
      return 'ARAM'
    case 'urf':
      return 'URF'
    case 'nexusblitz':
      return 'NEXUSBLITZ'
    case 'ultbook':
      return 'ULTBOOK'
  }

  return 'CLASSIC'
}

const configExistence = computed(() => {
  if (!selectedId.value) {
    return {
      runes: [],
      spells: []
    }
  }

  const runes = acs.settings.runesV2[selectedId.value]
  const spells = acs.settings.summonerSpells[selectedId.value]

  const runesKeys = runes
    ? Object.entries(runes)
        .filter((kv) => kv[1])
        .map((kv) => kv[0])
    : []
  const spellsKeys = spells
    ? Object.entries(spells)
        .filter((kv) => kv[1])
        .map((kv) => kv[0])
    : []

  return {
    runes: runesKeys,
    spells: spellsKeys
  }
})
</script>

<style scoped>
:deep(.n-radio-button .n-radio__label) {
  height: 100%;
}
</style>
