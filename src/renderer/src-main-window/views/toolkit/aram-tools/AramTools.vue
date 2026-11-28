<template>
  <div class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <!--
      三列两行网格：第 1 行为侧栏与主栏，第 2 行放置左下资产统计卡片与右下结算卡片。
      两块卡片同处第 2 行自动等高拉伸，顶边与底边横向对齐。
    -->
    <div
      class="box-border grid min-h-0 w-full flex-1 grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[minmax(0,1fr)_auto] gap-x-3 gap-y-2.5 overflow-hidden p-4"
    >
      <!-- 左侧边栏：控制与资产（第一行） -->
      <aside class="col-start-1 row-start-1 flex min-h-0 w-66 flex-col gap-2 overflow-hidden">
        <!-- 召唤师信息：px-3 与下方筛选下拉框保持同一水平内缩，头像与名称/Tagline 垂直居中 -->
        <div class="flex shrink-0 items-center px-3">
          <div class="relative size-16 shrink-0">
            <LcuImage
              class="size-full rounded"
              :src="lcs.summoner.me ? profileIconUri(lcs.summoner.me.profileIconId) : undefined"
            />
            <div
              v-if="lcs.summoner.me"
              class="absolute -bottom-1 left-0 rounded px-1 py-0.5 text-[10px] dark:bg-black/40 dark:text-white"
            >
              {{ lcs.summoner.me.summonerLevel }}
            </div>
          </div>

          <div class="ml-3 flex min-w-0 flex-col gap-1 self-center">
            <div v-if="lcs.summoner.me" class="flex min-w-0 items-center gap-2">
              <span
                class="truncate font-bold text-black dark:text-white"
                :class="lcs.summoner.me.gameName.length >= 16 ? 'text-sm' : 'text-xl'"
              >
                {{ lcs.summoner.me.gameName }}
              </span>
              <NIcon
                class="shrink-0 cursor-pointer text-black/50 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
                :size="14"
                :title="t('sharedUi.copyableText.copy')"
                @click="copySummonerName"
              >
                <DoneSharp v-if="summonerCopied" />
                <Copy24Regular v-else />
              </NIcon>
            </div>
            <div v-if="lcs.summoner.me" class="text-sm text-gray-500 dark:text-gray-400">
              #{{ lcs.summoner.me.tagLine }}
            </div>
            <div v-else class="text-xs text-black/60 italic dark:text-white/70">
              {{ t('toolkit.aramTools.summoner.noData') }}
            </div>
          </div>
        </div>

        <div class="aram-left-scroll min-h-0 flex-1">
          <NScrollbar class="h-full">
            <div class="flex h-full min-h-full flex-col gap-2 pb-1">
              <!-- 英雄排序筛选 -->
              <SettingsSection
                class="shrink-0"
                :title="t('toolkit.aramTools.panel.sortDefault')"
              >
                <div class="px-3 py-2.5">
                  <NSelect
                    v-model:value="sortMode"
                    size="small"
                    :options="sortOptions"
                    :placeholder="t('toolkit.aramTools.panel.sortByName')"
                  />
                </div>
              </SettingsSection>

              <!-- 英雄定位筛选 -->
              <SettingsSection class="shrink-0" :title="t('toolkit.aramTools.roleFilter.title')">
                <div class="px-3 py-2.5">
                  <NSelect
                    v-model:value="roleFilter"
                    size="small"
                    multiple
                    clearable
                    :options="roleOptions"
                    :placeholder="t('toolkit.aramTools.roleFilter.all')"
                  />
                </div>
              </SettingsSection>

              <!-- 价格定位筛选 -->
              <SettingsSection class="shrink-0" :title="t('toolkit.aramTools.priceFilter.title')">
                <div class="px-3 py-2.5">
                  <NSelect
                    v-model:value="priceFilter"
                    size="small"
                    multiple
                    clearable
                    :disabled="!lcs.isConnected"
                    :options="priceTierOptions"
                    :placeholder="t('toolkit.aramTools.priceFilter.all')"
                  />
                </div>
              </SettingsSection>

              <!-- 预设目录 -->
              <SettingsSection class="shrink-0" :title="t('toolkit.aramTools.presetList.title')">
                <div class="px-3 py-2.5">
                  <NSelect
                    size="small"
                    :value="state.activePresetId"
                    :options="presetOptions"
                    :placeholder="t('toolkit.aramTools.presets.namePlaceholder')"
                    @update:value="setActivePreset"
                  />
                </div>
              </SettingsSection>

              <!-- 预设管理 -->
              <SettingsSection class="shrink-0" :title="t('toolkit.aramTools.presets.title')">
                <div class="flex flex-col gap-2 px-3 py-2.5">
                  <NInput
                    size="small"
                    :value="activePreset?.name ?? ''"
                    :placeholder="t('toolkit.aramTools.presets.namePlaceholder')"
                    @update:value="onRenamePreset"
                  />
                  <div class="flex gap-2">
                    <NButton size="small" secondary class="flex-1" @click="onCreatePreset">
                      {{ t('toolkit.aramTools.presets.create') }}
                    </NButton>
                    <NButton
                      size="small"
                      type="error"
                      secondary
                      class="flex-1"
                      :disabled="!activePreset"
                      @click="onRemovePreset"
                    >
                      {{ t('toolkit.aramTools.presets.remove') }}
                    </NButton>
                  </div>
                  <div class="flex gap-2">
                    <NButton
                      size="small"
                      secondary
                      class="flex-1"
                      :disabled="!activePreset"
                      @click="onSaveSelectionToPreset"
                    >
                      {{ t('toolkit.aramTools.presets.saveSelection') }}
                    </NButton>
                    <NButton
                      size="small"
                      secondary
                      class="flex-1"
                      :disabled="!activePreset"
                      @click="onLoadPresetSelection"
                    >
                      {{ t('toolkit.aramTools.presets.loadSelection') }}
                    </NButton>
                  </div>
                </div>
              </SettingsSection>
            </div>
          </NScrollbar>
        </div>

      </aside>

      <!-- 左下：资产统计卡片（与右下结算卡片同处网格第 2 行，顶边对齐，紧凑高度；按钮在上、文字在下） -->
      <div
        class="col-start-1 row-start-2 flex flex-col justify-between gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-3 dark:border-white/10 dark:bg-white/5"
      >
        <NButton
          size="small"
          secondary
          block
          :loading="isRefreshing"
          :disabled="!lcs.isConnected"
          @click="onRefresh"
        >
          {{ t('toolkit.aramTools.assets.refresh') }}
        </NButton>
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs text-black/70 dark:text-white/80">
            <span>{{ t('toolkit.aramTools.assets.owned') }}</span>
            <span>{{ t('toolkit.aramTools.assets.count', { n: ownedCount }) }}</span>
          </div>
          <div class="flex items-center justify-between text-xs text-black/70 dark:text-white/80">
            <span>{{ t('toolkit.aramTools.assets.unowned') }}</span>
            <span>{{ t('toolkit.aramTools.assets.count', { n: unownedCount }) }}</span>
          </div>
          <div class="text-xs font-bold text-orange-500">
            {{ t('toolkit.aramTools.assets.balance', { n: blueEssence.toLocaleString() }) }}
          </div>
        </div>
      </div>

      <!-- 中间主栏：英雄面板（第一行，下方新增插件状态与购买进度日志两张卡片） -->
      <main class="col-start-2 row-start-1 flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
        <div class="flex min-h-7 shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1.5">
          <span class="shrink-0 text-sm font-bold text-black/80 dark:text-white/90">
            {{ t('toolkit.aramTools.panel.title') }}
          </span>
          <span class="shrink-0 text-xs text-black/50 dark:text-white/50">
            {{
              t('toolkit.aramTools.panel.summary', {
                total: champions.length,
                selected: selectedIds.size
              })
            }}
          </span>

          <div class="ml-auto flex flex-wrap items-center gap-1.5">
            <NCheckbox v-model:checked="showRiftFree" size="small">
              {{ t('toolkit.aramTools.panel.showRiftFree') }}
            </NCheckbox>
            <NCheckbox v-model:checked="showAramFree" size="small">
              {{ t('toolkit.aramTools.panel.showAramFree') }}
            </NCheckbox>
            <NCheckbox v-model:checked="showOwned" size="small">
              {{ t('toolkit.aramTools.panel.showOwned') }}
            </NCheckbox>
            <NButton size="small" secondary :disabled="!lcs.isConnected" @click="selectAllVisible">
              {{ t('toolkit.aramTools.panel.selectAll') }}
            </NButton>
            <NButton size="small" secondary :disabled="!selectedIds.size" @click="clearSelection">
              {{ t('toolkit.aramTools.panel.clearSelection') }}
            </NButton>
          </div>
        </div>

        <NAlert v-if="!lcs.isConnected" type="warning" :show-icon="true" class="shrink-0">
          {{ t('toolkit.aramTools.notConnected') }}
        </NAlert>

        <NScrollbar class="min-h-0 flex-1 rounded-lg bg-black/5 dark:bg-white/5">
          <AramHeroGrid
            :champions="sortedChampions"
            :owned-ids="ownedIds"
            :aram-free-ids="aramWeekFreeIds"
            :rift-free-ids="riftFreeIds"
            :selected-ids="selectedIds"
            :price-map="priceMap"
            :disabled="!lcs.isConnected"
            @toggle="toggleChampion"
          />
        </NScrollbar>
      </main>

      <!-- 中下：插件状态与购买进度日志（与左下/右下卡片同处网格第 2 行，顶边底边严格对齐） -->
      <div class="col-start-2 row-start-2 flex min-h-0 min-w-0 gap-3">
        <!-- 左：插件状态 & 购买总进度（状态文案在上，进度条在下） -->
        <div
          class="flex min-h-0 flex-[4] flex-col justify-between gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-3 dark:border-white/10 dark:bg-white/5"
        >
          <div class="flex flex-col gap-1.5">
            <div class="text-xs font-bold text-black/80 dark:text-white/90">
              {{ t('toolkit.aramTools.pluginStatus.title') }}
            </div>
            <div
              class="text-xs"
              :class="isPurchasing ? 'text-orange-500' : 'text-black/70 dark:text-white/80'"
            >
              {{
                isPurchasing
                  ? t('toolkit.aramTools.pluginStatus.purchasing')
                  : t('toolkit.aramTools.pluginStatus.ready')
              }}
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <div class="text-xs text-black/70 dark:text-white/80">
              {{ t('toolkit.aramTools.progress.label', { n: purchasePercent }) }}
            </div>
            <NProgress
              type="line"
              :height="8"
              :show-indicator="false"
              :percentage="purchasePercent"
            />
          </div>
        </div>

        <!-- 右：购买进度文字日志（固定高度、内部滚动，新日志自动滚到底部） -->
        <div
          class="flex min-h-0 flex-[5] flex-col rounded-lg border border-black/10 bg-black/5 px-3 py-3 dark:border-white/10 dark:bg-white/5"
        >
          <div class="shrink-0 text-xs font-bold text-black/80 dark:text-white/90">
            {{ t('toolkit.aramTools.purchaseLog.title') }}
          </div>
          <NScrollbar ref="logScrollbarRef" class="mt-1.5 min-h-0 flex-1">
            <div v-if="!purchaseLogs.length" class="py-2 text-xs text-black/50 dark:text-white/50">
              {{ t('toolkit.aramTools.purchaseLog.empty') }}
            </div>
            <div v-else class="flex flex-col">
              <div
                v-for="log in purchaseLogs"
                :key="log.id"
                class="flex items-center gap-2.5 border-b border-black/5 py-1.5 last:border-b-0 dark:border-white/10"
              >
                <ChampionIcon class="cart-item__icon" :champion-id="log.id" />
                <div class="min-w-0 flex-1 truncate text-sm text-black/80 dark:text-white/90">
                  {{ log.name }}
                </div>
                <span class="shrink-0 text-xs text-orange-500">
                  {{
                    log.price != null
                      ? `${log.price} ${t('toolkit.aramTools.panel.essenceUnit')}`
                      : t('toolkit.aramTools.panel.priceUnknown')
                  }}
                </span>
                <span
                  class="flex shrink-0 items-center gap-1 text-xs"
                  :class="log.ok ? 'text-black/70 dark:text-white/80' : 'text-red-500'"
                >
                  <span class="max-w-[180px] truncate">
                    {{
                      log.ok
                        ? t('toolkit.aramTools.purchaseLog.success')
                        : t('toolkit.aramTools.purchaseLog.failure', { reason: log.message })
                    }}
                  </span>
                  <span class="shrink-0">
                    {{ t('toolkit.aramTools.purchaseLog.remaining', { n: log.remaining }) }}
                  </span>
                </span>
              </div>
            </div>
          </NScrollbar>
        </div>
      </div>

      <!-- 右侧边栏：购物车（第一行） -->
      <aside class="col-start-3 row-start-1 flex min-h-0 w-66 flex-col overflow-hidden">
        <div class="flex min-h-0 flex-1 flex-col">
          <!-- 固定 28px 行高与中间标题行共用中心线，mb-2 与主栏 gap-2 一致，购物车列表顶边仍对齐英雄网格顶边 -->
          <div
            class="mb-2 flex h-7 shrink-0 items-center justify-center px-3 text-center text-sm font-bold text-black/80 dark:text-white/90"
          >
            {{ t('toolkit.aramTools.cart.title') }}
          </div>
          <div
            class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-black/5 dark:bg-white/5"
          >
            <NScrollbar class="min-h-0 flex-1">
              <div
                v-if="!cartItems.length"
                class="px-3 py-8 text-center text-xs text-black/50 dark:text-white/50"
              >
                {{ t('toolkit.aramTools.cart.empty') }}
              </div>
              <div
                v-for="item in cartItems"
                :key="item.id"
                class="flex items-center gap-2.5 border-b border-black/5 px-3 py-2.5 last:border-b-0 dark:border-white/10"
              >
                <ChampionIcon class="cart-item__icon" :champion-id="item.id" />
                <div class="min-w-0 flex-1 truncate text-sm text-black/80 dark:text-white/90">
                  {{ item.name }}
                </div>
                <span class="shrink-0 text-xs text-orange-500">
                  {{
                    item.price != null
                      ? `${item.price} ${t('toolkit.aramTools.panel.essenceUnit')}`
                      : t('toolkit.aramTools.panel.priceUnknown')
                  }}
                </span>
                <NButton size="tiny" quaternary @click="toggleChampion(item.id)">
                  {{ t('toolkit.aramTools.cart.remove') }}
                </NButton>
              </div>
            </NScrollbar>
          </div>
        </div>

      </aside>

      <!-- 右下：购物车结算卡片（与左下资产统计卡片同处网格第 2 行，顶边对齐，紧凑高度；文字在上、按钮在下） -->
      <div
        class="col-start-3 row-start-2 flex flex-col justify-between rounded-lg border border-black/10 bg-black/5 px-3 py-3 dark:border-white/10 dark:bg-white/5"
      >
        <div class="flex flex-col gap-1.5">
          <div class="text-xs text-black/70 dark:text-white/80">
            {{ t('toolkit.aramTools.cart.selectedCount', { n: selectedUnowned.length }) }}
          </div>
          <div class="text-xs" :class="isInsufficient ? 'text-red-500' : 'text-orange-500'">
            {{ t('toolkit.aramTools.cart.totalCost', { n: totalCost.toLocaleString() }) }}
          </div>
          <div
            class="text-xs"
            :class="isInsufficient ? 'text-red-500' : 'text-black/70 dark:text-white/80'"
          >
            {{ t('toolkit.aramTools.cart.balance', { n: remaining.toLocaleString() }) }}
          </div>
          <div v-if="isInsufficient" class="text-[11px] text-red-500">
            {{ t('toolkit.aramTools.cart.insufficient') }}
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <!-- 取消周免一分为二：左红取消峡谷周免、右蓝取消乱斗周免，各占一半宽度 -->
          <div class="flex gap-2">
            <NButton
              size="small"
              type="error"
              secondary
              class="min-w-0 flex-1 whitespace-nowrap"
              :disabled="!hasSelectedRiftFree"
              @click="deselectRiftFree"
            >
              {{ t('toolkit.aramTools.panel.deselectRiftFree') }}
            </NButton>
            <NButton
              size="small"
              type="info"
              secondary
              class="min-w-0 flex-1 whitespace-nowrap"
              :disabled="!hasSelectedAramFree"
              @click="deselectWeekFree"
            >
              {{ t('toolkit.aramTools.panel.deselectAramFree') }}
            </NButton>
          </div>
          <NButton
            type="primary"
            size="small"
            block
            :loading="isPurchasing"
            :disabled="!canPurchase"
            @click="purchaseAll"
          >
            {{ t('toolkit.aramTools.cart.purchase') }}
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useActivated } from '@renderer-shared/composables/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { writeClipboardText } from '@renderer-shared/utils/clipboard'
import { Copy24Regular } from '@vicons/fluent'
import { DoneSharp } from '@vicons/material'
import { useTimeoutFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import {
  NAlert,
  NButton,
  NCheckbox,
  NIcon,
  NInput,
  NProgress,
  NScrollbar,
  NSelect,
  useDialog,
  useMessage
} from 'naive-ui'
import type { ScrollbarInst } from 'naive-ui'
import { computed, nextTick, ref, watch } from 'vue'

import AramHeroGrid from './AramHeroGrid.vue'
import { useAramAssets } from './use-aram-assets'
import { useAramPresets } from './use-aram-presets'
import { useAramWeekFree } from './use-aram-week-free'
import { useRiftWeekFree } from './use-rift-week-free'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)
const lcs = useLeagueClientStore()
const message = useMessage()
const dialog = useDialog()
const isActivated = useActivated()

