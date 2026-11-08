<template>
  <div class="query-filter-row shrink-0">
    <Qq101ModeSelect
      :value="preferences.mode"
      :modes="modes"
      :placeholder="t('qq101.mode')"
      @update:value="(mode) => emit('change', { mode, patch: null, position: 'all' })"
    />
    <Qq101BoardSelect v-if="preferences.mode === 'aram_mayhem'" v-model:value="board" />
    <Qq101TierSelect
      v-if="preferences.mode === 'ranked'"
      :value="preferences.tier"
      @update:value="(tier) => emit('change', { tier })"
    />
    <Qq101PositionSelect
      v-if="preferences.mode === 'ranked' || preferences.mode === 'classic'"
      :value="preferences.position"
      :positions="positions"
      @update:value="(position) => emit('change', { position })"
    />
    <Qq101PatchSelect
      v-if="preferences.mode === 'ranked'"
      include-latest
      :value="preferences.patch"
      :patches="patches"
      class="version-filter"
      @update:value="(patch) => emit('change', { patch })"
    />
    <Qq101RoleSelect
      v-if="
        preferences.mode === 'aram' || (preferences.mode === 'aram_mayhem' && board === 'champions')
      "
      v-model:value="role"
    />
    <Qq101RaritySelect
      v-if="preferences.mode === 'aram_mayhem' && board === 'augments'"
      include-unknown
      v-model:value="rarity"
    />
  </div>
</template>
<script setup lang="ts">
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import type { Qq101Role } from '@shared/http-api-axios-helper/qq101'
import '@champion-data-window/components/query-filter/filter-row.css'
import { useTranslation } from 'i18next-vue'
import type { RankingBoard } from '../rankings'
import Qq101ModeSelect from '../filters/Qq101ModeSelect.vue'
import Qq101BoardSelect from '../filters/Qq101BoardSelect.vue'
import Qq101TierSelect from '../filters/Qq101TierSelect.vue'
import Qq101PositionSelect from '../filters/Qq101PositionSelect.vue'
import Qq101PatchSelect from '../filters/Qq101PatchSelect.vue'
import Qq101RoleSelect from '../filters/Qq101RoleSelect.vue'
import Qq101RaritySelect from '../filters/Qq101RaritySelect.vue'

const { preferences, patches } = defineProps<{
  preferences: Qq101ChampionDataPreferences
  patches: string[]
}>()
const emit = defineEmits<{ change: [update: Partial<Qq101ChampionDataPreferences>] }>()
const board = defineModel<RankingBoard>('board', { required: true })
const role = defineModel<Qq101Role>('role', { required: true })
const rarity = defineModel<string>('rarity', { required: true })

const { t } = useTranslation()
const modes = ['ranked', 'aram_mayhem', 'aram', 'classic'] as const
const positions = ['all', 'top', 'jungle', 'middle', 'bottom', 'utility'] as const
</script>
