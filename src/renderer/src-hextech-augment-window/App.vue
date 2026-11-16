<template>
  <SetupInAppScope />
  <div v-if="snapshot" class="augment-overlay" aria-live="polite">
    <div
      v-for="(label, slot) in snapshot.labels"
      :key="`${slot}-${label.id}`"
      class="augment-label"
      :aria-label="label.name"
      :style="position(label)"
    >
      <div class="augment-tier" :data-tier="label.tier">{{ label.tier ?? '—' }}</div>
      <div class="augment-performance">
        {{
          label.performance === null
            ? t('hextechAugment.noData')
            : t('hextechAugment.performance', { value: label.performance })
        }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useColorThemeAttr } from '@renderer-shared/composables/useColorThemeAttr'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useHextechAugmentStore } from '@renderer-shared/shards/hextech-augment/store'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import type { HextechAugmentLabel } from '@shared/types/hextech-augment'
import { useTranslation } from 'i18next-vue'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'

const store = useHextechAugmentStore()
const appCommon = useAppCommonStore()
const { t } = useTranslation()
const now = useNow({ interval: 100 })
const snapshot = computed(() =>
  store.snapshot && now.value.getTime() - store.snapshot.capturedAt <= 1200 ? store.snapshot : null
)
useColorThemeAttr(
  () => appCommon.colorTheme,
  () => appCommon.themeId
)
function position(label: HextechAugmentLabel) {
  if (!snapshot.value) return {}
  return {
    left: `${(100 * (label.x + label.width / 2)) / snapshot.value.window.width}%`,
    // The picker scales with the client height. Its lower blank area is below
    // the title and description, and above the card's bottom edge/reroll button.
    top: `${(100 * (label.y + label.height)) / snapshot.value.window.height + 18}%`
  }
}
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
  pointer-events: none;
}
.augment-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  font-family: 'Microsoft YaHei', sans-serif;
  color: #f4f5f8;
}
.augment-label {
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(110px, 14vw, 340px);
  padding: 0;
  background: radial-gradient(ellipse, rgb(8 15 20 / 80%), transparent 72%);
  text-shadow: 0 2px 4px #000;
  text-align: center;
}
.augment-performance {
  margin-top: 0.6vh;
  font-size: clamp(12px, 1.6vh, 34px);
  line-height: 1.4;
  font-weight: 600;
  white-space: nowrap;
}
.augment-tier {
  font-size: clamp(30px, 4.5vh, 96px);
  font-weight: 800;
  line-height: 1;
  color: #c7cbd4;
}
.augment-tier::before,
.augment-tier::after {
  display: inline-block;
  margin: 0 0.4em;
  font-size: 0.55em;
  vertical-align: 0.12em;
}
.augment-tier::before {
  content: '«';
}
.augment-tier::after {
  content: '»';
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