const {
  champions,
  ownedIds,
  blueEssence,
  priceMap,
  isRefreshing,
  refresh,
  ensurePrices,
  getPrice
} = useAramAssets()

const {
  state,
  activePreset,
  setActivePreset,
  createPreset,
  renamePreset,
  removePreset,
  setPresetChampions
} = useAramPresets()

const { buildIds: buildWeekFreeIds, ensureLoaded: ensureWeekFreeLoaded } = useAramWeekFree()
const { buildIds: buildRiftFreeIds, ensureLoaded: ensureRiftFreeLoaded } = useRiftWeekFree()

const selectedIds = ref<Set<number>>(new Set())
const roleFilter = ref<string[]>([])
const priceFilter = ref<number[]>([])
// 默认不勾选「显示峡谷周免」「显示乱斗周免」与「显示已拥有」，仅展示可购买的英雄
const showRiftFree = ref(false)
const showAramFree = ref(false)
const showOwned = ref(false)
const sortMode = ref<'default' | 'priceAsc' | 'priceDesc' | null>(null)

const isPurchasing = ref(false)
const purchaseLogs = ref<
  {
    id: number
    name: string
    price: number | null
    ok: boolean
    message: string
    remaining: number
  }[]
>([])
const purchaseTotal = ref(0)
const logScrollbarRef = ref<ScrollbarInst | null>(null)

