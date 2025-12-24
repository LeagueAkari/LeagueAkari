<template>
  <NScrollbar class="max-h-[70vh]">
    <div
      v-for="(group, index) of data.grouped.filter((g) => g.data.length > 0)"
      :key="group.type"
      class="pr-4"
    >
      <div v-if="index !== 0" class="my-2 h-px w-full bg-black/10 dark:bg-white/10" />

      <!-- overview -->
      <div class="mb-3 flex items-end gap-2">
        <div class="flex items-center gap-2">
          <ChampionIcon
            class="size-4 rounded"
            :champion-id="participantMap[event.victimId]?.championId"
          />

          <span class="text-sm font-bold text-black dark:text-white">{{
            $t(`MatchCard.eventsTab.victimDamageDetails.${group.type}`)
          }}</span>
        </div>

        <div>
          <span class="font-bold">
            {{
              formatExtremeNumber(
                group.type === 'received'
                  ? data.totalPhysicalDamageReceived +
                      data.totalMagicDamageReceived +
                      data.totalTrueDamageReceived
                  : data.totalPhysicalDamageDealt +
                      data.totalMagicDamageDealt +
                      data.totalTrueDamageDealt
              )
            }}
          </span>
          (
          <span :class="getDamageTextColor('physical')">{{
            formatExtremeNumber(
              group.type === 'received'
                ? data.totalPhysicalDamageReceived
                : data.totalPhysicalDamageDealt
            )
          }}</span>
          /
          <span :class="getDamageTextColor('magic')">{{
            formatExtremeNumber(
              group.type === 'received' ? data.totalMagicDamageReceived : data.totalMagicDamageDealt
            )
          }}</span>
          /
          <span :class="getDamageTextColor('true')">{{
            formatExtremeNumber(
              group.type === 'received' ? data.totalTrueDamageReceived : data.totalTrueDamageDealt
            )
          }}</span>
          )
        </div>
      </div>

      <!-- champion, minion, other -->
      <div v-for="receiver of group.data" class="flex items-start gap-2 not-last:mb-2">
        <ChampionIcon
          :title="$t(`MatchCard.eventsTab.victimDamageDetails.damageDealerNames.${receiver.type}`)"
          v-if="
            receiver.type === 'champion' || receiver.type === 'minion' || receiver.type === 'other'
          "
          class="size-8 rounded-full border-2 border-solid"
          :style="{
            borderColor: getTeamColor(participantMap[receiver.participantId]?.teamIdentifier)
          }"
          :champion-id="participantMap[receiver.participantId]?.championId"
        />

        <!-- tower -->
        <div
          v-if="receiver.type === 'tower'"
          :title="$t(`MatchCard.eventsTab.victimDamageDetails.damageDealerNames.tower`)"
        >
          <TowerIcon
            class="size-6 rounded-full border-solid border-black/40 p-1 dark:border-white/40"
          />
        </div>

        <!-- monster -->
        <div
          v-if="receiver.type === 'monster'"
          :title="$t(`MatchCard.eventsTab.victimDamageDetails.damageDealerNames.monster`)"
        >
          <NIcon
            v-if="receiver.name === CHERRY_SHOPKEEPER_NAME"
            class="rounded-full border-solid border-black/40 p-1 text-[24px] dark:border-white/40"
          >
            <Fire />
          </NIcon>

          <DragonIcon
            v-else
            class="size-6 rounded-full border-solid border-black/40 p-1 dark:border-white/40"
          />
        </div>

        <div>
          <!-- bar -->
          <div class="mb-2 flex items-center gap-2">
            <DamageBar
              :border-radius="0"
              :height="14"
              :width="160"
              :physical-damage="receiver.totalPhysicalDamage"
              :magic-damage="receiver.totalMagicDamage"
              :true-damage="receiver.totalTrueDamage"
              :baseline-damage="data.maxDamageBaseline"
            />

            <!-- damage details -->
            <div class="text-xs text-black/80 dark:text-white/80">
              <span class="font-bold">
                {{
                  formatExtremeNumber(
                    receiver.totalPhysicalDamage +
                      receiver.totalMagicDamage +
                      receiver.totalTrueDamage
                  )
                }}
              </span>
              (
              <span :class="getDamageTextColor('physical')">{{
                formatExtremeNumber(receiver.totalPhysicalDamage)
              }}</span>
              /
              <span :class="getDamageTextColor('magic')">{{
                formatExtremeNumber(receiver.totalMagicDamage)
              }}</span>
              /
              <span :class="getDamageTextColor('true')">{{
                formatExtremeNumber(receiver.totalTrueDamage)
              }}</span>
              )
            </div>
          </div>

          <!-- spell -->
          <div class="flex items-center gap-1">
            <NPopover
              v-for="[type, damage] of [
                receiver.damageDetails.basic
                  ? (['A', receiver.damageDetails.basic] as const)
                  : null,
                receiver.damageDetails.p ? (['P', receiver.damageDetails.p] as const) : null,
                receiver.damageDetails.q ? (['Q', receiver.damageDetails.q] as const) : null,
                receiver.damageDetails.w ? (['W', receiver.damageDetails.w] as const) : null,
                receiver.damageDetails.e ? (['E', receiver.damageDetails.e] as const) : null,
                receiver.damageDetails.r ? (['R', receiver.damageDetails.r] as const) : null,
                receiver.damageDetails.other ? (['?', receiver.damageDetails.other] as const) : null
              ].filter((skill) => skill !== null)"
            >
              <template #trigger>
                <div>
                  <div
                    class="flex size-6 items-center justify-center rounded text-xs font-bold"
                    :class="getClassBySkillKey(type)"
                  >
                    {{ type }}
                  </div>

                  <div
                    class="text-center text-[10px]"
                    :class="getDamageTextColor(getDamageMostType(damage))"
                  >
                    {{
                      formatExtremeNumber(
                        damage.physicalDamage + damage.magicDamage + damage.trueDamage
                      )
                    }}
                  </div>
                </div>
              </template>
              <span :class="getDamageTextColor('physical')">{{
                formatExtremeNumber(damage.physicalDamage)
              }}</span>
              /
              <span :class="getDamageTextColor('magic')">{{
                formatExtremeNumber(damage.magicDamage)
              }}</span>
              /
              <span :class="getDamageTextColor('true')">{{
                formatExtremeNumber(damage.trueDamage)
              }}</span>
            </NPopover>
          </div>
        </div>
      </div>
    </div>
  </NScrollbar>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useNumberFormatter } from '@renderer-shared/composables/useNumberFormatter'
