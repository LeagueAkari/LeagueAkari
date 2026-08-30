import {
  AkariFeatureGateKeySchema,
  AkariFeatureGateRuntimeRuleSchema
} from '@shared/shards/akari-api'
import { z } from 'zod'

export const FeatureGateDevOverrideSchema = z
  .discriminatedUnion('mode', [
    z.object({ mode: z.literal('force-on') }).strict(),
    z.object({ mode: z.literal('force-off') }).strict(),
    z
      .object({
        mode: z.literal('rule'),
        config: AkariFeatureGateRuntimeRuleSchema
      })
      .strict()
  ])
  .superRefine((override, context) => {
    if (override.mode !== 'rule') return

    const config = override.config
    if (
      !config.platforms &&
      !config.minVersionInclusive &&
      !config.maxVersionExclusive &&
      !config.sgpServers
    ) {
      context.addIssue({
        code: 'custom',
        path: ['config'],
        message: 'Rule overrides must contain at least one constraint; use force-on instead'
      })
    }
  })

export type FeatureGateDevOverride = z.infer<typeof FeatureGateDevOverrideSchema>

export const FeatureGateDevOverridesSchema = z.record(
  AkariFeatureGateKeySchema,
  FeatureGateDevOverrideSchema
)

export type FeatureGateDevOverrides = z.infer<typeof FeatureGateDevOverridesSchema>

export function restoreFeatureGateDevOverrides(value: unknown): FeatureGateDevOverrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const restored: FeatureGateDevOverrides = {}
  for (const [key, persistedOverride] of Object.entries(value)) {
    if (!AkariFeatureGateKeySchema.safeParse(key).success) continue

    if (typeof persistedOverride === 'boolean') {
      restored[key] = { mode: persistedOverride ? 'force-on' : 'force-off' }
      continue
    }

    const result = FeatureGateDevOverrideSchema.safeParse(persistedOverride)
    if (result.success) restored[key] = result.data
  }

  return restored
}