const ROLES = ['FIGHTER', 'TANK', 'MAGE', 'ASSASSIN', 'MARKSMAN', 'SUPPORT']

/** 常规英雄的蓝色精粹价格档位（用作价格未加载时的兜底） */
const FALLBACK_PRICE_TIERS = [450, 1350, 3150, 4800, 6300]

const roleOptions = computed(() =>
  ROLES.map((role) => ({ label: t(`toolkit.aramTools.roles.${role}`), value: role }))
)

const sortOptions = computed(() => [
  { label: t('toolkit.aramTools.panel.sortByName'), value: 'default' },
  { label: t('toolkit.aramTools.panel.sortPriceAsc'), value: 'priceAsc' },
  { label: t('toolkit.aramTools.panel.sortPriceDesc'), value: 'priceDesc' }
])

/**
 * 价格档位直接从已加载的英雄价格中归纳，保证列表中的每个价格都能被筛选到；
 * 价格尚未加载时退回到常规档位。
 */
const priceTiers = computed(() => {
  const set = new Set<number>()
  for (const price of priceMap.value.values()) {
    if (typeof price === 'number' && price > 0) {
      set.add(price)
    }
  }

  const list = [...set].sort((a, b) => a - b)
  return list.length ? list : FALLBACK_PRICE_TIERS
})

