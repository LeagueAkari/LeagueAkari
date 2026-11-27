<template>
  <div v-if="champions.length" class="aram-hero-grid">
    <div
      v-for="champion in champions"
      :key="champion.id"
      class="hero-card"
      :class="{
        'hero-card--selected': isSelected(champion.id),
        'hero-card--owned': ownedIds.has(champion.id),
        'hero-card--disabled': disabled
      }"
      @click="handleClick(champion.id)"
    >
      <div class="hero-card__portrait">
        <ChampionIcon class="hero-card__img" :champion-id="champion.id" />

        <!-- 周免徽章：峡谷（左下红）、乱斗（右上蓝）分角排布互不重叠，自动识别结果，不参与任何手动勾选逻辑 -->
        <span
          v-if="riftFreeIds.has(champion.id)"
          class="hero-card__free hero-card__free--rift"
        >
          {{ t('toolkit.aramTools.panel.freeRift') }}
        </span>
        <span
          v-if="aramFreeIds.has(champion.id)"
          class="hero-card__free hero-card__free--aram"
        >
          {{ t('toolkit.aramTools.panel.freeAram') }}
        </span>
      </div>
      <div class="hero-card__name" :title="champion.name">{{ champion.name }}</div>
      <div class="hero-card__cost">
        <template v-if="ownedIds.has(champion.id)">
          <span class="hero-card__cost-owned">{{ t('toolkit.aramTools.panel.owned') }}</span>
        </template>
        <template v-else-if="priceOf(champion.id) != null">
          {{ priceOf(champion.id) }} {{ t('toolkit.aramTools.panel.essenceUnit') }}
        </template>
        <template v-else>{{ t('toolkit.aramTools.panel.priceUnknown') }}</template>
      </div>
    </div>
  </div>
  <NEmpty v-else class="py-8" :description="t('toolkit.aramTools.panel.empty')" />
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { ChampionSimple } from '@shared/types/league-client/game-data'
import { useTranslation } from 'i18next-vue'
import { NEmpty } from 'naive-ui'

const { t } = useTranslation()

const props = defineProps<{
  champions: ChampionSimple[]
  ownedIds: Set<number>
  aramFreeIds: Set<number>
  riftFreeIds: Set<number>
  selectedIds: Set<number>
  priceMap: Map<number, number | null>
  disabled?: boolean
}>()

const emit = defineEmits<{
  toggle: [championId: number]
}>()

const priceOf = (championId: number) => props.priceMap.get(championId)

const isSelected = (championId: number) => props.selectedIds.has(championId)

/**
 * 点击英雄卡片即切换其勾选状态；勾选结果既用于购物车（仅统计未拥有），
 * 也用于预设编辑（已拥有的英雄同样可以勾选）。仅在未连接等禁用状态下不响应。
 */
const handleClick = (championId: number) => {
  if (props.disabled) {
    return
  }
  emit('toggle', championId)
}
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.aram-hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  padding: 8px;
}

.hero-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid transparent;
  background-color: rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    transform 0.1s;
  box-sizing: border-box;
}

.hero-card:hover:not(.hero-card--disabled) {
  background-color: rgba(0, 0, 0, 0.08);
}

.hero-card--selected {
  border-color: #1ea90c;
  background-color: rgba(30, 169, 12, 0.12);
}

.hero-card--disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.hero-card__portrait {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 6px;
  overflow: hidden;
}

.hero-card__img {
  width: 100%;
  height: 100%;
}

/* 周免徽章：矩形小巧样式（仅 2px 微圆角）；峡谷=左下、乱斗=右上，分角排布互不重叠 */
.hero-card__free {
  position: absolute;
  z-index: 2;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  line-height: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 10px);
  pointer-events: none;
}

/* 峡谷周免：玫红风格，头像框左下角，与红色「取消峡谷周免」按钮呼应 */
.hero-card__free--rift {
  bottom: 5px;
  left: 5px;
  color: #be123c;
  background-color: #ffe4e6;
  box-shadow: 0 1px 3px rgba(190, 18, 60, 0.12);
}

/* 乱斗周免：蓝色风格，头像框右上角，与蓝色「取消乱斗周免」按钮呼应 */
.hero-card__free--aram {
  top: 5px;
  right: 5px;
  color: #1d64c8;
  background-color: #dbeafe;
  box-shadow: 0 1px 3px rgba(29, 100, 200, 0.12);
}

[data-theme='dark'] .hero-card__free--rift {
  color: #fff1f2;
  background-color: rgba(244, 63, 94, 0.34);
  /* 用内描边模拟 1px 边框，不改变徽章原有尺寸 */
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(251, 113, 133, 0.65);
}

[data-theme='dark'] .hero-card__free--aram {
  color: #eaf3ff;
  background-color: rgba(32, 128, 240, 0.34);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(96, 160, 240, 0.65);
}

.hero-card__name {
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(0, 0, 0, 0.8);
}

.hero-card__cost {
  font-size: 11px;
  line-height: 14px;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
}

.hero-card__cost-owned {
  color: #18a058;
}

[data-theme='dark'] .hero-card {
  background-color: rgba(255, 255, 255, 0.06);
}

[data-theme='dark'] .hero-card:hover:not(.hero-card--disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .hero-card--selected {
  border-color: #26dd0e;
  background-color: rgba(38, 221, 14, 0.16);
}

[data-theme='dark'] .hero-card__name {
  color: rgba(255, 255, 255, 0.85);
}

[data-theme='dark'] .hero-card__cost {
  color: rgba(255, 255, 255, 0.5);
}

[data-theme='dark'] .hero-card__cost-owned {
  color: #63e2b7;
}
</style>
