<template>
  <div class="player-page">
    <PlayerTagEditModal
      :puuid="tab.puuid"
      :summoner="tab.summoner"
      :tags="tab.tags"
      v-model:show="isShowingTagEditModal"
      @submit="(id) => handleTagEdited(id)"
    />
    <NModal v-model:show="isShowingRankedModal">
      <div class="ranked-modal">
        <div class="blocks">
          <RankedDisplay
            v-for="r of tab.rankedStats?.queueMap"
            :key="r.queueType"
            class="ranked"
            :ranked-entry="r"
          />
        </div>
        <RankedTable v-if="tab.rankedStats" :ranked-stats="tab.rankedStats" />
      </div>
    </NModal>

    <!-- Floating header -->
    <Transition name="bi-fade">
      <div class="player-header-simplified" v-if="shouldShowTinyHeader">
        <div class="header-simplified-inner">
          <LcuImage
            class="small-profile-icon"
            :src="tab.summoner ? profileIconUri(tab.summoner.profileIconId) : undefined"
          />
          <span class="small-game-name">{{ tab.summoner?.gameName }}</span>
          <span class="small-tag-line">#{{ tab.summoner?.tagLine }}</span>
          <div class="header-simplified-actions">
            <NButton
              round
              class="header-button"
              size="small"
              :title="t('MatchHistoryTab.prevPage')"
              @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 2) - 1)"
              :disabled="
                !tab.matchHistoryPage || tab.matchHistoryPage.page <= 1 || tab.isLoadingMatchHistory
              "
              tertiary
            >
              <template #icon>
                <NIcon><NavigateBeforeOutlinedIcon /></NIcon>
              </template>
            </NButton>
            <NButton
              :title="t('MatchHistoryTab.nextPage')"
              size="small"
              round
              class="header-button"
              @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 1) + 1)"
              :disabled="!tab.matchHistoryPage || tab.isLoadingMatchHistory"
              tertiary
            >
              <template #icon>
                <NIcon><NavigateNextOutlinedIcon /></NIcon>
              </template>
            </NButton>
            <NButton
              tertiary
              class="header-button"
              :title="t('MatchHistoryTab.refreshPage')"
              size="small"
              round
              :loading="isSomethingLoading"
              @click="() => handleRefresh()"
            >
              <template #icon>
                <NIcon><RefreshIcon /></NIcon>
              </template>
            </NButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main content -->
    <NScrollbar x-scrollable ref="scroll" @scroll="(e) => handleMainContentScroll(e)">
      <div class="inner-container" ref="inner-container">
        <div class="profile">
          <!-- Profile -->
          <div class="header-profile">
            <div class="profile-image">
              <LcuImage
                class="profile-image-icon"
                :src="tab.summoner ? profileIconUri(tab.summoner.profileIconId) : undefined"
              />
              <div class="profile-image-lv" v-if="tab.summoner">
                {{ tab.summoner.summonerLevel }}
              </div>
            </div>
            <div class="profile-name">
              <div class="game-name-line">
                <StreamerModeMaskedText>
                  <template #masked>
                    <span class="game-name">{{ maskedSummonerName(tab.puuid, index) }}</span>
                  </template>
                  <CopyableText
                    class="game-name"
                    :class="{ 'long-name': tab.summoner && tab.summoner.gameName.length >= 12 }"
                    :text="summonerName(tab.summoner?.gameName, tab.summoner?.tagLine, '-')"
                  >
                    <NTooltip
                      placement="bottom"
                      :disabled="!tab.summoner || !tab.summoner.displayName"
                    >
                      <template #trigger>
                        {{ tab.summoner?.gameName || '-' }}
                      </template>
                      <CopyableText :text="tab.summoner?.displayName">
                        {{ t('MatchHistoryTab.previousName', { name: tab.summoner?.displayName }) }}
                      </CopyableText>
                    </NTooltip>
                  </CopyableText>
                </StreamerModeMaskedText>
                <NPopover v-if="tab.spectatorData && isSmallScreen" display-directive="show">
                  <template #trigger>
                    <IndicatorPulse />
                  </template>
                  <div style="width: 256px">
                    <SpectateStatus
                      :is-cross-region="!isOnSelfSgpServer"
                      :sgp-server-id="tab.sgpServerId"
                      :data="tab.spectatorData"
                      :puuid="tab.puuid"
                      @to-summoner="(puuid) => handleToSummoner(puuid)"
                      @launch-spectator="handleLaunchSpectator"
                    />
                  </div>
                </NPopover>
              </div>
              <StreamerModeMaskedText>
                <template #masked>
                  <span class="tag-line">#####</span>
                </template>
                <span class="tag-line">#{{ tab.summoner?.tagLine || '-' }}</span>
              </StreamerModeMaskedText>
            </div>
          </div>

          <!-- Ranked stats -->
          <div class="header-ranked" v-if="tab.rankedStats">
            <RankedDisplay
              class="ranked"
              :small="isSmallScreen"
              :ranked-entry="tab.rankedStats?.queueMap['RANKED_SOLO_5x5']"
            />
            <RankedDisplay
              class="ranked"
              :small="isSmallScreen"
              :ranked-entry="tab.rankedStats?.queueMap['RANKED_FLEX_SR']"
            />
            <div class="ranked-more">
              <NButton
                :focusable="false"
                :title="t('MatchHistoryTab.rankedMore')"
                size="small"
                secondary
                @click="isShowingRankedModal = true"
              >
                <template #icon>
                  <MoreHorizFilledIcon />
                </template>
              </NButton>
            </div>
          </div>

          <!-- Refresh, Tag, ... -->
          <div class="buttons-container">
            <NButton
              secondary
              class="square-button"
              :title="t('MatchHistoryTab.tagPlayer')"
              @click="handleTagPlayer"
              v-if="!isSelfTab && isOnSelfSgpServer"
            >
              <template #icon>
                <NIcon><EditIcon /></NIcon>
              </template>
            </NButton>
            <NButton
              secondary
              class="square-button"
              :title="t('MatchHistoryTab.refreshPage')"
              :loading="isSomethingLoading"
              @click="handleRefresh"
            >
              <template #icon>
                <NIcon><RefreshIcon /></NIcon>
              </template>
            </NButton>
          </div>
        </div>

        <!-- Shows on smaller screen -->
        <div class="show-on-smaller-screen">
          <NInputNumber
            size="small"
            placeholder=""
            style="width: 48px"
            v-model:value="inputtingPage"
            @blur="handleInputBlur"
            @keyup.enter="() => handleLoadMatchHistoryPage(inputtingPage || 1)"
            :disabled="tab.isLoadingMatchHistory"
            :min="1"
            :show-button="false"
          />
          <NButton
            size="small"
            :title="t('MatchHistoryTab.prevPage')"
            @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 2) - 1)"
            :disabled="
              !tab.matchHistoryPage || tab.matchHistoryPage.page <= 1 || tab.isLoadingMatchHistory
            "
            secondary
            >{{ t('MatchHistoryTab.prevPage') }}</NButton
          >
          <NButton
            :title="t('MatchHistoryTab.nextPage')"
            size="small"
            @click="() => handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 1) + 1)"
            :disabled="tab.isLoadingMatchHistory"
            secondary
            >{{ t('MatchHistoryTab.nextPage') }}</NButton
          >
          <NSelect
            :value="tab.matchHistoryPage?.pageSize"
            @update:value="handleChangePageSize"
            :disabled="tab.isLoadingMatchHistory"
            class="page-select"
            size="small"
            style="width: 108px"
            :options="pageSizeOptions"
            :consistent-menu-width="false"
          ></NSelect>
          <NSelect
            v-if="mhs.settings.matchHistoryUseSgpApi && currentSgpServerSupported.matchHistory"
            size="small"
            :value="tab.matchHistoryPage?.tag || 'all'"
            style="width: 160px"
            @update:value="handleChangeSgpTag"
            :disabled="tab.isLoadingMatchHistory"
            :options="sgpTagOptions"
          ></NSelect>
        </div>

        <!-- Main content -->
        <div class="content">
          <div class="left">
            <!-- Pagination -->
            <div class="left-content-item">
              <div class="left-content-item-content">
                <div style="display: flex; gap: 4px">
                  <NInputNumber
                    size="small"
                    placeholder=""
                    style="flex: 1"
                    v-model:value="inputtingPage"
                    @blur="handleInputBlur"
                    @keyup.enter="() => handleLoadMatchHistoryPage(inputtingPage || 1)"
                    :disabled="tab.isLoadingMatchHistory"
                    :min="1"
                    :show-button="false"
                  />
                  <NButton
                    size="small"
                    :title="t('MatchHistoryTab.prevPage')"
                    @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 2) - 1)"
                    :disabled="
                      !tab.matchHistoryPage ||
                      tab.matchHistoryPage.page <= 1 ||
                      tab.isLoadingMatchHistory
                    "
                    secondary
                    >{{ t('MatchHistoryTab.prevPage') }}</NButton
                  >
                  <NButton
                    :title="t('MatchHistoryTab.nextPage')"
                    size="small"
                    @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 1) + 1)"
                    :disabled="!tab.matchHistoryPage || tab.isLoadingMatchHistory"
                    secondary
                    >{{ t('MatchHistoryTab.nextPage') }}</NButton
                  >
                  <NSelect
                    :value="tab.matchHistoryPage?.pageSize"
                    @update:value="handleChangePageSize"
                    :disabled="tab.isLoadingMatchHistory"
                    class="page-select"
                    size="small"
                    placeholder=""
                    style="width: 86px"
                    :consistent-menu-width="false"
                    :options="pageSizeOptions"
                  ></NSelect>
                </div>
                <NSelect
                  v-if="
                    currentSgpServerSupported.matchHistory && mhs.settings.matchHistoryUseSgpApi
                  "
                  size="small"
                  :value="tab.matchHistoryPage?.tag"
                  @update:value="handleChangeSgpTag"
                  :disabled="tab.isLoadingMatchHistory"
                  style="margin-top: 8px"
                  :options="sgpTagOptions"
                ></NSelect>
              </div>
            </div>

            <!-- Shows when a summoner is private -->
            <div
              class="left-content-item privacy-private"
              v-if="!isSelfTab && tab.summoner && tab.summoner.privacy === 'PRIVATE'"
            >
              <div class="left-content-item-title">{{ t('MatchHistoryTab.private.title') }}</div>
              <div class="left-content-item-content">
                {{ t('MatchHistoryTab.private.content') }}
              </div>
            </div>

            <!-- Shows when a summoner is tagged -->
            <div
              v-for="tagInfo of tab.tags"
              :key="tagInfo.selfPuuid"
              class="left-content-item tagged-player"
            >
              <div class="left-content-item-title">
                <span> {{ t('MatchHistoryTab.tagged.title') }}</span>
                <span
                  v-if="!tagInfo.markedBySelf"
                  class="marked-by-other"
                  @click="handleToSummoner(tagInfo.selfPuuid)"
                >
                  {{ t('MatchHistoryTab.tagged.taggedByOther') }}
                </span>
                <NPopconfirm
                  type="warning"
                  @positive-click="handleRemoveTag(tagInfo.puuid, tagInfo.selfPuuid)"
                >
                  <template #trigger>
                    <NIcon class="remove-tag">
                      <DeleteIcon />
                    </NIcon>
                  </template>
                  {{ t('MatchHistoryTab.tagged.deletePopconfirm') }}
                </NPopconfirm>
              </div>
              <NScrollbar class="tagged-player-n-scrollbar">
                <div class="left-content-item-content">{{ tagInfo.tag }}</div>
              </NScrollbar>
            </div>

            <!-- In-game spectator status -->
            <div
              class="left-content-item"
              v-if="currentSgpServerSupported.common && tab.spectatorData"
            >
              <SpectateStatus
                :is-cross-region="!isOnSelfSgpServer"
                :sgp-server-id="tab.sgpServerId"
                :data="tab.spectatorData"
                :puuid="tab.puuid"
                @to-summoner="(puuid, setCurrent) => handleToSummoner(puuid, setCurrent)"
                @launch-spectator="handleLaunchSpectator"
              />
            </div>

            <!-- Statistics -->
            <div class="left-content-item" v-if="analysis.matchHistory">
              <div class="left-content-item-title">{{ t('MatchHistoryTab.stats.title') }}</div>
              <div class="left-content-item-content">
                <div class="stat-item" v-if="as.settings.isInKyokoMode" title="Akari's insight">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.akariScore') }}</span>
                  <span class="stat-item-content" :class="{ 'n-a': analysis.akariScore === null }">
                    <template v-if="analysis.akariScore !== null">
                      <LeagueAkariSpan bold :text="analysis.akariScore.total.toFixed(2)" />
                    </template>
                    <template v-else>{{ t('MatchHistoryTab.stats.na') }}</template>
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgKda') }}</span>
                  <NPopover>
                    <template #trigger>
                      <span class="stat-item-content">{{
                        analysis.matchHistory.summary.averageKda.toFixed(2)
                      }}</span>
                    </template>
                    {{ analysis.matchHistory.summary.totalKills }} /
                    {{ analysis.matchHistory.summary.totalDeaths }} /
                    {{ analysis.matchHistory.summary.totalAssists }}
                  </NPopover>
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgKp') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (analysis.matchHistory.summary.averageKillParticipationRate * 100).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgDmg') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (
                        analysis.matchHistory.summary.averageDamageDealtToChampionShareOfTeam * 100
                      ).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgDmgTaken') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (analysis.matchHistory.summary.averageDamageTakenShareOfTeam * 100).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgGold') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (analysis.matchHistory.summary.averageGoldShareOfTeam * 100).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgCs') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (analysis.matchHistory.summary.averageCsShareOfTeam * 100).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.winLose') }}</span>
                  <span class="stat-item-content"
                    >{{ analysis.matchHistory.summary.win }} {{ t('MatchHistoryTab.stats.win') }}
                    {{ analysis.matchHistory.summary.lose }}
                    {{ t('MatchHistoryTab.stats.lose') }} ({{
                      (analysis.matchHistory.summary.winRate * 100).toFixed()
                    }}
                    %)
                  </span>
                </div>
                <div class="stat-item" v-if="frequentlyUsedChampions.length">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.champions') }}</span>
                  <div class="stat-item-content-champions">
                    <NPopover
                      v-for="c of frequentlyUsedChampions"
                      :key="c.id"
                      :delay="50"
                      :keep-alive-on-hover="false"
                    >
                      <template #trigger>
                        <div class="champion-slot">
                          <LcuImage
                            style="width: 100%; height: 100%"
                            :src="championIconUri(c.id)"
                          />
                          <div class="champion-used-count">{{ c.count }}</div>
                        </div>
                      </template>
                      <div class="stat-item-content-champion">
                        <div>
                          {{ lcs.gameData.champions[c.id]?.name }} · {{ c.count }}
                          {{ t('MatchHistoryTab.stats.times') }}
                        </div>
                        <div class="win-lose-box">
                          <span class="win">{{ c.win }} {{ t('MatchHistoryTab.stats.win') }}</span>
                          <span class="lose"
                            >{{ c.lose }} {{ t('MatchHistoryTab.stats.lose') }}</span
                          >
                          <span
                            >({{ t('MatchHistoryTab.stats.wr') }}
                            {{ (c.winRate * 100).toFixed() }} %)</span
                          >
                        </div>
                      </div>
                    </NPopover>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recently played with -->
            <div class="left-content-item" v-if="recentlyPlayers.teammates.length">
              <div class="left-content-item-title">
                {{ t('MatchHistoryTab.recentPlayers.teammatesTitle') }}
              </div>
              <div class="left-content-item-content">
                <div
                  class="recently-played-item"
                  v-for="(p, index) of recentlyPlayers.teammates"
                  :key="p.targetPuuid"
                >
                  <LcuImage
                    style="width: 18px; height: 18px"
                    :src="profileIconUri(p.targetProfileIconId)"
                  />
                  <div
                    class="name-and-tag"
                    @click="() => handleToSummoner(p.targetPuuid)"
                    @mouseup.prevent="(event) => handleMouseUp(event, p.targetPuuid)"
                    @mousedown="handleMouseDown"
                  >
                    <StreamerModeMaskedText>
                      <template #masked>
                        <span class="game-name-line">{{
                          maskedSummonerName(p.targetPuuid, index)
                        }}</span>
                      </template>
                      <span class="game-name-line">{{ p.targetGameName }}</span>
                      <span class="tag-line">#{{ p.targetTagLine }}</span>
                    </StreamerModeMaskedText>
                  </div>
                  <span class="win-or-lose"
                    >{{ p.win }} {{ t('MatchHistoryTab.recentPlayers.win') }} {{ p.lose }}
                    {{ t('MatchHistoryTab.recentPlayers.lose') }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Recently played against -->
            <div class="left-content-item" v-if="recentlyPlayers.opponents.length">
              <div class="left-content-item-title">
                {{ t('MatchHistoryTab.recentPlayers.opponentsTitle') }}
              </div>
              <div class="left-content-item-content">
                <div
                  class="recently-played-item"
                  v-for="(p, index) of recentlyPlayers.opponents"
                  :key="p.targetPuuid"
                >
                  <LcuImage
                    style="width: 18px; height: 18px"
                    :src="profileIconUri(p.targetProfileIconId)"
                  />
                  <div
                    class="name-and-tag"
                    @click="() => handleToSummoner(p.targetPuuid)"
                    @mouseup.prevent="(event) => handleMouseUp(event, p.targetPuuid)"
                    @mousedown="handleMouseDown"
                  >
                    <StreamerModeMaskedText>
                      <template #masked>
                        <span class="game-name-line">{{
                          maskedSummonerName(
                            p.targetPuuid,
                            index + recentlyPlayers.teammates.length
                          )
                        }}</span>
                      </template>
                      <span class="game-name-line">{{ p.targetGameName }}</span>
                      <span class="tag-line">#{{ p.targetTagLine }}</span>
                    </StreamerModeMaskedText>
                  </div>
                  <span class="win-or-lose"
                    >{{ p.win }} {{ t('MatchHistoryTab.recentPlayers.win') }} {{ p.lose }}
                    {{ t('MatchHistoryTab.recentPlayers.lose') }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Encountered games -->
            <div class="left-content-item" v-if="!isSelfTab">
              <EncounteredGames
                :data="tab.encounteredGamesPage?.data"
                :page="tab.encounteredGamesPage?.page"
                :page-size="tab.encounteredGamesPage?.pageSize"
                :total="tab.encounteredGamesPage?.total"
                :loading="tab.isLoadingEncounteredGames"
                @page-change="loadEncounteredGames"
              />
            </div>
          </div>

          <!-- Right part -->
          <div class="right" ref="right">
            <MatchHistoryCard
              class="match-history-card-item"
              @set-show-detailed-game="handleToggleShowDetailedGame"
              @load-detailed-game="(_) => loadDetailedGame(g)"
              @to-summoner="(puuid, setCurrent) => handleToSummoner(puuid, setCurrent)"
              :self-puuid="tab.puuid"
              :is-detailed="g.isDetailed"
              :is-loading="g.isLoading"
              :is-expanded="g.isExpanded"
              :game="g.game"
              v-for="g of tab.matchHistoryPage?.games"
              :key="g.game.gameId"
            />
            <div
              class="match-history-empty-placeholder"
              v-if="!tab.matchHistoryPage || tab.matchHistoryPage.games.length === 0"
            >
              <NSpin v-if="tab.isLoadingMatchHistory" />
              <span v-else>{{ t('MatchHistoryTab.matchHistory.empty') }}</span>
            </div>
          </div>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
// ============================================================================
// IMPORTS - 导入语句
// ============================================================================
// Vue imports
// Shared component imports
import CopyableText from '@renderer-shared/components/CopyableText.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import RankedTable from '@renderer-shared/components/RankedTable.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import MatchHistoryCard from '@renderer-shared/components/match-history-card/MatchHistoryCard.vue'
// Composition imports
import { useSgpTagOptions } from '@renderer-shared/compositions/useSgpTagOptions'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
// Shard imports
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri, profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
// Utils imports
import {
  analyzeMatchHistory,
  analyzeMatchHistoryPlayers,
  calculateAkariScore
} from '@shared/utils/analysis'
import { summonerName } from '@shared/utils/name'
// Icon imports
import { Delete as DeleteIcon } from '@vicons/carbon'
import { Edit20Filled as EditIcon } from '@vicons/fluent'
import { RefreshSharp as RefreshIcon } from '@vicons/ionicons5'
import {
  MoreHorizFilled as MoreHorizFilledIcon,
  NavigateBeforeOutlined as NavigateBeforeOutlinedIcon,
  NavigateNextOutlined as NavigateNextOutlinedIcon
} from '@vicons/material'
// Third-party library imports
import { useIntervalFn, useMediaQuery } from '@vueuse/core'
import { toBlob } from 'html-to-image'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NIcon,
  NInputNumber,
  NModal,
  NPopconfirm,
  NPopover,
  NScrollbar,
  NSelect,
  NSpin,
  NTooltip,
  useMessage,
  useNotification
} from 'naive-ui'
import { computed, markRaw, nextTick, ref, useTemplateRef, watch } from 'vue'

// Local component imports
import PlayerTagEditModal from '@main-window/components/PlayerTagEditModal.vue'
import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'
import {
  GameDataState,
  TabState,
  useMatchHistoryTabsStore
} from '@main-window/shards/match-history-tabs/store'

// Local widget imports
import EncounteredGames from './widgets/EncounteredGames.vue'
import IndicatorPulse from './widgets/IndicatorPulse.vue'
import RankedDisplay from './widgets/RankedDisplay.vue'
import SpectateStatus from './widgets/SpectateStatus.vue'

// ============================================================================
// PROPS & EMITS - 组件属性和事件定义
// ============================================================================

const { tab, index = 0 } = defineProps<{
  tab: TabState
  index?: number
}>()

// ============================================================================
// COMPOSITION API - 组合式 API 实例
// ============================================================================

// Translation
const { t } = useTranslation()

// Shard instances
const lc = useInstance(LeagueClientRenderer)
const rc = useInstance(RiotClientRenderer)
const sgp = useInstance(SgpRenderer)
const mh = useInstance(MatchHistoryTabsRenderer)
const log = useInstance(LoggerRenderer)
const sp = useInstance(SavedPlayerRenderer)
const gc = useInstance(GameClientRenderer)
const app = useInstance(AppCommonRenderer)

// Store instances
const lcs = useLeagueClientStore()
const mhs = useMatchHistoryTabsStore()
const sgps = useSgpStore()
const as = useAppCommonStore()

// UI utilities
const notification = useNotification()
const message = useMessage()

// Composition hooks
const sgpTagOptions = useSgpTagOptions()
const { summonerName: maskedSummonerName } = useStreamerModeMaskedText()
const { navigateToTabByPuuidAndSgpServerId } = mh.useNavigateToTab()

// Media query
const isSmallScreen = useMediaQuery(`(max-width: 1100px)`)

// ============================================================================
// CONSTANTS - 常量定义
// ============================================================================

const VIEW_NAMESPACE = 'view:MatchHistoryTab'
const UPDATE_SPECTATOR_DATA_INTERVAL = 60 * 1000 // 1 分钟
const FREQUENT_USE_CHAMPION_THRESHOLD = 1
const RECENTLY_PLAYED_PLAYER_THRESHOLD = 2
const ENCOUNTERED_GAMES_PAGE_SIZE = 20
const SHOW_TINY_HEADER_THRESHOLD = 160

// ============================================================================
// REACTIVE DATA - 响应式数据
// ============================================================================

// Modal states
const isShowingRankedModal = ref(false)
const isShowingTagEditModal = ref(false)

// Input states
const inputtingPage = ref(tab.matchHistoryPage?.page)

// Scroll states
const mainContentScrollTop = ref(0)

// Template refs
const scrollEl = useTemplateRef('scroll')
const rightEl = useTemplateRef('right')
const innerContainerEl = useTemplateRef('inner-container')

// ============================================================================
// COMPUTED PROPERTIES - 计算属性
// ============================================================================

const currentSgpServerSupported = computed(() => {
  return sgps.sgpServerConfig.servers[tab.sgpServerId] || { common: false, matchHistory: false }
})

const isOnSelfSgpServer = computed(() => {
  return sgps.availability.sgpServerId === tab.sgpServerId
})

const isSelfTab = computed(() => {
  return lcs.summoner.me?.puuid === tab.puuid
})

const analysis = computed(() => {
  const matchHistory = analyzeMatchHistory(tab.matchHistoryPage?.games || [], tab.puuid)
  const players = analyzeMatchHistoryPlayers(tab.matchHistoryPage?.games || [], tab.puuid)

  return {
    matchHistory: matchHistory,
    playerRelationship: players,
    akariScore: matchHistory ? calculateAkariScore(matchHistory) : null
  }
})

const isSomethingLoading = computed(() => {
  return (
    tab.isLoadingMatchHistory ||
    tab.isLoadingRankedStats ||
    tab.isLoadingSavedInfo ||
    tab.isLoadingSpectatorData ||
    tab.isLoadingSummoner ||
    tab.isLoadingSummonerProfile
  )
})

const shouldShowTinyHeader = computed(() => mainContentScrollTop.value > SHOW_TINY_HEADER_THRESHOLD)

const pageSizeOptions = computed(() => [
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 10 }),
    value: 10
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 20 }),
    value: 20
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 30 }),
    value: 30
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 40 }),
    value: 40
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 50 }),
    value: 50
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 100 }),
    value: 100
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 200 }),
    value: 200
  }
])

