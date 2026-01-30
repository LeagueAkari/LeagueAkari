
<template>
  <div class="opgg-champion-wrapper">
    <!-- 真的想不出一点容易组织的结构, 就这样复制粘贴吧 -->
    <div class="sorting-controls">
        <NRadioGroup size="small" v-model:value="opggChampionSortBy">
          <NFlex style="gap: 4px">
            <NRadio value="default" :title="t('default', { ns: 'common' })">{{ t('default', { ns: 'common' }) }}</NRadio>
            <NRadio value="pickRate" :title="t('OpggChampion.pickRate')">{{
                t('OpggChampion.pickRate')
              }}</NRadio>
            <NRadio value="winRate" :title="t('OpggChampion.winRate')">
              {{ t('OpggChampion.winRate') }}
            </NRadio>
          </NFlex>
        </NRadioGroup>
    </div>
    <NSpin v-if="loading" class="spin-mask">
      <template #description>
        <div class="loading-description">
          <NButton size="tiny" secondary @click="emits('cancel')">{{ t('Opgg.cancel') }}</NButton>
        </div>
      </template>
    </NSpin>
    <NScrollbar>
      <div class="card-area" v-if="info">
        <div class="card-content">
          <div class="first-line" :title="info.id === 893 ? t('OpggChampion.adorableRabi') : ''">
            <ChampionIcon ring round class="image" :champion-id="info.id" />
            <div class="name-tier">
              <div class="name">
                {{ lcs.gameData.champions[info.id]?.name || info.id }}
              </div>
              <div class="tier" :class="[[`tier-${info.tier}`]]">
                {{ tierText }}
              </div>
              <div class="position" v-if="props.position && props.position !== 'none'">
                {{ t(`Opgg.positions.${props.position}`) || props.position }}
              </div>
            </div>
            <div class="prop-groups">
              <div class="prop-field" v-if="info.total_place && info.play">
                <div class="prop">{{ t('OpggChampion.avgPlace') }}</div>
                <div class="value">{{ (info.total_place / (info.play || 1)).toFixed(2) }}</div>
              </div>
              <div class="prop-field" v-if="info.first_place && info.play">
                <div class="prop">{{ t('OpggChampion.1st') }}</div>
                <div class="value">
                  {{ ((info.first_place / (info.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
              <div class="prop-field" v-if="info.win_rate">
                <div class="prop">{{ t('OpggChampion.winRate') }}</div>
                <div class="value">{{ (info.win_rate * 100).toFixed(2) }}%</div>
              </div>
              <div class="prop-field" v-if="info.play && info.win">
                <div class="prop">{{ t('OpggChampion.winRate') }}</div>
                <div class="value">{{ ((info.win / (info.play || 1)) * 100).toFixed(2) }}%</div>
              </div>
              <div class="prop-field" v-if="info.pick_rate">
                <div class="prop">{{ t('OpggChampion.pickRate') }}</div>
                <div class="value">{{ (info.pick_rate * 100).toFixed(2) }}%</div>
              </div>
              <div class="prop-field" v-if="info.ban_rate">
                <div class="prop">{{ t('OpggChampion.banRate') }}</div>
                <div class="value">{{ (info.ban_rate * 100).toFixed(2) }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="card-area"
        v-if="
          (info && info.position && info.position.counters?.length) ||
          (data && data.data.counters && data.data.counters.length)
        "
      >
        <div class="card-title">
          {{ isCountersExpanded ? t('OpggChampion.allCounters') : t('OpggChampion.counter') }}
          <NSwitch
            size="small"
            v-model:value="isCountersExpanded"
            :round="false"
            style="margin-right: 8px; /* a little adjustment for a better looking */"
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
        <div class="card-content" v-if="!isCountersExpanded">
          <div class="counters" v-if="info && info.position">
            <div
              class="counter"
              v-for="c of info.position.counters"
              :key="c.champion_id"
              @click="() => emits('showChampion', c.champion_id)"
            >
              <LcuImage class="image" :src="championIconUri(c.champion_id)" />
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="play">
                {{
                  t('OpggChampion.times', {
                    times: c.play.toLocaleString()
                  })
                }}
              </div>
            </div>
          </div>
          <div class="counter-empty" v-else>{{ t('OpggChampion.empty') }}</div>
        </div>
        <div class="card-content" v-if="isCountersExpanded">
          <div class="counters" v-if="data && data.data.counters && data.data.counters.length">
            <div
              class="counter"
              @click="() => emits('showChampion', c.champion_id)"
              v-for="c of data.data.counters.toSorted(
                (a: any, b: any) => b.win / (b.play || 1) - a.win / (a.play || 1)
              )"
              :key="c.champion_id"
            >
              <LcuImage class="image" :src="championIconUri(c.champion_id)" />
              <div
                class="win-rate"
                :title="t('OpggChampion.winRate')"
                :class="{ win: c.win / (c.play || 1) > 0.5 }"
              >
                {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="play">
                {{
                  t('OpggChampion.times', {
                    times: c.play.toLocaleString()
                  })
                }}
              </div>
            </div>
          </div>
          <div class="counter-empty" v-else>{{ t('OpggChampion.empty') }}</div>
        </div>
      </div>
      <div
        class="card-area"
        v-if="data && data.data.summoner_spells && data.data.summoner_spells.length"
      >
        <div class="card-title">
          {{ t('OpggChampion.spells') }}
          <NCheckbox size="small" v-model:checked="isSummonerSpellsExpanded">
            {{ t('OpggChampion.showAll') }}</NCheckbox>
        </div>
        <div class="card-content">
          <div
            class="summoner-spells-group"
            v-for="(s, i) in sortedData('summoner_spells', isSummonerSpellsExpanded, 2)"
            :key="i"
          >
            <div class="index">#{{ i + 1 }}</div>
            <div class="spells">
              <SummonerSpellDisplay :size="28" :spell-id="spell" v-for="spell of s.ids" />
            </div>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="buttons">
                <NButton
                  @click="() => emits('setSummonerSpells', s.ids)"
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
      </div>
      <div class="card-area" v-if="data && data.data.runes && data.data.runes.length">
        <div class="card-title">
          {{ t('OpggChampion.runes') }}
          <NCheckbox size="small" v-model:checked="isRunesExpanded">
            {{ t('OpggChampion.showAll') }}</NCheckbox>
        </div>
        <div class="card-content">
          <div
            class="runes-group"
            v-for="(r, i) in sortedData('runes', isRunesExpanded, 2)"
            :key="i"
          >
            <div class="index">#{{ i + 1 }}</div>
            <div>
              <div class="primary">
                <PerkstyleDisplay
                  style="margin-right: 4px"
                  :size="24"
                  :perkstyle-id="r.primary_page_id"
                />
                <PerkDisplay
                  :max-width="280"
                  :size="28"
                  v-for="p of r.primary_rune_ids"
                  :perk-id="p"
                />
              </div>
              <div class="secondary">
                <PerkstyleDisplay
                  style="margin-right: 4px"
                  class="secondary-style"
                  :size="24"
                  :perkstyle-id="r.secondary_page_id"
                />
                <PerkDisplay
                  :max-width="280"
                  :size="18"
                  v-for="p of r.secondary_rune_ids"
                  :perk-id="p"
                />
                <div class="gap"></div>
                <PerkDisplay :max-width="280" :size="18" v-for="p of r.stat_mod_ids" :perk-id="p" />
              </div>
            </div>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                >{{ (r.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: r.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((r.win / (r.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="buttons">
                <NButton
                  @click="() => emits('setRunes', r)"
                  size="tiny"
                  type="primary"
                  :disabled="lcs.connectionState !== 'connected'"
                  secondary
                >{{ t('OpggChampion.apply') }}
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.synergies && data.data.synergies.length">
        <div class="card-title">
          {{ t('OpggChampion.synergies') }}
          <NCheckbox size="small" v-model:checked="isSynergiesExpanded"
          >{{ t('OpggChampion.showAll') }}</NCheckbox>
        </div>
        <div class="card-content">
          <div
            class="synergies-group"
            v-for="(s, i) in sortedData('synergies', isSynergiesExpanded, 4)"
            :key="i"
          >
            <div class="index" style="margin-right: 4px">#{{ i + 1 }}</div>
            <div class="image-name" @click="() => emits('showChampion', s.champion_id)">
              <LcuImage class="image" :src="championIconUri(s.champion_id)" />
              <span class="name">{{ lcs.gameData.champions[s.champion_id]?.name || s.champion_id }}</span>
            </div>
            <div class="desc">
              <div class="value-text">
                <span class="value">{{ (s.total_place / (s.play || 1)).toFixed(2) }}</span>
                <span class="text">{{ t('OpggChampion.avgPlace') }} </span>
              </div>
              <div class="value-text">
                <span class="value">{{ ((s.first_place / (s.play || 1)) * 100).toFixed(2) }}%</span>
                <span class="text">{{ t('OpggChampion.1st') }}</span>
              </div>
              <div class="value-text">
                <span class="value" :title="t('OpggChampion.pickRate')"
                >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="text" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="value-text">
                <span class="value" :title="t('OpggChampion.winRate')"
                >{{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%</span
                >
                <span class="text" :title="t('OpggChampion.winRate')">{{
                    t('OpggChampion.winRate')
                  }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="augments && Object.keys(augments).length">
        <div class="card-title" v-if="props.isAramMayhem">
          {{ t('OpggChampion.aramMayhemAugments') }}
        </div>
        <NTabs v-model:value="augmentTab" size="small" :animated="false">
          <template #suffix>
            <NCheckbox size="small" v-model:checked="isAugmentsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox>
          </template>
          
          <!-- ARAM Mayhem tier-based tabs: All, Silver, Gold, Prism -->
          <template v-if="props.isAramMayhem">
            <!-- ALL tab -->
            <NTabPane name="all" v-if="augments && augments['all']">
              <template #tab>
                <span class="augments-tab-title">{{ t('OpggChampion.augmentAll') }}</span>
              </template>
              <div
                class="augments-group"
                v-for="(a, i) in sortedData('augments', isAugmentsExpanded, 8, augments['all'].augments)"
                :key="i"
              >
                <div class="index">#{{ i + 1 }}</div>
                <div class="image-name">
                  <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                  <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
                </div>
                <div class="desc">
                  <div class="pick">
                    <span class="tier-badge" :class="`tier-${getTierLabel(a.tier).toLowerCase()}`">{{ getTierLabel(a.tier) }}</span>
                  </div>
                  <div class="pick">
                    <span class="pick-rate" :title="t('OpggChampion.popular')">
                      {{ t('OpggChampion.popular') }}: {{ a.popular }}
                    </span>
                  </div>
                  <div class="win-rate" :title="t('OpggChampion.performance')">
                    {{ t('OpggChampion.performance') }}: {{ a.performance }}
                  </div>
                </div>
              </div>
            </NTabPane>
            
            <!-- Silver tab (Tier 3-5: C, D, E) -->
            <NTabPane name="silver" v-if="augments && augments[1]">
              <template #tab>
                <span class="augments-tab-title">{{ t('OpggChampion.augmentSilver') }}</span>
              </template>
              <div
                class="augments-group"
                v-for="(a, i) in sortedData('augments', isAugmentsExpanded, 6, augments[1].augments)"
                :key="i"
              >
                <div class="index">#{{ i + 1 }}</div>
                <div class="image-name">
                  <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                  <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
                </div>
                <div class="desc">
                  <div class="pick">
                    <span class="tier-badge" :class="`tier-${getTierLabel(a.tier).toLowerCase()}`">{{ getTierLabel(a.tier) }}</span>
                  </div>
                  <div class="pick">
                    <span class="pick-rate" :title="t('OpggChampion.popular')">
                      {{ t('OpggChampion.popular') }}: {{ a.popular }}
                    </span>
                  </div>
                  <div class="win-rate" :title="t('OpggChampion.performance')">
                    {{ t('OpggChampion.performance') }}: {{ a.performance }}
                  </div>
                </div>
              </div>
            </NTabPane>
            
            <!-- Gold tab (Tier 1-2: A, B) -->
            <NTabPane name="gold" v-if="augments && augments[4]">
              <template #tab>
                <span class="augments-tab-title">{{ t('OpggChampion.augmentGold') }}</span>
              </template>
              <div
                class="augments-group"
                v-for="(a, i) in sortedData('augments', isAugmentsExpanded, 6, augments[4].augments)"
                :key="i"
              >
                <div class="index">#{{ i + 1 }}</div>
                <div class="image-name">
                  <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                  <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
                </div>
                <div class="desc">
                  <div class="pick">
                    <span class="tier-badge" :class="`tier-${getTierLabel(a.tier).toLowerCase()}`">{{ getTierLabel(a.tier) }}</span>
                  </div>
                  <div class="pick">
                    <span class="pick-rate" :title="t('OpggChampion.popular')">
                      {{ t('OpggChampion.popular') }}: {{ a.popular }}
                    </span>
                  </div>
                  <div class="win-rate" :title="t('OpggChampion.performance')">
                    {{ t('OpggChampion.performance') }}: {{ a.performance }}
                  </div>
                </div>
              </div>
            </NTabPane>
            
            <!-- Prism tab (Tier 0: S) -->
            <NTabPane name="prism" v-if="augments && augments[8]">
              <template #tab>
                <span class="augments-tab-title">{{ t('OpggChampion.augmentPrism') }}</span>
              </template>
              <div
                class="augments-group"
                v-for="(a, i) in sortedData('augments', isAugmentsExpanded, 6, augments[8].augments)"
                :key="i"
              >
                <div class="index">#{{ i + 1 }}</div>
                <div class="image-name">
                  <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                  <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
                </div>
                <div class="desc">
                  <div class="pick">
                    <span class="tier-badge" :class="`tier-${getTierLabel(a.tier).toLowerCase()}`">{{ getTierLabel(a.tier) }}</span>
                  </div>
                  <div class="pick">
                    <span class="pick-rate" :title="t('OpggChampion.popular')">
                      {{ t('OpggChampion.popular') }}: {{ a.popular }}
                    </span>
                  </div>
                  <div class="win-rate" :title="t('OpggChampion.performance')">
                    {{ t('OpggChampion.performance') }}: {{ a.performance }}
                  </div>
                </div>
              </div>
            </NTabPane>
          </template>
          
          <!-- Regular mode rarity-based tabs -->
          <template v-else>
            <NTabPane name="silver" v-if="augments && augments[1]">
              <template #tab>
                <span class="augments-tab-title">{{ t('OpggChampion.augmentSilver') }}</span>
              </template>
              <div
                class="augments-group"
                v-for="(a, i) in sortedData('augments', isAugmentsExpanded, 4, augments[1].augments)"
                :key="i"
              >
                <div class="index">#{{ i + 1 }}</div>
                <div class="image-name">
                  <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                  <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
                </div>
                <div class="desc">
                  <div class="pick">
                    <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                    >
                    <span class="pick-play" :title="t('OpggChampion.plays')">
                      {{
                        t('OpggChampion.times', {
                          times: a.play.toLocaleString()
                        })
                      }}</span
                    >
                  </div>
                  <div class="win-rate" :title="t('OpggChampion.winRate')">
                    {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                  </div>
                </div>
              </div>
            </NTabPane>
            <NTabPane name="gold" v-if="augments && augments[4]">
              <template #tab>
                <span class="augments-tab-title">{{ t('OpggChampion.augmentGold') }}</span>
              </template>
              <div
                class="augments-group"
                v-for="(a, i) in sortedData('augments', isAugmentsExpanded, 4, augments[4].augments)"
                :key="i"
              >
                <div class="index">#{{ i + 1 }}</div>
                <div class="image-name">
                  <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                  <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
                </div>
                <div class="desc">
                  <div class="pick">
                    <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                    >
                    <span class="pick-play" :title="t('OpggChampion.plays')">
                      {{
                        t('OpggChampion.times', {
                          times: a.play.toLocaleString()
                        })
                      }}</span
                    >
                  </div>
                  <div class="win-rate" :title="t('OpggChampion.winRate')">
                    {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                  </div>
                </div>
              </div>
            </NTabPane>
            <NTabPane name="prism" v-if="augments && augments[8]">
              <template #tab>
                <span class="augments-tab-title">{{ t('OpggChampion.augmentPrism') }}</span>
              </template>
              <div
                class="augments-group"
                v-for="(a, i) in sortedData('augments', isAugmentsExpanded, 4, augments[8].augments)"
                :key="i"
              >
                <div class="index">#{{ i + 1 }}</div>
                <div class="image-name">
                  <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                  <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
                </div>
                <div class="desc">
                  <div class="pick">
                    <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                    >
                    <span class="pick-play" :title="t('OpggChampion.plays')">
                      {{
                        t('OpggChampion.times', {
                          times: a.play.toLocaleString()
                        })
                      }}</span
                    >
                  </div>
                  <div class="win-rate" :title="t('OpggChampion.winRate')">
                    {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                  </div>
                </div>
              </div>
            </NTabPane>
          </template>
        </NTabs>
      </div>
      <div
        class="card-area"
        v-if="data && data.data.skill_masteries && data.data.skill_masteries.length"
      >
        <div class="card-title">
          {{ t('OpggChampion.abilityBuild') }}
          <NCheckbox
            v-if="data.data.skill_masteries.length > 2"
            size="small"
            v-model:checked="isSkillMasteriesExpanded"
          >{{ t('OpggChampion.showAll') }}</NCheckbox>
        </div>
        <div class="card-content">
          <div
            class="skills-group"
            v-for="(m, i) in sortedData('skill_masteries', isSkillMasteriesExpanded, 2)"
            :key="i"
          >
            <div class="index" style="margin-right: 4px">#{{ i + 1 }}</div>
            <div>
              <div class="skill-route">
                <template v-for="(s, i) of m.ids">
                  <div
                    class="skill"
                    :class="{
                      w: s.startsWith('W'),
                      q: s.startsWith('Q'),
                      e: s.startsWith('E'),
                      r: s.startsWith('R')
                    }"
                  >
                    {{ s }}
                  </div>
                  <NIcon v-if="i < m.ids.length - 1" class="separator">
                    <ArrowForwardIosOutlinedIcon />
                  </NIcon>
                </template>
              </div>
              <div class="skill-details">
                <!-- display only one group of it -->
                <div
                  class="skill"
                  :class="{
                    w: s.startsWith('W'),
                    q: s.startsWith('Q'),
                    e: s.startsWith('E'),
                    r: s.startsWith('R')
                  }"
                  v-for="s of m.builds[0].order"
                >
                  {{ s }}
                </div>
              </div>
            </div>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                >{{ (m.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: m.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((m.win / (m.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- inline styled :( -->
      <div class="card-area" v-if="isAbleToAddToItemSet">
        <div class="card-title">{{ t('OpggChampion.applyRunesText') }}</div>
        <div class="card-content">
          <div
            style="display: flex; align-items: center; justify-content: space-between; height: 38px"
          >
            <span style="font-size: 13px">{{ t('OpggChampion.applyRunes') }}</span>
            <div style="min-width: 76px; display: flex; justify-content: center">
              <NButton
                size="tiny"
                type="primary"
                secondary
                @click="emits('addToItemSet')"
                :disabled="lcs.connectionState !== 'connected'"
              >{{ t('OpggChampion.apply') }}
              </NButton>
            </div>
          </div>
        </div>
      </div>
      <div
        class="card-area"
        v-if="data && data.data.starter_items && data.data.starter_items.length"
      >
        <div class="card-title">
          {{ t('OpggChampion.starterItemText') }}
          <NCheckbox
            v-if="data.data.starter_items.length > 4"
            size="small"
            v-model:checked="isStarterItemsExpanded"
          >{{ t('OpggChampion.showAll') }}</NCheckbox>
        </div>
        <div class="card-content">
          <div
            class="items-group"
            v-for="(s, i) in sortedData('starter_items', isStarterItemsExpanded, 4)"
            :key="i"
          >
            <div class="index">#{{ i + 1 }}</div>
            <template v-for="(ss, i) of s.ids">
              <ItemDisplay :size="32" :item-id="ss" :max-width="300" />
              <NIcon v-if="i < s.ids.length - 1" class="separator">
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
              <span v-if="s.ids.length === 1" class="items-title">{{ lcs.gameData.items[ss]?.name || ss }}</span>
            </template>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.starter_items && data.data.boots.length">
        <div class="card-title">
          鞋子
          <NCheckbox
            v-if="data.data.boots.length > 4"
            size="small"
            v-model:checked="isBootsExpanded"
          >{{ t('OpggChampion.showAll') }}</NCheckbox>
        </div>
        <div class="card-content">
          <div class="double-columns">
            <div
              class="items-group"
              v-for="(s, i) in sortedData('boots', isBootsExpanded, 4)"
              :key="i"
            >
              <div class="index">#{{ i + 1 }}</div>
              <template v-for="(ss, i) of s.ids">
                <ItemDisplay :size="32" :item-id="ss" :max-width="300" />
                <NIcon v-if="i < s.ids.length - 1" class="separator">
                  <ArrowForwardIosOutlinedIcon />
                </NIcon>
                <span v-if="s.ids.length === 1" class="items-title">{{ lcs.gameData.items[ss]?.name || ss }}</span>
              </template>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" :title="t('OpggChampion.plays')">
                    {{
                      t('OpggChampion.times', {
                        times: s.play.toLocaleString()
                      })
                    }}
                  </span>
                </div>
                <div class="win-rate" :title="t('OpggChampion.winRate')">
                  {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.prism_items && data.data.prism_items.length">
        <div class="card-title">
          {{ t('OpggChampion.prismItemText') }}
          <NCheckbox
            v-if="data.data.prism_items.length > 4"
            size="small"
            v-model:checked="isPrismItemsExpanded"
          >{{ t('OpggChampion.showAll') }}</NCheckbox>
        </div>
        <div class="card-content">
          <div class="double-columns">
            <div
              class="items-group"
              v-for="(s, i) in sortedData('prism_items', isPrismItemsExpanded, 4)"
              :key="i"
            >
              <div class="index">#{{ i + 1 }}</div>
              <template v-for="(ss, i) of s.ids">
                <ItemDisplay :size="32" :item-id="ss" :max-width="300" />
                <NIcon v-if="i < s.ids.length - 1" class="separator">
                  <ArrowForwardIosOutlinedIcon />
                </NIcon>
                <span v-if="s.ids.length === 1" class="items-title">{{ lcs.gameData.items[ss]?.name || ss }}</span>
              </template>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" :title="t('OpggChampion.plays')">
                    {{
                      t('OpggChampion.times', {
                        times: s.play.toLocaleString()
                      })
                    }}</span
                  >
                </div>
                <div class="win-rate" :title="t('OpggChampion.winRate')">
                  {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.starter_items && coreItems.length">
        <div class="card-title">
          {{ t('OpggChampion.coreItemText') }}
          <NCheckbox
            v-if="coreItems.length > 4"
            size="small"
            v-model:checked="isCoreItemsExpanded"
          >{{ t('OpggChampion.showAll') }}</NCheckbox>
        </div>
        <div class="card-content">
          <div
            class="items-group"
            v-for="(s, i) in sortedData('core_items', isCoreItemsExpanded, 5, coreItems)"
            :key="i"
          >
            <div class="index">#{{ i + 1 }}</div>
            <template v-for="(ss, i) of s.ids">
              <ItemDisplay :size="32" :item-id="ss" :max-width="300" />
              <NIcon v-if="i < s.ids.length - 1" class="separator">
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
            </template>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">{{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}</span>
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.starter_items && data.data.last_items.length">
        <div class="card-title">
          {{ t('OpggChampion.itemText') }}
          <NCheckbox
            v-if="data.data.last_items.length > 8"
            size="small"
            v-model:checked="isLastItemsExpanded"
          >{{ t('OpggChampion.showAll') }}</NCheckbox>
        </div>
        <div class="card-content">
          <div class="double-columns">
            <div
              class="items-group"
              v-for="(s, i) in sortedData('last_items', isLastItemsExpanded, 8)"
              :key="i"
            >
              <div class="index">#{{ i + 1 }}</div>
              <template v-for="(ss, i) of s.ids">
                <ItemDisplay :size="32" :item-id="ss" :max-width="300" />
                <NIcon v-if="i < s.ids.length - 1" class="separator">
                  <ArrowForwardIosOutlinedIcon />
                </NIcon>
                <span v-if="s.ids.length === 1" class="items-title">{{ lcs.gameData.items[ss]?.name || ss }}</span>
              </template>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" :title="t('OpggChampion.plays')"
                  >{{
                      t('OpggChampion.times', {
                        times: s.play.toLocaleString()
                      })
                    }}
                  </span>
                </div>
                <div class="win-rate" :title="t('OpggChampion.winRate')">
                  {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
                </div>
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
import { ArrowForwardIosOutlined as ArrowForwardIosOutlinedIcon } from '@vicons/material'
import { useLocalStorage } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NFlex, NIcon, NRadio, NRadioGroup, NScrollbar, NSpin, NSwitch, NTabPane, NTabs } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

const props = defineProps<{
  region?: string
  tier?: string
  mode?: string
  position?: string
  version?: string
  loading?: boolean
  champion?: any
  data?: any
  isAbleToAddToItemSet?: boolean
  isAramMayhem?: boolean
  aramAugmentsData?: any
}>()

const emits = defineEmits<{
  showChampion: [championId: number]
  setSummonerSpells: [ids: number[]]
  setRunes: [
    runes: {
      primary_page_id: number
      secondary_page_id: number
      primary_rune_ids: number[]
      secondary_rune_ids: number[]
      stat_mod_ids: number[]
    }
  ]
  addToItemSet: []
  cancel: []
}>()

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const info = computed(() => {
  if (!props.champion) {
    return null
  }

  if (props.mode === 'ranked') {
    const position = props.champion.positions?.find(
      (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
    )

    return {
      id: props.champion.id,
      pick_rate: position?.stats?.pick_rate,
      win_rate: position?.stats?.win_rate,
      ban_rate: position?.stats?.ban_rate,
      tier: position?.stats?.tier_data?.tier,
      position: position
    }
  }

  return {
    id: props.champion.id,
    pick_rate: props.champion.average_stats?.pick_rate,
    win_rate: props.champion.average_stats?.win_rate,
    ban_rate: props.champion.average_stats?.ban_rate,
    tier: props.champion.average_stats?.tier,
    first_place: props.champion.average_stats?.first_place,
    total_place: props.champion.average_stats?.total_place,
    play: props.champion.average_stats?.play,
    win: props.champion.average_stats?.win
  }
})

// OP.GG 使用 rarity 来表示三种不同的 augment 等级
// 1 - silver, 4 - gold, 8 - prism
// For ARAM: Mayhem, the API returns tier 0-5 in the augment data
const augments = computed(() => {
  // For ARAM: Mayhem mode, use ARAM augments data with new structure
  if (props.isAramMayhem && props.aramAugmentsData) {
    if (!props.aramAugmentsData.data || props.aramAugmentsData.data.length === 0) {
      return null
    }
    
    // Group augments for All, Silver, Gold, Prism tabs
    // Based on actual augment rarity from lcs.gameData.augments[id].rarity
    const groupedAugments: any = {
      all: {
        rarity: 'all',
        augments: props.aramAugmentsData.data.map((a: any) => ({
          id: a.id,
          tier: a.tier,
          performance: a.performance,
          popular: a.popular,
          // For compatibility with display template
          pick_rate: a.popular,
          play: a.popular,
          win: a.performance
        }))
      }
    }
    
    // Group by actual augment rarity from game data
    const prismAugments: any[] = []
    const goldAugments: any[] = []
    const silverAugments: any[] = []
    
    props.aramAugmentsData.data.forEach((a: any) => {
      const augmentData = lcs.gameData.augments[a.id]
      const mappedAugment = {
        id: a.id,
        tier: a.tier,
        performance: a.performance,
        popular: a.popular,
        pick_rate: a.popular,
        play: a.popular,
        win: a.performance
      }
      
      if (augmentData?.rarity === 'kPrismatic') {
        prismAugments.push(mappedAugment)
      } else if (augmentData?.rarity === 'kGold') {
        goldAugments.push(mappedAugment)
      } else if (augmentData?.rarity === 'kSilver') {
        silverAugments.push(mappedAugment)
      }
    })
    
    // Prism: kPrismatic rarity
    if (prismAugments.length > 0) {
      groupedAugments[8] = {
        rarity: 8,
        augments: prismAugments
      }
    }
    
    // Gold: kGold rarity
    if (goldAugments.length > 0) {
      groupedAugments[4] = {
        rarity: 4,
        augments: goldAugments
      }
    }
    
    // Silver: kSilver rarity
    if (silverAugments.length > 0) {
      groupedAugments[1] = {
        rarity: 1,
        augments: silverAugments
      }
    }
    
    return Object.keys(groupedAugments).length > 0 ? groupedAugments : null
  }
  
  // Regular mode: use augments from the main data
  if (!props.data) {
    return null
  }

  if (!props.data.data.augment_group) {
    return null
  }

  return props.data.data.augment_group.reduce((acc: any, cur: any) => {
    acc[cur.rarity] = cur
    return acc
  }, {})
})

// Combine Arena core_items with ARAM core_items in ARAM: Mayhem mode
const coreItems = computed(() => {
  // Regular mode: use core_items from the main data
  if (!props.data) {
    return []
  }
  
  return props.data.data.core_items || []
})

const augmentTab = ref<string | undefined>('all')
watchEffect(() => {
  if (!augments.value) {
    augmentTab.value = undefined
    return
  }

  // For ARAM Mayhem, default to 'all' tab
  if (props.isAramMayhem && augments.value['all']) {
    augmentTab.value = 'all'
  } else if (augments.value[4]) {
    augmentTab.value = 'gold'
  } else if (augments.value[1]) {
    augmentTab.value = 'silver'
  } else if (augments.value[8]) {
    augmentTab.value = 'prism'
  } else {
    augmentTab.value = undefined
  }
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

const opggChampionSortBy = useLocalStorage('opgg-sort-by', 'default')

watchEffect(() => {
  if (!props.data) {
    isSummonerSpellsExpanded.value = false
    isRunesExpanded.value = false
    isSynergiesExpanded.value = false
    isAugmentsExpanded.value = true
    isSkillMasteriesExpanded.value = false
    isStarterItemsExpanded.value = false
    isBootsExpanded.value = false
    isPrismItemsExpanded.value = true
    isCoreItemsExpanded.value = false
    isLastItemsExpanded.value = true
    isCountersExpanded.value = false
  }
})

// Helper function to sort and slice the data without modifying original data
const sortedData = (key: string, isExpanded: boolean, limit: number, customData: any[] = []) => {
  const data = customData.length ? customData : props.data.data[key]

  // Create a shallow copy of the data to preserve the original array
  let sortedItems = [...data]

  // For ARAM Mayhem augments, sort based on opggChampionSortBy
  if (props.isAramMayhem && key === 'augments' && customData.length) {
    if (opggChampionSortBy.value === 'pickRate') {
      // Sort by popular (descending)
      sortedItems.sort((a: any, b: any) => {
        const popularA = a.popular || 0
        const popularB = b.popular || 0
        return popularB - popularA
      })
    } else if (opggChampionSortBy.value === 'winRate') {
      // Sort by performance (descending)
      sortedItems.sort((a: any, b: any) => {
        const performanceA = a.performance || 0
        const performanceB = b.performance || 0
        return performanceB - performanceA
      })
    }
    // If 'default', keep original order (no sorting)
  } else if (opggChampionSortBy.value !== 'default') {
    // Apply sorting based on a selected criterion for regular mode
    sortedItems.sort((a: any, b: any) => {
      switch (opggChampionSortBy.value) {
        case 'pickRate': {
          const pickRateA = a.pick_rate || 0
          const pickRateB = b.pick_rate || 0
          return pickRateB - pickRateA // Sort by pick rate in descending order
        }
        case 'winRate': {
          const winRateA = a.win / (a.play || 1)
          const winRateB = b.win / (b.play || 1)
          return winRateB - winRateA // Sort by win rate in descending order
        }
        default:
          return 0
      }
    })
  }

  // Slice the sorted array to get the first `limit` elements (or all if expanded)
  return sortedItems.slice(0, isExpanded ? Infinity : limit)
}

// Helper function to get tier label (S, A, B, C, D, E) from tier number (0-5)
const getTierLabel = (tier: number): string => {
  const labels = ['S', 'A', 'B', 'C', 'D', 'E']
  return labels[tier] || 'E'
}

const tierText = computed(() => {
  if (!info.value) {
    return '-'
  }

  if (info.value.tier === undefined) {
    return '-'
  }

  if (info.value.tier === 0) {
    return 'OP'
  }

  return t('OpggChampion.tierText', {
    tier: info.value.tier
  })
})

if (import.meta.env.DEV) {
  watchEffect(() => {
    console.debug('OPGG Component: ', props.data, props.champion, info.value)
  })

  watchEffect(() => {
    console.debug('OPGG Component: Info', info.value)
  })
}
</script>

<style lang="less" scoped>
.opgg-champion-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;

  [data-theme='dark'] .spin-mask {
    background-color: rgba(0, 0, 0, 0.5);
  }

  [data-theme='light'] .spin-mask {
    background-color: rgba(255, 255, 255, 0.6);
  }

  .spin-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
  }

  .loading-description {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .cancel-button {
      margin-top: 8px;
    }
  }
}

.sorting-controls {
  text-align: right;
}

[data-theme='dark'] .card-area {
  border: 1px solid #37373c;
  background-color: rgba(0, 0, 0, 0.2);
}

[data-theme='light'] .card-area {
  border: 1px solid #d0d0d0;
  background-color: rgba(255, 255, 255, 0.5);
}

.card-area {
  border-radius: 2px;
  padding: 8px 8px;

  .card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  [data-theme='dark']&.toggle-to-current {
    background-color: #1b4e71;
  }

  [data-theme='light']&.toggle-to-current {
    background-color: #e4f4ff;
  }

  &.toggle-to-current {
    cursor: pointer;
  }
}

.skill-route {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  align-items: center;
  flex-wrap: wrap;

  .skill {
    position: relative;
    padding: 0 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    min-width: 24px;
    height: 24px;
    border-radius: 4px;
    box-sizing: border-box;
  }

  [data-theme='dark'] .separator {
    color: #909090;
  }

  [data-theme='light'] .separator {
    color: #6a6a6a;
  }

  .separator {
    font-size: 10px;
  }
}

.skill-details {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;

  .skill {
    position: relative;
    display: flex;
    padding: 0 2px;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    font-size: 10px;
    border-radius: 2px;
    box-sizing: border-box;
  }
}

[data-theme='dark'] .skill.w {
  color: #00d7b0;
  background-color: #3f3f46;
}

[data-theme='light'] .skill.w {
  color: #00d7b0;
  background-color: #e0e0e7;
}

[data-theme='dark'] .skill.q {
  color: #01a8fb;
  background-color: #3f3f46;
}

[data-theme='light'] .skill.q {
  color: #01a8fb;
  background-color: #e0e0e7;
}

[data-theme='dark'] .skill.e {
  color: #ff8200;
  background-color: #3f3f46;
}

[data-theme='light'] .skill.e {
  color: #ff8200;
  background-color: #e0e0e7;
}

[data-theme='dark'] .skill.r {
  color: white;
  background-color: #5f32e6;
}

[data-theme='light'] .skill.r {
  color: white;
  background-color: #8a5df6;
}

.first-line {
  display: flex;
  align-items: center;
  gap: 8px;

  .image {
    width: 78px;
    height: 78px;
  }

  .prop-groups {
    display: flex;
    flex-wrap: wrap;
    align-self: flex-end;
    gap: 8px;
    justify-content: flex-end;
    width: 172px;
  }

  .name-tier {
    margin-right: auto;
  }

  .name {
    font-size: 18px;
    font-weight: bold;
  }

  [data-theme='dark'] .position {
    color: #c9c9c9;
  }

  [data-theme='light'] .position {
    color: #5a5a5a;
  }

  .position {
    font-size: 13px;
  }

  .prop-field {
    width: 50px;
  }

  [data-theme='dark'] .tier {
    color: #c9c9c9;
  }

  [data-theme='light'] .tier {
    color: #5a5a5a;
  }

  .tier {
    font-size: 14px;
  }

  [data-theme='dark'] .prop {
    color: #b2b2b2;
  }

  [data-theme='light'] .prop {
    color: #6a6a6a;
  }

  .prop {
    font-size: 11px;
  }

  .value {
    font-size: 13px;
    font-weight: bold;
  }
}

.summoner-spells-group {
  display: flex;
  gap: 4px;
  align-items: center;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .spells {
    display: flex;
    gap: 4px;
  }

  .desc {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex: 1;
  }

  .pick {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 76px;

    [data-theme='dark'] .pick-rate {
      color: #ebebeb;
    }

    [data-theme='light'] .pick-rate {
      color: #758592;
    }

    .pick-rate {
      font-size: 12px;
      font-weight: bold;
    }

    [data-theme='dark'] .pick-play {
      color: #bebebe;
    }

    [data-theme='light'] .pick-play {
      color: #5a5a5a;
    }

    .pick-play {
      font-size: 12px;
      text-align: center;
    }
  }

  [data-theme='dark'] .win-rate {
    color: #a0c6f8;
  }

  [data-theme='light'] .win-rate {
    color: #0969da;
  }

  .win-rate {
    min-width: 76px;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
  }

  .buttons {
    display: flex;
    min-width: 76px;
    justify-content: center;
  }
}

.tier {
  font-weight: bold;
  font-size: 14px;

  &.tier-0 {
    color: #ff7300;
  }

  &.tier-1 {
    color: #0093ff;
  }

  &.tier-2 {
    color: #00bba3;
  }

  &.tier-3 {
    color: #ffb900;
  }

  &.tier-4 {
    color: #9aa4af;
  }

  &.tier-5 {
    color: #a88a67;
  }

  &.tier-6 {
    color: rgb(85, 34, 83);
  }
}

.card-content {
  [data-theme='dark'] .counter-empty {
    color: #a4a4a4;
  }

  [data-theme='light'] .counter-empty {
    color: #5c5c5c;
  }

  .counter-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 20px;
    font-size: 12px;
  }
}

.counters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 46px;
    cursor: pointer;
    transition: filter 0.2s;

    &:hover {
      filter: brightness(1.2);
    }

    .image {
      width: 32px;
      height: 32px;
      margin-bottom: 4px;
    }

    .win-rate {
      font-size: 11px;
      font-weight: bold;
      color: #d75a5a;
    }

    .win-rate.win {
      color: #a0c6f8;
    }

    [data-theme='dark'] .play {
      color: #a4a4a4;
    }

    [data-theme='light'] .play {
      color: #6a6a6a;
    }

    .play {
      font-size: 10px;
      text-align: center;
    }
  }
}

.skills-group {
  display: flex;
  align-items: center;
  min-height: 56px;

  &:not(:last-child) {
    margin-bottom: 8px;
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .pick {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      [data-theme='dark'] .pick-rate {
        color: #ebebeb;
      }

      [data-theme='light'] .pick-rate {
        color: #758592;
      }

      .pick-rate {
        font-size: 12px;
        font-weight: bold;
      }

      [data-theme='dark'] .pick-play {
        color: #bebebe;
      }

      [data-theme='light'] .pick-play {
        color: #5a5a5a;
      }

      .pick-play {
        font-size: 12px;
        text-align: center;
      }
    }

    [data-theme='dark'] .win-rate {
      color: #a0c6f8;
    }

    [data-theme='light'] .win-rate {
      color: #0969da;
    }

    .win-rate {
      min-width: 76px;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
    }
  }
}

.runes-group {
  display: flex;
  align-items: center;
  gap: 4px;

  .primary {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    margin-bottom: 4px;
  }

  .secondary {
    display: flex;
    gap: 2px;
    align-items: flex-end;
  }

  &:not(:last-child) {
    margin-bottom: 12px;
  }

  .gap {
    width: 24px;
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .pick {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      [data-theme='dark'] .pick-rate {
        color: #ebebeb;
      }

      [data-theme='light'] .pick-rate {
        color: #758592;
      }

      .pick-rate {
        font-size: 12px;
        font-weight: bold;
      }

      [data-theme='dark'] .pick-play {
        color: #bebebe;
      }

      [data-theme='light'] .pick-play {
        color: #5a5a5a;
      }

      .pick-play {
        font-size: 12px;
        text-align: center;
      }
    }

    [data-theme='dark'] .win-rate {
      color: #a0c6f8;
    }

    [data-theme='light'] .win-rate {
      color: #0969da;
    }

    .win-rate {
      min-width: 76px;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
    }

    .buttons {
      display: flex;
      min-width: 76px;
      justify-content: center;
    }
  }
}

.items-group {
  gap: 4px;
  display: flex;
  align-items: center;
  margin-bottom: 4px;

  [data-theme='dark'] .separator {
    color: #909090;
  }

  [data-theme='light'] .separator {
    color: #6a6a6a;
  }

  .separator {
    font-size: 10px;
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .pick {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      [data-theme='dark'] .pick-rate {
        color: #ebebeb;
      }

      [data-theme='light'] .pick-rate {
        color: #758592;
      }

      .pick-rate {
        font-size: 12px;
        font-weight: bold;
      }

      [data-theme='dark'] .pick-play {
        color: #bebebe;
      }

      [data-theme='light'] .pick-play {
        color: #5a5a5a;
      }

      .pick-play {
        font-size: 12px;
        text-align: center;
      }
    }

    [data-theme='dark'] .win-rate {
      color: #a0c6f8;
    }

    [data-theme='light'] .win-rate {
      color: #0969da;
    }

    .win-rate {
      min-width: 76px;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
    }
  }
}

.synergies-group {
  display: flex;
  align-items: center;
  gap: 4px;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .image-name {
    display: flex;
    align-items: center;
    font-size: 12px;
    gap: 4px;
    cursor: pointer;
    transition: filter 0.2s;

    &:hover {
      filter: brightness(1.2);
    }

    .image {
      width: 24px;
      height: 24px;
    }

    .name {
      font-size: 0.75rem;
      font-weight: bold;
      color: var(--gray-light);
      margin-left: 0.5rem;
    }
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .value-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      [data-theme='dark'] .value {
        color: #ebebeb;
      }

      [data-theme='light'] .value {
        color: #2d2d2d;
      }

      .value {
        font-size: 12px;
        font-weight: bold;
      }

      [data-theme='dark'] .text {
        color: #bebebe;
      }

      [data-theme='light'] .text {
        color: #5a5a5a;
      }

      .text {
        font-size: 12px;
      }
    }
  }
}

.double-columns {
  display: grid;
  column-gap: 12px;
  row-gap: 5px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (max-width: 600px) {
  .double-columns {
    grid-template-columns: 1fr;
  }
}

[data-theme='dark'] .index {
  color: #b2b2b2;
}

[data-theme='light'] .index {
  color: #6a6a6a;
}

.index {
  min-width: 16px;
  font-size: 10px;
}

.augments-tab-title {
  font-size: 12px;
  font-weight: bold;
}

.items-title {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--gray-light);
  margin-left: 0.5rem;
}

.augments-group {
  display: flex;
  align-items: center;
  height: 30px;
  margin-bottom: 4px;
  gap: 4px;

  .image-name {
    display: flex;
    align-items: center;
    gap: 4px;

    .name {
      font-size: 0.75rem;
      font-weight: bold;
      color: var(--gray-light);
      margin-left: 0.5rem;
    }
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .pick {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      [data-theme='dark'] .pick-rate {
        color: #ebebeb;
      }

      [data-theme='light'] .pick-rate {
        color: #758592;
      }

      .pick-rate {
        font-size: 12px;
        font-weight: bold;
      }

      [data-theme='dark'] .pick-play {
        color: #bebebe;
      }

      [data-theme='light'] .pick-play {
        color: #5a5a5a;
      }

      .pick-play {
        font-size: 12px;
        text-align: center;
      }
    }

    [data-theme='dark'] .win-rate {
      color: #a0c6f8;
    }

    [data-theme='light'] .win-rate {
      color: #0969da;
    }

    .win-rate {
      min-width: 76px;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
    }
  }
}

.tier-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  margin-bottom: 2px;
  min-width: 24px;
  text-align: center;
}

.tier-badge.tier-s {
  background-color: #ff7300;
  color: white;
}

.tier-badge.tier-a {
  background-color: #0093ff;
  color: white;
}

.tier-badge.tier-b {
  background-color: #00bba3;
  color: white;
}

.tier-badge.tier-c {
  background-color: #ffb900;
  color: white;
}

.tier-badge.tier-d {
  background-color: #9aa4af;
  color: white;
}

.tier-badge.tier-e {
  background-color: #a88a67;
  color: white;
}
</style>
