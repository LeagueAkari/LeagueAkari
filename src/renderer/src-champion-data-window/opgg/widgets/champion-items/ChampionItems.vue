<template>
  <ItemRecommendations
    v-for="group in groups"
    :key="group.key"
    :title="t(`opgg.champion.${group.title}`)"
    :items="group.items"
    :columns="group.columns"
    :visible-count="group.visibleCount"
  />
  <ChampionItemProgression />
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { useOpgg } from '../../context'
import ItemRecommendations from './ItemRecommendations.vue'
import ChampionItemProgression from './ChampionItemProgression.vue'

const { champion } = useOpgg()
const { t } = useTranslation()

const groups = computed(() => {
  const details = champion.value

  if (!details || details.kind === 'aram_mayhem') {
    return []
  }

  const hasProgression =
    (details.kind === 'ranked' || details.kind === 'flex') &&
    [...details.itemBuildsByOrder.single, ...details.itemBuildsByOrder.combined].some(
      (stage) => stage.builds.length
    )

  return [
    {
      key: 'starter',
      title: 'starterItemText',
      items: details.starterItems,
      columns: 1 as const,
      visibleCount: 4
    },
    {
      key: 'boots',
      title: 'boots',
      items: details.boots,
      columns: 2 as const,
      visibleCount: 4
    },
    ...(details.kind === 'arena'
      ? [
          {
            key: 'prism',
            title: 'prismItemText',
            items: details.prismItems,
            columns: 2 as const,
            visibleCount: 4
          }
        ]
      : []),
    {
      key: 'core',
      title: 'coreItemText',
      items: details.coreItems,
      columns: 1 as const,
      visibleCount: 4
    },
    ...(hasProgression
      ? []
      : [
          {
            key: 'last',
            title: 'itemText',
            items: details.lastItems,
            columns: 2 as const,
            visibleCount: 8
          }
        ])
  ]
})
</script>
