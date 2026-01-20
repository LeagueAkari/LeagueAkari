import { z } from 'zod'

export const LeagueServersConfigV2Schema = z.object({
  servers: z.record(
    z.string(),
    z.object({
      matchHistory: z.string(),
      common: z.string(),
      regionPathParam: z.string().optional()
    })
  ),

  tencentServerMatchHistoryInteroperability: z.array(z.string()),
  tencentServerSpectatorInteroperability: z.array(z.string()),
  tencentServerSummonerInteroperability: z.array(z.string()),

  serverNames: z.record(z.string(), z.record(z.string(), z.string())),

  version: z.number().lte(2),
  lastUpdate: z.number()
})

export type LeagueServersConfig = z.infer<typeof LeagueServersConfigV2Schema>

export const InGameSendTemplateCatalogV1Schema = z.object({
  templates: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      description: z.string(),
      version: z.number(),
      path: z.string()
    })
  ),
  version: z.number().lte(1),
  lastUpdate: z.number()
})

export type InGameSendTemplateCatalog = z.infer<typeof InGameSendTemplateCatalogV1Schema>

export const SupportedQueuesV1Schema = z.object({
  queues: z.array(z.number()),
  version: z.number().lte(1),
  lastUpdate: z.number()
})

export type SupportedQueues = z.infer<typeof SupportedQueuesV1Schema>

export const OngoingGameConfigV1Schema = z.object({
  /** 主播模式特殊策略 */
  spotlight: z.object({
    /** 英雄选择阶段的 puuid 反混淆 */
    deobfuscation: z.boolean(),

    /** 使用 puuid 查询 gameflow */
    gsmByPuuid: z.boolean(),

    /** 使用 puuid 查询 spectator data */
    spectatorByPuuid: z.boolean()
  }),

  version: z.number().lte(1),
  lastUpdate: z.number()
})

export type OngoingGameConfig = z.infer<typeof OngoingGameConfigV1Schema>

const ArchiveFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  downloadUrl: z.url(),
  contentType: z.string()
})

/** 没有版本号的普通 json 对象，很简单 */
export const ReleaseOverridesPlainObjectSchema = z.object({
  /** 指的是软件版本号，并非 schema 版本 */
  version: z.string().optional(),
  publishedAt: z.iso.datetime().optional(),
  descriptionZhCn: z.string().optional(),
  descriptionEn: z.string().optional(),
  archiveFileGitHub: ArchiveFileSchema.optional(),
  archiveFileGitee: ArchiveFileSchema.optional()
})

export type ReleaseOverridesPlainObject = z.infer<typeof ReleaseOverridesPlainObjectSchema>
