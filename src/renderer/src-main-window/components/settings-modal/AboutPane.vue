<template>
  <div class="box-border flex h-full flex-col px-4 pt-4 pb-2">
    <NScrollbar class="min-h-0 flex-1">
      <div class="flex flex-col gap-5 pb-4">
        <section class="flex flex-col items-center pt-4 text-center">
          <div class="flex w-full justify-center">
            <img
              class="size-40 drop-shadow-sm"
              src="@renderer-shared/assets/logo/logo-hollow.svg"
              alt="Logo of League Akari"
            />
          </div>
          <div class="mt-3 max-w-xl text-[13px] leading-6 text-black/60 dark:text-white/60">
            <LeagueAkariSpan bold @click="handleClickEasterEgg" />{{
              t('settings.about.descriptionBefore', { version: as.version })
            }}
            <a
              class="text-green-700 underline decoration-green-700/30 underline-offset-2 transition-colors hover:text-green-600 dark:text-green-300 dark:decoration-green-300/30 dark:hover:text-green-200"
              target="_blank"
              href="https://riot-api-libraries.readthedocs.io/en/latest/lcu.html"
              >League Client Update (LCU)</a
            >.
          </div>
        </section>

        <section class="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-2">
          <div class="min-h-16 p-2 text-center text-yellow-600 dark:text-yellow-300">
            <NStatistic :label="t('settings.about.stats.stars')" tabular-nums>
              <template #prefix>
                <NSpin v-if="isFetchingGitHubStats" class="mr-1" :size="16" />
                <NIcon v-else class="mr-1 text-yellow-500"><StarIcon /></NIcon>
              </template>
              <NNumberAnimation
                v-if="!isFetchingGitHubStats && githubStars !== null"
                :from="0"
                :to="githubStars"
                :duration="900"
                show-separator
                locale="en-US"
              />
              <span v-else class="text-black/45 dark:text-white/45">{{ githubStarsText }}</span>
            </NStatistic>
          </div>
          <div class="min-h-16 p-2 text-center">
            <NStatistic :label="t('settings.about.stats.version')">
              <span class="relative inline-block">
                {{ as.version }}
                <NTag
                  v-if="as.isRabiVersion"
                  size="tiny"
                  :bordered="false"
                  class="bg-akari-500/10! text-akari-600! dark:bg-akari-400/15! dark:text-akari-300! absolute! top-[1em] right-[-0.2em] translate-x-full -translate-y-1/3"
                >
                  {{ t('settings.about.stats.rabiTag') }}
                </NTag>
              </span>
            </NStatistic>
          </div>
          <div class="min-h-16 p-2 text-center">
            <NStatistic :label="t('settings.about.stats.license')" value="MIT" />
          </div>
        </section>

        <div class="flex justify-center">
          <NButton
            text
            tag="a"
            :href="LEAGUE_AKARI_GITHUB"
            target="_blank"
            rel="noreferrer"
            size="small"
          >
            <template #icon>
              <NIcon><GithubIcon /></NIcon>
            </template>
            {{ t('settings.about.actions.github') }}
          </NButton>
        </div>
      </div>
    </NScrollbar>
    <div class="mt-2 text-xs text-black/55 dark:text-white/55">
      {{ t('settings.about.copyright') }}
    </div>
  </div>
</template>

<script setup lang="tsx">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LEAGUE_AKARI_GITHUB } from '@shared/constants/common'
import { Github as GithubIcon, Star as StarIcon } from '@vicons/fa'
import axios from 'axios'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NIcon,
  NNumberAnimation,
  NScrollbar,
  NSpin,
  NStatistic,
  NTag,
  useMessage
} from 'naive-ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const { t } = useTranslation()

const as = useAppCommonStore()

const message = useMessage()
const githubStars = ref<number | null>(null)
const isFetchingGitHubStats = ref(false)
let githubStatsController: AbortController | null = null

const GITHUB_REPO_API = 'https://api.github.com/repos/LeagueAkari/LeagueAkari'
const GITHUB_STARS_CACHE_KEY = 'league-akari:github-stars'

interface GitHubRepoStatsResponse {
  stargazers_count?: unknown
}

interface CachedGitHubStars {
  stargazersCount: number
  updatedAt: number
}

const isValidGitHubStars = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

const readCachedGitHubStars = () => {
  try {
    const raw = localStorage.getItem(GITHUB_STARS_CACHE_KEY)
    if (!raw) {
      return null
    }

    const cached = JSON.parse(raw) as Partial<CachedGitHubStars>
    if (isValidGitHubStars(cached.stargazersCount)) {
      return cached.stargazersCount
    }
  } catch {}

  return null
}

const writeCachedGitHubStars = (stargazersCount: number) => {
  try {
    localStorage.setItem(
      GITHUB_STARS_CACHE_KEY,
      JSON.stringify({
        stargazersCount,
        updatedAt: Date.now()
      } satisfies CachedGitHubStars)
    )
  } catch {}
}

const githubStarsText = computed(() => {
  if (isFetchingGitHubStats.value) {
    return t('settings.about.stats.loading')
  }

  return t('settings.about.stats.unknown')
})

const handleClickEasterEgg = () => {
  message.create(() => <LeagueAkariSpan bold />, {
    type: 'success',
    keepAliveOnHover: true
  })
}

const fetchGitHubStats = async () => {
  githubStatsController?.abort()
  githubStars.value = readCachedGitHubStars()
  const controller = new AbortController()
  githubStatsController = controller
  isFetchingGitHubStats.value = true

  try {
    const response = await axios.get<GitHubRepoStatsResponse>(GITHUB_REPO_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      signal: controller.signal
    })

    const data = response.data
    if (isValidGitHubStars(data.stargazers_count)) {
      githubStars.value = data.stargazers_count
      writeCachedGitHubStars(data.stargazers_count)
    }
  } catch (error) {
    if (!axios.isCancel(error) && githubStars.value === null) {
      githubStars.value = null
    }
  } finally {
    if (githubStatsController === controller) {
      githubStatsController = null
      isFetchingGitHubStats.value = false
    }
  }
}

onMounted(fetchGitHubStats)

onUnmounted(() => {
  githubStatsController?.abort()
})
</script>