const priceTierOptions = computed(() =>
  priceTiers.value.map((tier) => ({
    label: `${tier} ${t('toolkit.aramTools.panel.essenceUnit')}`,
    value: tier
  }))
)

/** 英雄池中真正已拥有的数量（与卡片状态、总池数量保持一致） */
const ownedCount = computed(() =>
  champions.value.reduce((count, champion) => count + (ownedIds.value.has(champion.id) ? 1 : 0), 0)
)

const unownedCount = computed(() => Math.max(0, champions.value.length - ownedCount.value))

/**
 * 最终生效的大乱斗周免集合：只由官方大乱斗免费英雄名单（或本地缓存 / 内置 52 人名单兜底）决定，
 * 与手动勾选状态完全无关。
 */
const aramWeekFreeIds = computed(() => buildWeekFreeIds(champions.value))

/** 最终生效的峡谷周免集合：由官方「每周免费英雄」名单（或本地缓存）决定，与手动勾选状态完全无关 */
const riftFreeIds = computed(() => buildRiftFreeIds(champions.value))

/** 当前勾选中是否包含峡谷周免英雄 */
const hasSelectedRiftFree = computed(() => {
  for (const id of selectedIds.value) {
    if (riftFreeIds.value.has(id)) {
      return true
    }
  }
  return false
})

