<template>
  <div class="common-buttons" :class="{ blurred: mws.focus === 'blurred' }">
    <!-- notice -->
    <NPopover
      :z-index="TITLE_BAR_TOOLTIP_Z_INDEX"
      :show="shouldShowNoticeTooltip || noticeTooltipShow"
      @update:show="(v) => (noticeTooltipShow = v)"
    >
      <template #trigger>
        <div class="common-button-outer" @click="sn.showNoticeModal()">
          <NBadge dot :show="shouldShowNoticeBadge" :offset="[-4, 4]">
            <div class="common-button-inner">
              <NIcon><Notification /></NIcon>
            </div>
          </NBadge>
        </div>
      </template>

      <template v-if="sns.noticeSummary">
        <div>
          <div class="font-bold text-black/80 dark:text-white/80">
            {{ t('titlebar.actions.noticeSummary') }}
          </div>
          <div class="my-2 h-px bg-black/10 dark:bg-white/10"></div>
          <div class="mb-2 max-w-100 text-xs text-black/80 dark:text-white/80">
            {{ sns.noticeSummary }}
          </div>
          <div class="flex justify-end gap-2">
            <NButton
              size="tiny"
              @click="setRead()"
              v-if="
                aks.notice?.severity !== 'low' && sns.lastNoticeRevision !== aks.notice?.revision
              "
              >{{ t('titlebar.actions.noticeOk') }}</NButton
            >
            <NButton size="tiny" type="primary" @click="sn.showNoticeModal()">{{
              t('titlebar.actions.noticeSeeMore')
            }}</NButton>
          </div>
        </div>
      </template>
      <template v-else>
        {{ t('titlebar.actions.notice') }}
      </template>
    </NPopover>

    <!-- github -->
    <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
      <template #trigger>
        <div class="common-button-outer" @click="handleToGithub">
          <div class="common-button-inner">
            <NIcon><LogoGithub /></NIcon>
          </div>
        </div>
      </template>
      {{ t('titlebar.actions.github') }}
    </NTooltip>

    <!-- aux window -->
    <HorizontalExpand :show="aws.settings.enabled" class="h-full">
      <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
        <template #trigger>
          <div class="common-button-outer" @click="handleShowAuxWindow">
            <div class="common-button-inner">
              <NIcon><Window24Filled /></NIcon>
            </div>
          </div>
        </template>
        {{ t('titlebar.actions.auxWindow') }}
      </NTooltip>
    </HorizontalExpand>

    <!-- champion data -->
    <HorizontalExpand :show="ows.settings.enabled" class="h-full">
      <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
        <template #trigger>
          <div class="common-button-outer" @click="handleShowOpggWindow">
            <div class="common-button-inner">
              <NIcon><ChartLineData /></NIcon>
            </div>
          </div>
        </template>
        {{ t('titlebar.actions.opggWindow') }}
      </NTooltip>
    </HorizontalExpand>

    <!-- theme selector -->
    <NDropdown
      trigger="click"
      placement="bottom-end"
      size="small"
      :width="180"
      :z-index="TITLE_BAR_TOOLTIP_Z_INDEX"
      :options="themeDropdownOptions"
      :theme-overrides="{ fontSizeSmall: '12px', optionHeightSmall: '28px' }"
      @select="handleThemeSelect"
    >
      <div class="common-button-outer">
        <div class="common-button-inner">
          <NIcon><ColorPaletteOutline /></NIcon>
        </div>
      </div>
    </NDropdown>
  </div>
</template>

