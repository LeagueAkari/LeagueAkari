<template>
  <div class="grid items-start gap-4">
    <StoryPanel
      title="LCU media"
      description="Static assets are resolved by the Storybook AkariResourceProvider from Community Dragon (raw.communitydragon.org). The champion image examples use real LCU asset paths; the video example uses a Community Dragon ability video because match-history fixtures do not include ability media paths."
    >
      <div class="flex flex-wrap items-start gap-5">
        <div class="grid gap-2">
          <div class="resource-label">LCU path</div>
          <LcuImage class="size-16 rounded" src="/lol-game-data/assets/v1/champion-icons/1.png" />
        </div>

        <div class="grid gap-2">
          <div class="resource-label">akari://league-client</div>
          <LcuImage
            class="size-16 rounded"
            src="akari://league-client/lol-game-data/assets/v1/champion-icons/22.png"
          />
        </div>

        <div class="grid gap-2">
          <div class="resource-label">unsupported akari://</div>
          <LcuImage class="size-16 rounded" src="akari://unknown/lol-game-data/assets/test.png" />
        </div>

        <div class="grid gap-2">
          <div class="resource-label">ordinary video URL</div>
          <LcuVideo
            class="h-24 w-42 rounded object-cover"
            src="https://d28xe8vt774jo5.cloudfront.net/champion-abilities/0001/ability_0001_Q1.webm"
            autoplay
            loop
            muted
            playsinline
          />
        </div>
      </div>
    </StoryPanel>

    <StoryPanel
      title="Champion icons"
      description="Champion IDs are extracted from the existing LCU/SGP match-history fixtures. The final icon is the provider-level special case for bravery mode."
    >
      <div class="flex flex-wrap items-center gap-4">
        <ChampionIcon
          v-for="championId of championIds"
          :key="championId"
          :champion-id="championId"
          class="size-14 rounded-lg"
        />
        <ChampionIcon :champion-id="-3" class="size-14 rounded-full" round />
      </div>
    </StoryPanel>

    <StoryPanel
      title="Display resources"
      description="IDs come from current match-history fixtures when those raw values exist. Display names, descriptions, tooltips, icons, and augment rarity are loaded from Community Dragon (raw.communitydragon.org). Empty display components are included at the end of each row."
    >
      <div class="grid gap-5">
        <div class="resource-row">
          <span class="resource-row-label">Items</span>
          <ItemDisplay v-for="itemId of itemIds" :key="itemId" :item-id="itemId" :size="32" />
          <ItemDisplay :item-id="3340" :size="32" is-trinket />
          <ItemDisplay :size="32" />
        </div>

        <div class="resource-row">
          <span class="resource-row-label">Summoner spells</span>
          <SummonerSpellDisplay
            v-for="spellId of spellIds"
            :key="spellId"
            :spell-id="spellId"
            :size="32"
          />
          <SummonerSpellDisplay :size="32" />
        </div>

        <div class="resource-row">
          <span class="resource-row-label">Perks</span>
          <PerkDisplay v-for="perkId of perkIds" :key="perkId" :perk-id="perkId" :size="32" />
          <PerkDisplay :size="32" />
        </div>

        <div class="resource-row">
          <span class="resource-row-label">Perk styles</span>
          <PerkstyleDisplay
            v-for="perkstyleId of perkstyleIds"
            :key="perkstyleId"
            :perkstyle-id="perkstyleId"
            :size="32"
          />
          <PerkstyleDisplay :size="32" />
        </div>

        <div class="resource-row">
          <span class="resource-row-label">Augments</span>
          <AugmentDisplay
            v-for="augmentId of augmentIds"
            :key="augmentId"
            :augment-id="augmentId"
            :size="32"
          />
          <AugmentDisplay :size="32" />
        </div>
      </div>
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import LcuVideo from '@renderer-shared/components/LcuVideo.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'

import StoryPanel from '../StoryPanel.vue'
import { storyGameResourceSamples } from '../match-card/match-card-fixtures'

const { championIds, itemIds, spellIds, perkIds, perkstyleIds, augmentIds } =
  storyGameResourceSamples
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.resource-label {
  @apply text-xs font-medium text-black/60 dark:text-white/60;
}

.resource-row {
  @apply flex flex-wrap items-center gap-2;
}

.resource-row-label {
  @apply w-28 shrink-0 text-xs font-semibold text-black/60 dark:text-white/60;
}
</style>
