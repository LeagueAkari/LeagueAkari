<template>
  <div class="relative h-full">
    <!-- spinning... -->
    <NSpin v-if="isLoading" class="absolute inset-0 z-10 dark:bg-black/50">
      <template #description>
        <div class="flex flex-col items-center gap-2">
          <NButton size="tiny" secondary @click="cancel">
            {{ t('Opgg.cancel') }}
          </NButton>
        </div>
      </template>
    </NSpin>

    <NScrollbar v-if="champion">
      <!-- summary -->
      <div class="h-18 p-2 dark:border-white/10" v-if="summary">
        <div class="flex items-center gap-3">
          <ChampionIcon
            round
            class="size-14 ring-2 dark:ring-amber-400/80"
            :champion-id="summary.id"
          />

          <!-- T 级 / 名字 / 位置 -->
          <div class="mr-auto">
            <div class="text-lg font-bold">
              {{ lcs.gameData.championName(summary.id) }}
            </div>
            <div
              v-if="summary.average_stats"
              class="text-sm font-bold"
              :class="getTierTextColorClass(summary.average_stats.tier)"
            >
              {{ tierText }}
            </div>
            <div
              class="text-[13px] text-black/80 dark:text-white/80"
              v-if="position && position !== 'none'"
            >
              {{ t(`Opgg.positions.${position}`) || position }}
            </div>
          </div>

          <!-- stats -->
          <div
            class="flex w-[172px] flex-wrap justify-end gap-2 self-end"
            v-if="summary.average_stats"
          >
            <!-- cherry 平均排名 -->
            <div
              class="w-[50px]"
              v-if="summary.average_stats.total_place && summary.average_stats.play"
            >
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('OpggChampion.avgPlace') }}
              </div>
              <div class="text-[13px] font-bold">
                {{
                  (summary.average_stats.total_place / (summary.average_stats.play || 1)).toFixed(2)
                }}
              </div>
            </div>

            <!-- cherry 吃鸡率 -->
            <div
              class="w-[50px]"
              v-if="summary.average_stats.first_place && summary.average_stats.play"
            >
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('OpggChampion.1st') }}
              </div>
              <div class="text-[13px] font-bold">
                {{
                  (
                    (summary.average_stats.first_place / (summary.average_stats.play || 1)) *
                    100
                  ).toFixed(2)
                }}%
              </div>
            </div>

            <!-- 胜率 1 -->
            <div class="w-[50px]" v-if="summary.average_stats.win_rate">
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('OpggChampion.winRate') }}
              </div>
              <div class="text-[13px] font-bold">
                {{ (summary.average_stats.win_rate * 100).toFixed(2) }}%
              </div>
            </div>

            <!-- 备选胜率 2  -->
            <div class="w-[50px]" v-if="summary.average_stats.play && summary.average_stats.win">
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('OpggChampion.winRate') }}
              </div>
              <div class="text-[13px] font-bold">
                {{
                  ((summary.average_stats.win / (summary.average_stats.play || 1)) * 100).toFixed(
                    2
                  )
                }}%
              </div>
            </div>

            <!-- 选取率 -->
            <div class="w-[50px]" v-if="summary.average_stats.pick_rate">
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('OpggChampion.pickRate') }}
              </div>
              <div class="text-[13px] font-bold">
                {{ (summary.average_stats.pick_rate * 100).toFixed(2) }}%
              </div>
            </div>

            <!-- 禁用率 -->
            <div class="w-[50px]" v-if="summary.average_stats.ban_rate">
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('OpggChampion.banRate') }}
              </div>
              <div class="text-[13px] font-bold">
                {{ (summary.average_stats.ban_rate * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- counter 位 -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="thatPosition && thatPosition.counters.length"
      >
        <!-- title line (title + expand) -->
        <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
          {{ isCountersExpanded ? t('OpggChampion.allCounters') : t('OpggChampion.counter') }}
          <NSwitch
            size="small"
            v-model:value="isCountersExpanded"
            :round="false"
            class="mr-2"
            :rail-style="
              ({ checked }) => ({
                backgroundColor: checked ? '#2a947d' : '#d75a5a'
              })
            "
          >
            <template #checked>{{ t('OpggChampion.allC') }}</template>
            <template #unchecked>{{ t('OpggChampion.counterC') }}</template>
          </NSwitch>
        </div>

        <!-- expanded (注意展开和没有展开，用的数据不同。但一般来说既然后 thatPosition 数据，那么 champion.data.counters 数据也应该存在) -->
        <div class="counters flex flex-wrap gap-2" v-if="isCountersExpanded">
          <div
            class="counter flex w-[46px] cursor-pointer flex-col items-center transition-[filter] duration-200 hover:brightness-[1.2]"
            v-if="champion.data.counters"
            @click="setTab('champion', c.champion_id)"
            v-for="c of champion.data.counters?.toSorted(
              (a, b) => b.win / (b.play || 1) - a.win / (a.play || 1)
            )"
            :key="c.champion_id"
          >
            <LcuImage class="image mb-1 h-8 w-8" :src="championIconUri(c.champion_id)" />
            <div
              class="win-rate text-[11px] font-bold text-[#d75a5a]"
              :title="t('OpggChampion.winRate')"
              :class="{ 'text-[#a0c6f8]': c.win / (c.play || 1) > 0.5 }"
            >
              {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
            </div>
            <div class="play text-center text-[10px] text-[#a4a4a4]">
              {{
                t('OpggChampion.times', {
                  times: c.play.toLocaleString()
                })
              }}
            </div>
          </div>

          <div
            class="flex h-16 w-full items-center justify-center text-sm text-white/50 dark:text-white/50"
            v-else
          >
            {{ t('OpggChampion.empty') }}
          </div>
        </div>

        <!-- not expanded -->
        <div class="counters flex flex-wrap gap-2" v-else>
          <div
            class="counter flex w-[46px] cursor-pointer flex-col items-center transition-[filter] duration-200 hover:brightness-[1.2]"
            v-if="thatPosition.counters"
            v-for="c of thatPosition.counters"
            :key="c.champion_id"
            @click="setTab('champion', c.champion_id)"
          >
            <LcuImage class="image mb-1 h-8 w-8" :src="championIconUri(c.champion_id)" />
            <div
              class="win-rate text-[11px] font-bold text-[#d75a5a]"
              :title="t('OpggChampion.winRate')"
            >
              {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
            </div>
            <div class="play text-center text-[10px] text-[#a4a4a4]">
              {{
                t('OpggChampion.times', {
                  times: c.play.toLocaleString()
                })
              }}
            </div>
          </div>

          <!-- empty -->
          <div
            class="flex h-16 w-full items-center justify-center text-sm text-white/50 dark:text-white/50"
            v-else
          >
            {{ t('OpggChampion.empty') }}
          </div>
        </div>
      </div>

      <!-- spells -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="champion.data.summoner_spells && champion.data.summoner_spells.length"
      >
        <!-- title line (title + expand) -->
        <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
          {{ t('OpggChampion.spells') }}
          <NCheckbox size="small" v-model:checked="isSummonerSpellsExpanded">
            {{ t('OpggChampion.showAll') }}
          </NCheckbox>
        </div>

        <!--  summoner spells -->
        <div
          class="mb-1 flex items-center gap-1 last:mb-0"
          v-for="(s, i) of champion.data.summoner_spells.slice(
            0,
            isSummonerSpellsExpanded ? Infinity : 2
          )"
        >
          <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
          <div class="spells flex gap-1">
            <SummonerSpellDisplay :size="28" :spell-id="spell" v-for="spell of s.ids" />
          </div>
          <div class="desc flex flex-1 items-center justify-end">
            <div class="pick flex min-w-[76px] flex-col items-center">
              <span
                class="pick-rate text-xs font-bold text-[#ebebeb]"
                :title="t('OpggChampion.pickRate')"
                >{{ (s.pick_rate * 100).toFixed(2) }}%</span
              >
              <span
                class="pick-play text-center text-xs text-[#bebebe]"
                :title="t('OpggChampion.plays')"
              >
                {{
                  t('OpggChampion.times', {
                    times: s.play.toLocaleString()
                  })
                }}</span
              >
            </div>
            <div
              class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
              :title="t('OpggChampion.winRate')"
            >
              {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
            </div>
            <div class="buttons flex min-w-[76px] justify-center">
              <NButton
                @click="setSummonerSpells(s.ids)"
                size="tiny"
                type="primary"
                secondary
                :disabled="lcs.gameflow.phase !== 'ChampSelect'"
              >
                {{ t('OpggChampion.apply') }}
              </NButton>
            </div>
          </div>
        </div>
      </div>

      <!-- runes -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="champion.data.runes && champion.data.runes.length"
      >
        <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
          {{ t('OpggChampion.runes') }}
          <NCheckbox size="small" v-model:checked="isRunesExpanded">
            {{ t('OpggChampion.showAll') }}
          </NCheckbox>
        </div>

        <!--  runes -->
        <div
          class="mb-3 flex items-center gap-1 last:mb-0"
          v-for="(r, i) of champion.data.runes.slice(0, isRunesExpanded ? Infinity : 2)"
        >
          <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
          <div>
            <div class="primary items.end mb-1 flex gap-[2px]">
              <PerkstyleDisplay class="mr-1" :size="24" :perkstyle-id="r.primary_page_id" />
              <PerkDisplay
                :max-width="280"
                :size="18"
                v-for="p of r.primary_rune_ids"
                :perk-id="p"
              />
            </div>
            <div class="secondary items.end flex gap-[2px]">
              <PerkstyleDisplay
                class="secondary-style mr-1"
                :size="24"
                :perkstyle-id="r.secondary_page_id"
              />
              <PerkDisplay
                :max-width="280"
                :size="18"
                v-for="p of r.secondary_rune_ids"
                :perk-id="p"
              />
              <div class="gap w-6"></div>
              <PerkDisplay :max-width="280" :size="18" v-for="p of r.stat_mod_ids" :perk-id="p" />
            </div>
          </div>
          <div class="desc ml-auto flex items-center">
            <div class="pick flex min-w-[76px] flex-col items-center">
              <span
                class="pick-rate text-xs font-bold text-[#ebebeb]"
                :title="t('OpggChampion.pickRate')"
                >{{ (r.pick_rate * 100).toFixed(2) }}%</span
              >
              <span
                class="pick-play text-center text-xs text-[#bebebe]"
                :title="t('OpggChampion.plays')"
              >
                {{
                  t('OpggChampion.times', {
                    times: r.play.toLocaleString()
                  })
                }}</span
              >
            </div>
            <div
              class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
              :title="t('OpggChampion.winRate')"
            >
              {{ ((r.win / (r.play || 1)) * 100).toFixed(2) }}%
            </div>
            <div class="buttons flex min-w-[76px] justify-center">
              <NButton
                @click="setRunes(r, { championId: champion.data.summary.id, position: position })"
                size="tiny"
                type="primary"
                :disabled="lcs.connectionState !== 'connected'"
                secondary
              >
                {{ t('OpggChampion.apply') }}
              </NButton>
            </div>
          </div>
        </div>
      </div>

      <!-- cherries synergies -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="champion.data.synergies && champion.data.synergies.length"
      >
        <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
          {{ t('OpggChampion.synergies')
          }}<NCheckbox size="small" v-model:checked="isSynergiesExpanded">{{
            t('OpggChampion.showAll')
          }}</NCheckbox>
        </div>
        <div
          class="mb-1 flex items-center gap-1 last:mb-0"
          v-for="(s, i) of champion.data.synergies.slice(0, isSynergiesExpanded ? Infinity : 4)"
        >
          <div class="mr-1 min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
          <div
            class="flex cursor-pointer items-center gap-1 text-xs transition-[filter] duration-200 hover:brightness-[1.2]"
            @click="setTab('champion', s.champion_id)"
          >
            <LcuImage class="image h-6 w-6" :src="championIconUri(s.champion_id)" />
            <span>{{ lcs.gameData.championName(s.champion_id) }}</span>
          </div>
          <div class="desc ml-auto flex items-center">
            <div class="value-text flex min-w-[76px] flex-col items-center">
              <span class="value text-xs font-bold text-[#ebebeb]">{{
                (s.total_place / (s.play || 1)).toFixed(2)
              }}</span>
              <span class="text text-xs text-[#bebebe]">{{ t('OpggChampion.avgPlace') }} </span>
            </div>
            <div class="value-text flex min-w-[76px] flex-col items-center">
              <span class="value text-xs font-bold text-[#ebebeb]"
                >{{ ((s.first_place / (s.play || 1)) * 100).toFixed(2) }}%</span
              >
              <span class="text text-xs text-[#bebebe]">{{ t('OpggChampion.1st') }}</span>
            </div>
            <div class="value-text flex min-w-[76px] flex-col items-center">
              <span
                class="value text-xs font-bold text-[#ebebeb]"
                :title="t('OpggChampion.pickRate')"
                >{{ (s.pick_rate * 100).toFixed(2) }}%</span
              >
              <span class="text text-xs text-[#bebebe]" :title="t('OpggChampion.plays')">
                {{
                  t('OpggChampion.times', {
                    times: s.play.toLocaleString()
                  })
                }}</span
              >
            </div>
            <div class="value-text flex min-w-[76px] flex-col items-center">
              <span
                class="value text-xs font-bold text-[#ebebeb]"
                :title="t('OpggChampion.winRate')"
                >{{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%</span
              >
              <span class="text text-xs text-[#bebebe]" :title="t('OpggChampion.winRate')">{{
                t('OpggChampion.winRate')
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- augments -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="augments && Object.keys(augments).length"
      >
        <NTabs v-model:value="augmentTab" size="small" :animated="false">
          <template #suffix>
            <NCheckbox size="small" v-model:checked="isAugmentsExpanded">
              {{ t('OpggChampion.showAll') }}
            </NCheckbox>
          </template>

          <!-- silver -->
          <NTabPane name="silver" v-if="augments && augments[1]">
            <template #tab>
              <span class="text-xs font-bold">{{ t('OpggChampion.augmentSilver') }}</span>
            </template>
            <div
              class="mb-1 flex items-center gap-1 last:mb-0"
              v-for="(a, i) of augments[1].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
            >
              <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
              <div class="flex items-center gap-1">
                <AugmentDisplay :size="24" :augment-id="a.id" class="mr-1" />
                <span class="name text-xs">{{ lcs.gameData.augmentName(a.id) }}</span>
              </div>
              <div class="desc ml-auto flex items-center">
                <div class="pick flex min-w-[76px] flex-col items-center">
                  <span
                    class="pick-rate text-xs font-bold text-[#ebebeb]"
                    :title="t('OpggChampion.pickRate')"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span
                    class="pick-play text-center text-xs text-[#bebebe]"
                    :title="t('OpggChampion.plays')"
                  >
                    {{
                      t('OpggChampion.times', {
                        times: a.play.toLocaleString()
                      })
                    }}</span
                  >
                </div>
                <div
                  class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
                  :title="t('OpggChampion.winRate')"
                >
                  {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </NTabPane>

          <!-- gold -->
          <NTabPane name="gold" v-if="augments && augments[4]">
            <template #tab>
              <span class="text-xs font-bold">{{ t('OpggChampion.augmentGold') }}</span>
            </template>
            <div
              class="mb-1 flex items-center gap-1 last:mb-0"
              v-for="(a, i) of augments[4].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
            >
              <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
              <div class="flex items-center gap-1">
                <AugmentDisplay :size="24" :augment-id="a.id" class="mr-1" />
                <span class="name text-xs">{{ lcs.gameData.augmentName(a.id) }}</span>
              </div>
              <div class="desc ml-auto flex items-center">
                <div class="pick flex min-w-[76px] flex-col items-center">
                  <span
                    class="pick-rate text-xs font-bold text-[#ebebeb]"
                    :title="t('OpggChampion.pickRate')"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span
                    class="pick-play text-center text-xs text-[#bebebe]"
                    :title="t('OpggChampion.plays')"
                  >
                    {{
                      t('OpggChampion.times', {
                        times: a.play.toLocaleString()
                      })
                    }}</span
                  >
                </div>
                <div
                  class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
                  :title="t('OpggChampion.winRate')"
                >
                  {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </NTabPane>

          <!-- prism -->
          <NTabPane name="prism" v-if="augments && augments[8]">
            <template #tab>
              <span class="text-xs font-bold">{{ t('OpggChampion.augmentPrism') }}</span>
            </template>

            <div
              class="mb-1 flex items-center gap-1 last:mb-0"
              v-for="(a, i) of augments[8].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
            >
              <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
              <div class="flex items-center gap-1">
                <AugmentDisplay :size="24" :augment-id="a.id" class="mr-1" />
                <span class="name text-xs">{{ lcs.gameData.augmentName(a.id) }}</span>
              </div>
              <div class="desc ml-auto flex items-center">
                <div class="pick items.center flex min-w-[76px] flex-col">
                  <span
                    class="pick-rate text-xs font-bold text-[#ebebeb]"
                    :title="t('OpggChampion.pickRate')"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span
                    class="pick-play text-center text-xs text-[#bebebe]"
                    :title="t('OpggChampion.plays')"
                  >
                    {{
                      t('OpggChampion.times', {
                        times: a.play.toLocaleString()
                      })
                    }}</span
                  >
                </div>
                <div
                  class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
                  :title="t('OpggChampion.winRate')"
                >
                  {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </NTabPane>
        </NTabs>
      </div>

      <!-- skills  -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="champion.data.skill_masteries && champion.data.skill_masteries.length"
      >
        <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
          {{ t('OpggChampion.abilityBuild')
          }}<NCheckbox
            v-if="champion.data.skill_masteries.length > 2"
            size="small"
            v-model:checked="isSkillMasteriesExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div
            class="mb-2 flex min-h-[56px] items-center last:mb-0"
            v-for="(m, i) of champion.data.skill_masteries.slice(
              0,
              isSkillMasteriesExpanded ? Infinity : 2
            )"
          >
            <div class="mr-1 min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
            <div>
              <div class="items.center mb-2 flex flex-wrap gap-1">
                <template v-for="(s, i) of m.ids">
                  <div
                    class="skill relative box-border flex h-6 min-w-[24px] items-center justify-center rounded-[4px] px-[2px] text-white"
                    :class="{
                      'bg-[#3f3f46] text-[#00d7b0]': s.startsWith('W'),
                      'bg-[#3f3f46] text-[#01a8fb]': s.startsWith('Q'),
                      'bg-[#3f3f46] text-[#ff8200]': s.startsWith('E'),
                      'bg-[#5f32e6] text-white': s.startsWith('R')
                    }"
                  >
                    {{ s }}
                  </div>
                  <NIcon v-if="i < m.ids.length - 1" class="separator text-[10px] text-[#909090]">
                    <ArrowForwardIosOutlinedIcon />
                  </NIcon>
                </template>
              </div>
              <div class="flex flex-wrap gap-[2px]">
                <!-- display only one group of it -->
                <div
                  class="skill items.center relative box-border flex h-4 min-w-[16px] justify-center rounded-[2px] px-[2px] text-[10px]"
                  :class="{
                    'bg-[#3f3f46] text-[#00d7b0]': s.startsWith('W'),
                    'bg-[#3f3f46] text-[#01a8fb]': s.startsWith('Q'),
                    'bg-[#3f3f46] text-[#ff8200]': s.startsWith('E'),
                    'bg-[#5f32e6] text-white': s.startsWith('R')
                  }"
                  v-for="s of m.builds[0].order"
                >
                  {{ s }}
                </div>
              </div>
            </div>
            <div class="desc items.center ml-auto flex">
              <div class="pick items.center flex min-w-[76px] flex-col">
                <span
                  class="pick-rate text-xs font-bold text-[#ebebeb]"
                  :title="t('OpggChampion.pickRate')"
                  >{{ (m.pick_rate * 100).toFixed(2) }}%</span
                >
                <span
                  class="pick-play text-center text-xs text-[#bebebe]"
                  :title="t('OpggChampion.plays')"
                >
                  {{
                    t('OpggChampion.times', {
                      times: m.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div
                class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
                :title="t('OpggChampion.winRate')"
              >
                {{ ((m.win / (m.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- import item set -->
      <div class="mb-1 rounded border border-[#37373c] p-2 last:mb-0" v-if="canAddItemSet">
        <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
          {{ t('OpggChampion.applyRunesText') }}
        </div>
        <div class="card-content">
          <div class="items.center flex h-10 justify-between">
            <span class="text-[13px]">{{ t('OpggChampion.applyRunes') }}</span>
            <div class="justify.center flex min-w-[76px]">
              <NButton
                size="tiny"
                type="primary"
                secondary
                @click="writeItemSets(champion, { position, mode, region, tier })"
                :disabled="lcs.connectionState !== 'connected'"
              >
                {{ t('OpggChampion.apply') }}
              </NButton>
            </div>
          </div>
        </div>
      </div>

      <!-- starter items -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="champion.data.starter_items && champion.data.starter_items.length"
      >
        <div class="items.center mb-2 flex justify-between text-[13px] font-bold">
          {{ t('OpggChampion.starterItemText')
          }}<NCheckbox
            v-if="champion.data.starter_items.length > 4"
            size="small"
            v-model:checked="isStarterItemsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div
          class="items.center mb-1 flex gap-1 last:mb-0"
          v-for="(s, i) of champion.data.starter_items.slice(
            0,
            isStarterItemsExpanded ? Infinity : 4
          )"
        >
          <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
          <template v-for="(ss, i) of s.ids">
            <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
            <NIcon v-if="i < s.ids.length - 1" class="separator text-[10px] text-[#909090]">
              <ArrowForwardIosOutlinedIcon />
            </NIcon>
          </template>
          <div class="desc items.center ml-auto flex">
            <div class="pick items.center flex min-w-[76px] flex-col">
              <span
                class="pick-rate text-xs font-bold text-[#ebebeb]"
                :title="t('OpggChampion.pickRate')"
                >{{ (s.pick_rate * 100).toFixed(2) }}%</span
              >
              <span
                class="pick-play text-center text-xs text-[#bebebe]"
                :title="t('OpggChampion.plays')"
              >
                {{
                  t('OpggChampion.times', {
                    times: s.play.toLocaleString()
                  })
                }}</span
              >
            </div>
            <div
              class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
              :title="t('OpggChampion.winRate')"
            >
              {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- boots -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="champion.data.boots.length"
      >
        <div class="items.center mb-2 flex justify-between text-[13px] font-bold">
          {{ t('OpggChampion.boots')
          }}<NCheckbox
            v-if="champion.data.boots.length > 4"
            size="small"
            v-model:checked="isBootsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="grid grid-cols-2 gap-x-3">
          <div
            class="items.center mb-1 flex gap-1 last:mb-0"
            v-for="(s, i) of champion.data.boots.slice(0, isBootsExpanded ? Infinity : 4)"
          >
            <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
            <template v-for="(ss, i) of s.ids">
              <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
              <NIcon v-if="i < s.ids.length - 1" class="separator text-[10px] text-[#909090]">
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
            </template>
            <div class="desc items.center ml-auto flex">
              <div class="pick items.center flex min-w-[76px] flex-col">
                <span
                  class="pick-rate text-xs font-bold text-[#ebebeb]"
                  :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span
                  class="pick-play text-center text-xs text-[#bebebe]"
                  :title="t('OpggChampion.plays')"
                >
                  {{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}
                </span>
              </div>
              <div
                class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
                :title="t('OpggChampion.winRate')"
              >
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- prism items -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="champion.data.prism_items && champion.data.prism_items.length"
      >
        <div class="items.center mb-2 flex justify-between text-[13px] font-bold">
          {{ t('OpggChampion.prismItemText')
          }}<NCheckbox
            v-if="champion.data.prism_items.length > 4"
            size="small"
            v-model:checked="isPrismItemsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="grid grid-cols-2 gap-x-3">
          <div
            class="items.center mb-1 flex gap-1 last:mb-0"
            v-for="(s, i) of champion.data.prism_items.slice(
              0,
              isPrismItemsExpanded ? Infinity : 4
            )"
          >
            <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
            <template v-for="(ss, i) of s.ids">
              <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
              <NIcon v-if="i < s.ids.length - 1" class="separator text-[10px] text-[#909090]">
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
            </template>
            <div class="desc items.center ml-auto flex">
              <div class="pick items.center flex min-w-[76px] flex-col">
                <span
                  class="pick-rate text-xs font-bold text-[#ebebeb]"
                  :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span
                  class="pick-play text-center text-xs text-[#bebebe]"
                  :title="t('OpggChampion.plays')"
                >
                  {{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div
                class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
                :title="t('OpggChampion.winRate')"
              >
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- core item -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="champion.data.core_items && champion.data.core_items.length"
      >
        <div class="items.center mb-2 flex justify-between text-[13px] font-bold">
          {{ t('OpggChampion.coreItemText')
          }}<NCheckbox
            v-if="champion.data.core_items.length > 4"
            size="small"
            v-model:checked="isCoreItemsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div
            class="items.center mb-1 flex gap-1 last:mb-0"
            v-for="(s, i) of champion.data.core_items.slice(0, isCoreItemsExpanded ? Infinity : 4)"
          >
            <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
            <template v-for="(ss, i) of s.ids">
              <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
              <NIcon v-if="i < s.ids.length - 1" class="separator text-[10px] text-[#909090]">
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
            </template>
            <div class="desc items.center ml-auto flex">
              <div class="pick items.center flex min-w-[76px] flex-col">
                <span
                  class="pick-rate text-xs font-bold text-[#ebebeb]"
                  :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span
                  class="pick-play text-center text-xs text-[#bebebe]"
                  :title="t('OpggChampion.plays')"
                  >{{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div
                class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
                :title="t('OpggChampion.winRate')"
              >
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- single item 这里翻译过来似乎是最后一件，应该是最佳单件 -->
      <div
        class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
        v-if="champion.data.last_items && champion.data.last_items.length"
      >
        <div class="items.center mb-2 flex justify-between text-[13px] font-bold">
          {{ t('OpggChampion.itemText')
          }}<NCheckbox
            v-if="champion.data.last_items.length > 8"
            size="small"
            v-model:checked="isLastItemsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="grid grid-cols-2 gap-x-3">
          <div
            class="items.center mb-1 flex gap-1 last:mb-0"
            v-for="(s, i) of champion.data.last_items.slice(0, isLastItemsExpanded ? Infinity : 8)"
          >
            <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
            <template v-for="(ss, i) of s.ids">
              <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
              <NIcon v-if="i < s.ids.length - 1" class="separator text-[10px] text-[#909090]">
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
            </template>
            <div class="desc items.center ml-auto flex">
              <div class="pick items.center flex min-w-[76px] flex-col">
                <span
                  class="pick-rate text-xs font-bold text-[#ebebeb]"
                  :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span
                  class="pick-play text-center text-xs text-[#bebebe]"
                  :title="t('OpggChampion.plays')"
                  >{{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}
                </span>
              </div>
              <div
                class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
                :title="t('OpggChampion.winRate')"
              >
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { OpggArenaAugmentGroup } from '@shared/types/opgg'
import { ArrowForwardIosOutlined as ArrowForwardIosOutlinedIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NIcon, NScrollbar, NSpin, NSwitch, NTabPane, NTabs } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useOpgg } from './context'
import { useLoadout } from './utils/loadout'
import { getTierTextColorClass } from './utils/theme'

const { mode, tier, region, champion, position, setTab, cancel, isLoading } = useOpgg()
const { setSummonerSpells, setRunes, writeItemSets } = useLoadout()

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const summary = computed(() => {
  if (!champion.value) {
    return null
  }

  return champion.value.data.summary
})

const augmentTab = ref<string | undefined>('silver')
// OP.GG 使用 rarity 来表示三种不同的 augment 等级
// 1 - silver, 4 - gold, 8 - prism
const augments = computed(() => {
  if (!champion.value || !champion.value.data.augment_group) {
    return null
  }

  return champion.value.data.augment_group.reduce(
    (acc, cur) => {
      acc[cur.rarity] = cur
      return acc
    },
    {} as Record<number, OpggArenaAugmentGroup>
  )
})

watchEffect(() => {
  if (!augments.value) {
    augmentTab.value = undefined
    return
  }

  if (augments.value[1]) {
    augmentTab.value = 'silver'
  } else if (augments.value[4]) {
    augmentTab.value = 'gold'
  } else if (augments.value[8]) {
    augmentTab.value = 'prism'
  } else {
    augmentTab.value = undefined
  }
})

const thatPosition = computed(() => {
  if (!champion.value) {
    return null
  }

  return champion.value.data.summary.positions?.find(
    (p) => p.name.toUpperCase() === position.value?.toUpperCase()
  )
})

const isSummonerSpellsExpanded = ref(false)
const isCountersExpanded = ref(false)
const isRunesExpanded = ref(false)
const isSynergiesExpanded = ref(false)
const isAugmentsExpanded = ref(false)
const isSkillMasteriesExpanded = ref(false)
const isStarterItemsExpanded = ref(false)
const isBootsExpanded = ref(false)
const isPrismItemsExpanded = ref(false)
const isCoreItemsExpanded = ref(false)
const isLastItemsExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isSummonerSpellsExpanded.value = false
    isRunesExpanded.value = false
    isSynergiesExpanded.value = false
    isAugmentsExpanded.value = false
    isSkillMasteriesExpanded.value = false
    isStarterItemsExpanded.value = false
    isBootsExpanded.value = false
    isPrismItemsExpanded.value = false
    isCoreItemsExpanded.value = false
    isLastItemsExpanded.value = false
    isCountersExpanded.value = false
  }
})

const tierText = computed(() => {
  if (!champion.value) {
    return '-'
  }

  const averageStats = champion.value.data.summary.average_stats

  if (!averageStats) {
    return '-'
  }

  if (averageStats.tier === undefined) {
    return '-'
  }

  if (averageStats.tier === 0) {
    return 'OP'
  }

  return t('OpggChampion.tierText', {
    tier: averageStats.tier
  })
})

const canAddItemSet = computed(() => {
  if (!champion.value) {
    return false
  }

  let result = false

  if (champion.value.data.boots && champion.value.data.boots.length) {
    result = true
  }

  if (champion.value.data.starter_items && champion.value.data.starter_items.length) {
    result = true
  }

  if (champion.value.data.core_items && champion.value.data.core_items.length) {
    result = true
  }

  if (champion.value.data.last_items && champion.value.data.last_items.length) {
    result = true
  }

  if (champion.value.data.prism_items && champion.value.data.prism_items.length) {
    result = true
  }

  return result
})
</script>
