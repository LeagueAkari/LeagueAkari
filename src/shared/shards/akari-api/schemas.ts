import { z } from 'zod'

import type {
  AkariAutoSelectGroupsConfig,
  AkariLastResortRelease,
  AkariLeagueServersConfig,
  AkariNotice,
  AkariOngoingGameConfig,
  AkariRelease,
  AkariSupportedQueuesConfig
} from './types'

const AkariLastResortArchiveFileSchema = z
  .object({
    name: z.string(),
    size: z.number(),
    downloadUrl: z.url(),
    contentType: z.string()
  })
  .passthrough()

const ConfigMetadataShape = {
  updatedAt: z.iso.datetime({ offset: true })
}

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

export const AkariOngoingGameConfigSchema: z.ZodType<AkariOngoingGameConfig> = z
  .object({
    ...ConfigMetadataShape,
    spotlight: z
      .object({
        deobfuscation: z.boolean(),
        gsmByPuuid: z.boolean(),
        spectatorByPuuid: z.boolean()
      })
      .passthrough()
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

export const AkariLastResortReleaseSchema: z.ZodType<AkariLastResortRelease> = z
  .object({
    version: z.string(),
    publishedAt: z.iso.datetime({ offset: true }),
    descriptions: z
      .object({
        'zh-CN': z.string().optional(),
        en: z.string().optional()
      })
      .passthrough(),
    archiveFileGitHub: AkariLastResortArchiveFileSchema.optional(),
    archiveFileGitee: AkariLastResortArchiveFileSchema.optional()
  })
  .passthrough()
