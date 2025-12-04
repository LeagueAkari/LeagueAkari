<template>
  <div class="px-4 py-2 dark:bg-white/5 rounded">
    <!-- Header Section -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-base font-bold text-gray-900 dark:text-white"
        >{{ t('EncounteredGames.title') }} ({{ total }})</span
      >

      <!-- Pagination Controls -->
      <div class="flex items-center gap-1" v-if="total > pageSize">
        <NButton quaternary size="tiny" :disabled="page === 1 || loading" @click="page--">
          <template #icon>
            <NIcon><ArrowLeftIcon /></NIcon>
          </template>
        </NButton>

        <span class="text-11px text-gray-500 dark:text-white/70">
          {{ page }} / {{ Math.ceil(total / pageSize) }}
        </span>

        <NButton
          quaternary
          size="tiny"
          :disabled="page === Math.ceil(total / pageSize) || loading"
          @click="page++"
        >
          <template #icon>
            <NIcon><ArrowRightIcon /></NIcon>
          </template>
        </NButton>
      </div>
    </div>

    <!-- Game List Section -->
    <div class="flex flex-col gap-3" v-if="games.length > 0">
      <div
        class="flex items-center rounded-sm cursor-pointer gap-2"
        v-for="{ game, gameId, recordId } in games"
        :key="gameId"
        @click="handleGameClick(gameId)"
      >
        <div class="flex flex-1 gap-1 flex-col">
          <!-- Game Info Line 1: Type, Queue, Date -->
          <div class="h-4 flex items-end gap-1" v-if="game">
            <div
              class="text-xs font-bold"
              :class="
                game.type === 'enemy'
                  ? 'text-red-600 dark:text-red-300'
                  : 'text-green-700 dark:text-green-300'
              "
              v-if="game.type"
            >
              {{
                game.type === 'enemy'
                  ? t('EncounteredGames.opponent')
                  : t('EncounteredGames.teammate')
              }}
            </div>

            <div
              class="flex-1 w-0 text-xs text-gray-900 dark:text-white/80 text-black font-bold truncate"
            >
              {{ game.queueName }}
            </div>

            <div class="text-11px text-gray-500 dark:text-white/70 ml-auto" v-if="game.date">
              {{ dayjs(game.date).format('MM-DD') }}
            </div>
          </div>
          <NSkeleton v-else :sharp="false" :height="16" />

          <!-- Game Info Line 2: Player Stats -->
          <div v-if="game" class="flex items-end gap-1">
            <!-- Player 1 (Self) -->
            <template v-if="game.p1">
              <ChampionIcon :stretched="false" class="w-5 h-5" :champion-id="game.p1.championId" />
              <div
                class="text-11px font-bold"
                :class="
                  game.p1.win
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-600 dark:text-red-300'
                "
              >
                {{
                  game.p1.placement
                    ? formatPlacement(game.p1.placement)
                    : game.p1.win
                      ? t('EncounteredGames.win')
                      : t('EncounteredGames.lose')
                }}
              </div>
              <div class="text-11px text-gray-500 dark:text-white/70">
                {{ game.p1.kda.join('/') }}
              </div>
            </template>

            <div class="flex-1" v-if="game.p1 && game.p2" />

            <!-- Player 2 (Encountered) -->
            <template v-if="game.p2">
              <ChampionIcon :stretched="false" class="w-5 h-5" :champion-id="game.p2.championId" />
              <div
                class="text-11px font-bold"
                :class="
                  game.p2.win
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-600 dark:text-red-300'
                "
              >
                {{
                  game.p2.placement
                    ? formatPlacement(game.p2.placement)
                    : game.p2.win
                      ? t('EncounteredGames.win')
                      : t('EncounteredGames.lose')
                }}
              </div>
              <div class="text-11px text-gray-500 dark:text-white/70">
                {{ game.p2.kda.join('/') }}
              </div>
            </template>
          </div>
          <NSkeleton v-else :sharp="false" :height="20" />
        </div>

        <!-- Delete Action -->
        <NPopconfirm
          :positive-button-props="{ type: 'warning', size: 'tiny' }"
          :negative-button-props="{ size: 'tiny' }"
          @positive-click="handleDelete(recordId)"
        >
          <template #trigger>
            <NButton size="tiny" quaternary :focusable="false" @click.stop>
              <template #icon>
                <NIcon><DeleteIcon /></NIcon>
              </template>
            </NButton>
          </template>
          {{ t('EncounteredGames.deletePopconfirm') }}
        </NPopconfirm>
      </div>
    </div>

    <!-- Empty State -->
    <div
      class="flex items-center justify-center h-20 text-xs text-gray-500 dark:text-white/70"
      v-else
    >
      <span>{{ t('EncounteredGames.noData') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import {
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Delete as DeleteIcon
} from '@vicons/carbon'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NPopconfirm, NSkeleton } from 'naive-ui'
import { ref } from 'vue'

const { t } = useTranslation()

// Mock Props for now
withDefaults(
  defineProps<{
    pageSize?: number
    loading?: boolean
  }>(),
  {
    pageSize: 5,
    loading: false
  }
)

const page = ref(1)
const total = ref(15)

// Mock Data Generation
const generateMockGame = (id: number) => ({
  recordId: id,
  gameId: 10000 + id,
  game: {
    queueName: 'Ranked Solo/Duo',
    date: new Date(Date.now() - id * 86400000), // days ago
    type: id % 2 === 0 ? 'ally' : 'enemy',
    p1: {
      championId: 1, // Annie
      kda: [5, 2, 10],
      placement: 0,
      win: true
    },
    p2: {
      championId: 2, // Olaf
      kda: [3, 5, 2],
      placement: 0,
      win: false
    }
  }
})

const games = ref(Array.from({ length: 5 }, (_, i) => generateMockGame(i)))

// Methods
const handleGameClick = (gameId: number) => {
  console.log('Game clicked:', gameId)
}

const handleDelete = (recordId: number) => {
  console.log('Delete record:', recordId)
  games.value = games.value.filter((g) => g.recordId !== recordId)
}

const formatPlacement = (placement: number) => {
  return `#${placement}`
}
</script>

<style scoped>
/* UnoCSS handles most styles, minimal custom CSS needed */
</style>
