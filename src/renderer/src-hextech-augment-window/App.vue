<template>
  <SetupInAppScope />
  <div v-if="snapshot" class="augment-strip" aria-live="polite">
    <div class="augment-header">
      <AkariLogo class="augment-logo" aria-hidden="true" />
      <span>League Akari</span>
    </div>
    <div class="augment-options">
      <div
        v-for="(label, slot) in snapshot.labels"
        :key="label.id ?? `pending-${slot}`"
        class="augment-option"
        :class="{
          'is-recommended': label.id !== null && topAugmentIds.has(label.id),
          'is-updated': isUpdated(label.id)
        }"
        :title="label.name"
        :aria-label="label.name"
      >
        <div class="augment-option-header">
          <span class="augment-position">{{ t(`hextechAugment.positions.${slot}`) }}</span>
          <span class="augment-tier" :data-tier="label.tier">{{ label.tier ?? '?' }}</span>
        </div>
        <div class="augment-rank" :title="t('hextechAugment.rankHelp')">
          {{
            label.id === null
              ? t('hextechAugment.recognizing')
              : label.tierRank != null
                ? t('hextechAugment.tierRank', { rank: label.tierRank, total: label.tierCount })
                : t('hextechAugment.noData')
          }}
        </div>
        <div class="augment-option-footer">
          <div class="augment-bars" :title="t('hextechAugment.rankHelp')" aria-hidden="true">
            <span v-for="bar in 3" :key="bar" :class="{ filled: bar <= getRankBars(label) }" />
          </div>
          <span v-if="label.id !== null && topAugmentIds.has(label.id)" class="augment-best">{{
            t('hextechAugment.bestPick')
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import { useColorThemeAttr } from '@renderer-shared/composables/useColorThemeAttr'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useHextechAugmentStore } from '@renderer-shared/shards/hextech-augment/store'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { useNow } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { computed, ref, watch } from 'vue'

import { getChangedAugmentIds, getRankBars, getTopAugmentIds } from './offer-display'

const store = useHextechAugmentStore()
const appCommon = useAppCommonStore()
const { t } = useTranslation()
const now = useNow({ interval: 100 })
const snapshot = computed(() =>
  store.snapshot && now.value.getTime() < store.snapshot.expiresAt ? store.snapshot : null
)
const topAugmentIds = computed(() => getTopAugmentIds(snapshot.value?.labels ?? []))
const updatedUntil = ref<Record<number, number>>({})
const isUpdated = (id: number | null) => id !== null && Boolean(updatedUntil.value[id])
watch(now, (date) => {
  const active = Object.entries(updatedUntil.value).filter(([, until]) => until > date.getTime())
  if (active.length !== Object.keys(updatedUntil.value).length) {
    updatedUntil.value = Object.fromEntries(active)
  }
})
watch(snapshot, (current, previous) => {
  if (!current || !previous || current.championId !== previous.championId) {
    updatedUntil.value = {}
    return
  }
  const changed = getChangedAugmentIds(previous, current)
  if (!changed.length) return
  const expiresAt = Date.now() + 1600
  updatedUntil.value = Object.fromEntries(
    current.labels
      .filter((label) => label.id !== null)
      .map((label) => [
        label.id!,
        changed.includes(label.id!) ? expiresAt : (updatedUntil.value[label.id!] ?? 0)
      ])
  )
})
useColorThemeAttr(
  () => appCommon.colorTheme,
  () => appCommon.themeId
)
</script>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent !important;
}
.augment-strip {
  box-sizing: border-box;
  height: 100%;
  padding: 10px;
  border: 1px solid #08080a;
  border-radius: 17px;
  background: rgb(22 22 25 / 96%);
  font-family: 'Microsoft YaHei', sans-serif;
  color: #f4f4f5;
  user-select: none;
}
.augment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 20px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  -webkit-app-region: drag;
}
.augment-logo {
  width: 18px;
  height: 18px;
  color: #e882bd;
}
.augment-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}
.augment-option {
  box-sizing: border-box;
  min-width: 0;
  height: 86px;
  padding: 8px;
  border: 1px solid #49494c;
  border-radius: 12px;
  background: #2c2c2f;
}
.augment-option.is-recommended {
  border-color: #7be7ad;
  box-shadow: inset 0 0 0 1px #7be7ad;
  background: #263c31;
}
.augment-option-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  height: 36px;
}
.augment-position {
  padding-top: 1px;
  font-size: 10px;
  line-height: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: #ababaf;
}
.augment-tier {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: 30px;
  height: 32px;
  border: 2px solid currentColor;
  border-radius: 9px;
  color: #aaaab0;
  background: rgb(255 255 255 / 5%);
  font-size: 17px;
  line-height: 20px;
  font-weight: 800;
}
.augment-rank {
  margin-top: 4px;
  font-size: 11px;
  line-height: 14px;
  font-weight: 700;
  white-space: nowrap;
}
.augment-option-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 12px;
  margin-top: 2px;
}
.augment-bars {
  display: flex;
  gap: 2px;
}
.augment-bars span {
  width: 10px;
  height: 5px;
  border-radius: 3px;
  background: #727276;
}
.augment-bars .filled {
  background: #fafafa;
}
.augment-best {
  color: #8cf1b9;
  font-size: 10px;
  line-height: 12px;
  font-weight: 700;
}
.augment-tier[data-tier='S'],
.augment-tier[data-tier='A'] {
  color: #f0bf3c;
  background: rgb(240 191 60 / 12%);
}
.augment-tier[data-tier='B'] {
  color: #78c9e5;
  background: rgb(120 201 229 / 10%);
}
.augment-tier[data-tier='C'] {
  color: #bd9edf;
}
.augment-tier[data-tier='D'],
.augment-tier[data-tier='E'],
.augment-tier[data-tier='F'] {
  color: #df767a;
  background: rgb(223 118 122 / 10%);
}

.augment-option.is-updated {
  outline: 2px solid transparent;
  outline-offset: -2px;
  animation: augment-refresh 1600ms ease-out;
}
@keyframes augment-refresh {
  0% {
    opacity: 0.45;
    transform: translateY(2px);
    outline-color: #a5ddff;
  }
  25% {
    opacity: 1;
    transform: translateY(0);
    outline-color: #a5ddff;
  }
  100% {
    outline-color: transparent;
  }
}
@media (prefers-reduced-motion: reduce) {
  .augment-option.is-updated {
    animation-name: augment-refresh-reduced;
  }
}
@keyframes augment-refresh-reduced {
  from {
    outline-color: #a5ddff;
  }
  to {
    outline-color: transparent;
  }
}
</style>