/** 当前勾选中是否包含大乱斗周免英雄 */
const hasSelectedAramFree = computed(() => {
  for (const id of selectedIds.value) {
    if (aramWeekFreeIds.value.has(id)) {
      return true
    }
  }
  return false
})

/** 按筛选条件（定位 / 价格 / 显示开关）过滤后的英雄 */
const filteredChampions = computed(() => {
  const roles = roleFilter.value
  const tiers = priceFilter.value

  return champions.value.filter((champion) => {
    const owned = ownedIds.value.has(champion.id)
    const aramFree = aramWeekFreeIds.value.has(champion.id)
    const riftFree = riftFreeIds.value.has(champion.id)

    if (owned && !showOwned.value) {
      return false
    }

    // 未拥有的英雄只有在其所属周免池被勾选展示时才可见；两个池同时勾选时取并集
    if (!owned && aramFree && !showAramFree.value) {
      return false
    }

    if (!owned && riftFree && !showRiftFree.value) {
      return false
    }

    if (roles.length && !champion.roles.some((role) => roles.includes(role.toUpperCase()))) {
      return false
    }

    if (tiers.length) {
      const price = getPrice(champion.id)
      if (typeof price !== 'number' || !tiers.includes(price)) {
        return false
      }
    }

    return true
  })
})

