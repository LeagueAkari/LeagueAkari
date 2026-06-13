<template>
  <NPopover
    v-if="lcs.isConnected && perkstyleId && lcs.gameData.perkstyles.styles[perkstyleId]"
    :delay="500"
    :keep-alive-on-hover="false"
  >
    <template #trigger>
      <div
        class="cursor-pointer rounded-full border-2 border-transparent p-0.5 transition-colors duration-200"
        :class="selected ? 'border-[#c8aa6e]' : 'hover:border-[#c8aa6e80]'"
        @click="emits('itemClick', perkstyleId)"
      >
        <div
          :style="{
            width: `${size}px`,
            height: `${size}px`,
            'mask-size': `${size - 6}px`,
            'mask-image': `url(akari://league-client${getIconPath(perkstyleId)})`
          }"
          class="perkstyle-icon"
          :class="{
            [getSvgClass(perkstyleId)]: true
          }"
        />
      </div>
    </template>
    <div class="mb-2 flex w-45 items-center">
      <div
        v-bind="$attrs"
        :style="{
          width: `24px`,
          height: `24px`,
          'mask-size': `18px`,
          'mask-image': `url(akari://league-client${getIconPath(perkstyleId)})`
        }"
        class="perkstyle-icon"
        :class="{
          [getSvgClass(perkstyleId)]: true
        }"
      />
      <div class="ml-2 text-xs font-bold">
        ({{ perkstyleId || '-' }}) {{ lcs.gameData.perkstyles.styles[perkstyleId].name }}
      </div>
    </div>
    <div class="max-w-45 text-xs">
      {{ lcs.gameData.perkstyles.styles[perkstyleId].tooltip }}
    </div>
  </NPopover>
  <div
    v-else
    class="cursor-pointer rounded-full border-2 border-transparent p-0.5 transition-colors duration-200"
    :class="selected ? 'border-[#c8aa6e]' : 'hover:border-[#c8aa6e80]'"
  >
    <div
      :style="{ width: `${size}px`, height: `${size}px` }"
      class="rounded-full bg-[#353535]"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NPopover } from 'naive-ui'

const { size = 20 } = defineProps<{
  selected?: boolean
  perkstyleId?: number
  size?: number
}>()

const emits = defineEmits<{
  itemClick: [perkstyleId: number]
}>()

const lcs = useLeagueClientStore()

const getIconPath = (perkstyleId: number) => {
  return lcs.gameData.perkstyles.styles[perkstyleId]?.assetMap.svg_icon
}

const getSvgClass = (perkstyleId: number) => {
  const style = lcs.gameData.perkstyles.styles[perkstyleId]
  if (!style) return ''

  switch (style.id) {
    case 8100:
      return 'perks-domination-style-icon'
    case 8300:
      return 'perks-inspiration-style-icon'
    case 8000:
      return 'perks-precision-style-icon'
    case 8400:
      return 'perks-resolve-style-icon'
    case 8200:
      return 'perks-sorcery-style-icon'
    default:
      return ''
  }
}
</script>

<style scoped>
.perkstyle-icon {
  mask-position: 50% 50%;
  mask-repeat: no-repeat;

  --la-perks-color-domination-light: #d44242;
  --la-perks-color-domination-dark: #dc4747;
  --la-perks-color-inspiration-light: #49aab9;
  --la-perks-color-inspiration-dark: #48b4be;
  --la-perks-color-precision-light: #aea789;
  --la-perks-color-precision-dark: #c8aa6e;
  --la-perks-color-resolve-light: #a1d586;
  --la-perks-color-resolve-dark: #a4d08d;
  --la-perks-color-sorcery-light: #9faafc;
  --la-perks-color-sorcery-dark: #6c75f5;
}

.perks-domination-style-icon {
  background: linear-gradient(
    to bottom,
    var(--la-perks-color-domination-light) 0%,
    var(--la-perks-color-domination-dark) 100%
  );
}

.perks-inspiration-style-icon {
  background: linear-gradient(
    to bottom,
    var(--la-perks-color-inspiration-light) 0%,
    var(--la-perks-color-inspiration-dark) 100%
  );
}

.perks-precision-style-icon {
  background: linear-gradient(
    to bottom,
    var(--la-perks-color-precision-light) 0%,
    var(--la-perks-color-precision-dark) 100%
  );
}

.perks-resolve-style-icon {
  background: linear-gradient(
    to bottom,
    var(--la-perks-color-resolve-light) 0%,
    var(--la-perks-color-resolve-dark) 100%
  );
}

.perks-sorcery-style-icon {
  background: linear-gradient(
    to bottom,
    var(--la-perks-color-sorcery-light) 0%,
    var(--la-perks-color-sorcery-dark) 100%
  );
}
</style>
