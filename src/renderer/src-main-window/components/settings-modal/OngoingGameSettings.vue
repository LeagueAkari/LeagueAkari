<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
      <SettingsSection :title="t('OngoingGameSettings.titleCommon')">
        <SettingsRow
          :label="t('OngoingGameSettings.enabled.label')"
          :label-description="t('OngoingGameSettings.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ogs.settings.enabled"
            @update:value="(val) => og.setEnabled(val)"
          />
        </SettingsRow>

        <SettingsRow
          :label="t('OngoingGameSettings.autoRouteWhenGameStarts.label')"
          :label-description="t('OngoingGameSettings.autoRouteWhenGameStarts.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ogs.settings.autoRouteWhenGameStarts"
            @update:value="(val) => og.setAutoRouteWhenGameStarts(val)"
          />
        </SettingsRow>

        <SettingsRow
          :label="t('OngoingGameSettings.matchHistoryLoadCount.label')"
          :label-description="t('OngoingGameSettings.matchHistoryLoadCount.description')"
          :label-width="400"
        >
          <NInputNumber
            class="w-25!"
            size="small"
            :min="2"
            :max="200"
            :step="5"
            :value="ogs.settings.matchHistoryLoadCount"
            @update:value="(val) => og.setMatchHistoryLoadCount(val || 20)"
          />
        </SettingsRow>

        <SettingsRow
          :label="t('OngoingGameSettings.concurrency.label')"
          :label-description="t('OngoingGameSettings.concurrency.description')"
          :label-width="400"
        >
          <NInputNumber
            class="w-25!"
            size="small"
            :min="1"
            :value="ogs.settings.concurrency"
            @update:value="(val) => og.setConcurrency(val || 10)"
          />
        </SettingsRow>

        <SettingsRow
          :label="t('OngoingGameSettings.gameDetailsLoadCount.label')"
          :label-description="
            t('OngoingGameSettings.gameDetailsLoadCount.description', {
              count: ogs.settings.gameDetailsLoadCount
            })
          "
          :label-width="400"
        >
          <NInputNumber
            class="w-25!"
            size="small"
            :min="0"
            :value="ogs.settings.gameDetailsLoadCount"
            @update:value="(val) => og.setGameDetailsLoadCount(val || 0)"
          />
        </SettingsRow>

        <SettingsRow
          :label="t('OngoingGameSettings.matchHistoryTagPreference.label')"
          :label-description="t('OngoingGameSettings.matchHistoryTagPreference.description')"
          :label-width="400"
          :disabled="as.settings.preferredLolSource !== 'sgp'"
        >
          <NRadioGroup
            :value="ogs.settings.matchHistoryTagPreference"
            @update:value="(val) => og.setMatchHistoryTagPreference(val)"
            :disabled="as.settings.preferredLolSource !== 'sgp'"
          >
            <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
              <NRadio value="all">
                {{ t('OngoingGameSettings.matchHistoryTagPreference.options.all') }}</NRadio
              >
              <NRadio value="current">{{
                t('OngoingGameSettings.matchHistoryTagPreference.options.current')
              }}</NRadio>
            </div>
          </NRadioGroup>
        </SettingsRow>

        <SettingsRow
          :label="t('OngoingGameSettings.queryInLobbyPhase.label')"
          :label-description="t('OngoingGameSettings.queryInLobbyPhase.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ogs.settings.queryInLobbyPhase"
            @update:value="(val) => og.setQueryInLobbyPhase(val)"
          />
        </SettingsRow>

        <SettingsRow
          :label="t('OngoingGameSettings.premadeTeamInferMatchCountThreshold.label')"
          :label-description="
            t('OngoingGameSettings.premadeTeamInferMatchCountThreshold.description')
          "
          :label-width="400"
        >
          <NInputNumber
            class="w-25!"
            size="small"
            :min="2"
            :value="ogs.settings.premadeTeamInferMatchCountThreshold"
            @update:value="(val) => og.setPremadeTeamInferMatchCountThreshold(val || 5)"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection :title="t('OngoingGameSettings.titlePlayerCard')">
        <SettingsRow
          :label-width="400"
          :label="t('OngoingGameSettings.showChampionUsage.label')"
          :label-description="t('OngoingGameSettings.showChampionUsage.description')"
        >
          <NRadioGroup
            :value="ogs.settings.showChampionUsage"
            @update:value="(val) => og.setShowChampionUsage(val)"
          >
            <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
              <NRadio value="none">
                {{ t('OngoingGameSettings.showChampionUsage.options.none') }}</NRadio
              >
              <NRadio value="recent">{{
                t('OngoingGameSettings.showChampionUsage.options.recent')
              }}</NRadio>
              <NRadio value="mastery">{{
                t('OngoingGameSettings.showChampionUsage.options.mastery')
              }}</NRadio>
            </div>
          </NRadioGroup>
        </SettingsRow>

        <SettingsRow
          :label-width="400"
          :label="t('OngoingGameSettings.showMatchHistoryItemBorder.label')"
          :label-description="t('OngoingGameSettings.showMatchHistoryItemBorder.description')"
        >
          <NSwitch
            size="small"
            :value="ogs.settings.showMatchHistoryItemBorder"
            @update:value="(val) => og.setShowMatchHistoryItemBorder(val)"
          />
        </SettingsRow>

        <SettingsRow
          :label-width="400"
          :label="t('OngoingGameSettings.playerCardTags.label')"
          align="start"
          :label-description="t('OngoingGameSettings.playerCardTags.description')"
        >
          <NFlex vertical align="start" class="max-w-full">
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showPremadeTeamTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showPremadeTeamTag: val })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showPremadeTeamTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showWinningStreakTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showWinningStreakTag: val
                  })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showWinningStreakTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showLosingStreakTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showLosingStreakTag: val })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showLosingStreakTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showSoloKillsTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showSoloKillsTag: val })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showSoloKillsTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showAverageTeamDamageTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showAverageTeamDamageTag: val
                  })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showAverageTeamDamageTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showAverageTeamDamageTakenTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showAverageTeamDamageTakenTag: val
                  })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showAverageTeamDamageTakenTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showSuspiciousFlashPositionTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showSuspiciousFlashPositionTag: val
                  })
              "
            >
              {{
                t('OngoingGameSettings.playerCardTags.tags.showSuspiciousFlashPositionTag.label')
              }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showAverageTeamGoldTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showAverageTeamGoldTag: val
                  })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showAverageTeamGoldTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showAverageDamageGoldEfficiencyTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showAverageDamageGoldEfficiencyTag: val
                  })
              "
            >
              {{
                t(
                  'OngoingGameSettings.playerCardTags.tags.showAverageDamageGoldEfficiencyTag.label'
                )
              }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showGreatPerformanceTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showGreatPerformanceTag: val
                  })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showGreatPerformanceTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showMetTag"
              @update:checked="
                (val) => og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showMetTag: val })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showMetTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showTaggedTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showTaggedTag: val })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showTaggedTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showSelfTag"
              @update:checked="
                (val) => og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showSelfTag: val })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showSelfTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showWinRateTeamTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showWinRateTeamTag: val })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showWinRateTeamTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showPrivacyTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showPrivacyTag: val })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showPrivacyTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showAverageEnemyMissingPingsTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showAverageEnemyMissingPingsTag: val
                  })
              "
            >
              {{
                t('OngoingGameSettings.playerCardTags.tags.showAverageEnemyMissingPingsTag.label')
              }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showAverageVisionScoreTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showAverageVisionScoreTag: val
                  })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showAverageVisionScoreTag.label') }}
            </NCheckbox>
            <NCheckbox
              v-if="as.settings.isInKyokoMode"
              :checked="ogs.settings.playerCardTags.showAkariScoreTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showAkariScoreTag: val })
              "
            >
              {{ t('OngoingGameSettings.playerCardTags.tags.showAkariScoreTag.label') }}
            </NCheckbox>
          </NFlex>
        </SettingsRow>
      </SettingsSection>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useTranslation } from 'i18next-vue'
import { NCheckbox, NFlex, NInputNumber, NRadio, NRadioGroup, NScrollbar, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()
const og = useInstance(OngoingGameRenderer)
</script>
