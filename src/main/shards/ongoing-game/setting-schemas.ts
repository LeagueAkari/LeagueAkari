import type { OngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game'
import { z } from 'zod'

export const ongoingGamePlayerCardTagsSchema: z.ZodType<OngoingGamePanelPlayerCardTagSettings> =
  z.looseObject({
    showPremadeTeamTag: z.boolean(),
    showSuspiciousFlashPositionTag: z.boolean(),
    showWinningStreakTag: z.boolean(),
    showLosingStreakTag: z.boolean(),
    showSoloKillsTag: z.boolean(),
    showEasyGankTag: z.boolean(),
    showGreatPerformanceTag: z.boolean(),
    showAverageTeamDamageTag: z.boolean(),
    showAverageTeamDamageTakenTag: z.boolean(),
    showAverageTeamGoldTag: z.boolean(),
    showAverageCsPerMinuteTag: z.boolean(),
    showAverageDamageGoldEfficiencyTag: z.boolean(),
    showAverageEnemyMissingPingsTag: z.boolean(),
    showAverageVisionScoreTag: z.boolean(),
    showAverageKillDamageEfficiencyTag: z.boolean(),
    showSelfTag: z.boolean(),
    showMetTag: z.boolean(),
    showTaggedTag: z.boolean(),
    showWinRateTeamTag: z.boolean(),
    showPrivacyTag: z.boolean(),
    showAkariScoreTag: z.boolean()
  })
