<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('OngoingGameSettings.titleCommon') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.enabled.label')"
        :label-description="t('OngoingGameSettings.enabled.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="ogs.settings.enabled"
          @update:value="(val) => og.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.autoRouteWhenGameStarts.label')"
        :label-description="t('OngoingGameSettings.autoRouteWhenGameStarts.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="ogs.settings.autoRouteWhenGameStarts"
          @update:value="(val) => og.setAutoRouteWhenGameStarts(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.matchHistoryLoadCount.label')"
        :label-description="t('OngoingGameSettings.matchHistoryLoadCount.description')"
        :label-width="400"
      >
        <NInputNumber
          style="width: 100px"
          size="small"
          :min="2"
          :max="200"
          :step="5"
          :value="ogs.settings.matchHistoryLoadCount"
          @update:value="(val) => og.setMatchHistoryLoadCount(val || 20)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.concurrency.label')"
        :label-description="t('OngoingGameSettings.concurrency.description')"
        :label-width="400"
      >
        <NInputNumber
          style="width: 100px"
          size="small"
          :min="1"
          :value="ogs.settings.concurrency"
          @update:value="(val) => og.setConcurrency(val || 10)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.gameDetailsLoadCount.label')"
        :label-description="
          t('OngoingGameSettings.gameDetailsLoadCount.description', {
            countV: ogs.settings.gameDetailsLoadCount
          })
        "
        :label-width="400"
      >
        <NInputNumber
          style="width: 100px"
          size="small"
          :min="0"
          :value="ogs.settings.gameDetailsLoadCount"
          @update:value="(val) => og.setGameDetailsLoadCount(val || 0)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.matchHistoryTagPreference.label')"
        :label-description="t('OngoingGameSettings.matchHistoryTagPreference.description')"
        :label-width="400"
      >
        <NRadioGroup
          :value="ogs.settings.matchHistoryTagPreference"
          @update:value="(val) => og.setMatchHistoryTagPreference(val)"
        >
          <NRadio value="all">
            {{ t('OngoingGameSettings.matchHistoryTagPreference.options.all') }}</NRadio
          >
          <NRadio value="current">{{
            t('OngoingGameSettings.matchHistoryTagPreference.options.current')
          }}</NRadio>
        </NRadioGroup>
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('OngoingGameSettings.titlePlayerCard') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label-width="400"
        :label="t('OngoingGameSettings.showChampionUsage.label')"
        :label-description="t('OngoingGameSettings.showChampionUsage.description')"
      >
        <NRadioGroup
          :value="ogs.settings.showChampionUsage"
          @update:value="(val) => og.setShowChampionUsage(val)"
        >
          <NRadio value="none">
            {{ t('OngoingGameSettings.showChampionUsage.options.none') }}</NRadio
          >
          <NRadio value="recent">{{
            t('OngoingGameSettings.showChampionUsage.options.recent')
          }}</NRadio>
          <NRadio value="mastery">{{
            t('OngoingGameSettings.showChampionUsage.options.mastery')
          }}</NRadio>
        </NRadioGroup>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label-width="400"
        :label="t('OngoingGameSettings.showMatchHistoryItemBorder.label')"
        :label-description="t('OngoingGameSettings.showMatchHistoryItemBorder.description')"
      >
        <NSwitch
          size="small"
          :value="ogs.settings.showMatchHistoryItemBorder"
          @update:value="(val) => og.setShowMatchHistoryItemBorder(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label-width="400"
        :label="t('OngoingGameSettings.playerCardTags.label')"
        align="start"
        :label-description="t('OngoingGameSettings.playerCardTags.description')"
      >
        <NFlex vertical align="start">
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
                og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showWinningStreakTag: val })
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
            {{
              t('OngoingGameSettings.playerCardTags.tags.showSoloKillsTag.label', {
                countV: ogs.settings.gameDetailsLoadCount
              })
            }}
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
            {{ t('OngoingGameSettings.playerCardTags.tags.showSuspiciousFlashPositionTag.label') }}
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
              t('OngoingGameSettings.playerCardTags.tags.showAverageDamageGoldEfficiencyTag.label')
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
              (val) => og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showTaggedTag: val })
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
              (val) => og.setPlayerCardTags({ ...ogs.settings.playerCardTags, showPrivacyTag: val })
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
            {{ t('OngoingGameSettings.playerCardTags.tags.showAverageEnemyMissingPingsTag.label') }}
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
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useTranslation } from 'i18next-vue'
import {
  NCard,
  NCheckbox,
  NFlex,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NScrollbar,
  NSwitch
} from 'naive-ui'

const { t } = useTranslation()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()
const og = useInstance(OngoingGameRenderer)
</script>

<style scoped>
.unsupported-sgp-server {
  color: rgb(230, 114, 41);
  font-weight: bold;
}
</style>
