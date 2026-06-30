<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
      <SettingsSection :title="t('settings.ongoingGame.titleCommon')">
        <SettingsRow
          :label="t('settings.ongoingGame.enabled.label')"
          :label-description="t('settings.ongoingGame.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ogs.settings.enabled"
            @update:value="(val) => og.setEnabled(val)"
          />
        </SettingsRow>

        <SettingsRow
          :label="t('settings.ongoingGame.autoRouteWhenGameStarts.label')"
          :label-description="t('settings.ongoingGame.autoRouteWhenGameStarts.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ogs.settings.autoRouteWhenGameStarts"
            @update:value="(val) => og.setAutoRouteWhenGameStarts(val)"
          />
        </SettingsRow>

        <SettingsRow
          :label="t('settings.ongoingGame.matchHistoryLoadCount.label')"
          :label-description="t('settings.ongoingGame.matchHistoryLoadCount.description')"
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
          :label="t('settings.ongoingGame.concurrency.label')"
          :label-description="t('settings.ongoingGame.concurrency.description')"
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
          :label="t('settings.ongoingGame.gameDetailsLoadCount.label')"
          :label-description="
            t('settings.ongoingGame.gameDetailsLoadCount.description', {
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
          :label="t('settings.ongoingGame.matchHistoryTagPreference.label')"
          :label-description="t('settings.ongoingGame.matchHistoryTagPreference.description')"
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
                {{ t('settings.ongoingGame.matchHistoryTagPreference.options.all') }}</NRadio
              >
              <NRadio value="current">{{
                t('settings.ongoingGame.matchHistoryTagPreference.options.current')
              }}</NRadio>
            </div>
          </NRadioGroup>
        </SettingsRow>

        <SettingsRow
          :label="t('settings.ongoingGame.queryInLobbyPhase.label')"
          :label-description="t('settings.ongoingGame.queryInLobbyPhase.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ogs.settings.queryInLobbyPhase"
            @update:value="(val) => og.setQueryInLobbyPhase(val)"
          />
        </SettingsRow>

        <SettingsRow
          :label="t('settings.ongoingGame.premadeTeamInferMatchCountThreshold.label')"
          :label-description="
            t('settings.ongoingGame.premadeTeamInferMatchCountThreshold.description')
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

      <SettingsSection :title="t('settings.ongoingGame.titlePlayerCard')">
        <SettingsRow
          :label-width="400"
          :label="t('settings.ongoingGame.showChampionUsage.label')"
          :label-description="t('settings.ongoingGame.showChampionUsage.description')"
        >
          <NRadioGroup
            :value="ogs.settings.showChampionUsage"
            @update:value="(val) => og.setShowChampionUsage(val)"
          >
            <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
              <NRadio value="none">
                {{ t('settings.ongoingGame.showChampionUsage.options.none') }}</NRadio
              >
              <NRadio value="recent">{{
                t('settings.ongoingGame.showChampionUsage.options.recent')
              }}</NRadio>
              <NRadio value="mastery">{{
                t('settings.ongoingGame.showChampionUsage.options.mastery')
              }}</NRadio>
            </div>
          </NRadioGroup>
        </SettingsRow>

        <SettingsRow
          :label-width="400"
          :label="t('settings.ongoingGame.showMatchHistoryItemBorder.label')"
          :label-description="t('settings.ongoingGame.showMatchHistoryItemBorder.description')"
        >
          <NSwitch
            size="small"
            :value="ogs.settings.showMatchHistoryItemBorder"
            @update:value="(val) => og.setShowMatchHistoryItemBorder(val)"
          />
        </SettingsRow>

        <SettingsRow
          :label-width="400"
          :label="t('settings.ongoingGame.showJunglePathing.label')"
          :label-description="t('settings.ongoingGame.showJunglePathing.description')"
        >
          <NSwitch
            size="small"
            :value="ogs.settings.showJunglePathing"
            @update:value="(val) => og.setShowJunglePathing(val)"
          />
        </SettingsRow>

        <SettingsRow
          :label-width="400"
          :label="t('settings.ongoingGame.playerCardTags.label')"
          align="start"
          :label-description="t('settings.ongoingGame.playerCardTags.description')"
          control-full-line
        >
          <div class="grid w-full grid-cols-3 gap-y-1">
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showPremadeTeamTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showPremadeTeamTag: val })
              "
            >
              {{ t('settings.ongoingGame.playerCardTags.tags.showPremadeTeamTag.label') }}
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
              {{ t('settings.ongoingGame.playerCardTags.tags.showWinningStreakTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showLosingStreakTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showLosingStreakTag: val })
              "
            >
              {{ t('settings.ongoingGame.playerCardTags.tags.showLosingStreakTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showSoloKillsTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showSoloKillsTag: val })
              "
            >
              {{ t('settings.ongoingGame.playerCardTags.tags.showSoloKillsTag.label') }}
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
              {{ t('settings.ongoingGame.playerCardTags.tags.showAverageTeamDamageTag.label') }}
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
              {{
                t('settings.ongoingGame.playerCardTags.tags.showAverageTeamDamageTakenTag.label')
              }}
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
                t('settings.ongoingGame.playerCardTags.tags.showSuspiciousFlashPositionTag.label')
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
              {{ t('settings.ongoingGame.playerCardTags.tags.showAverageTeamGoldTag.label') }}
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
                  'settings.ongoingGame.playerCardTags.tags.showAverageDamageGoldEfficiencyTag.label'
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
              {{ t('settings.ongoingGame.playerCardTags.tags.showGreatPerformanceTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showMetTag"
              @update:checked="
                (val) => og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showMetTag: val })
              "
            >
              {{ t('settings.ongoingGame.playerCardTags.tags.showMetTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showTaggedTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showTaggedTag: val })
              "
            >
              {{ t('settings.ongoingGame.playerCardTags.tags.showTaggedTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showSelfTag"
              @update:checked="
                (val) => og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showSelfTag: val })
              "
            >
              {{ t('settings.ongoingGame.playerCardTags.tags.showSelfTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showWinRateTeamTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showWinRateTeamTag: val })
              "
            >
              {{ t('settings.ongoingGame.playerCardTags.tags.showWinRateTeamTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showPrivacyTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showPrivacyTag: val })
              "
            >
              {{ t('settings.ongoingGame.playerCardTags.tags.showPrivacyTag.label') }}
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
                t('settings.ongoingGame.playerCardTags.tags.showAverageEnemyMissingPingsTag.label')
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
              {{ t('settings.ongoingGame.playerCardTags.tags.showAverageVisionScoreTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showAkariScoreTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showAkariScoreTag: val })
              "
            >
              {{ t('settings.ongoingGame.playerCardTags.tags.showAkariScoreTag.label') }}
            </NCheckbox>
            <NCheckbox
              :checked="ogs.settings.playerCardTags.showAverageKillDamageEfficiencyTag"
              @update:checked="
                (val) =>
                  og.setPlayerCardTags({
                    ...ogs.settings.playerCardTags,
                    showAverageKillDamageEfficiencyTag: val
                  })
              "
            >
              {{
                t(
                  'settings.ongoingGame.playerCardTags.tags.showAverageKillDamageEfficiencyTag.label'
                )
              }}
            </NCheckbox>
          </div>
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
import { NCheckbox, NInputNumber, NRadio, NRadioGroup, NScrollbar, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()
const og = useInstance(OngoingGameRenderer)
</script>
