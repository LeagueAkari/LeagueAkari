<template>
  <div class="tags">
    <div class="tag self" v-if="isSelf && ogs.settings.playerCardTags.showSelfTag">
      {{ t('ongoingGame.playerCard.self') }}
    </div>

    <NPopover
      v-if="
        ogs.settings.playerCardTags.showTaggedTag && savedInfo && !isSelf && savedInfo.tags.length
      "
      :delay="50"
      style="max-height: 240px"
      scrollable
    >
      <template #trigger>
        <div class="tag tagged">{{ t('ongoingGame.playerCard.tagged') }}</div>
      </template>
      <div class="tagged-text-list">
        <div class="tagged-item" v-for="tag in sortedTags" :key="tag.selfPuuid">
          <div class="tag-source" v-if="tag.markedBySelf">
            {{ t('ongoingGame.playerCard.taggedBySelf') }}
          </div>
          <div class="tag-source" v-else>
            <span class="tagged-by-other-text">{{
              t('ongoingGame.playerCard.taggedByOther')
            }}</span>
            <span
              v-if="ogs.summoner[tag.selfPuuid]"
              class="tagged-by-other-name"
              @click="navigateToSummonerByPuuid(tag.selfPuuid)"
            >
              {{ riotId(ogs.summoner[tag.selfPuuid]) }}
            </span>
            <span v-else class="tagged-by-other-name unknown">
              {{ t('ongoingGame.playerCard.unknown') }}
            </span>
          </div>
          <div class="tagged-text">
            {{ tag.tag }}
          </div>
        </div>
      </div>
    </NPopover>

    <NPopover
      v-if="ogs.settings.playerCardTags.showPremadeTeamTag && premadeTeamId"
      :delay="50"
      style="max-height: 240px"
    >
      <template #trigger>
        <div
          class="tag"
          :style="{
            backgroundColor: premadeTeamId
              ? premadeColors[premadeTeamId]?.foregroundColor
              : '#ffffff40',
            color: premadeTeamId ? premadeColors[premadeTeamId]?.color || '#fff' : '#fff'
          }"
        >
          {{
            t('ongoingGame.playerCard.premade', {
              team: premadeTeamId
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{ t('ongoingGame.playerCard.premadePopover', { team: premadeTeamId }) }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      :delay="50"
      v-if="
        ogs.settings.playerCardTags.showWinRateTeamTag &&
        analysis &&
        analysis.winLoss.all.count >= 16 &&
        analysis.winLoss.all.winRate >= 0.85
      "
    >
      <template #trigger>
        <div class="tag win-rate-team">{{ t('ongoingGame.playerCard.highWinRate') }}</div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.highWinRatePopover', {
            count: analysis.winLoss.all.count,
            winCount: analysis.winLoss.all.wins
          })
        }}
      </div>
    </NPopover>

    <NPopover
      v-if="ogs.settings.playerCardTags.showMetTag && savedInfo && savedInfo.lastMetAt && !isSelf"
      :delay="50"
      scrollable
      style="max-height: 240px"
    >
      <template #trigger>
        <div class="tag have-met">{{ t('ongoingGame.playerCard.met') }}</div>
      </template>
      <div class="w-min max-w-none text-xs">
        <div class="mb-1 text-gray-900 dark:text-gray-100">
          {{
            t('ongoingGame.playerCard.metPopover.title', {
              date: dayjs(savedInfo.lastMetAt)
                .locale(as.settings.locale.toLowerCase())
                .format('YYYY-MM-DD HH:mm:ss'),
              count: savedInfo.encounteredGames.total
            })
          }}
          <br />
          {{
            t('ongoingGame.playerCard.metPopover.titleNote', {
              count: savedInfo.encounteredGames.data.length
            })
          }}
        </div>
        <table
          class="w-min border-collapse border-spacing-0 border border-black/20 text-xs text-black dark:border-white/25 dark:text-gray-300"
        >
          <colgroup>
            <col style="width: 180px" />
            <col style="width: auto" />
            <col style="width: auto" />
          </colgroup>
          <thead>
            <tr>
              <th
                class="border border-black/20 px-2 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
              >
                {{ t('ongoingGame.playerCard.metPopover.gameId') }}
              </th>
              <th
                class="border border-black/20 px-2 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
              >
                {{ t('ongoingGame.playerCard.metPopover.date') }}
              </th>
              <th
                class="border border-black/20 px-2 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
              >
                {{ t('ongoingGame.playerCard.metPopover.gameStats') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in encounteredGames" :key="item.gameId">
              <td
                class="cursor-pointer border border-black/20 px-2 py-0.5 text-center whitespace-nowrap transition-colors hover:text-black/70 dark:border-white/25 dark:text-gray-300 dark:hover:text-white"
                @click="previewEncounteredGame(item.gameId)"
              >
                <div
                  class="inline-block rounded bg-black/10 px-1 py-0.5 text-xs leading-3 whitespace-nowrap text-black dark:bg-white/12 dark:text-gray-100"
                >
                  {{
                    t('ongoingGame.playerCard.metPopover.inspectByGameId', {
                      gameId: masked(
                        item.gameId.toString(),
                        (index + 1).toString().padStart(6, '●')
                      )
                    })
                  }}
                </div>
              </td>
              <td
                class="border border-black/20 px-2 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
              >
                {{ dayjs(item.updateAt).format('MM-DD HH:mm:ss') }} ({{
                  dayjs(item.updateAt).locale(as.settings.locale.toLowerCase()).fromNow()
                }})
              </td>
              <td
                class="border border-black/20 px-2 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
              >
                <template v-if="item.gameStats">
                  <div class="flex items-center gap-1">
                    <span
                      class="text-xs leading-3 font-bold whitespace-nowrap"
                      :class="{
                        'text-emerald-600 dark:text-emerald-400':
                          item.gameStats.selfWinResult === 'win',
                        'text-red-600 dark:text-red-400': item.gameStats.selfWinResult === 'loss',
                        'text-gray-600 dark:text-gray-400':
                          item.gameStats.selfWinResult === 'abort' ||
                          item.gameStats.selfWinResult === 'remake'
                      }"
                    >
                      {{
                        t(
                          `ongoingGame.playerCard.metPopover.winResult.${item.gameStats.selfWinResult}`
                        )
                      }}
                    </span>
                    <span
                      v-if="item.gameStats.myPlacement"
                      class="text-xs leading-3 font-bold whitespace-nowrap"
                      :class="{
                        'text-emerald-600 dark:text-emerald-400':
                          item.gameStats.selfWinResult === 'win',
                        'text-red-600 dark:text-red-400': item.gameStats.selfWinResult === 'loss',
                        'text-gray-600 dark:text-gray-400':
                          item.gameStats.selfWinResult === 'abort' ||
                          item.gameStats.selfWinResult === 'remake'
                      }"
                    >
                      ({{ formatI18nOrdinal(item.gameStats.myPlacement, as.settings.locale) }})
                    </span>
                    <span
                      class="mr-2 text-xs leading-3 font-bold whitespace-nowrap"
                      :class="{
                        'text-emerald-600 dark:text-emerald-400': item.gameStats.isSameTeam,
                        'text-red-600 dark:text-red-400': !item.gameStats.isSameTeam
                      }"
                    >
                      {{
                        item.gameStats.isSameTeam
                          ? t(`ongoingGame.playerCard.metPopover.team.teammate`)
                          : t(`ongoingGame.playerCard.metPopover.team.opponent`)
                      }}
                    </span>
                    <PositionIcon
                      v-if="item.gameStats.myPosition"
                      class="shrink-0 text-base"
                      :position="item.gameStats.myPosition"
                    />
                    <LcuImage
                      class="h-4 w-4 shrink-0"
                      :src="championIconUri(item.gameStats.myChampionId)"
                    />
                    <div
                      class="flex gap-0.5 text-[11px] whitespace-nowrap text-black/90 dark:text-white/90"
                    >
                      <span>{{ item.gameStats.selfKda.k }}</span>
                      <span>/</span>
                      <span>{{ item.gameStats.selfKda.d }}</span>
                      <span>/</span>
                      <span>{{ item.gameStats.selfKda.a }}</span>
                    </div>
                    <div class="mx-1 h-3 w-px shrink-0 bg-black/20 dark:bg-white/25"></div>
                    <span
                      v-if="item.gameStats.opponentPlacement"
                      class="text-xs leading-3 font-bold whitespace-nowrap"
                      :class="{
                        'text-emerald-600 dark:text-emerald-400':
                          item.gameStats.opponentWinResult === 'win',
                        'text-red-600 dark:text-red-400':
                          item.gameStats.opponentWinResult === 'loss',
                        'text-gray-600 dark:text-gray-400':
                          item.gameStats.opponentWinResult === 'abort' ||
                          item.gameStats.opponentWinResult === 'remake'
                      }"
                    >
                      ({{
                        formatI18nOrdinal(item.gameStats.opponentPlacement, as.settings.locale)
                      }})
                    </span>
                    <PositionIcon
                      v-if="item.gameStats.opponentPosition"
                      class="shrink-0 text-base"
                      :position="item.gameStats.opponentPosition"
                    />
                    <LcuImage
                      class="h-4 w-4 shrink-0"
                      :src="championIconUri(item.gameStats.opponentChampionId)"
                    />
                    <div
                      class="flex gap-0.5 text-[11px] whitespace-nowrap text-black/90 dark:text-white/90"
                    >
                      <span>{{ item.gameStats.opponentKda.k }}</span>
                      <span>/</span>
                      <span>{{ item.gameStats.opponentKda.d }}</span>
                      <span>/</span>
                      <span>{{ item.gameStats.opponentKda.a }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>—</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.settings.playerCardTags.showPrivacyTag && summoner?.privacy === 'PRIVATE'"
      :delay="50"
    >
      <template #trigger>
        <div class="tag privacy-private">{{ t('ongoingGame.playerCard.private') }}</div>
      </template>
      <div class="popover-text">
        {{ t('ongoingGame.playerCard.privatePopover') }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.settings.playerCardTags.showWinningStreakTag &&
        analysis &&
        analysis.winLoss.all.winningStreak >= 3
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag winning-streak">
          {{
            t('ongoingGame.playerCard.winningStreak', {
              count: analysis.winLoss.all.winningStreak
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.winningStreakPopover', {
            count: analysis.winLoss.all.winningStreak
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.settings.playerCardTags.showLosingStreakTag &&
        analysis &&
        analysis.winLoss.all.losingStreak >= 3
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag losing-streak">
          {{
            t('ongoingGame.playerCard.losingStreak', {
              count: analysis.winLoss.all.losingStreak
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.losingStreakPopover', {
            count: analysis.winLoss.all.losingStreak
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.settings.playerCardTags.showGreatPerformanceTag &&
        analysis &&
        (analysis.akariScore.outstanding || analysis.akariScore.extraordinary)
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag akari-loved" v-if="analysis.akariScore.extraordinary">
          {{ t('ongoingGame.playerCard.akariLoved.extraordinary') }}
        </div>
        <div class="tag akari-loved" v-else-if="analysis.akariScore.outstanding">
          {{ t('ongoingGame.playerCard.akariLoved.outstanding') }}
        </div>
      </template>
      <div class="popover-text">
        <div v-if="analysis.akariScore.extraordinary">
          {{ t('ongoingGame.playerCard.akariLoved.extraordinaryPopover') }}
        </div>
        <div v-else-if="analysis.akariScore.outstanding">
          {{ t('ongoingGame.playerCard.akariLoved.outstandingPopover') }}
        </div>
        <AkariScorePopoverContent
          class="mt-2 border-t border-black/10 pt-2 dark:border-white/10"
          :score="analysis.akariScore"
          :total-precision="1"
        />
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.settings.playerCardTags.showSuspiciousFlashPositionTag &&
        isSuspiciousFlashPosition &&
        isSuspiciousFlashPosition.isSuspicious
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag sus-flash">
          {{ t('ongoingGame.playerCard.suspiciousFlashPosition') }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.suspiciousFlashPositionPopover', {
            dCount: isSuspiciousFlashPosition.flashOnD,
            fCount: isSuspiciousFlashPosition.flashOnF
          })
        }}
      </div>
    </NPopover>

    <NPopover :keep-alive-on-hover="false" v-if="easyGankTag" :delay="50">
      <template #trigger>
        <div class="tag" :class="easyGankTag.className">{{ t(easyGankTag.labelKey) }}</div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.easyGankPopover', {
            times: easyGankTag.times.toFixed(2),
            count: easyGankTag.count
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.settings.playerCardTags.showSoloKillsTag && analysis?.summary.avgSoloKills"
      :delay="50"
    >
      <template #trigger>
        <div class="tag too-many-solo-kills">
          {{
            t('ongoingGame.playerCard.soloKills', {
              times: analysis.summary.avgSoloKills.toFixed(1)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.soloKillsPopover', {
            times: analysis.summary.avgSoloKills.toFixed(2),
            count: analysis.count
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.settings.playerCardTags.showAverageTeamDamageTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag team-damage-share">
          {{
            t('ongoingGame.playerCard.teamDamageShare', {
              rate: (analysis.summary.avgChampionDamagePercentageOfTeam * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.teamDamageSharePopover', {
            rate: (analysis.summary.avgChampionDamagePercentageOfTeam * 100).toFixed(2),
            count: analysis.count
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.settings.playerCardTags.showAverageTeamDamageTakenTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag team-damage-taken-share">
          {{
            t('ongoingGame.playerCard.teamDamageTakenShare', {
              rate: (analysis.summary.avgDamageTakenPercentageOfTeam * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.teamDamageTakenSharePopover', {
            rate: (analysis.summary.avgDamageTakenPercentageOfTeam * 100).toFixed(2),
            count: analysis.count
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.settings.playerCardTags.showAverageTeamGoldTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag team-gold-share">
          {{
            t('ongoingGame.playerCard.teamGoldShare', {
              rate: (analysis.summary.avgGoldPercentageOfTeam * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.teamGoldSharePopover', {
            rate: (analysis.summary.avgGoldPercentageOfTeam * 100).toFixed(2),
            count: analysis.count
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.settings.playerCardTags.showAverageDamageGoldEfficiencyTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag damage-gold-efficiency">
          {{
            t('ongoingGame.playerCard.damageGoldEfficiency', {
              rate: (analysis.summary.avgDamageGoldEfficiency * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.damageGoldEfficiencyPopover', {
            rate: (analysis.summary.avgDamageGoldEfficiency * 100).toFixed(2),
            count: analysis.count
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.settings.playerCardTags.showAverageEnemyMissingPingsTag &&
        analysis &&
        analysis.summary.avgEnemyMissingPings !== null
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag enemy-missing-pings">
          {{
            t('ongoingGame.playerCard.enemyMissingPings', {
              count: truncateTailingZeros(analysis.summary.avgEnemyMissingPings)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.enemyMissingPingsPopover', {
            count: analysis.summary.avgEnemyMissingPings.toFixed(3)
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.settings.playerCardTags.showAverageVisionScoreTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag vision-score">
          {{
            t('ongoingGame.playerCard.visionScore', {
              count: truncateTailingZeros(analysis.summary.avgVisionScore)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('ongoingGame.playerCard.visionScorePopover', {
            count: analysis.summary.avgVisionScore.toFixed(3)
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.settings.playerCardTags.showAverageKillDamageEfficiencyTag &&
        analysis &&
        killDamageEfficiencyTag &&
        killDamageEfficiencyTag.kind !== 'normal'
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag kill-damage-efficiency">
          <template v-if="killDamageEfficiencyTag.kind === 'high'">{{
            t('ongoingGame.playerCard.killDamageEfficiencyHigh')
          }}</template>
          <template v-else-if="killDamageEfficiencyTag.kind === 'low'">{{
            t('ongoingGame.playerCard.killDamageEfficiencyLow')
          }}</template>
        </div>
      </template>
      <div class="popover-text">
        <template v-if="killDamageEfficiencyTag.kind === 'high'">{{
          t('ongoingGame.playerCard.killDamageEfficiencyHighPopover', {
            rate: (killDamageEfficiencyTag.value * 100).toFixed(2),
            count: analysis.count
          })
        }}</template>
        <template v-else-if="killDamageEfficiencyTag.kind === 'low'">{{
          t('ongoingGame.playerCard.killDamageEfficiencyLowPopover', {
            rate: (killDamageEfficiencyTag.value * 100).toFixed(2),
            count: analysis.count
          })
        }}</template>
      </div>
    </NPopover>

    <AkariScorePopover
      v-if="ogs.settings.playerCardTags.showAkariScoreTag && analysis"
      :score="analysis.akariScore"
      :total-precision="1"
    >
      <div class="tag akari-loved">Akari {{ analysis.akariScore.total.toFixed(2) }}</div>
    </AkariScorePopover>
  </div>
</template>

<script lang="ts" setup>
import {
  AkariScorePopover,
  AkariScorePopoverContent
} from '@renderer-shared/components/akari-score'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { formatI18nOrdinal } from '@shared/i18n'
import { riotId } from '@shared/utils/name'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import { PREMADE_TEAM_COLORS, PREMADE_TEAM_COLORS_LIGHT } from '../../constants'
import { useOngoingGamePanel } from '../../context'
import { SUMMONER_SPELL_SMITE_ID } from '@shared/constants/summoner-spells'

const { puuid } = defineProps<{
  puuid: string
}>()

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const ogs = useOngoingGameStore()
const as = useAppCommonStore()

const { mergedPremadeTeams, previewGame, navigateToSummonerByPuuid } = useOngoingGamePanel()

const premadeColors = computed(() => {
  return as.colorTheme === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})

const analysis = computed(() => {
  if (!ogs.analysis?.players[puuid]) {
    return null
  }

  return ogs.analysis.players[puuid]
})

const summoner = computed(() => ogs.summoner[puuid])
const savedInfo = computed(() => ogs.savedInfo[puuid])

const premadeTeamId = computed(() => mergedPremadeTeams.value.premadeTeamIdMap[puuid])

const isCurrentJungler = computed(() => {
  const assignedPosition = ogs.positionAssignments[puuid]?.position?.toUpperCase()

  if (assignedPosition === 'JUNGLE') {
    return true
  }

  const spells = ogs.additional.spells[puuid]

  return (
    spells?.spell1Id === SUMMONER_SPELL_SMITE_ID || spells?.spell2Id === SUMMONER_SPELL_SMITE_ID
  )
})

const easyGankTag = computed<{
  className: 'hard-gank' | 'gankable' | 'easy-gank' | 'very-easy-gank'
  labelKey:
    | 'ongoingGame.playerCard.hardGank'
    | 'ongoingGame.playerCard.gankable'
    | 'ongoingGame.playerCard.easyGank'
    | 'ongoingGame.playerCard.veryEasyGank'
  times: number
  count: number
} | null>(() => {
  if (isCurrentJungler.value || !analysis.value) {
    return null
  }

  if (!analysis.value.details) {
    return null
  }

  const times = analysis.value.details.avgEarlyDeathsWithEnemyJunglerInvolved

  if (times === null) {
    return null
  }

  if (times > 2) {
    return {
      className: 'very-easy-gank',
      labelKey: 'ongoingGame.playerCard.veryEasyGank',
      times,
      count: analysis.value.detailsCount
    }
  }

  if (times >= 1.5) {
    return {
      className: 'easy-gank',
      labelKey: 'ongoingGame.playerCard.easyGank',
      times,
      count: analysis.value.detailsCount
    }
  }

  if (times >= 1) {
    return {
      className: 'gankable',
      labelKey: 'ongoingGame.playerCard.gankable',
      times,
      count: analysis.value.detailsCount
    }
  }

  return {
    className: 'hard-gank',
    labelKey: 'ongoingGame.playerCard.hardGank',
    times,
    count: analysis.value.detailsCount
  }
})

const isSuspiciousFlashPosition = computed(() => {
  if (!analysis.value) {
    return null
  }

  return {
    isSuspicious: analysis.value.spells.flashOnD && analysis.value.spells.flashOnF,
    flashOnD: analysis.value.spells.flashOnD,
    flashOnF: analysis.value.spells.flashOnF
  }
})

const encounteredGames = computed(() => {
  if (!savedInfo.value) {
    return []
  }

  const mapped = savedInfo.value.encounteredGames.data.map((record) => {
    const game = ogs.cachedGames[record.gameId]

    if (!game) {
      return { gameStats: null, ...record }
    }

    const basicInfo = toBasicInfo(game)
    const participants = toParticipants(game, basicInfo)

    const s = participants.find((p) => p.puuid === record.selfPuuid)
    const h = participants.find((p) => p.puuid === record.puuid)

    if (!s || !h) {
      return { gameStats: null, ...record }
    }

    // for cherry mode, all players are placed in the same team
    const isSameTeam = basicInfo.isCherrySubteam
      ? s.playerSubteamId === h.playerSubteamId
      : s.teamId === h.teamId

    return {
      gameStats: {
        gameId: game.gameId,
        myChampionId: s.championId,
        opponentChampionId: h.championId,
        myPosition: s.position,
        opponentPosition: h.position,
        selfWinResult: s.winResult,
        opponentWinResult: h.winResult,
        selfKda: { k: s.kills, d: s.deaths, a: s.assists },
        opponentKda: { k: h.kills, d: h.deaths, a: h.assists },
        isSameTeam,
        date: basicInfo.gameCreation,
        mode: basicInfo.gameMode,
        myPlacement: s.subteamPlacement,
        opponentPlacement: h.subteamPlacement
      },
      ...record
    }
  })

  return mapped
})

const killDamageEfficiencyTag = computed(() => {
  if (!analysis.value) {
    return null
  }

  const kde = analysis.value.summary.avgKillDamageEfficiency

  if (kde > 1.2) {
    return {
      kind: 'high',
      value: kde
    }
  }

  if (kde < 0.8) {
    return {
      kind: 'low',
      value: kde
    }
  }

  return {
    kind: 'normal',
    value: kde
  }
})

const previewEncounteredGame = (gameId: number) => {
  const summary = ogs.cachedGames[gameId]

  previewGame(
    summary
      ? {
          summary,
          details: ogs.gameDetails[gameId],
          puuid
        }
      : {
          summary: gameId,
          puuid
        }
  )
}

const sortedTags = computed(() => {
  if (!savedInfo.value) {
    return []
  }

  // make sure self-tagged tags are at the top
  return savedInfo.value.tags.sort((a, b) => {
    if (a.markedBySelf && !b.markedBySelf) {
      return -1
    }

    return 0
  })
})

const isSelf = computed(() => puuid === lcs.summoner.me?.puuid)

const truncateTailingZeros = (num: number, precision = 1) => {
  const str = num.toFixed(precision)
  const trimmed = str.replace(/\.?0+$/, '')
  return trimmed
}

const { masked } = useStreamerModeMaskedText()
</script>

<style scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;

  .full-row-item {
    flex: 1 0 100%;
    width: 100%;
  }

  .tag {
    font-size: 11px;
    line-height: 11px;
    color: #ffffff;
    padding: 2px 4px;
    border-radius: 2px;

    &.tagged {
      background-color: #49914d;
    }

    &.primary {
      background-color: #5b4694;
    }

    &.win-rate-team {
      background-color: #7e2c85;
    }

    &.have-met {
      background-color: #5cacea;
      color: #000;
    }

    &.privacy-private {
      background-color: #870808;
    }

    &.winning-streak {
      background-color: #18571c;
      color: #fff;
    }

    &.losing-streak {
      background-color: #893b3b;
    }

    &.akari-loved {
      color: #ffffff;
      background-color: #b81b86;
    }

    &.sus-flash {
      color: #ffffff;
      background-color: #3a1bb8;
    }

    &.too-many-solo-deaths {
      color: #ffffff;
      background-color: #a81919;
    }

    &.too-many-solo-kills {
      color: #ffffff;
      background-color: #9019a8;
    }

    &.easy-gank {
      color: #ffffff;
      background-color: #8f541e;
    }

    &.hard-gank {
      color: #ffffff;
      background-color: #24606d;
    }

    &.gankable {
      color: #ffffff;
      background-color: #64732a;
    }

    &.very-easy-gank {
      color: #ffffff;
      background-color: #a81919;
    }

    &.self {
      background-color: #37246c;
    }

    &.team-damage-share {
      background-color: #692723;
    }

    &.team-damage-taken-share {
      background-color: #135225;
    }

    &.team-gold-share {
      background-color: #a73d2a;
    }

    &.damage-gold-efficiency {
      background-color: #8f411e;
    }

    &.enemy-missing-pings {
      background-color: #e7da30;
      color: #000;
    }

    &.vision-score {
      background-color: #2451a6;
    }

    &.kill-damage-efficiency {
      background-color: #04614b;
    }
  }
}

.popover-text {
  font-size: 12px;
  max-width: 240px;
}

.tagged-text-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .tagged-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tag-source {
    display: flex;
    gap: 4px;
    font-size: 12px;

    .tagged-by-other-text {
      color: #ffffff80;
    }

    .tagged-by-other-name {
      font-weight: bold;
      color: #ffffff;
      cursor: pointer;

      &.unknown {
        color: #ffffff80;
      }
    }
  }

  .tagged-text {
    font-size: 12px;
    white-space: pre-wrap;
    max-width: 260px;
  }
}
</style>
