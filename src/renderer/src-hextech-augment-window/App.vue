<template>
  <SetupInAppScope />
  <div v-if="snapshot" class="augment-strip" aria-live="polite">
    <div class="augment-header">{{ t('hextechAugment.title') }}</div>
    <div class="augment-options">
      <div v-for="(label, slot) in snapshot.labels" :key="slot" class="augment-option">
        <div class="augment-details">
          <div class="augment-position">{{ t(`hextechAugment.positions.${slot}`) }}</div>
          <div class="augment-name" :title="label.name">{{ label.name }}</div>
        </div>
        <div class="augment-tier" :data-tier="label.tier">
          {{ label.tier ?? t('hextechAugment.noData') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useColorThemeAttr } from '@renderer-shared/composables/useColorThemeAttr'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useHextechAugmentStore } from '@renderer-shared/shards/hextech-augment/store'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { useNow } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const store = useHextechAugmentStore()
const appCommon = useAppCommonStore()
const { t } = useTranslation()
const now = useNow({ interval: 100 })
const snapshot = computed(() =>
  store.snapshot && now.value.getTime() < store.snapshot.expiresAt ? store.snapshot : null
)
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
  padding: 10px 12px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 8px;
  background: rgb(17 20 26 / 94%);
  font-family: 'Microsoft YaHei', sans-serif;
  color: #f4f5f8;
  user-select: none;
}
.augment-header {
  -webkit-app-region: drag;
  padding-bottom: 8px;
  font-size: 12px;
  color: #b2bac8;
}
.augment-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.augment-option {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}
.augment-details {
  min-width: 0;
  flex: 1;
}
.augment-position {
  margin-bottom: 4px;
  font-size: 11px;
  color: #939dab;
}
.augment-name {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  font-size: 13px;
  line-height: 1.4;
}
.augment-tier {
  flex-shrink: 0;
  font-size: 32px;
  font-weight: 800;
  color: #c7cbd4;
}
.augment-tier:not([data-tier]) {
  max-width: 4em;
  font-size: 11px;
}
.augment-tier[data-tier='S'] {
  color: #ffdb79;
}
.augment-tier[data-tier='A'] {
  color: #ff655e;
}
.augment-tier[data-tier='B'] {
  color: #63d9ff;
}
.augment-tier[data-tier='C'] {
  color: #83e4b5;
}
</style>