/** 在筛选结果上排序（名称排序为默认，价格未知的始终排在末尾） */
const sortedChampions = computed(() => {
  const mode = sortMode.value ?? 'default'

  if (mode === 'default') {
    // 默认按英雄名称排序
    return [...filteredChampions.value].sort((a, b) =>
      a.name.localeCompare(b.name, 'zh-Hans-CN')
    )
  }

  const fallback = mode === 'priceAsc' ? Number.MAX_SAFE_INTEGER : -1
  const priceValue = (id: number) => {
    const price = getPrice(id)
    return typeof price === 'number' ? price : fallback
  }

  const list = [...filteredChampions.value]
  list.sort((a, b) =>
    mode === 'priceAsc' ? priceValue(a.id) - priceValue(b.id) : priceValue(b.id) - priceValue(a.id)
  )
  return list
})

const selectedUnowned = computed(() =>
  champions.value.filter(
    (champion) => selectedIds.value.has(champion.id) && !ownedIds.value.has(champion.id)
  )
)

const purchasable = computed(() =>
  selectedUnowned.value.filter((champion) => typeof getPrice(champion.id) === 'number')
)

const totalCost = computed(() =>
  purchasable.value.reduce((sum, champion) => sum + (getPrice(champion.id) ?? 0), 0)
)

