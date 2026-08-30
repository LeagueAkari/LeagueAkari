import type {
  AkariFeatureGateRuntimeRule,
  AkariFeatureGateSnapshot
} from '@shared/shards/akari-api'
import type { FeatureGateDevOverride, FeatureGateDevOverrides } from '@shared/shards/feature-gating'

export type FeatureGateGroupId = 'local-only' | 'overridden-cloud' | 'cloud-only'

export interface FeatureGateListRow {
  key: string
  groupId: FeatureGateGroupId
  cloudConfig: AkariFeatureGateRuntimeRule | null
  devOverride: FeatureGateDevOverride | null
  effective: boolean
}

export interface FeatureGateListGroup {
  id: FeatureGateGroupId
  title: string
  description: string
  rows: FeatureGateListRow[]
}

export interface FeatureGateOverrideEditorTarget {
  key: string | null
  cloudConfig: AkariFeatureGateRuntimeRule | null
  devOverride: FeatureGateDevOverride | null
}

export interface BuildFeatureGateGroupsOptions {
  cloudSnapshot: AkariFeatureGateSnapshot | null
  devOverrides: FeatureGateDevOverrides
  query: string
  isEnabled: (key: string) => boolean
}

const GROUP_DEFINITIONS: ReadonlyArray<Pick<FeatureGateListGroup, 'id' | 'title' | 'description'>> =
  [
    {
      id: 'local-only',
      title: '本地新增',
      description: '仅存在于本机开发配置，不对应云端 key。'
    },
    {
      id: 'overridden-cloud',
      title: '覆盖云端',
      description: '同名 Dev 配置完整替换了云端规则。'
    },
    {
      id: 'cloud-only',
      title: '云端配置',
      description: '当前直接使用云端规则求值。'
    }
  ]

export function buildFeatureGateGroups({
  cloudSnapshot,
  devOverrides,
  query,
  isEnabled
}: BuildFeatureGateGroupsOptions): FeatureGateListGroup[] {
  const cloudGates = cloudSnapshot?.gates ?? {}
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const keys = new Set([...Object.keys(devOverrides), ...Object.keys(cloudGates)])
  const rowsByGroup = new Map<FeatureGateGroupId, FeatureGateListRow[]>()

  for (const key of keys) {
    if (normalizedQuery && !key.toLocaleLowerCase().includes(normalizedQuery)) continue

    const hasCloudConfig = Object.hasOwn(cloudGates, key)
    const hasDevOverride = Object.hasOwn(devOverrides, key)
    const groupId: FeatureGateGroupId = hasDevOverride
      ? hasCloudConfig
        ? 'overridden-cloud'
        : 'local-only'
      : 'cloud-only'
    const rows = rowsByGroup.get(groupId) ?? []
    rows.push({
      key,
      groupId,
      cloudConfig: hasCloudConfig ? cloudGates[key] : null,
      devOverride: hasDevOverride ? devOverrides[key] : null,
      effective: isEnabled(key)
    })
    rowsByGroup.set(groupId, rows)
  }

  return GROUP_DEFINITIONS.flatMap((definition) => {
    const rows = rowsByGroup.get(definition.id)
    if (!rows?.length) return []

    rows.sort((a, b) => {
      if (a.effective !== b.effective) return a.effective ? -1 : 1
      return a.key.localeCompare(b.key, 'en')
    })
    return [{ ...definition, rows }]
  })
}

export function formatFeatureGateRule(config: AkariFeatureGateRuntimeRule) {
  const parts: string[] = []
  if (config.platforms) {
    parts.push(
      `平台 ${config.platforms.map((platform) => (platform === 'win32' ? 'Windows' : 'macOS')).join('、')}`
    )
  }
  if (config.minVersionInclusive) parts.push(`版本 ≥ ${config.minVersionInclusive}`)
  if (config.maxVersionExclusive) parts.push(`版本 < ${config.maxVersionExclusive}`)
  if (config.sgpServers) parts.push(`区服 ${config.sgpServers.join('、')}`)
  return parts.length ? parts.join(' · ') : '全部运行环境'
}

export function hasFeatureGateRuleConstraints(config: AkariFeatureGateRuntimeRule) {
  return Boolean(
    config.platforms ||
    config.minVersionInclusive ||
    config.maxVersionExclusive ||
    config.sgpServers
  )
}

export function formatFeatureGateOverride(override: FeatureGateDevOverride) {
  if (override.mode === 'force-on') return '始终开启'
  if (override.mode === 'force-off') return '始终关闭'
  return formatFeatureGateRule(override.config)
}

export function featureGateOverrideModeLabel(override: FeatureGateDevOverride) {
  if (override.mode === 'force-on') return '强制开启'
  if (override.mode === 'force-off') return '强制关闭'
  return '按规则'
}