<script setup lang="ts">
import HorizontalExpand from '@renderer-shared/components/HorizontalExpand.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAkariApiStore } from '@renderer-shared/shards/akari-api/store'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import {
  useAuxWindowStore,
  useMainWindowStore,
  useOpggWindowStore
} from '@renderer-shared/shards/window-manager/store'
import { LEAGUE_AKARI_GITHUB } from '@shared/constants/common'
import {
  AppThemeId,
  AppThemeSetting,
  BUILTIN_DARK_THEME_IDS,
  BUILTIN_LIGHT_THEME_IDS,
  getThemeColorTheme,
  isAppThemeSetting
} from '@shared/types/app-theme'
import { ChartLineData, Checkmark, Notification } from '@vicons/carbon'
import { Window24Filled } from '@vicons/fluent'
import { ColorPaletteOutline, LogoGithub } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NBadge, NButton, NDropdown, NIcon, NPopover, NTag, NTooltip } from 'naive-ui'
import { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { computed, h, ref } from 'vue'

import { SimpleNotificationsRenderer } from '@main-window/shards/simple-notifications'
import { useSimpleNotificationsStore } from '@main-window/shards/simple-notifications/store'

const { t } = useTranslation()

const mws = useMainWindowStore()
const aws = useAuxWindowStore()
const ows = useOpggWindowStore()
const aks = useAkariApiStore()
const sns = useSimpleNotificationsStore()
const as = useAppCommonStore()
const wm = useInstance(WindowManagerRenderer)
const sn = useInstance(SimpleNotificationsRenderer)
const app = useInstance(AppCommonRenderer)

const TITLE_BAR_TOOLTIP_Z_INDEX = 75000

const handleShowAuxWindow = () => {
  wm.auxWindow.show()
}

const handleShowOpggWindow = () => {
  wm.opggWindow.show()
}

const handleToGithub = () => {
  window.open(LEAGUE_AKARI_GITHUB, '_blank')
}

const themeToneLabel = (id: AppThemeId) => {
  const colorTheme = getThemeColorTheme(id)
  return t(`titlebar.actions.themeSelector.tone.${colorTheme}`)
}

const selectedThemeIcon = (key: AppThemeSetting) => {
  if (activeThemePresetKey.value !== key) {
    return undefined
  }

  return () =>
    h(NIcon, null, {
      default: () => h(Checkmark)
    })
}

const activeThemePresetKey = computed(() => {
  if (isAppThemeSetting(as.settings.theme)) {
    return as.settings.theme
  }

  return 'dark'
})

const themeToneTag = (id: AppThemeId) => {
  const colorTheme = getThemeColorTheme(id)

  return () =>
    h(
      NTag,
      {
        bordered: false,
        round: true,
        size: 'tiny',
        type: colorTheme === 'light' ? 'success' : 'info'
      },
      {
        default: () => themeToneLabel(id)
      }
    )
}

const createThemeDropdownOption = (id: AppThemeId): DropdownMixedOption => {
  return {
    key: id,
    label: t(`titlebar.actions.themeSelector.presets.${id}`, { defaultValue: id }),
    icon: selectedThemeIcon(id),
    extra: themeToneTag(id)
  }
}

const themeDropdownOptions = computed<DropdownMixedOption[]>(() => {
  return [
    {
      type: 'group',
      key: 'system',
      label: t('titlebar.actions.themeSelector.groups.system'),
      children: [
        {
          key: 'default',
          label: t('titlebar.actions.themeSelector.presets.followSystem'),
          icon: selectedThemeIcon('default')
        }
      ]
    },
    {
      type: 'group',
      key: 'bright-core',
      label: t('titlebar.actions.themeSelector.groups.brightBuiltin'),
      children: BUILTIN_LIGHT_THEME_IDS.map(createThemeDropdownOption)
    },
    {
      type: 'group',
      key: 'dark-core',
      label: t('titlebar.actions.themeSelector.groups.darkBuiltin'),
      children: BUILTIN_DARK_THEME_IDS.map(createThemeDropdownOption)
    }
  ]
})

const handleThemeSelect = (key: string | number) => {
  if (isAppThemeSetting(key)) {
    app.setTheme(key)
  }
}

const shouldShowNoticeBadge = computed(() => {
  return (
    aks.notice !== null &&
    (aks.notice.severity === 'medium' || aks.notice.severity === 'high') &&
    sns.lastNoticeRevision !== aks.notice.revision
  )
})

const noticeTooltipShow = ref(false)
const shouldShowNoticeTooltip = computed(() => {
  return (
    aks.notice !== null &&
    aks.notice.summary &&
    aks.notice.severity === 'medium' &&
    sns.lastNoticeRevision !== aks.notice.revision
  )
})

const setRead = () => {
  sns.lastNoticeRevision = aks.notice?.revision ?? null
}
</script>

<style scoped>
.common-buttons {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;

  &.blurred {
    filter: brightness(0.8);
  }

  .common-button-outer {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 100%;
    cursor: pointer;
    -webkit-app-region: no-drag;
  }

  .common-button-inner {
    padding: 4px;
    border-radius: 2px;
    transition:
      background-color 0.3s,
      color 0.3s;
    font-size: 16px;

    i {
      display: block;
    }
  }

  .common-button-inner-img {
    width: 16px;
    height: 16px;
  }
}

[data-theme='dark'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 1);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .common-button-inner {
      color: rgba(255, 255, 255, 0.86);
    }
  }
}

[data-theme='light'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(0, 0, 0, 0.15);
      color: rgba(0, 0, 0, 1);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .common-button-inner {
      color: rgba(0, 0, 0, 0.86);
    }
  }
}

[data-theme-id='dark'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 1);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .common-button-inner {
      color: rgba(255, 255, 255, 0.86);
    }
  }
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: color-mix(in oklch, var(--la-color-link) 18%, transparent);
      color: var(--la-color-text-themed);
    }

    .common-button-outer:active .common-button-inner {
      background-color: color-mix(in oklch, var(--la-color-link) 12%, transparent);
    }

    .common-button-inner {
      color: color-mix(in oklch, var(--la-color-text-themed) 92%, transparent);
    }
  }
}

[data-theme-id='graphite'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(105, 202, 255, 0.2);
      color: #e2edf7;
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(105, 202, 255, 0.14);
    }

    .common-button-inner {
      color: rgba(226, 237, 247, 0.9);
    }
  }
}

[data-theme-id='sakura'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(212, 90, 134, 0.18);
      color: rgba(49, 44, 52, 0.95);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(212, 90, 134, 0.12);
    }

    .common-button-inner {
      color: rgba(49, 44, 52, 0.86);
    }
  }
}

[data-theme-id='mint'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(36, 136, 115, 0.16);
      color: rgba(33, 45, 42, 0.95);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(36, 136, 115, 0.12);
    }

    .common-button-inner {
      color: rgba(33, 45, 42, 0.88);
    }
  }
}

[data-theme-id='aurora'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(193, 168, 255, 0.2);
      color: #f3f2f8;
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(193, 168, 255, 0.14);
    }

    .common-button-inner {
      color: rgba(243, 242, 248, 0.88);
    }
  }
}

[data-theme-id='butter'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(194, 127, 34, 0.16);
      color: rgba(66, 57, 48, 0.95);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(194, 127, 34, 0.12);
    }

    .common-button-inner {
      color: rgba(66, 57, 48, 0.88);
    }
  }
}
</style>
