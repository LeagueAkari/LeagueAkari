<template>
  <div class="traffic-buttons" :class="{ blurred: mws.focus === 'blurred' }">
    <!-- 目前仍存在的绝赞 bug，最小化的时候无法清除 hover 状态 -->
    <!-- 其他 electron 应用中多少也发现了类似的情况 -->
    <div
      :title="t('titlebar.windowControls.minimize')"
      class="traffic-button minimize"
      @click="handleMinimize"
    >
      <!-- 邪道最小化 -->
      <NIcon style="transform: rotate(90deg)"><DividerShort20RegularIcon /></NIcon>
    </div>
    <div
      :title="
        mws.status === 'normal'
          ? t('titlebar.windowControls.maximize')
          : t('titlebar.windowControls.restore')
      "
      class="traffic-button maximize"
      @click="handleMaximize"
    >
      <NIcon>
        <Maximize24FilledIcon v-if="mws.status === 'normal'" />
        <WindowMultiple16FilledIcon v-else />
      </NIcon>
    </div>
    <div
      :title="t('titlebar.windowControls.close')"
      class="traffic-button close"
      @click="handleClose"
    >
      <NIcon><CloseOutlinedIcon /></NIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useMainWindowStore } from '@renderer-shared/shards/window-manager/store'
import { WindowMultiple16Filled as WindowMultiple16FilledIcon } from '@vicons/fluent'
import { DividerShort20Regular as DividerShort20RegularIcon } from '@vicons/fluent'
import { Maximize24Filled as Maximize24FilledIcon } from '@vicons/fluent'
import { CloseOutlined as CloseOutlinedIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'

const { t } = useTranslation()

// 交通灯按钮
const mws = useMainWindowStore()
const wm = useInstance(WindowManagerRenderer)

const handleMinimize = async () => {
  await wm.mainWindow.minimize()
}

const handleMaximize = async () => {
  if (mws.status === 'normal') {
    await wm.mainWindow.maximize()
  } else {
    await wm.mainWindow.unmaximize()
  }
}

const handleClose = async () => {
  await wm.mainWindow.close()
}
</script>

<style scoped>
.traffic-buttons {
  position: relative;
  height: 100%;
  display: flex;
  -webkit-app-region: no-drag;

  &.blurred {
    filter: brightness(0.8);
  }

  .traffic-button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 48px;
    font-size: 14px;
    transition: all 0.3s;

    /*  special case for close button */
    &.close {
      font-size: 16px;
    }

    &:active {
      filter: brightness(0.85);
    }
  }
}

[data-theme='dark'] {
  .traffic-buttons {
    .traffic-button.minimize {
      &:hover {
        background-color: #fff3;
        color: #fff;
      }
    }

    .traffic-button.maximize {
      &:hover {
        background-color: #fff3;
        color: #fff;
      }
    }

    .traffic-button.close {
      &:hover {
        background-color: #e81123;
        color: #fff;
      }
    }
  }
}

[data-theme='light'] {
  .traffic-buttons {
    .traffic-button.minimize {
      &:hover {
        background-color: rgba(0, 0, 0, 0.162);
        color: #000;
      }
    }

    .traffic-button.maximize {
      &:hover {
        background-color: rgba(0, 0, 0, 0.162);
        color: #000;
      }
    }

    .traffic-button.close {
      &:hover {
        background-color: rgb(194, 0, 0);
        color: #fff;
      }
    }
  }
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) {
  .traffic-buttons {
    .traffic-button.minimize {
      &:hover {
        background-color: color-mix(in oklch, var(--la-color-link) 22%, transparent);
        color: var(--la-color-text-themed);
      }
    }

    .traffic-button.maximize {
      &:hover {
        background-color: color-mix(in oklch, var(--la-color-link) 22%, transparent);
        color: var(--la-color-text-themed);
      }
    }

    .traffic-button.close {
      &:hover {
        background-color: #cc3047;
        color: #fff;
      }
    }
  }
}
</style>
