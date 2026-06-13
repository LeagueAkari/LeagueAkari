<template>
  <div class="box-border flex h-full flex-col px-4 pt-4 pb-2">
    <NScrollbar class="min-h-0 flex-1">
      <div class="mb-4 flex justify-center align-bottom">
        <img
          class="size-40"
          src="@renderer-shared/assets/logo/logo-hollow.svg"
          alt="Logo of League Akari"
        />
      </div>
      <div class="about-para">
        <LeagueAkariSpan bold @click="() => handleClickEasterEgg()" />{{
          t('AboutPane.line1', { version: as.version })
        }}
        <a target="_blank" href="https://riot-api-libraries.readthedocs.io/en/latest/lcu.html"
          >League Client Update (LCU)</a
        >.
        <a
          target="_blank"
          :href="`${LEAGUE_AKARI_GITHUB}?tab=readme-ov-file#4-%E5%8F%82%E8%80%83`"
          >{{ t('AboutPane.line2') }}</a
        >.
      </div>
      <div class="about-para-2">
        <span class="mr-1">GitHub: </span>
        <a target="_blank" :href="LEAGUE_AKARI_GITHUB" class="mr-2">League Akari</a>
        <a target="_blank" :href="LEAGUE_AKARI_GITHUB">
          <img
            alt="GitHub Repo stars"
            src="https://img.shields.io/github/stars/LeagueAkari/LeagueAkari"
        /></a>
      </div>
    </NScrollbar>
    <div class="about-para copyright">
      {{ t('AboutPane.copyright') }}
    </div>
  </div>
</template>

<script setup lang="tsx">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LEAGUE_AKARI_GITHUB } from '@shared/constants/common'
import { useTranslation } from 'i18next-vue'
import { NScrollbar, useMessage } from 'naive-ui'

const { t } = useTranslation()

const as = useAppCommonStore()

const message = useMessage()

const handleClickEasterEgg = () => {
  message.create(() => <LeagueAkariSpan bold />, {
    type: 'success',
    keepAliveOnHover: true
  })
}
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.about-para {
  @apply text-[13px];
}

.about-para-2 {
  @apply mt-1 flex items-center text-[13px];

  img {
    display: block;
  }
}

.copyright {
  @apply mt-2 text-xs text-black/55 dark:text-white/55;
}
</style>
