import { gte, valid } from 'semver'
import { z } from 'zod'

import type {
  AkariAutoSelectGroupsConfig,
  AkariContactChannels,
  AkariFeatureGateSnapshot,
  AkariLeagueServersConfig,
  AkariNotice,
  AkariRelease,
  AkariSupportedQueuesConfig
} from './types'

const ConfigMetadataShape = {
  updatedAt: z.iso.datetime({ offset: true })
}

const UniqueNonEmptyStringArraySchema = z
  .array(z.string().trim().min(1).max(64))
  .min(1)
  .refine((values) => new Set(values).size === values.length)

const AkariFeatureGateRuntimeRuleSchema = z
  .object({
    platforms: z
      .array(z.enum(['win32', 'darwin']))
      .min(1)
      .refine((values) => new Set(values).size === values.length)
      .optional(),
    minVersionInclusive: z.string().optional(),
    maxVersionExclusive: z.string().optional(),
    sgpServers: UniqueNonEmptyStringArraySchema.optional()
  })
  .superRefine((gate, context) => {
    const minVersion = gate.minVersionInclusive && valid(gate.minVersionInclusive)
    const maxVersion = gate.maxVersionExclusive && valid(gate.maxVersionExclusive)

    if (gate.minVersionInclusive && !minVersion) {
      context.addIssue({
        code: 'custom',
        path: ['minVersionInclusive'],
        message: 'minVersionInclusive must be valid SemVer'
      })
    }
    if (gate.maxVersionExclusive && !maxVersion) {
      context.addIssue({
        code: 'custom',
        path: ['maxVersionExclusive'],
        message: 'maxVersionExclusive must be valid SemVer'
      })
    }
    if (minVersion && maxVersion && gte(minVersion, maxVersion)) {
      context.addIssue({
        code: 'custom',
        path: ['maxVersionExclusive'],
        message: 'maxVersionExclusive must be greater than minVersionInclusive'
      })
    }
  })
  .strict()

export const AkariFeatureGateSnapshotSchema: z.ZodType<AkariFeatureGateSnapshot> = z
  .object({
    ...ConfigMetadataShape,
    gates: z.record(
      z.string().regex(/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/),
      AkariFeatureGateRuntimeRuleSchema
    )
  })
  .strict()

export const AkariNoticeSchema: z.ZodType<AkariNotice> = z
  .object({
    revision: z.string(),
    language: z.enum(['zh-CN', 'en']),
    severity: z.enum(['low', 'medium', 'high']),
    summary: z.string(),
    contentType: z.literal('text/markdown'),
    content: z.string(),
    updatedAt: z.iso.datetime({ offset: true })
  })
  .passthrough()

const AkariContactChannelUrlSchema = z.url().refine(
  (value) => {
    const protocol = new URL(value).protocol
    return protocol === 'https:' || protocol === 'mailto:'
  },
  { message: 'url must use https or mailto' }
)

export const AkariContactChannelsSchema: z.ZodType<AkariContactChannels> = z
  .object({
    ...ConfigMetadataShape,
    channels: z.array(
      z
        .object({
          id: z
            .string()
            .trim()
            .min(1)
            .max(64)
            .regex(/^[a-z0-9][a-z0-9_-]*$/i),
          platform: z.enum(['qq', 'telegram', 'discord', 'email', 'website', 'other']),
          name: z.string().trim().min(1).max(80),
          identifier: z.string().trim().min(1).max(120),
          url: AkariContactChannelUrlSchema,
          password: z.string().trim().min(1).max(120).nullable()
        })
        .passthrough()
    )
  })
  .passthrough()

export const AkariAutoSelectGroupsConfigSchema: z.ZodType<AkariAutoSelectGroupsConfig> = z
  .object({
    ...ConfigMetadataShape,
    groups: z.array(
      z
        .object({
          groupId: z.string(),
          name: z.object({
            'zh-CN': z.string(),
            en: z.string()
          }),
          iconPath: z.string().regex(/^\/lol-game-data\/assets\/.+/),
          isCustom: z.boolean(),
          supportedSgpServers: z.array(z.string()).min(1),
          targetGameModes: z.array(
            z
              .object({
                gameMode: z.string(),
                queueTypes: z.array(z.string())
              })
              .passthrough()
          ),
          positions: z.array(z.string()),
          additionalPicks: z.array(z.number()),
          additionalBans: z.array(z.number()),
          excludedPicks: z.array(z.number()),
          excludedBans: z.array(z.number())
        })
        .passthrough()
    )
  })
  .passthrough()

export const AkariLeagueServersConfigSchema: z.ZodType<AkariLeagueServersConfig> = z
  .object({
    ...ConfigMetadataShape,
    servers: z.record(
      z.string(),
      z
        .object({
          matchHistory: z.string(),
          common: z.string(),
          isTencent: z.boolean(),
          regionPathParam: z.string().optional()
        })
        .passthrough()
    ),
    serverNames: z.record(z.string(), z.record(z.string(), z.string()))
  })
  .passthrough()

export const AkariSupportedQueuesConfigSchema: z.ZodType<AkariSupportedQueuesConfig> = z
  .object({
    ...ConfigMetadataShape,
    queues: z.array(z.number())
  })
  .passthrough()

export const AkariReleaseSchema: z.ZodType<AkariRelease> = z
  .object({
    version: z.string(),
    publishedAt: z.iso.datetime({ offset: true }),
    description: z.string(),
    artifacts: z.array(
      z
        .object({
          platform: z.string(),
          arch: z.string(),
          fileName: z.string(),
          size: z.number(),
          contentType: z.string(),
          sha256: z.string().nullable(),
          downloadUrl: z.url()
        })
        .passthrough()
    )
  })
  .passthrough()