import { MatchParticipant } from '@shared/data-adapter/match-history/participants'
import { DamageDetail, DetailedChampionKillEvent } from '@shared/types/sgp/match-history'
import { Fire } from '@vicons/fa'
import { NIcon, NPopover, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

import { useMatchCard } from '../context'
import DragonIcon from '../icons/Dragon.vue'
import TowerIcon from '../icons/Tower.vue'
import { getClassBySkillKey, getDamageTextColor, getTeamColor } from '../utils/theme'
import DamageBar from './DamageBar.vue'

const { event } = defineProps<{
  event: DetailedChampionKillEvent
}>()

const { participants } = useMatchCard()

const { formatExtremeNumber } = useNumberFormatter()

const participantMap = computed(() => {
  return participants.value.reduce(
    (acc, cur) => {
      acc[cur.participantId] = cur
      return acc
    },
    {} as Record<number, MatchParticipant>
  )
})

const CHERRY_SHOPKEEPER_NAME = 'Cherry_Shopkeeper'

type DamageType = 'champion' | 'tower' | 'minion' | 'monster' | 'other'

type Damage = {
  magicDamage: number
  physicalDamage: number
  trueDamage: number
}

type DamageSource = {
  p: Damage | null
  q: Damage | null
  w: Damage | null
  e: Damage | null
  r: Damage | null
  basic: Damage | null
  other: Damage | null
}

type DamageDetails = {
  type: 'champion' | 'tower' | 'minion' | 'monster' | 'other'
  name: string
  participantId: number // 非 champion 则为 0
  damageDetails: DamageSource
  totalPhysicalDamage: number
  totalMagicDamage: number
  totalTrueDamage: number
}

const TYPE_MAP = {
  MINION: 'minion',
  MONSTER: 'monster',
  TOWER: 'tower'
} as Record<string, DamageType>

const enum SpellSlot {
  P = 63,
  Q = 0,
  W = 1,
  E = 2,
  R = 3
}

const data = computed(() => {
  const collectDamage = (damage: DamageDetail[]) => {
    return damage.reduce(
      (acc, cur) => {
        const type = cur.participantId ? 'champion' : TYPE_MAP[cur.type] || 'other'

        const key = type === 'champion' ? `champion:${cur.participantId}` : type

        if (!acc[key]) {
          acc[key] = {
            type,
            name: cur.name,
            participantId: cur.participantId,
            damageDetails: {
              basic: null,
              p: null,
              q: null,
              w: null,
              e: null,
              r: null,
              other: null
            },
            totalPhysicalDamage: 0,
            totalMagicDamage: 0,
            totalTrueDamage: 0
          }
        }

        // 收集槽位的伤害
        if (cur.basic) {
          if (!acc[key].damageDetails.basic) {
            acc[key].damageDetails.basic = { physicalDamage: 0, magicDamage: 0, trueDamage: 0 }
          }

          acc[key].damageDetails.basic.physicalDamage += cur.physicalDamage
          acc[key].damageDetails.basic.magicDamage += cur.magicDamage
          acc[key].damageDetails.basic.trueDamage += cur.trueDamage
        } else if (cur.spellSlot === SpellSlot.P) {
          if (!acc[key].damageDetails.p) {
            acc[key].damageDetails.p = { physicalDamage: 0, magicDamage: 0, trueDamage: 0 }
          }

          acc[key].damageDetails.p.physicalDamage += cur.physicalDamage
          acc[key].damageDetails.p.magicDamage += cur.magicDamage
          acc[key].damageDetails.p.trueDamage += cur.trueDamage
        } else if (cur.spellSlot === SpellSlot.Q) {
          if (!acc[key].damageDetails.q) {
            acc[key].damageDetails.q = { physicalDamage: 0, magicDamage: 0, trueDamage: 0 }
          }

          acc[key].damageDetails.q.physicalDamage += cur.physicalDamage
          acc[key].damageDetails.q.magicDamage += cur.magicDamage
          acc[key].damageDetails.q.trueDamage += cur.trueDamage
        } else if (cur.spellSlot === SpellSlot.W) {
          if (!acc[key].damageDetails.w) {
            acc[key].damageDetails.w = { physicalDamage: 0, magicDamage: 0, trueDamage: 0 }
          }

          acc[key].damageDetails.w.physicalDamage += cur.physicalDamage
          acc[key].damageDetails.w.magicDamage += cur.magicDamage
          acc[key].damageDetails.w.trueDamage += cur.trueDamage
        } else if (cur.spellSlot === SpellSlot.E) {
          if (!acc[key].damageDetails.e) {
            acc[key].damageDetails.e = { physicalDamage: 0, magicDamage: 0, trueDamage: 0 }
          }

          acc[key].damageDetails.e.physicalDamage += cur.physicalDamage
          acc[key].damageDetails.e.magicDamage += cur.magicDamage
          acc[key].damageDetails.e.trueDamage += cur.trueDamage
        } else if (cur.spellSlot === SpellSlot.R) {
          if (!acc[key].damageDetails.r) {
            acc[key].damageDetails.r = { physicalDamage: 0, magicDamage: 0, trueDamage: 0 }
          }

          acc[key].damageDetails.r.physicalDamage += cur.physicalDamage
          acc[key].damageDetails.r.magicDamage += cur.magicDamage
          acc[key].damageDetails.r.trueDamage += cur.trueDamage
        } else {
          if (!acc[key].damageDetails.other) {
            acc[key].damageDetails.other = { physicalDamage: 0, magicDamage: 0, trueDamage: 0 }
          }

          acc[key].damageDetails.other.physicalDamage += cur.physicalDamage
          acc[key].damageDetails.other.magicDamage += cur.magicDamage
          acc[key].damageDetails.other.trueDamage += cur.trueDamage
        }

        acc[key].totalPhysicalDamage += cur.physicalDamage
        acc[key].totalMagicDamage += cur.magicDamage
        acc[key].totalTrueDamage += cur.trueDamage

        return acc
      },
      {} as Record<string, DamageDetails>
    )
  }

  const extractMaxAndSorted = (damage: DamageDetails[]) => {
    const maxTotal = damage.reduce((acc, cur) => {
      const total = cur.totalPhysicalDamage + cur.totalMagicDamage + cur.totalTrueDamage
      return Math.max(acc, total)
    }, 0)

    const sorted = damage.toSorted((a, b) => {
      const aTotalDamage = a.totalPhysicalDamage + a.totalMagicDamage + a.totalTrueDamage
      const bTotalDamage = b.totalPhysicalDamage + b.totalMagicDamage + b.totalTrueDamage

      return bTotalDamage - aTotalDamage
    })

    return {
      maxTotal,
      sorted
    }
  }

  // id 0 可能代表很多其他的伤害来源，这里当成独立处理
  const damageDealtMap = collectDamage(event.victimDamageDealt || [])
  const damageReceivedMap = collectDamage(event.victimDamageReceived)

  const { sorted: damageReceived, maxTotal: maxDamageReceived } = extractMaxAndSorted(
    Object.values(damageReceivedMap)
  )
  const { sorted: damageDealt, maxTotal: maxDamageDealt } = extractMaxAndSorted(
    Object.values(damageDealtMap)
  )

  return {
    maxDamageBaseline: Math.max(maxDamageReceived, maxDamageDealt),
    totalPhysicalDamageReceived: damageReceived.reduce(
      (acc, cur) => acc + cur.totalPhysicalDamage,
      0
    ),
    totalMagicDamageReceived: damageReceived.reduce((acc, cur) => acc + cur.totalMagicDamage, 0),
    totalTrueDamageReceived: damageReceived.reduce((acc, cur) => acc + cur.totalTrueDamage, 0),
    totalPhysicalDamageDealt: damageDealt.reduce((acc, cur) => acc + cur.totalPhysicalDamage, 0),
    totalMagicDamageDealt: damageDealt.reduce((acc, cur) => acc + cur.totalMagicDamage, 0),
    totalTrueDamageDealt: damageDealt.reduce((acc, cur) => acc + cur.totalTrueDamage, 0),
    grouped: [
      { type: 'received', data: damageReceived },
      { type: 'dealt', data: damageDealt }
    ]
  }
})

const getDamageMostType = (damage: Damage) => {
  const most = [
    { type: 'physical', value: damage.physicalDamage },
    { type: 'magic', value: damage.magicDamage },
    { type: 'true', value: damage.trueDamage }
  ].toSorted((a, b) => b.value - a.value)[0]

  return most.type
}
</script>
