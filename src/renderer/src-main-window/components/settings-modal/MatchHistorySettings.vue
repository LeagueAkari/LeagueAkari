<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('MatchHistorySettings.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistorySettings.refreshTabsAfterGameEnds.label')"
        :label-description="t('MatchHistorySettings.refreshTabsAfterGameEnds.description')"
        :label-width="400"
      >
        <NSwitch size="small" v-model:value="mhs.frontendSettings.refreshTabsAfterGameEnds" />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistorySettings.matchHistoryUseSgpApi.label')"
        :label-width="400"
      >
        <template #labelDescription>
          <div>{{ t('MatchHistorySettings.matchHistoryUseSgpApi.description') }}</div>
          <template
            v-if="mhs.frontendSettings.matchHistoryUseSgpApi && lcs.connectionState === 'connected'"
          >
            <div
              v-if="
                sgps.availability.sgpServerId && sgps.availability.serversSupported.matchHistory
              "
              class="sgp-server-hint-ok"
              style="font-weight: bold; user-select: text"
            >
              {{
                t('MatchHistorySettings.matchHistoryUseSgpApi.current', {
                  server: sgps.availability.sgpServerId
                })
              }}
            </div>
            <div class="sgp-server-hint-not-ok" v-else style="font-weight: bold">
              {{
                t('MatchHistorySettings.matchHistoryUseSgpApi.unsupported', {
                  server: sgps.availability.sgpServerId
                })
              }}
            </div>
          </template>
        </template>
        <NSwitch size="small" v-model:value="mhs.frontendSettings.matchHistoryUseSgpApi" />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistorySettings.loadCount.label')"
        :label-description="t('MatchHistorySettings.loadCount.description')"
        :label-width="400"
      >
        <NSelect
          style="width: 120px"
          size="small"
          v-model:value="mhs.frontendSettings.loadCount"
          :options="pageSizeOptions"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NScrollbar, NSelect, NSwitch } from 'naive-ui'

import { usePageSizeOptions } from '@main-window/shards/match-history-tabs'
import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

const { t } = useTranslation()

const mhs = useMatchHistoryTabsStore()
const sgps = useSgpStore()
const lcs = useLeagueClientStore()

const pageSizeOptions = usePageSizeOptions()
</script>

<style scoped>
[data-theme='dark'] {
  .sgp-server-hint-ok {
    color: #63e2b7;
  }

  .sgp-server-hint-not-ok {
    color: rgb(230, 114, 41);
  }
}

[data-theme='light'] {
  .sgp-server-hint-ok {
    color: rgb(24, 129, 94);
  }

  .sgp-server-hint-not-ok {
    color: rgb(166, 116, 58);
  }
}
</style>
