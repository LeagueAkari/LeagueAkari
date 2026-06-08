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
  descriptions: z.record(z.enum(['zh-CN', 'en']), z.string()).optional(),
  archiveFileGitHub: ArchiveFileSchema.optional(),
  archiveFileGitee: ArchiveFileSchema.optional()
})

export type ReleaseOverridesPlainObject = z.infer<typeof ReleaseOverridesPlainObjectSchema>

/**
 * 自动选择组的游戏模式匹配规则
 */
export const AutoSelectTargetGameModeSchema = z.object({
  /** 游戏模式，如 CLASSIC, ARAM, CHERRY 等 */
  gameMode: z.string(),
  /** 队列类型，'*' 表示所有 */
  queueTypes: z.array(z.string())
})

export type AutoSelectTargetGameMode = z.infer<typeof AutoSelectTargetGameModeSchema>

/**
 * 自动选择组配置
 */
export const AutoSelectGroupSchema = z.object({
  /** 组的唯一标识 */
  groupId: z.string(),
  /** 是否匹配自定义对局 */
  isCustom: z.boolean(),
  /** 适用的游戏模式 */
  targetGameModes: z.array(AutoSelectTargetGameModeSchema),
  /** 可以根据什么位置选择 */
  positions: z.array(z.string()),
  /** 可以额外选用的英雄 */
  additionalPicks: z.array(z.number()),
  /** 可以额外禁用的英雄 */
  additionalBans: z.array(z.number()),
  /** 禁止选用的英雄 */
  excludedPicks: z.array(z.number()),
  /** 禁止 Ban 的英雄 */
  excludedBans: z.array(z.number())
})

export type AutoSelectGroup = z.infer<typeof AutoSelectGroupSchema>

/**
 * 自动选择组配置 V1
 */
export const AutoSelectGroupsV1Schema = z.object({
  groups: z.array(AutoSelectGroupSchema),
  version: z.number().lte(1),
  lastUpdate: z.number()
})

export type AutoSelectGroups = z.infer<typeof AutoSelectGroupsV1Schema>
