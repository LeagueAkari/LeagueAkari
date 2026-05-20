<template>
  <div class="grid items-start gap-4 md:grid-cols-2">
    <StoryPanel title="Brand text">
      <div class="flex flex-col gap-3 text-base">
        <LeagueAkariSpan />
        <LeagueAkariSpan bold text="League Akari X" class="text-2xl" />
        <LeagueAkariSpan bold text="98.76" class="text-4xl" />
      </div>
    </StoryPanel>

    <StoryPanel title="Copy and links">
      <div class="flex flex-col gap-3 text-sm">
        <CopyableText text="League Akari debug token" />
        <CopyableText text="EUW1 / Akari#2026">EUW1 / Akari#2026</CopyableText>
        <ExternalLink href="https://github.com/Hanxven/LeagueAkari">Open project page</ExternalLink>
      </div>
    </StoryPanel>

    <StoryPanel title="Tooltip">
      <div class="flex flex-col gap-3 text-sm">
        <TooltipWithIcon tooltip="TooltipWithIcon uses Naive UI popover and no app shard.">
          <span>Plain tooltip trigger</span>
        </TooltipWithIcon>
        <TooltipWithIcon>
          <span>Slot tooltip trigger</span>
          <template #tooltip>
            <div class="max-w-56 text-xs leading-relaxed">
              Slot content can include richer copy, inline layout, or translated text.
            </div>
          </template>
        </TooltipWithIcon>
      </div>
    </StoryPanel>

    <StoryPanel title="Native data image fallback">
      <div class="flex items-center gap-3">
        <ChampionIcon :champion-id="-3" round ring class="size-14 shrink-0" />
        <div class="text-xs text-black/60 dark:text-white/60">
          ChampionIcon can be previewed with local fallback assets when it does not require the LCU
          resource protocol.
        </div>
      </div>
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'

import CopyableText from '../../CopyableText.vue'
import ExternalLink from '../../ExternalLink.vue'
import LeagueAkariSpan from '../../LeagueAkariSpan.vue'
import TooltipWithIcon from '../../TooltipWithIcon.vue'
import StoryPanel from '../StoryPanel.vue'
</script>