const remaining = computed(() => blueEssence.value - totalCost.value)

/** 预计消耗超出当前余额时为真，用于标红提示并禁用购买 */
const isInsufficient = computed(() => remaining.value < 0)

const canPurchase = computed(
  () =>
    lcs.isConnected && !isPurchasing.value && purchasable.value.length > 0 && !isInsufficient.value
)

const cartItems = computed(() =>
  selectedUnowned.value.map((champion) => ({
    id: champion.id,
    name: champion.name,
    price: getPrice(champion.id) ?? null
  }))
)

/** 本次批量购买的总数 / 已完成数 / 百分比，用于插件状态卡片的进度条展示 */
const purchaseProcessed = computed(() => purchaseLogs.value.length)

const purchasePercent = computed(() =>
  purchaseTotal.value > 0 ? Math.round((purchaseProcessed.value / purchaseTotal.value) * 100) : 0
)

// 新日志追加后自动滚动到底部（超出范围的 scrollTop 会被浏览器自动钳制）
watch(
  () => purchaseLogs.value.length,
  async () => {
    await nextTick()
    logScrollbarRef.value?.scrollTo({ top: 999999 })
  }
)

const summonerCopied = ref(false)
const { start: startSummonerCopiedTimer } = useTimeoutFn(() => {
  summonerCopied.value = false
}, 2000)

const copySummonerName = async () => {
  const me = lcs.summoner.me
  if (!me) {
    return
  }

  try {
    await writeClipboardText(`${me.gameName}#${me.tagLine}`)
    summonerCopied.value = true
    startSummonerCopiedTimer()
    message.success(() => t('toolkit.aramTools.summoner.copied'))
  } catch {
    message.error(() => t('toolkit.aramTools.summoner.copyFailed'))
  }
}

const toggleChampion = (championId: number) => {
  // 勾选同时服务于预设编辑与购物车：已拥有英雄也可勾选，
  // 购物车与结算仍只统计未拥有的英雄（见 selectedUnowned / purchasable）
  const next = new Set(selectedIds.value)
  if (next.has(championId)) {
    next.delete(championId)
  } else {
    next.add(championId)
  }
  selectedIds.value = next
}

const clearSelection = () => {
  selectedIds.value = new Set()
}

/** 全选当前列表 / 筛选结果中的英雄（含已拥有，便于全英雄账号构建预设） */
const selectAllVisible = () => {
  selectedIds.value = new Set(sortedChampions.value.map((champion) => champion.id))
}

/** 取消勾选中所有大乱斗周免英雄，保留其他已勾选英雄 */
const deselectWeekFree = () => {
  const freeIds = aramWeekFreeIds.value
  if (!freeIds.size || !selectedIds.value.size) {
    return
  }

  const next = new Set(selectedIds.value)
  for (const id of freeIds) {
    next.delete(id)
  }
  selectedIds.value = next
}

/** 取消勾选中所有峡谷周免英雄，保留其他已勾选英雄 */
const deselectRiftFree = () => {
  const freeIds = riftFreeIds.value
  if (!freeIds.size || !selectedIds.value.size) {
    return
  }

  const next = new Set(selectedIds.value)
  for (const id of freeIds) {
    next.delete(id)
  }
  selectedIds.value = next
}

const onLoadPresetSelection = () => {
  const preset = activePreset.value
  if (!preset) {
    return
  }
  // 预设中可能包含已拥有英雄，载入后需可见才能继续调整
  showOwned.value = true
  selectedIds.value = new Set(preset.championIds)
}

const onSaveSelectionToPreset = () => {
  const preset = activePreset.value
  if (!preset) {
    return
  }
  setPresetChampions(preset.id, [...selectedIds.value])
  message.success(() => t('toolkit.aramTools.presets.saveSuccess', { n: selectedIds.value.size }))
}

const onRenamePreset = (value: string) => {
  const preset = activePreset.value
  if (!preset) {
    return
  }
  renamePreset(preset.id, value)
}

