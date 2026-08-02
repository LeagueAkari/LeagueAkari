<template>
  <div
    class="sidebar-menu"
    :class="{ 'rabi-test': currentActiveItem === 'test' }"
    ref="sidebar-menu"
  >
    <NTooltip v-for="item of showItems" :key="item.key" placement="right" :disabled="!isCollapsed">
      <template #trigger>
        <div
          class="menu-item"
          :data-key="item.key"
          @click="item.isDisabled ? undefined : handleMenuChange(item.key)"
          :class="{ active: currentActiveItem === item.key, disabled: item.isDisabled }"
        >
          <div class="menu-item__inner">
            <NBadge :show="!!item.inProgress" dot :offset="[-6, 8]">
              <component :is="item.icon" class="menu-item__icon" />
            </NBadge>
            <div class="menu-item__label">{{ item.name }}</div>
          </div>
        </div>
      </template>
      <span class="menu-item-popover">{{ item.name }}</span>
    </NTooltip>
    <svg class="indicator-rail" aria-hidden="true" focusable="false">
      <motion.path class="indicator-rail__shape" :d="renderedIndicatorPath" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import { NBadge, NTooltip } from 'naive-ui'
import {
  Component as ComponentC,
  computed,
  onMounted,
  useTemplateRef,
  watch,
  watchEffect
} from 'vue'

import { useSidebarIndicatorMotion } from './use-sidebar-indicator-motion'

const {
  defaultValue,
  items = [],
  isCollapsed = false
} = defineProps<{
  defaultValue?: string
  isCollapsed?: boolean
  items?: {
    key: string
    icon: ComponentC
    name: string
    show?: boolean
    inProgress?: boolean
    isDisabled?: boolean
  }[]
}>()

const showItems = computed(() => items.filter((item) => item.show !== false))
const currentActiveItem = defineModel<string>('current')

watchEffect(() => {
  currentActiveItem.value = defaultValue
})

const sidebarMenu = useTemplateRef('sidebar-menu')
const { renderedIndicatorPath, setIndicatorTarget } = useSidebarIndicatorMotion()

const updateIndicatorTarget = (key?: string) => {
  if (!sidebarMenu.value) {
    return
  }

  const activeItem = key
    ? Array.from(sidebarMenu.value.querySelectorAll<HTMLElement>('.menu-item')).find(
        (item) => item.dataset.key === key
      )
    : sidebarMenu.value.querySelector<HTMLElement>('.menu-item.active')

  if (activeItem) {
    const { top: itemTop, height } = activeItem.getBoundingClientRect()
    const { top: sidebarTop } = sidebarMenu.value.getBoundingClientRect()

    const thatHeight = 0.5 * height
    setIndicatorTarget(itemTop - sidebarTop + (height - thatHeight) / 2, thatHeight)
  }
}

const handleMenuChange = (key: string) => {
  updateIndicatorTarget(key)
  currentActiveItem.value = key
}

onMounted(updateIndicatorTarget)

watch([() => currentActiveItem.value, showItems], () => updateIndicatorTarget(), {
  flush: 'post'
})
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
    left: calc(var(--la-sidebar-icon-horizontal-padding) - 2px);
    width: 8px;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .indicator-rail__shape {
    fill: #1ea90c;
    transition: fill 0.2s;

    [data-theme='dark'] & {
      fill: #26dd0e;
    }
  }

  /*  dedicated for test page */
  &.rabi-test .indicator-rail__shape {
    fill: #f94395;
  }
}

.menu-item {
  width: 100%;
  position: relative;
  padding: 0 var(--la-sidebar-icon-horizontal-padding);
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
    box-sizing: border-box;
  }

  .menu-item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--la-sidebar-icon-height);
    width: calc(var(--la-sidebar-width-collapsed) - var(--la-sidebar-icon-horizontal-padding) * 2);
    font-size: 16px;
    transition:
      color 0.2s,
      font-size 0.2s;
    flex-shrink: 0;

    .collapsed & {
      font-size: 20px;
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

  &.disabled {
    cursor: not-allowed;
  }

  &:hover:not(.disabled) {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(0, 0, 0, 1);

      [data-theme='dark'] & {
        color: rgba(255, 255, 255, 1);
      }
    }

    .menu-item__inner {
      background-color: rgba(0, 0, 0, 0.05);

      [data-theme='dark'] & {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }
  }

  &:active:not(.disabled) {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(0, 0, 0, 0.8);

      [data-theme='dark'] & {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  .menu-item__icon,
  .menu-item__label {
    color: rgba(0, 0, 0, 0.6);

    [data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  &.disabled {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(0, 0, 0, 0.3);

      [data-theme='dark'] & {
        color: rgba(255, 255, 255, 0.3);
      }
    }
  }

  &.active {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(0, 0, 0, 1);

      [data-theme='dark'] & {
        color: rgba(255, 255, 255, 1);
      }
    }

    .menu-item__inner {
      background-color: rgba(0, 0, 0, 0.08);

      [data-theme='dark'] & {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }
  }
}

.menu-item-popover {
  font-weight: bold;
  font-size: 14px;
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) {
  .sidebar-menu .indicator-rail__shape {
    fill: var(--la-color-link);
  }

  .menu-item {
    .menu-item__icon,
    .menu-item__label {
      color: color-mix(in oklch, var(--la-color-text-themed) 84%, transparent);
    }

    &:hover:not(.disabled) {
      .menu-item__icon,
      .menu-item__label {
        color: var(--la-color-text-themed);
      }

      .menu-item__inner {
        background-color: color-mix(in oklch, var(--la-color-link) 12%, transparent);
      }
    }

    &.active {
      .menu-item__icon,
      .menu-item__label {
        color: var(--la-color-text-themed);
      }

      .menu-item__inner {
        background-color: color-mix(in oklch, var(--la-color-link) 18%, transparent);
      }
    }
  }
}
</style>