const frequentlyUsedChampions = computed(() => {
  const a = analysis.value.matchHistory
  if (!a) {
    return []
  }

  return Object.values(a.champions)
    .filter((c) => c.count >= FREQUENT_USE_CHAMPION_THRESHOLD)
    .sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count
      }

      return b.win - a.win
    })
})

const recentlyPlayers = computed(() => {
  const relationship = analysis.value.playerRelationship

  const processPlayers = (isOpponent: boolean) => {
    return Object.values(relationship)
      .filter((a) => a.games.length >= RECENTLY_PLAYED_PLAYER_THRESHOLD)
      .map((a) => {
        const filteredGames = a.games.filter((g) => g.isOpponent === isOpponent)
        return { ...a, games: filteredGames }
      })
      .filter((a) => a.games.length >= RECENTLY_PLAYED_PLAYER_THRESHOLD)
      .map((a) => {
        const win = a.games.filter((g) => (isOpponent ? !g.win : g.win)).length
        const lose = a.games.filter((g) => (isOpponent ? g.win : !g.win)).length
        return { ...a, win, lose }
      })
      .sort((a, b) => {
        if (a.games.length !== b.games.length) {
          return b.games.length - a.games.length
        }
        return b.win - a.win
      })
  }

  const teammates = processPlayers(false)
  const opponents = processPlayers(true)

  return { teammates, opponents }
})

// ============================================================================
// DATA LOADING METHODS - 数据加载方法
// ============================================================================
</script>
