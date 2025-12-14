import { z } from 'zod'

export const leagueServersConfigV1Schema = z.object({
  servers: z.record(
    z.string(),
    z.object({
      matchHistory: z.string(),
      common: z.string()
    })
  ),

  tencentServerMatchHistoryInteroperability: z.array(z.string()),
  tencentServerSpectatorInteroperability: z.array(z.string()),
  tencentServerSummonerInteroperability: z.array(z.string()),

  serverNames: z.record(z.string(), z.record(z.string(), z.string())),

  version: z.number().lte(1),
  lastUpdate: z.number()
})

export type LeagueServersConfig = z.infer<typeof leagueServersConfigV1Schema>

export const inGameSendTemplateCatalogV1Schema = z.object({
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

export type InGameSendTemplateCatalog = z.infer<typeof inGameSendTemplateCatalogV1Schema>

export const supportedQueuesV1Schema = z.object({
  queues: z.array(z.number()),
  version: z.number().lte(1),
  lastUpdate: z.number()
})

export type SupportedQueues = z.infer<typeof supportedQueuesV1Schema>

export const ongoingGameConfigV1Schema = z.object({
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

export type OngoingGameConfig = z.infer<typeof ongoingGameConfigV1Schema>
