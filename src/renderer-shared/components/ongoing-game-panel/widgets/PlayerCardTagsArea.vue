<template>
  <div class="tags">
    <div class="tag self" v-if="isSelf && ogs.settings.playerCardTags.showSelfTag">
      {{ t('PlayerInfoCard.self') }}
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
        <div class="tag tagged">{{ t('PlayerInfoCard.tagged') }}</div>
      </template>
      <div class="tagged-text-list">
        <div class="tagged-item" v-for="tag in sortedTags" :key="tag.selfPuuid">
          <div class="tag-source" v-if="tag.markedBySelf">
            {{ t('PlayerInfoCard.taggedBySelf') }}
          </div>
          <div class="tag-source" v-else>
            <span class="tagged-by-other-text">{{ t('PlayerInfoCard.taggedByOther') }}</span>
            <span
              v-if="ogs.summoner[tag.selfPuuid]"
              class="tagged-by-other-name"
              @click="emits('toSummoner', tag.selfPuuid)"
            >
              {{ riotId(ogs.summoner[tag.selfPuuid]) }}
            </span>
            <span v-else class="tagged-by-other-name unknown">
              {{ t('PlayerInfoCard.unknown') }}
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
          ref="premade-tag-el"
        >
          {{
            t('PlayerInfoCard.premade', {
              team: premadeTeamId
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{ t('PlayerInfoCard.premadePopover', { team: premadeTeamId }) }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      :delay="50"
      v-if="
        ogs.settings.playerCardTags.showWinRateTeamTag &&
        analysis &&
        analysis.summary.count >= 16 &&
        analysis.summary.winRate >= 0.85
      "
    >
      <template #trigger>
        <div class="tag win-rate-team">{{ t('PlayerInfoCard.highWinRate') }}</div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.highWinRatePopover', {
            countV: analysis.summary.count,
            winCount: analysis.summary.wins
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
        <div class="tag have-met">{{ t('PlayerInfoCard.met') }}</div>
      </template>
      <div class="w-min max-w-none text-xs">
        <div class="mb-1 text-gray-900 dark:text-gray-100">
          {{
            t('PlayerInfoCard.metPopover.title', {
              date: dayjs(savedInfo.lastMetAt)
                .locale(as.settings.locale.toLowerCase())
                .format('YYYY-MM-DD HH:mm:ss'),
              countV: savedInfo.encounteredGames.total,
              countV2: savedInfo.encounteredGames.data.length
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
                {{ t('PlayerInfoCard.metPopover.gameId') }}
              </th>
              <th
                class="border border-black/20 px-2 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
              >
                {{ t('PlayerInfoCard.metPopover.date') }}
              </th>
              <th
                class="border border-black/20 px-2 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
              >
                {{ t('PlayerInfoCard.metPopover.gameStats') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in encounteredGames" :key="item.gameId">
              <td
                class="cursor-pointer border border-black/20 px-2 py-0.5 text-center whitespace-nowrap transition-colors hover:text-black/70 dark:border-white/25 dark:text-gray-300 dark:hover:text-white"
                @click="
                  () =>
                    ogs.cachedGames[item.gameId]
                      ? emits('showGame', ogs.cachedGames[item.gameId], puuid)
                      : emits('showGameById', item.gameId, puuid)
                "
              >
                <div
                  class="inline-block rounded bg-black/10 px-1 py-0.5 text-xs leading-3 whitespace-nowrap text-black dark:bg-white/12 dark:text-gray-100"
                >
                  {{
                    t('PlayerInfoCard.metPopover.inspectByGameId', {
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
                      {{ t(`PlayerInfoCard.metPopover.winResult.${item.gameStats.selfWinResult}`) }}
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
                          ? t(`PlayerInfoCard.metPopover.team.teammate`)
                          : t(`PlayerInfoCard.metPopover.team.opponent`)
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
        <div class="tag privacy-private">{{ t('PlayerInfoCard.private') }}</div>
      </template>
      <div class="popover-text">
        {{ t('PlayerInfoCard.privatePopover') }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.settings.playerCardTags.showWinningStreakTag &&
        analysis &&
        analysis.summary.winningStreak >= 3
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag winning-streak">
          {{
            t('PlayerInfoCard.winningStreak', {
              countV: analysis.summary.winningStreak
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.winningStreakPopover', {
            countV: analysis.summary.winningStreak
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.settings.playerCardTags.showLosingStreakTag &&
        analysis &&
        analysis.summary.losingStreak >= 3
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag losing-streak">
          {{
            t('PlayerInfoCard.losingStreak', {
              countV: analysis.summary.losingStreak
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.losingStreakPopover', {
            countV: analysis.summary.losingStreak
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
          {{ t('PlayerInfoCard.akariLoved.extraordinary') }}
        </div>
        <div class="tag akari-loved" v-else-if="analysis.akariScore.outstanding">
          {{ t('PlayerInfoCard.akariLoved.outstanding') }}
        </div>
      </template>
      <div class="popover-text" v-if="analysis.akariScore.extraordinary">
        {{ t('PlayerInfoCard.akariLoved.extraordinaryPopover') }}
      </div>
      <div class="popover-text" v-else-if="analysis.akariScore.outstanding">
        {{ t('PlayerInfoCard.akariLoved.outstandingPopover') }}
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
          {{ t('PlayerInfoCard.suspiciousFlashPosition') }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.suspiciousFlashPositionPopover', {
            dCount: isSuspiciousFlashPosition.flashOnD,
            fCount: isSuspiciousFlashPosition.flashOnF
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
            t('PlayerInfoCard.soloKills', {
              times: analysis.summary.avgSoloKills.toFixed(1)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.soloKillsPopover', {
            times: analysis.summary.avgSoloKills.toFixed(2),
            countV: analysis.summary.count
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
            t('PlayerInfoCard.teamDamageShare', {
              rate: (analysis.summary.avgChampionDamagePercentageOfTeam * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.teamDamageSharePopover', {
            rate: (analysis.summary.avgChampionDamagePercentageOfTeam * 100).toFixed(2),
            countV: analysis.summary.count
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
            t('PlayerInfoCard.teamDamageTakenShare', {
              rate: (analysis.summary.avgDamageTakenPercentageOfTeam * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.teamDamageTakenSharePopover', {
            rate: (analysis.summary.avgDamageTakenPercentageOfTeam * 100).toFixed(2),
            countV: analysis.summary.count
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
            t('PlayerInfoCard.teamGoldShare', {
              rate: (analysis.summary.avgGoldPercentageOfTeam * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.teamGoldSharePopover', {
            rate: (analysis.summary.avgGoldPercentageOfTeam * 100).toFixed(2),
            countV: analysis.summary.count
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
            t('PlayerInfoCard.damageGoldEfficiency', {
              rate: (analysis.summary.avgDamageGoldEfficiency * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.damageGoldEfficiencyPopover', {
            rate: (analysis.summary.avgDamageGoldEfficiency * 100).toFixed(2),
            countV: analysis.summary.count
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
            t('PlayerInfoCard.enemyMissingPings', {
              countV: truncateTailingZeros(analysis.summary.avgEnemyMissingPings)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.enemyMissingPingsPopover', {
            countV: analysis.summary.avgEnemyMissingPings.toFixed(3)
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
            t('PlayerInfoCard.visionScore', {
              countV: truncateTailingZeros(analysis.summary.avgVisionScore)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.visionScorePopover', {
            countV: analysis.summary.avgVisionScore.toFixed(3)
          })
        }}
      </div>
    </NPopover>

    <NPopover
      :keep-alive-on-hover="false"
      v-if="as.settings.isInKyokoMode && ogs.settings.playerCardTags.showAkariScoreTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag akari-loved">Akari {{ analysis.akariScore.total.toFixed(1) }}</div>
      </template>
      <div class="popover-text">
        <div style="font-weight: bold">Akari Score: {{ analysis.akariScore.total.toFixed(1) }}</div>
        <div
          style="
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            row-gap: 2px;
            column-gap: 16px;
            margin-top: 4px;
          "
        >
          <div>Dmg: {{ analysis.akariScore.dmgScore.toFixed(2) }}</div>
          <div>Taken: {{ analysis.akariScore.dmgTakenScore.toFixed(2) }}</div>
          <div>Gold: {{ analysis.akariScore.goldScore.toFixed(2) }}</div>
          <div>CS: {{ analysis.akariScore.csScore.toFixed(2) }}</div>
          <div>K/P: {{ analysis.akariScore.participationScore.toFixed(2) }}</div>
          <div>KDA: {{ analysis.akariScore.kdaScore.toFixed(2) }}</div>
          <div>W/R: {{ analysis.akariScore.winRateScore.toFixed(2) }}</div>
        </div>
      </div>
    </NPopover>
  </div>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { MatchHistoryGamesAnalysisAll } from '@shared/data-adapter/analysis/players'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { formatI18nOrdinal } from '@shared/i18n'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { SavedInfo } from '@shared/types/shards/saved-player'
import { riotId } from '@shared/utils/name'
import { useElementHover } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed, onDeactivated, useTemplateRef, watch } from 'vue'

import { PREMADE_TEAM_COLORS, PREMADE_TEAM_COLORS_LIGHT } from '../ongoing-game-utils'

const { puuid, analysis, premadeTeamId, summoner, savedInfo } = defineProps<{
  puuid: string
  isSelf?: boolean
  premadeTeamId?: string
  currentHighlightingPremadeTeamId?: string | null
  summoner?: SummonerInfo
  analysis?: MatchHistoryGamesAnalysisAll
  savedInfo?: SavedInfo
}>()

const emits = defineEmits<{
  showGame: [game: LcuOrSgpGameSummary, puuid: string]
  showGameById: [gameId: number, puuid: string]
  highlight: [premadeTeamId: string, boolean]
  toSummoner: [puuid: string]
}>()

const { t } = useTranslation()

const ogs = useOngoingGameStore()
const as = useAppCommonStore()

const premadeColors = computed(() => {
  return as.colorTheme === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})

const premadeTagElHovering = useElementHover(useTemplateRef('premade-tag-el'))
watch(
  () => premadeTagElHovering.value,
  (hovering) => {
    if (premadeTeamId) {
      emits('highlight', premadeTeamId, hovering)
    }
  }
)

const isSuspiciousFlashPosition = computed(() => {
  if (!analysis) {
    return null
  }

  return {
    isSuspicious: analysis.summary.flashOnD && analysis.summary.flashOnF,
    flashOnD: analysis.summary.flashOnD,
    flashOnF: analysis.summary.flashOnF
  }
})

const encounteredGames = computed(() => {
  if (!savedInfo) {
    return []
  }

  const mapped = savedInfo.encounteredGames.data.map((record) => {
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

const sortedTags = computed(() => {
  if (!savedInfo) {
    return []
  }

  // make sure self-tagged tags are at the top
  return savedInfo.tags.sort((a, b) => {
    if (a.markedBySelf && !b.markedBySelf) {
      return -1
    }

    return 0
  })
})

const truncateTailingZeros = (num: number, precision = 1) => {
  const str = num.toFixed(precision)
  const trimmed = str.replace(/\.?0+$/, '')
  return trimmed
}

const { masked } = useStreamerModeMaskedText()

onDeactivated(() => {
  if (premadeTeamId) {
    emits('highlight', premadeTeamId, false)
  }
})
</script>

<style scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;

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