const onCreatePreset = () => {
  createPreset()
  // 全英雄账号下若不显示已拥有英雄，新建预设后将无英雄可勾选
  showOwned.value = true
}

const confirmRemovePreset = (id: string, name: string) => {
  dialog.warning({
    title: t('toolkit.aramTools.presets.removeConfirmTitle'),
    content: t('toolkit.aramTools.presets.removeConfirm', { name }),
    positiveText: t('toolkit.aramTools.presets.remove'),
    negativeText: t('common:cancel'),
    onPositiveClick: () => {
      removePreset(id)
    }
  })
}

const presetOptions = computed(() =>
  state.presets.map((preset) => ({ label: preset.name, value: preset.id }))
)

const onRemovePreset = () => {
  const preset = activePreset.value
  if (!preset) {
    return
  }
  confirmRemovePreset(preset.id, preset.name)
}

const onRefresh = async () => {
  try {
    await refresh()
    message.success(() => t('toolkit.aramTools.assets.refreshSuccess'))
  } catch (error: any) {
    message.warning(() => t('toolkit.aramTools.assets.refreshFailed', { reason: error.message }))
  }
}

const purchaseAll = async () => {
  const targets = purchasable.value
  if (!targets.length) {
    message.warning(() => t('toolkit.aramTools.cart.needSelect'))
    return
  }

  isPurchasing.value = true
  purchaseLogs.value = []
  purchaseTotal.value = targets.length

  let success = 0
  let failed = 0

  for (const champion of targets) {
    const price = getPrice(champion.id)
    if (typeof price !== 'number') {
      continue
    }

    try {
      await lc.api.store.purchaseChampion(champion.id, price)
      success += 1
      purchaseLogs.value.push({
        id: champion.id,
        name: champion.name,
        price,
        ok: true,
        message: '',
        remaining: targets.length - purchaseLogs.value.length
      })
    } catch (error: any) {
      failed += 1
      const reason =
        error?.response?.data?.message ??
        error?.response?.data?.errorCode ??
        error?.message ??
        String(error)
      purchaseLogs.value.push({
        id: champion.id,
        name: champion.name,
        price,
        ok: false,
        message: reason,
        remaining: targets.length - purchaseLogs.value.length
      })
    }
  }

  isPurchasing.value = false

  message.success(() => t('toolkit.aramTools.cart.finished', { success, failed }))

  await refresh()
}

const shouldReload = computed(() => isActivated.value && lcs.isConnected)

// 英雄总表就绪后自动同步官方周免名单（大乱斗 + 召唤师峡谷，主进程发起以规避跨域限制）；
// 大乱斗请求失败时使用内置的本周 52 人名单兜底，整个过程不涉及任何手动勾选状态。
watch(
  () => champions.value.length,
  () => {
    if (champions.value.length) {
      void ensureWeekFreeLoaded(champions.value)
      void ensureRiftFreeLoaded(champions.value)
    }
  },
  { immediate: true }
)

// 连接且英雄列表就绪后，按需一次性拉取全部英雄的蓝色精粹价格
watch(
  () => [shouldReload.value, champions.value.length] as const,
  () => {
    if (shouldReload.value && champions.value.length) {
      ensurePrices(champions.value.map((champion) => champion.id))
    }
  },
  { immediate: true }
)

watch(
  shouldReload,
  async (value) => {
    if (value) {
      await refresh()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.aram-left-scroll :deep(.n-scrollbar-content) {
  height: 100%;
}

/* 左侧分组标题与控件文字水平居中 */
.aram-left-scroll :deep(.settings-section-header) {
  text-align: center;
}

.aram-left-scroll :deep(.n-base-selection-placeholder),
.aram-left-scroll :deep(.n-base-selection-placeholder__inner),
.aram-left-scroll :deep(.n-base-selection-input__content) {
  text-align: center;
}

.aram-left-scroll :deep(.n-base-selection-placeholder__inner),
.aram-left-scroll :deep(.n-base-selection-input__content) {
  width: 100%;
}

.aram-left-scroll :deep(.n-input__input-el),
.aram-left-scroll :deep(.n-input__placeholder) {
  text-align: center;
}

.cart-item__icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
}
</style>
