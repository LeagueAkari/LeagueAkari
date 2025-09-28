<template>
  <div
    class="sidebar-menu"
    :class="{ 'rabi-test': currentActiveItem === 'test' }"
    ref="sidebar-menu"
    :style="{
      '--indicator-top': `${indicatorPosition.top}px`,
      '--indicator-rail-height': `${indicatorPosition.height}px`
    }"
  >
    <NTooltip v-for="item of showItems" :key="item.key" placement="right" :disabled="!isCollapsed">
      <template #trigger>
        <div
          class="menu-item"
          :data-key="item.key"
          @click="handleMenuChange(item.key)"
          :class="{ active: currentActiveItem === item.key }"
        >
          <div class="menu-item__inner">
            <NBadge :show="!!item.inProgress" dot>
              <component :is="item.icon" class="menu-item__icon" />
            </NBadge>
            <div class="menu-item__label">{{ item.name }}</div>
          </div>
        </div>
      </template>
      <span class="menu-item-popover">{{ item.name }}</span>
    </NTooltip>
    <div class="indicator-rail"></div>
  </div>
</template>

<script setup lang="ts">
import { NBadge, NTooltip } from 'naive-ui'
import {
  Component as ComponentC,
  computed,
  nextTick,
  ref,
  useTemplateRef,
  watch,
  watchEffect
} from 'vue'

const {
  defaultValue,
  items = [],
  isCollapsed = false
} = defineProps<{
  defaultValue?: string
  isCollapsed?: boolean
  items?: { key: string; icon: ComponentC; name: string; show?: boolean; inProgress?: boolean }[]
}>()

const showItems = computed(() => items.filter((item) => item.show !== false))
const currentActiveItem = defineModel<string>('current')

watchEffect(() => {
  currentActiveItem.value = defaultValue
})

const handleMenuChange = (key: string) => {
  currentActiveItem.value = key
}

const sidebarMenu = useTemplateRef('sidebar-menu')
const indicatorPosition = ref({
  top: 0,
  height: 0
})
const updateIndicatorPosition = () => {
  if (!sidebarMenu.value) {
    return
  }

  const activeItem = sidebarMenu.value.querySelector('.menu-item.active') as HTMLElement
  if (activeItem) {
    const { top: itemTop, height } = activeItem.getBoundingClientRect()
    const { top: sidebarTop } = sidebarMenu.value.getBoundingClientRect()

    const thatHeight = 0.5 * height
    indicatorPosition.value.top = itemTop - sidebarTop + (height - thatHeight) / 2
    indicatorPosition.value.height = thatHeight
  }
}

watch(
  () => currentActiveItem.value,
  () => {
    nextTick(() => updateIndicatorPosition())
  },
  { immediate: true }
)
</script>

<style scoped>
.sidebar-menu {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .indicator-rail {
    position: absolute;
    top: 0;
    left: 4px;
    width: 4px;
    height: 100%;
    pointer-events: none;

    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 4px;
      height: var(--indicator-rail-height);
      top: var(--indicator-top);
      border-radius: 2px;

      /*  now for dark only */
      background-color: #26dd0e;
    }

    &::before {
      transition:
        background-color 0.2s,
        top 0.2s cubic-bezier(0.65, 0, 0.35, 1),
        height 0.2s cubic-bezier(0.65, 0, 0.35, 1);
    }

    &::after {
      transition:
        background-color 0.2s,
        top 0.16s cubic-bezier(0.65, 0, 0.35, 1),
        height 0.16s cubic-bezier(0.65, 0, 0.35, 1);
    }
  }

  /*  dedicated for test page */
  &.rabi-test .indicator-rail {
    &::before,
    &::after {
      background-color: #f94395;
    }
  }
}

.menu-item {
  width: 100%;
  position: relative;
  padding: 0 4px;
  box-sizing: border-box;
  cursor: pointer;

  .menu-item__inner {
    display: flex;
    gap: 4px;
    width: 100%;
    position: relative;
    align-items: center;
    border-radius: 8px;
    transition: background-color 0.2s;
    overflow: hidden;
    padding: 0 4px;
    box-sizing: border-box;
  }

  .menu-item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    width: 36px;
    font-size: 16px;
    transition:
      color 0.2s,
      font-size 0.2s;
    flex-shrink: 0;

    .collapsed & {
      font-size: 18px;
    }
  }

  .menu-item__label {
    font-size: 14px;
    text-wrap-mode: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    transition:
      color 0.2s,
      opacity 0.2s;

    .collapsed & {
      opacity: 0;
    }
  }

  &:hover {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(255, 255, 255, 1);
    }

    .menu-item__inner {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  &:active {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .menu-item__icon,
  .menu-item__label {
    color: rgba(255, 255, 255, 0.45);
  }

  &.active {
    .menu-item__icon,
    .menu-item__label {
      color: #fff;
    }

    .menu-item__inner {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
}

.menu-item-popover {
  font-weight: bold;
  font-size: 14px;
}
</style>
